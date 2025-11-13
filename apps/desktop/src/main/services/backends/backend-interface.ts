/**
 * Interface commune pour tous les backends AI
 * Chaque backend (MLX, Ollama External, Ollama Embedded) doit implémenter cette interface
 */

import type {
  BackendType,
  BackendStatus,
  BackendCapability,
  ChatRequest,
  ChatResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  VisionRequest,
  VisionResponse,
  BackendModelInfo,
} from './backend-types';

export interface AIBackend {
  /**
   * Type du backend
   */
  readonly type: BackendType;

  /**
   * Capacités supportées par ce backend
   */
  readonly capabilities: BackendCapability[];

  /**
   * Vérifier si le backend est disponible sur le système
   * (sans l'initialiser)
   */
  isAvailable(): Promise<boolean>;

  /**
   * Initialiser le backend
   * (démarrer les processus, charger les modèles, etc.)
   */
  initialize(): Promise<void>;

  /**
   * Arrêter le backend proprement
   */
  shutdown(): Promise<void>;

  /**
   * Obtenir le statut actuel du backend
   */
  getStatus(): Promise<BackendStatus>;

  /**
   * CHAT: Générer une réponse de chat
   * @throws Error si le backend ne supporte pas cette capacité
   */
  chat(request: ChatRequest): Promise<AsyncIterable<string>>;

  /**
   * CHAT: Générer une réponse complète (non-streaming)
   * @throws Error si le backend ne supporte pas cette capacité
   */
  chatComplete(request: ChatRequest): Promise<ChatResponse>;

  /**
   * EMBEDDINGS: Générer un embedding vectoriel
   * @throws Error si le backend ne supporte pas cette capacité
   */
  generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse>;

  /**
   * VISION: Traiter une image
   * @throws Error si le backend ne supporte pas cette capacité
   */
  processImage(request: VisionRequest): Promise<VisionResponse>;

  /**
   * Lister les modèles disponibles
   */
  listModels(): Promise<BackendModelInfo[]>;

  /**
   * Télécharger un modèle
   * @returns Promise qui se résout quand le téléchargement est terminé
   */
  downloadModel?(modelName: string, onProgress?: (progress: number) => void): Promise<void>;

  /**
   * Supprimer un modèle
   */
  deleteModel?(modelName: string): Promise<void>;

  /**
   * Vérifier qu'une capacité est supportée
   */
  hasCapability(capability: BackendCapability): boolean;
}

/**
 * Classe de base abstraite pour faciliter l'implémentation
 */
export abstract class BaseAIBackend implements AIBackend {
  abstract readonly type: BackendType;
  abstract readonly capabilities: BackendCapability[];

  abstract isAvailable(): Promise<boolean>;
  abstract initialize(): Promise<void>;
  abstract shutdown(): Promise<void>;
  abstract getStatus(): Promise<BackendStatus>;

  hasCapability(capability: BackendCapability): boolean {
    return this.capabilities.includes(capability);
  }

  async chat(request: ChatRequest): Promise<AsyncIterable<string>> {
    throw new Error(`Backend ${this.type} does not support chat capability`);
  }

  async chatComplete(request: ChatRequest): Promise<ChatResponse> {
    throw new Error(`Backend ${this.type} does not support chat capability`);
  }

  async generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    throw new Error(`Backend ${this.type} does not support embeddings capability`);
  }

  async processImage(request: VisionRequest): Promise<VisionResponse> {
    throw new Error(`Backend ${this.type} does not support vision capability`);
  }

  async listModels(): Promise<BackendModelInfo[]> {
    return [];
  }

  protected assertCapability(capability: BackendCapability): void {
    if (!this.hasCapability(capability)) {
      throw new Error(
        `Backend ${this.type} does not support ${capability} capability. ` +
        `Supported capabilities: ${this.capabilities.join(', ')}`
      );
    }
  }
}
