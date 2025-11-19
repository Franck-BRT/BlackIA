/**
 * MLX LLM Backend
 * Backend complet pour LLM utilisant mlx-lm
 * Support: chat, génération de texte, streaming
 * Optimisé pour Apple Silicon (M1/M2/M3/M4)
 */

import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { logger } from '../../log-service';
import { BaseAIBackend } from '../backend-interface';
import type {
  BackendType,
  BackendStatus,
  BackendCapability,
  BackendModelInfo,
  ChatRequest,
  ChatResponse,
} from '../backend-types';

interface MLXLLMRequest {
  command: 'load' | 'unload' | 'generate' | 'chat' | 'status' | 'ping';
  model_path?: string;
  adapter_path?: string;
  prompt?: string;
  messages?: Array<{ role: string; content: string }>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

interface MLXLLMResponse {
  success: boolean;
  type?: 'chunk' | 'complete' | 'error';
  content?: string;
  done?: boolean;
  model?: string;
  ready?: boolean;
  model_loaded?: string;
  mlx_available?: boolean;
  error?: string;
  message?: string;
}

export class MLXLLMBackend extends BaseAIBackend {
  readonly type: BackendType = 'mlx';
  readonly capabilities: BackendCapability[] = ['chat', 'embeddings'];

  private pythonProcess: ChildProcess | null = null;
  private pythonPath: string = 'python3';
  private scriptPath: string;
  private requestQueue: Map<
    number,
    {
      resolve: (value: MLXLLMResponse) => void;
      reject: (error: Error) => void;
      onChunk?: (chunk: string) => void;
    }
  > = new Map();
  private requestId = 0;
  private isReady = false;
  private currentModel: string | null = null;
  private modelsDir: string;

  constructor(pythonPath?: string, modelsDir?: string) {
    super();
    if (pythonPath) {
      this.pythonPath = pythonPath;
    }
    this.scriptPath = join(__dirname, 'mlx_llm_server.py');

    // Répertoire des modèles
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    this.modelsDir =
      modelsDir || join(homeDir, 'Library', 'Application Support', 'BlackIA', 'models');
  }

  async isAvailable(): Promise<boolean> {
    // Vérifier si on est sur macOS
    if (process.platform !== 'darwin') {
      logger.debug('backend', 'MLX LLM not available', 'Not on macOS');
      return false;
    }

    // Chemin du virtualenv BlackIA (si créé par le script d'installation)
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const venvPython = homeDir ? `${homeDir}/.blackia-mlx/bin/python3` : '';

    // Essayer plusieurs chemins Python
    const pythonPaths = [
      venvPython, // Virtualenv BlackIA en priorité
      this.pythonPath,
      'python3',
      '/usr/bin/python3',
      '/opt/homebrew/bin/python3',
      '/usr/local/bin/python3',
    ].filter((p) => p); // Filtrer les chemins vides

    for (const pythonPath of pythonPaths) {
      try {
        const { execSync } = require('child_process');

        // Vérifier si Python existe
        execSync(`${pythonPath} --version`, { stdio: 'ignore' });

        // Vérifier si mlx-lm est installé
        execSync(`${pythonPath} -c "import mlx_lm"`, { stdio: 'ignore' });

        // Succès ! Utiliser ce Python
        this.pythonPath = pythonPath;
        logger.debug('backend', 'MLX LLM available', `Using Python: ${pythonPath}`);
        return true;
      } catch {
        // Ce chemin ne fonctionne pas, essayer le suivant
        continue;
      }
    }

    logger.warning(
      'backend',
      'MLX LLM not available',
      'mlx-lm not installed. Install with: pip3 install mlx-lm'
    );
    return false;
  }

