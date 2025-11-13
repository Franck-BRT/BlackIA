import { ipcMain } from 'electron';
import { textRAGService } from './services/text-rag-service';
import { logger } from './services/log-service';

/**
 * Configuration MLX stockée
 */
let mlxConfig = {
  model: 'sentence-transformers/all-mpnet-base-v2',
  pythonPath: 'python3',
  enabled: true
};

/**
 * Enregistre tous les handlers IPC pour MLX
 */
export function registerMLXHandlers(): void {
  // Vérifier si MLX est disponible
  ipcMain.handle('mlx:isAvailable', async () => {
    try {
      const status = await textRAGService.getStatus();
      return status.available;
    } catch (error: any) {
      logger.error('backend', 'Error checking MLX availability', '', {
        error: error.message
      });
      return false;
    }
  });

  // Obtenir le statut MLX
  ipcMain.handle('mlx:getStatus', async () => {
    try {
      const status = await textRAGService.getStatus();
      return {
        ...status,
        config: mlxConfig
      };
    } catch (error: any) {
      logger.error('backend', 'Error getting MLX status', '', {
        error: error.message
      });
      throw new Error(`Erreur statut MLX: ${error.message}`);
    }
  });

  // Lister les modèles disponibles
  ipcMain.handle('mlx:listModels', async () => {
    try {
      const models = await textRAGService.getAvailableModels();
      return models;
    } catch (error: any) {
      logger.error('backend', 'Error listing MLX models', '', {
        error: error.message
      });
      throw new Error(`Erreur liste modèles MLX: ${error.message}`);
    }
  });

  // Obtenir la configuration actuelle
  ipcMain.handle('mlx:getConfig', async () => {
    return mlxConfig;
  });

  // Mettre à jour la configuration
  ipcMain.handle('mlx:updateConfig', async (_, newConfig: {
    model?: string;
    pythonPath?: string;
    enabled?: boolean;
  }) => {
    try {
      // Merger la nouvelle config avec l'ancienne
      mlxConfig = {
        ...mlxConfig,
        ...newConfig
      };

      logger.info('backend', 'MLX configuration updated', '', {
        config: mlxConfig
      });

      // Redémarrer le service si nécessaire
      if (mlxConfig.enabled) {
        await textRAGService.shutdown();

        // Créer nouvelle instance avec la nouvelle config
        const { TextRAGService } = await import('./services/text-rag-service');
        const newService = new TextRAGService({
          model: mlxConfig.model,
          pythonPath: mlxConfig.pythonPath
        });

        await newService.initialize();

        logger.info('backend', 'MLX service restarted with new config', '');
      }

      return { success: true, config: mlxConfig };
    } catch (error: any) {
      logger.error('backend', 'Error updating MLX config', '', {
        error: error.message,
        newConfig
      });
      throw new Error(`Erreur mise à jour config MLX: ${error.message}`);
    }
  });

  // Tester la connexion MLX
  ipcMain.handle('mlx:test', async () => {
    try {
      const isReady = await textRAGService.isReady();

      if (!isReady) {
        await textRAGService.initialize();
      }

      // Générer un test embedding
      const testResult = await textRAGService.getStatus();

      return {
        success: true,
        message: 'MLX is ready',
        ...testResult
      };
    } catch (error: any) {
      logger.error('backend', 'MLX test failed', '', {
        error: error.message
      });
      return {
        success: false,
        message: error.message
      };
    }
  });

  // Réinitialiser MLX
  ipcMain.handle('mlx:restart', async () => {
    try {
      await textRAGService.shutdown();
      await textRAGService.initialize();

      logger.info('backend', 'MLX service restarted', '');

      return { success: true };
    } catch (error: any) {
      logger.error('backend', 'Error restarting MLX', '', {
        error: error.message
      });
      throw new Error(`Erreur redémarrage MLX: ${error.message}`);
    }
  });

  logger.info('backend', 'MLX IPC handlers registered', 'All MLX handlers are ready');
}

// Exporter la configuration pour les autres modules
export function getMLXConfig() {
  return mlxConfig;
}

export function setMLXConfig(config: typeof mlxConfig) {
  mlxConfig = config;
}
