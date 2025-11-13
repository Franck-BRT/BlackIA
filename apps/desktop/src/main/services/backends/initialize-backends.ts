/**
 * Initialisation des backends AI
 * À appeler au démarrage de l'application (dans main.ts)
 */

import { logger } from '../log-service';
import { backendManager } from './backend-manager';
import { OllamaExternalBackend } from './ollama/ollama-external-backend';
import { MLXBackend } from './mlx/mlx-backend';
// import { OllamaEmbeddedBackend } from './ollama/ollama-embedded-backend'; // Phase 3

/**
 * Initialiser tous les backends disponibles
 */
export async function initializeBackends(): Promise<void> {
  logger.info('backend', 'Initializing AI backends', '');

  try {
    // Créer les instances de backends
    const backends = [
      // Phase 2: MLX en priorité (natif Apple Silicon)
      new MLXBackend(),

      // Phase 1: Ollama External en fallback
      new OllamaExternalBackend('http://localhost:11434', 120000),

      // Phase 3: Ollama Embedded (TODO)
      // new OllamaEmbeddedBackend(),
    ];

    // Initialiser le Backend Manager
    await backendManager.initialize(backends);

    // Logger le backend actif
    const activeBackend = backendManager.getActiveBackendType();
    const status = await backendManager.getActiveBackend()?.getStatus();

    logger.info('backend', 'AI backends initialized successfully', `Active: ${activeBackend}`, {
      activeBackend,
      status,
    });

    // Écouter les événements du backend
    backendManager.on('backend-event', (event) => {
      logger.debug('backend', 'Backend event', event.type, { event });
    });

  } catch (error) {
    logger.error('backend', 'Failed to initialize AI backends', '', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Ne pas throw ici - permettre à l'app de démarrer même sans backend AI
    // L'utilisateur verra un message d'erreur dans l'UI
  }
}

/**
 * Fermer proprement tous les backends
 * À appeler avant la fermeture de l'application
 */
export async function shutdownBackends(): Promise<void> {
  logger.info('backend', 'Shutting down AI backends', '');

  try {
    await backendManager.shutdown();
    logger.info('backend', 'AI backends shut down successfully', '');
  } catch (error) {
    logger.error('backend', 'Error shutting down backends', '', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