  async initialize(): Promise<void> {
    logger.info('backend', 'Initializing MLX LLM backend', '');

    if (!(await this.isAvailable())) {
      throw new Error(
        'MLX LLM backend not available. Ensure Python3 and mlx-lm are installed.'
      );
    }

    // Démarrer le processus Python
    this.pythonProcess = spawn(this.pythonPath, [this.scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Gérer les erreurs du processus
    this.pythonProcess.on('error', (error) => {
      logger.error('backend', 'MLX LLM process error', '', { error: error.message });
      this.isReady = false;
    });

    this.pythonProcess.on('exit', (code, signal) => {
      logger.warning('backend', 'MLX LLM process exited', '', { code, signal });
      this.isReady = false;
    });

    // Gérer stderr pour les logs
    this.pythonProcess.stderr?.on('data', (data) => {
      const message = data.toString().trim();
      logger.debug('backend', 'MLX LLM stderr', message);
    });

    // Gérer stdout pour les réponses
    let buffer = '';
    this.pythonProcess.stdout?.on('data', (data) => {
      buffer += data.toString();

      // Traiter les lignes complètes
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Garder la dernière ligne incomplète

      for (const line of lines) {
        if (line.trim()) {
          this.handleResponse(line.trim());
        }
      }
    });

    // Attendre que le serveur soit prêt
    await this.waitForReady();

    logger.info('backend', 'MLX LLM backend initialized', 'Ready to process requests');
  }

  async shutdown(): Promise<void> {
    logger.info('backend', 'Shutting down MLX LLM backend', '');

    // Décharger le modèle si chargé
    if (this.currentModel) {
      try {
        await this.sendRequest({ command: 'unload' });
      } catch (error) {
        logger.warning('backend', 'Error unloading model during shutdown', '', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (this.pythonProcess) {
      this.pythonProcess.kill('SIGTERM');
      this.pythonProcess = null;
    }

    this.isReady = false;
    this.currentModel = null;
    this.requestQueue.clear();
  }

  async getStatus(): Promise<BackendStatus> {
    if (!this.isReady || !this.pythonProcess) {
      return {
        type: this.type,
        available: false,
        initialized: false,
        capabilities: this.capabilities,
        models: [],
        error: 'MLX LLM backend not initialized',
      };
    }

    try {
      const response = await this.sendRequest({ command: 'status' });

      return {
        type: this.type,
        available: true,
        initialized: this.isReady,
        capabilities: this.capabilities,
        models: await this.listModels(),
        version: 'MLX + mlx-lm',
      };
    } catch (error) {
      return {
        type: this.type,
        available: false,
        initialized: false,
        capabilities: this.capabilities,
        models: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * CHAT Implementation (streaming)
   */
  async *chat(request: ChatRequest): AsyncIterable<string> {
    this.assertCapability('chat');

    logger.debug(
      'backend',
      'MLX LLM chat request (streaming)',
      `Messages: ${request.messages.length}`
    );

    try {
      // Si aucun modèle n'est chargé, charger le modèle par défaut
      if (!this.currentModel) {
        await this.loadDefaultModel();
      }

      const mlxRequest: MLXLLMRequest = {
        command: 'chat',
        messages: request.messages,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        top_p: 0.9,
        stream: true,
      };

      // Utiliser un pattern pour yield chaque chunk
      const chunks: string[] = [];

      await this.sendRequestWithStreaming(
        mlxRequest,
        (chunk) => {
          chunks.push(chunk);
        }
      );

      // Yield tous les chunks collectés
      for (const chunk of chunks) {
        yield chunk;
      }
    } catch (error) {
      logger.error('backend', 'MLX LLM chat error', '', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * CHAT Implementation (non-streaming)
   */
  async chatComplete(request: ChatRequest): Promise<ChatResponse> {
    this.assertCapability('chat');

    logger.debug(
      'backend',
      'MLX LLM chat request (complete)',
      `Messages: ${request.messages.length}`
    );

    try {
      // Si aucun modèle n'est chargé, charger le modèle par défaut
      if (!this.currentModel) {
        await this.loadDefaultModel();
      }

      const mlxRequest: MLXLLMRequest = {
        command: 'chat',
        messages: request.messages,
        max_tokens: request.maxTokens,
        temperature: request.temperature,
        top_p: 0.9,
        stream: false,
      };

      const response = await this.sendRequest(mlxRequest);

      if (!response.success) {
        throw new Error(response.error || 'MLX LLM chat failed');
      }

      return {
        content: response.content || '',
        model: this.currentModel || 'unknown',
        finishReason: 'stop',
      };
    } catch (error) {
      logger.error('backend', 'MLX LLM chat error', '', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Model Management
   */
  async listModels(): Promise<BackendModelInfo[]> {
    // Pour l'instant, retourner une liste hardcodée
    // Plus tard, on récupérera depuis le gestionnaire de modèles
    return [
      {
        name: 'mlx-community/Llama-3.2-3B-Instruct-4bit',
        size: '2GB',
        downloaded: false,
        type: 'chat',
      },
      {
        name: 'mlx-community/Mistral-7B-Instruct-v0.3-4bit',
        size: '4GB',
        downloaded: false,
        type: 'chat',
      },
      {
        name: 'mlx-community/Qwen2.5-7B-Instruct-4bit',
        size: '4GB',
        downloaded: false,
        type: 'chat',
      },
    ];
  }

  async loadModel(modelPath: string): Promise<void> {
    logger.info('backend', 'Loading MLX model', modelPath);

    const response = await this.sendRequest({
      command: 'load',
      model_path: modelPath,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to load model');
    }

    this.currentModel = modelPath;
    logger.info('backend', 'MLX model loaded successfully', modelPath);
  }

  async unloadModel(): Promise<void> {
    if (!this.currentModel) {
      return;
    }

    logger.info('backend', 'Unloading MLX model', this.currentModel);

    const response = await this.sendRequest({
      command: 'unload',
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to unload model');
    }

    this.currentModel = null;
    logger.info('backend', 'MLX model unloaded successfully', '');
  }

  /**
   * Communication IPC avec le processus Python
   */
  private async sendRequest(
    request: MLXLLMRequest,
    skipReadyCheck: boolean = false
  ): Promise<MLXLLMResponse> {
    // Permettre le ping initial sans vérifier isReady (pour éviter le deadlock)
    if (!skipReadyCheck && (!this.pythonProcess || !this.isReady)) {
      throw new Error('MLX LLM backend not ready');
    }

    if (!this.pythonProcess) {
      throw new Error('MLX LLM backend process not started');
    }

    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      const timeout = setTimeout(() => {
        this.requestQueue.delete(id);
        reject(new Error('MLX LLM request timeout'));
      }, 60000); // 60 secondes timeout (modèles peuvent être longs à charger)

      this.requestQueue.set(id, {
        resolve: (response) => {
          clearTimeout(timeout);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });

      // Envoyer la requête
      const requestLine = JSON.stringify(request) + '\n';
      this.pythonProcess!.stdin?.write(requestLine);
    });
  }

  private async sendRequestWithStreaming(
    request: MLXLLMRequest,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    if (!this.pythonProcess || !this.isReady) {
      throw new Error('MLX LLM backend not ready');
    }

    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      const timeout = setTimeout(() => {
        this.requestQueue.delete(id);
        reject(new Error('MLX LLM request timeout'));
      }, 300000); // 5 minutes timeout pour génération longue

      this.requestQueue.set(id, {
        resolve: (response) => {
          clearTimeout(timeout);
          resolve();
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
        onChunk,
      });

      // Envoyer la requête
      const requestLine = JSON.stringify(request) + '\n';
      this.pythonProcess!.stdin?.write(requestLine);
    });
  }

  private handleResponse(line: string): void {
    try {
      const response: MLXLLMResponse = JSON.parse(line);

      // Prendre le premier callback dans la queue (FIFO)
      const entries = Array.from(this.requestQueue.entries());
      if (entries.length === 0) {
        logger.warning('backend', 'Received MLX response with no pending request', '');
        return;
      }

      const [id, callback] = entries[0];

      // Si c'est un chunk de streaming
      if (response.type === 'chunk' && callback.onChunk) {
        callback.onChunk(response.content || '');
        return; // Ne pas supprimer le callback, attendre 'complete'
      }

      // Si c'est la fin du streaming ou une réponse normale
      if (response.type === 'complete' || !response.type) {
        this.requestQueue.delete(id);

        if (response.success) {
          callback.resolve(response);
        } else {
          callback.reject(new Error(response.error || 'Unknown MLX LLM error'));
        }
      }
    } catch (error) {
      logger.error('backend', 'Error parsing MLX LLM response', line.substring(0, 100), {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async waitForReady(timeout = 10000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        // Utiliser skipReadyCheck=true pour éviter le deadlock lors du ping initial
        const response = await this.sendRequest({ command: 'ping' }, true);
        if (response.success) {
          this.isReady = true;
          logger.info('backend', 'MLX LLM backend ready', 'Ping successful');
          return;
        }
      } catch (error) {
        // Attendre et réessayer
        logger.debug('backend', 'MLX LLM ping retry', '', {
          error: error instanceof Error ? error.message : String(error),
        });
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    throw new Error('MLX LLM backend failed to start within timeout');
  }

  private async loadDefaultModel(): Promise<void> {
    // Pour l'instant, on suppose que l'utilisateur a déjà téléchargé un modèle
    // Plus tard, on pourra détecter automatiquement les modèles disponibles
    const defaultModel = 'mlx-community/Llama-3.2-3B-Instruct-4bit';
    logger.info('backend', 'Loading default MLX model', defaultModel);
    await this.loadModel(defaultModel);
  }
}
