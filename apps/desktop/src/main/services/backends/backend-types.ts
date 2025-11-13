/**
 * Types et interfaces pour le système multi-backend AI
 * Supporte MLX, Ollama External, et Ollama Embedded
 */

export type BackendType = 'mlx' | 'ollama-external' | 'ollama-embedded';

export type BackendCapability = 'chat' | 'embeddings' | 'vision';

/**
 * Paramètres de configuration pour chaque backend
 */
export interface BackendSettings {
  preferredBackend: BackendType;
  fallbackEnabled: boolean;
  mlx: MLXSettings;
  ollama: OllamaSettings;
}

export interface MLXSettings {
  enabled: boolean;
  chatModel: string;
  embedModel: string;
  visionModel: string;
  pythonPath?: string;
}

export interface OllamaSettings {
  external: {
    enabled: boolean;
    url: string;
    timeout: number;
  };
  embedded: {
    enabled: boolean;
    port: number;
    modelsPath: string;
    autoStart: boolean;
  };
}

/**
 * Statut d'un backend
 */
export interface BackendStatus {
  type: BackendType;
  available: boolean;
  initialized: boolean;
  capabilities: BackendCapability[];
  models: BackendModelInfo[];
  version?: string;
  error?: string;
}

export interface BackendModelInfo {
  name: string;
  size?: string;
  downloaded: boolean;
  type: 'chat' | 'embed' | 'vision';
}

/**
 * Requêtes pour chaque capacité
 */
export interface ChatRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface ChatResponse {
  content: string;
  model: string;
  finishReason?: 'stop' | 'length' | 'error';
}

export interface EmbeddingRequest {
  text: string | string[];
  model: string;
}

export interface EmbeddingResponse {
  embeddings: number[] | number[][];
  model: string;
  dimensions: number;
}

export interface VisionRequest {
  image: string; // base64 or file path
  prompt?: string;
  model: string;
}

export interface VisionResponse {
  description: string;
  model: string;
  patches?: number[][]; // Pour ColPali/Vision RAG
}

/**
 * Événements du backend
 */
export type BackendEvent =
  | { type: 'status-changed'; backend: BackendType; status: BackendStatus }
  | { type: 'model-download-progress'; model: string; progress: number }
  | { type: 'backend-switched'; from?: BackendType; to: BackendType; reason: string }
  | { type: 'error'; backend: BackendType; error: Error };
