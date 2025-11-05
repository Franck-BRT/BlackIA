// Note: fetch est disponible nativement dans Node.js 18+
import {
  OllamaConfig,
  OllamaModel,
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaChatStreamChunk,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaEmbeddingRequest,
  OllamaEmbeddingResponse,
  OllamaModelInfo,
  OllamaVersion,
  StreamCallback,
  PullProgressCallback,
  OllamaPullProgress,
} from './types';
import {
  OllamaError,
  OllamaConnectionError,
  OllamaModelNotFoundError,
  OllamaTimeoutError,
  OllamaStreamError,
} from './errors';

/**
 * Client Ollama pour BlackIA
 * Support du mode local (embarqué) et distant
 */
export class OllamaClient {
  private baseUrl: string;
  private timeout: number;
  private mode: 'local' | 'remote';

  constructor(config: OllamaConfig = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
    this.timeout = config.timeout || 60000;
    this.mode = config.mode || 'local';
  }

  /**
   * Vérifie si Ollama est accessible
   */
  async isAvailable(): Promise<boolean> {
    try {
      console.log('[OllamaClient] Vérification disponibilité sur:', this.baseUrl);
      const response = await this.fetch('/api/version', {
        method: 'GET',
        timeout: 5000,
      });
      console.log('[OllamaClient] Réponse reçue, status:', response.status, 'ok:', response.ok);
      return response.ok;
    } catch (error) {
      console.error('[OllamaClient] Erreur isAvailable:', error);
      return false;
    }
  }

  /**
   * Récupère la version d'Ollama
   */
  async getVersion(): Promise<OllamaVersion> {
    const response = await this.fetch('/api/version', {
      method: 'GET',
    });
    return response.json() as Promise<OllamaVersion>;
  }

  /**
   * Liste tous les modèles disponibles
   */
  async listModels(): Promise<OllamaModel[]> {
    const response = await this.fetch('/api/tags', {
      method: 'GET',
    });

    const data = (await response.json()) as { models: OllamaModel[] };
    return data.models || [];
  }

