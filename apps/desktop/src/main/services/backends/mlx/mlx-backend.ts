/**
 * MLX Backend
 * Utilise MLX (Apple Machine Learning Framework) pour des embeddings natifs
 * Optimisé pour Apple Silicon (M1/M2/M3)
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
  EmbeddingRequest,
  EmbeddingResponse,
} from '../backend-types';

interface MLXRequest {
  command: 'embed' | 'ping' | 'status';
  text?: string | string[];
  model?: string;
}

interface MLXResponse {
  success: boolean;
  embeddings?: number[] | number[][];
  dimensions?: number;
  model?: string;
  error?: string;
  message?: string;
  model_loaded?: string;
  ready?: boolean;
}

export class MLXBackend extends BaseAIBackend {
  readonly type: BackendType = 'mlx';
  readonly capabilities: BackendCapability[] = ['embeddings']; // Pour l'instant, seulement embeddings

  private pythonProcess: ChildProcess | null = null;
  private pythonPath: string = 'python3';
  private scriptPath: string;
  private requestQueue: Map<number, {
    resolve: (value: MLXResponse) => void;
    reject: (error: Error) => void;
  }> = new Map();
  private requestId = 0;
  private isReady = false;
  private defaultModel = 'sentence-transformers/all-MiniLM-L6-v2';

  constructor(pythonPath?: string) {
    super();
    if (pythonPath) {
      this.pythonPath = pythonPath;
    }
    this.scriptPath = join(__dirname, 'mlx_embeddings.py');
  }

  async isAvailable(): Promise<boolean> {
    // Vérifier si on est sur macOS
    if (process.platform !== 'darwin') {
      logger.debug('backend', 'MLX not available', 'Not on macOS');
      return false;
    }

    // Essayer plusieurs chemins Python
    const pythonPaths = [
      this.pythonPath,
      'python3',
      '/usr/bin/python3',
      '/opt/homebrew/bin/python3',
      '/usr/local/bin/python3',
    ];

    for (const pythonPath of pythonPaths) {
      try {
        const { execSync } = require('child_process');

        // Vérifier si Python existe
        execSync(`${pythonPath} --version`, { stdio: 'ignore' });

        // Vérifier si sentence-transformers est installé
        execSync(`${pythonPath} -c "import sentence_transformers"`, { stdio: 'ignore' });

        // Succès ! Utiliser ce Python
        this.pythonPath = pythonPath;
        logger.debug('backend', 'MLX available', `Using Python: ${pythonPath}`);
        return true;
      } catch {
        // Ce chemin ne fonctionne pas, essayer le suivant
        continue;
      }
    }

    logger.warning('backend', 'MLX not available', 'sentence-transformers not installed. Install with: pip3 install sentence-transformers torch');
    return false;
  }

  async initialize(): Promise<void> {
    logger.info('backend', 'Initializing MLX backend', '');

    if (!(await this.isAvailable())) {
      throw new Error('MLX backend not available. Ensure Python3 and sentence-transformers are installed.');
    }

    // Démarrer le processus Python
    this.pythonProcess = spawn(this.pythonPath, [this.scriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Gérer les erreurs du processus
    this.pythonProcess.on('error', (error) => {
      logger.error('backend', 'MLX process error', '', { error: error.message });
      this.isReady = false;
    });

    this.pythonProcess.on('exit', (code, signal) => {
      logger.warning('backend', 'MLX process exited', '', { code, signal });
      this.isReady = false;
    });

    // Gérer stderr pour les logs
    this.pythonProcess.stderr?.on('data', (data) => {
      const message = data.toString().trim();
      logger.debug('backend', 'MLX stderr', message);
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

    logger.info('backend', 'MLX backend initialized', 'Ready to process requests');
  }

  async shutdown(): Promise<void> {
    logger.info('backend', 'Shutting down MLX backend', '');

    if (this.pythonProcess) {
      this.pythonProcess.kill('SIGTERM');
      this.pythonProcess = null;
    }

    this.isReady = false;
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
        error: 'MLX backend not initialized',
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
        version: 'MLX + sentence-transformers',
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
   * EMBEDDINGS Implementation
   */
  async generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    this.assertCapability('embeddings');

    const texts = Array.isArray(request.text) ? request.text : [request.text];
    const model = request.model || this.defaultModel;

    logger.debug('backend', 'MLX generating embeddings', `Model: ${model}, Count: ${texts.length}`);

    try {
      const response = await this.sendRequest({
        command: 'embed',
        text: texts,
        model,
      });

      if (!response.success) {
        throw new Error(response.error || 'MLX embedding generation failed');
      }

      if (!response.embeddings) {
        throw new Error('No embeddings in response');
      }

      logger.debug('backend', 'MLX embeddings generated', `Dimensions: ${response.dimensions}`);

      return {
        embeddings: Array.isArray(request.text) ? response.embeddings as number[][] : (response.embeddings as number[][])[0],
        model,
        dimensions: response.dimensions || 0,
      };
    } catch (error) {
      logger.error('backend', 'MLX embedding error', '', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Model Management
   */
  async listModels(): Promise<BackendModelInfo[]> {
    // Modèles recommandés pour sentence-transformers
    return [
      {
        name: 'sentence-transformers/all-MiniLM-L6-v2',
        size: '80MB',
        downloaded: true, // Sera téléchargé automatiquement au premier usage
        type: 'embed',
      },
      {
        name: 'sentence-transformers/all-mpnet-base-v2',
        size: '420MB',
        downloaded: false,
        type: 'embed',
      },
      {
        name: 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
        size: '470MB',
        downloaded: false,
        type: 'embed',
      },
    ];
  }

  /**
   * Communication IPC avec le processus Python
   */
  private async sendRequest(request: MLXRequest): Promise<MLXResponse> {
    if (!this.pythonProcess || !this.isReady) {
      throw new Error('MLX backend not ready');
    }

    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      const timeout = setTimeout(() => {
        this.requestQueue.delete(id);
        reject(new Error('MLX request timeout'));
      }, 30000); // 30 secondes timeout

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

  private handleResponse(line: string): void {
    try {
      const response: MLXResponse = JSON.parse(line);

      // Prendre le premier callback dans la queue (FIFO)
      const entries = Array.from(this.requestQueue.entries());
      if (entries.length > 0) {
        const [id, callback] = entries[0];
        this.requestQueue.delete(id);

        if (response.success) {
          callback.resolve(response);
        } else {
          callback.reject(new Error(response.error || 'Unknown MLX error'));
        }
      }
    } catch (error) {
      logger.error('backend', 'Error parsing MLX response', line.substring(0, 100), {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async waitForReady(timeout = 10000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      try {
        const response = await this.sendRequest({ command: 'ping' });
        if (response.success) {
          this.isReady = true;
          return;
        }
      } catch {
        // Attendre et réessayer
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    throw new Error('MLX backend failed to start within timeout');
  }
}
