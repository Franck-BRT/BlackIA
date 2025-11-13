/**
 * Ollama External Backend
 * Utilise une instance Ollama externe (installée par l'utilisateur)
 */

import axios from 'axios';
import { execSync } from 'child_process';
import http from 'http';
import https from 'https';
import { logger } from '../../log-service';
import { BaseAIBackend } from '../backend-interface';
import type {
  BackendType,
  BackendStatus,
  BackendCapability,
  BackendModelInfo,
  ChatRequest,
  ChatResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  VisionRequest,
  VisionResponse,
} from '../backend-types';

export class OllamaExternalBackend extends BaseAIBackend {
  readonly type: BackendType = 'ollama-external';
  readonly capabilities: BackendCapability[] = ['chat', 'embeddings', 'vision'];

  private baseUrl: string;
  private timeout: number;
  private availableModels: string[] = [];

  constructor(baseUrl = 'http://localhost:11434', timeout = 120000) {
    super();
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Vérifier si Ollama répond
      const response = await axios.get(`${this.baseUrl}/api/tags`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      logger.debug('backend', 'Ollama external not available', '', {
        baseUrl: this.baseUrl,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  async initialize(): Promise<void> {
    logger.info('backend', 'Initializing Ollama External backend', this.baseUrl);

    // Vérifier la disponibilité
    if (!(await this.isAvailable())) {
      throw new Error(`Ollama not available at ${this.baseUrl}`);
    }

    // Charger la liste des modèles
    await this.refreshModels();

    logger.info('backend', 'Ollama External initialized', `Found ${this.availableModels.length} models`);
  }

  async shutdown(): Promise<void> {
    logger.info('backend', 'Shutting down Ollama External backend', '');
    // Rien à faire pour Ollama externe (géré par l'utilisateur)
  }

  async getStatus(): Promise<BackendStatus> {
    const available = await this.isAvailable();

    if (!available) {
      return {
        type: this.type,
        available: false,
        initialized: false,
        capabilities: this.capabilities,
        models: [],
        error: 'Ollama service not reachable',
      };
    }

    const models = await this.listModels();

    return {
      type: this.type,
      available: true,
      initialized: true,
      capabilities: this.capabilities,
      models,
      version: await this.getOllamaVersion(),
    };
  }

  /**
   * CHAT Implementation
   */
  async *chat(request: ChatRequest): AsyncIterable<string> {
    this.assertCapability('chat');

    logger.debug('backend', 'Ollama chat request', `Model: ${request.model}`, {
      model: request.model,
      messageCount: request.messages.length,
    });

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/chat`,
        {
          model: request.model,
          messages: request.messages,
          stream: true,
          options: {
            temperature: request.temperature,
            num_predict: request.maxTokens,
          },
        },
        {
          responseType: 'stream',
          timeout: this.timeout,
        }
      );

      for await (const chunk of response.data) {
        const text = chunk.toString();
        const lines = text.split('\n').filter((line: string) => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              yield data.message.content;
            }
          } catch {
            // Ignorer les lignes mal formées
          }
        }
      }
    } catch (error) {
      logger.error('backend', 'Ollama chat error', '', {
        error: error instanceof Error ? error.message : String(error),
        model: request.model,
      });
      throw error;
    }
  }

  async chatComplete(request: ChatRequest): Promise<ChatResponse> {
    this.assertCapability('chat');

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/chat`,
        {
          model: request.model,
          messages: request.messages,
          stream: false,
          options: {
            temperature: request.temperature,
            num_predict: request.maxTokens,
          },
        },
        {
          timeout: this.timeout,
        }
      );

      return {
        content: response.data.message.content,
        model: request.model,
        finishReason: response.data.done ? 'stop' : undefined,
      };
    } catch (error) {
      logger.error('backend', 'Ollama chat complete error', '', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * EMBEDDINGS Implementation avec fallback curl
   */
  async generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    this.assertCapability('embeddings');

    const texts = Array.isArray(request.text) ? request.text : [request.text];
    const embeddings: number[][] = [];

    logger.debug('backend', 'Generating embeddings', `Model: ${request.model}, Count: ${texts.length}`);

    for (const text of texts) {
      try {
        // Essayer d'abord avec axios
        const embedding = await this.generateSingleEmbeddingHTTP(text, request.model);
        embeddings.push(embedding);
      } catch (error) {
        // Fallback vers curl si axios échoue avec EOF
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes('EOF') || errorMsg.includes('ECONNRESET')) {
          logger.warning('backend', 'Ollama HTTP failed, trying curl fallback', errorMsg);
          const embedding = await this.generateSingleEmbeddingCurl(text, request.model);
          embeddings.push(embedding);
        } else {
          throw error;
        }
      }
    }

    return {
      embeddings: Array.isArray(request.text) ? embeddings : embeddings[0],
      model: request.model,
      dimensions: embeddings[0]?.length || 0,
    };
  }

  private async generateSingleEmbeddingHTTP(text: string, model: string): Promise<number[]> {
    const response = await axios.post(
      `${this.baseUrl}/api/embeddings`,
      { model, prompt: text },
      {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Connection: 'close',
        },
        httpAgent: new http.Agent({ keepAlive: false }),
        httpsAgent: new https.Agent({ keepAlive: false }),
      }
    );

    if (!response.data.embedding) {
      throw new Error('Invalid response from Ollama: missing embedding');
    }

    return response.data.embedding;
  }

  private async generateSingleEmbeddingCurl(text: string, model: string): Promise<number[]> {
    logger.debug('backend', 'Using curl fallback for embedding', model);

    const payload = JSON.stringify({ model, prompt: text });
    const jsonPayload = JSON.stringify(payload);

    const command = `curl -s -X POST ${this.baseUrl}/api/embeddings \
      -H "Content-Type: application/json" \
      -H "Connection: close" \
      -d ${jsonPayload} \
      --max-time 120`;

    try {
      const output = execSync(command, {
        encoding: 'utf-8',
        timeout: this.timeout,
        maxBuffer: 10 * 1024 * 1024,
      });

      const response = JSON.parse(output.trim());

      if (!response.embedding || !Array.isArray(response.embedding)) {
        throw new Error(`Invalid response from Ollama: ${output.substring(0, 200)}`);
      }

      logger.debug('backend', 'Curl embedding successful', `Dimensions: ${response.embedding.length}`);

      return response.embedding;
    } catch (error) {
      logger.error('backend', 'Curl embedding failed', '', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * VISION Implementation
   */
  async processImage(request: VisionRequest): Promise<VisionResponse> {
    this.assertCapability('vision');

    logger.debug('backend', 'Ollama vision request', `Model: ${request.model}`);

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/generate`,
        {
          model: request.model,
          prompt: request.prompt || 'Describe this image',
          images: [request.image],
          stream: false,
        },
        {
          timeout: this.timeout,
        }
      );

      return {
        description: response.data.response,
        model: request.model,
      };
    } catch (error) {
      logger.error('backend', 'Ollama vision error', '', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Model Management
   */
  async listModels(): Promise<BackendModelInfo[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, {
        timeout: 5000,
      });

      const models: BackendModelInfo[] = response.data.models.map((model: any) => {
        // Détecter le type de modèle basé sur le nom
        let type: 'chat' | 'embed' | 'vision' = 'chat';
        if (model.name.includes('embed')) {
          type = 'embed';
        } else if (model.name.includes('vision') || model.name.includes('llava')) {
          type = 'vision';
        }

        return {
          name: model.name,
          size: this.formatSize(model.size),
          downloaded: true,
          type,
        };
      });

      this.availableModels = models.map((m) => m.name);

      return models;
    } catch (error) {
      logger.error('backend', 'Failed to list Ollama models', '', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  async downloadModel(modelName: string, onProgress?: (progress: number) => void): Promise<void> {
    logger.info('backend', 'Downloading Ollama model', modelName);

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/pull`,
        { name: modelName },
        {
          responseType: 'stream',
          timeout: 0, // Pas de timeout pour le téléchargement
        }
      );

      for await (const chunk of response.data) {
        const text = chunk.toString();
        try {
          const data = JSON.parse(text);
          if (data.status === 'downloading' && data.completed && data.total) {
            const progress = (data.completed / data.total) * 100;
            onProgress?.(progress);
          }
        } catch {
          // Ignorer les erreurs de parsing
        }
      }

      logger.info('backend', 'Model downloaded successfully', modelName);
      await this.refreshModels();
    } catch (error) {
      logger.error('backend', 'Model download failed', modelName, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async deleteModel(modelName: string): Promise<void> {
    logger.info('backend', 'Deleting Ollama model', modelName);

    try {
      await axios.delete(`${this.baseUrl}/api/delete`, {
        data: { name: modelName },
      });

      logger.info('backend', 'Model deleted successfully', modelName);
      await this.refreshModels();
    } catch (error) {
      logger.error('backend', 'Model deletion failed', modelName, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Helpers
   */
  private async getOllamaVersion(): Promise<string | undefined> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/version`, {
        timeout: 5000,
      });
      return response.data.version;
    } catch {
      return undefined;
    }
  }

  private async refreshModels(): Promise<void> {
    await this.listModels();
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
}
