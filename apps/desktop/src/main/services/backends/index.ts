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

// TODO: À implémenter dans les phases suivantes
// export { MLXBackend } from './mlx/mlx-backend';
// export { OllamaEmbeddedBackend } from './ollama/ollama-embedded-backend';
