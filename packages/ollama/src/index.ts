/**
 * @blackia/ollama
 * Client Ollama pour BlackIA avec support local et distant
 */

export { OllamaClient } from './client';

export {
  OllamaError,
  OllamaConnectionError,
  OllamaModelNotFoundError,
  OllamaTimeoutError,
  OllamaStreamError,
} from './errors';

export type {
  OllamaConfig,
  OllamaModel,
  OllamaMessage,
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaChatStreamChunk,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaEmbeddingRequest,
  OllamaEmbeddingResponse,
  OllamaModelInfo,
  OllamaVersion,
  OllamaPullProgress,
  StreamCallback,
  PullProgressCallback,
  // Types pour les outils MCP
  OllamaTool,
  OllamaToolCall,
  OllamaToolParameter,
} from './types';
