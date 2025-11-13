/**
 * Backend System - Exports
 */

// Types
export * from './backend-types';
export * from './backend-interface';

// Manager
export { BackendManager, backendManager } from './backend-manager';

// Initialization
export { initializeBackends, shutdownBackends } from './initialize-backends';

// Backends
export { OllamaExternalBackend } from './ollama/ollama-external-backend';
export { MLXBackend } from './mlx/mlx-backend';

// TODO: À implémenter dans Phase 3
// export { OllamaEmbeddedBackend } from './ollama/ollama-embedded-backend';
