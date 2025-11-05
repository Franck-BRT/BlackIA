/**
 * Types pour l'intégration Ollama dans BlackIA
 */

export interface OllamaConfig {
  /**
   * URL de base de l'API Ollama
   * @default "http://localhost:11434"
   */
  baseUrl?: string;

  /**
   * Timeout des requêtes en millisecondes
   * @default 60000
   */
  timeout?: number;

  /**
   * Mode de connexion : local (embarqué) ou distant
   * @default "local"
   */
  mode?: 'local' | 'remote';
}

export interface OllamaModel {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model?: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[]; // Base64 encoded images
}

export interface OllamaChatRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  format?: 'json';
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
    stop?: string[];
    seed?: number;
    num_ctx?: number;
    repeat_penalty?: number;
    presence_penalty?: number;
    frequency_penalty?: number;
  };
}

export interface OllamaChatResponse {
  model: string;
  created_at: string;
  message: OllamaMessage;
  done: boolean;
  done_reason?: string;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaChatStreamChunk {
  model: string;
  created_at: string;
  message: {
    role: 'assistant';
    content: string;
  };
  done: boolean;
  done_reason?: string;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  system?: string;
  template?: string;
  context?: number[];
  raw?: boolean;
  format?: 'json';
  options?: OllamaChatRequest['options'];
  images?: string[];
}

export interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  done_reason?: string;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaEmbeddingRequest {
  model: string;
  prompt: string;
  options?: OllamaChatRequest['options'];
}

export interface OllamaEmbeddingResponse {
  embedding: number[];
}

export interface OllamaModelInfo {
  modelfile: string;
  parameters: string;
  template: string;
  details: OllamaModel['details'];
}

export interface OllamaPullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

export interface OllamaVersion {
  version: string;
}

/**
 * Callback pour le streaming des réponses
 */
export type StreamCallback = (chunk: OllamaChatStreamChunk) => void;

/**
 * Callback pour le téléchargement de modèles
 */
export type PullProgressCallback = (progress: OllamaPullProgress) => void;