  /**
   * Récupère les informations d'un modèle spécifique
   */
  async getModelInfo(modelName: string): Promise<OllamaModelInfo> {
    const response = await this.fetch('/api/show', {
      method: 'POST',
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) {
      throw new OllamaModelNotFoundError(modelName);
    }

    return response.json() as Promise<OllamaModelInfo>;
  }

  /**
   * Télécharge un modèle depuis la bibliothèque Ollama
   */
  async pullModel(
    modelName: string,
    onProgress?: PullProgressCallback
  ): Promise<void> {
    const response = await this.fetch('/api/pull', {
      method: 'POST',
      body: JSON.stringify({ name: modelName, stream: true }),
    });

    if (!response.ok) {
      throw new OllamaError(
        `Échec du téléchargement du modèle: ${response.statusText}`,
        response.status
      );
    }

    if (onProgress) {
      await this.processStream<OllamaPullProgress>(response, onProgress);
    }
  }

  /**
   * Supprime un modèle
   */
  async deleteModel(modelName: string): Promise<void> {
    const response = await this.fetch('/api/delete', {
      method: 'DELETE',
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) {
      throw new OllamaError(
        `Échec de la suppression du modèle: ${response.statusText}`,
        response.status
      );
    }
  }

  /**
   * Envoie une requête de chat (sans streaming)
   */
  async chat(request: OllamaChatRequest): Promise<OllamaChatResponse> {
    const response = await this.fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ ...request, stream: false }),
    });

    if (!response.ok) {
      throw new OllamaError(
        `Erreur lors du chat: ${response.statusText}`,
        response.status
      );
    }

    return response.json() as Promise<OllamaChatResponse>;
  }

  /**
   * Envoie une requête de chat avec streaming
   */
  async chatStream(
    request: OllamaChatRequest,
    onChunk: StreamCallback
  ): Promise<void> {
    console.log('[OllamaClient.chatStream] 🚀 Début du chatStream');
    console.log('[OllamaClient.chatStream] Request:', JSON.stringify(request, null, 2));
    console.log('[OllamaClient.chatStream] onChunk type:', typeof onChunk);

    const response = await this.fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ ...request, stream: true }),
    });

    console.log('[OllamaClient.chatStream] Response reçue, status:', response.status);
    console.log('[OllamaClient.chatStream] Response.body exists:', !!response.body);

    if (!response.ok) {
      throw new OllamaError(
        `Erreur lors du chat stream: ${response.statusText}`,
        response.status
      );
    }

    console.log('[OllamaClient.chatStream] ⏳ Début du processStream...');
    await this.processStream<OllamaChatStreamChunk>(response, onChunk);
    console.log('[OllamaClient.chatStream] ✅ processStream terminé');
  }

  /**
   * Génère une complétion (sans streaming)
   */
  async generate(
    request: OllamaGenerateRequest
  ): Promise<OllamaGenerateResponse> {
    const response = await this.fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ ...request, stream: false }),
    });

    if (!response.ok) {
      throw new OllamaError(
        `Erreur lors de la génération: ${response.statusText}`,
        response.status
      );
    }

    return response.json() as Promise<OllamaGenerateResponse>;
  }

  /**
   * Génère une complétion avec streaming
   */
  async generateStream(
    request: OllamaGenerateRequest,
    onChunk: (chunk: OllamaGenerateResponse) => void
  ): Promise<void> {
    const response = await this.fetch('/api/generate', {
      method: 'POST',
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      throw new OllamaError(
        `Erreur lors du generate stream: ${response.statusText}`,
        response.status
      );
    }

    await this.processStream<OllamaGenerateResponse>(response, onChunk);
  }

  /**
   * Génère des embeddings pour un texte
   */
  async embeddings(
    request: OllamaEmbeddingRequest
  ): Promise<OllamaEmbeddingResponse> {
    const response = await this.fetch('/api/embeddings', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new OllamaError(
        `Erreur lors de la génération des embeddings: ${response.statusText}`,
        response.status
      );
    }

    return response.json() as Promise<OllamaEmbeddingResponse>;
  }

  /**
   * Méthode fetch interne avec gestion d'erreurs
   */
  private async fetch(
    endpoint: string,
    options: {
      method: string;
      body?: string;
      timeout?: number;
    }
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    const timeout = options.timeout || this.timeout;

    console.log('[OllamaClient.fetch] URL:', url);
    console.log('[OllamaClient.fetch] typeof fetch:', typeof fetch);
    console.log('[OllamaClient.fetch] fetch exists:', typeof fetch !== 'undefined');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method: options.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: options.body,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('[OllamaClient.fetch] Succès! Status:', response.status);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error('[OllamaClient.fetch] Erreur:', error);
      console.error('[OllamaClient.fetch] Error name:', error.name);
      console.error('[OllamaClient.fetch] Error code:', error.code);
      console.error('[OllamaClient.fetch] Error message:', error.message);

      if (error.name === 'AbortError') {
        throw new OllamaTimeoutError(
          `La requête vers ${url} a expiré après ${timeout}ms`
        );
      }

      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new OllamaConnectionError(
          `Impossible de se connecter à Ollama sur ${this.baseUrl}. Assurez-vous qu'Ollama est en cours d'exécution.`
        );
      }

      throw new OllamaError(
        `Erreur réseau: ${error.message || 'Erreur inconnue'}`
      );
    }
  }

  /**
   * Traite un stream de réponses JSON (NDJSON)
   */
  private async processStream<T>(
    response: Response,
    onChunk: (chunk: T) => void
  ): Promise<void> {
    console.log('[OllamaClient.processStream] 🎬 Début du processStream');

    if (!response.body) {
      throw new OllamaStreamError('Pas de corps de réponse pour le stream');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let chunkCount = 0;

    console.log('[OllamaClient.processStream] Reader créé, début de la lecture...');

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('[OllamaClient.processStream] ✅ Stream terminé, total chunks:', chunkCount);
          break;
        }

        chunkCount++;
        const decodedChunk = decoder.decode(value, { stream: true });
        console.log('[OllamaClient.processStream] 📦 Chunk #' + chunkCount + ' reçu, taille:', decodedChunk.length);

        buffer += decodedChunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        console.log('[OllamaClient.processStream] Lignes à traiter:', lines.length);

        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line) as T;
              console.log('[OllamaClient.processStream] 🔄 Calling onChunk avec data:', JSON.stringify(data).substring(0, 100));
              onChunk(data);
              console.log('[OllamaClient.processStream] ✅ onChunk appelé avec succès');
            } catch (error) {
              console.error('[OllamaClient.processStream] ❌ Erreur lors du parsing JSON:', error);
              console.error('[OllamaClient.processStream] Ligne problématique:', line);
            }
          }
        }
      }

      // Traiter le reste du buffer
      if (buffer.trim()) {
        console.log('[OllamaClient.processStream] Traitement du buffer final, taille:', buffer.length);
        try {
          const data = JSON.parse(buffer) as T;
          console.log('[OllamaClient.processStream] 🔄 Calling onChunk (final) avec data:', JSON.stringify(data).substring(0, 100));
          onChunk(data);
          console.log('[OllamaClient.processStream] ✅ onChunk final appelé avec succès');
        } catch (error) {
          console.error('[OllamaClient.processStream] ❌ Erreur lors du parsing JSON final:', error);
          console.error('[OllamaClient.processStream] Buffer final problématique:', buffer);
        }
      }
    } catch (error: any) {
      console.error('[OllamaClient.processStream] ❌ Erreur critique dans le stream:', error);
      throw new OllamaStreamError(
        `Erreur lors du traitement du stream: ${error.message}`
      );
    } finally {
      reader.releaseLock();
      console.log('[OllamaClient.processStream] 🏁 Fin du processStream');
    }
  }

  /**
   * Change la configuration du client
   */
  setConfig(config: Partial<OllamaConfig>): void {
    if (config.baseUrl !== undefined) {
      this.baseUrl = config.baseUrl;
    }
    if (config.timeout !== undefined) {
      this.timeout = config.timeout;
    }
    if (config.mode !== undefined) {
      this.mode = config.mode;
    }
  }

  /**
   * Récupère la configuration actuelle
   */
  getConfig(): OllamaConfig {
    return {
      baseUrl: this.baseUrl,
      timeout: this.timeout,
      mode: this.mode,
    };
  }
}
