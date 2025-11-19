import { ipcMain } from 'electron';
import { textRAGService } from './services/text-rag-service';
import { logger } from './services/log-service';
import { getMLXModelManager } from './services/mlx-model-manager';
import { getMLXStoreService } from './services/mlx-store-service';
import { getEmbeddingManager } from './services/mlx-embedding-manager';
import { MLXLLMBackend } from './services/backends/mlx/mlx-llm-backend';

/**
 * Configuration MLX stockée
 */
let mlxConfig = {
  model: 'sentence-transformers/all-mpnet-base-v2',
  llmModel: 'mlx-community/Llama-3.2-3B-Instruct-4bit',
  pythonPath: 'python3',
  enabled: true,
};

/**
 * Instance du backend LLM MLX
 */
let mlxLLMBackend: MLXLLMBackend | null = null;

/**
 * Enregistre tous les handlers IPC pour MLX
 */
export function registerMLXHandlers(): void {
  // ============================================
  // EMBEDDINGS (existant - pour RAG)
  // ============================================

  // Vérifier si MLX est disponible
  ipcMain.handle('mlx:isAvailable', async () => {
    try {
      const status = await textRAGService.getStatus();
      return status.available;
    } catch (error: any) {
      logger.error('backend', 'Error checking MLX availability', '', {
        error: error.message,
      });
      return false;
    }
  });

  // Obtenir le statut MLX
  ipcMain.handle('mlx:getStatus', async () => {
    try {
      // Vérifier d'abord la disponibilité sans initialiser
      const mlxBackend = new (
        await import('./services/backends/mlx/mlx-backend')
      ).MLXBackend(mlxConfig.pythonPath);
      const available = await mlxBackend.isAvailable();

      if (!available) {
        return {
          type: 'mlx',
          available: false,
          initialized: false,
          capabilities: [],
          models: [],
          error: "sentence-transformers n'est pas installé",
          config: mlxConfig,
        };
      }

      // Vérifier si le service est initialisé, sinon l'initialiser
      const isReady = await textRAGService.isReady();
      if (!isReady) {
        await textRAGService.initialize();
      }

      // Si disponible, obtenir le statut complet
      const status = await textRAGService.getStatus();
      return {
        ...status,
        config: mlxConfig,
      };
    } catch (error: any) {
      logger.error('backend', 'Error getting MLX status', '', {
        error: error.message,
      });
      return {
        type: 'mlx',
        available: false,
        initialized: false,
        capabilities: [],
        models: [],
        error: error.message,
        config: mlxConfig,
      };
    }
  });

  // Lister les modèles d'embeddings disponibles
  ipcMain.handle('mlx:listModels', async () => {
    try {
      const mlxBackend = new (
        await import('./services/backends/mlx/mlx-backend')
      ).MLXBackend(mlxConfig.pythonPath);
      const available = await mlxBackend.isAvailable();

      if (!available) {
        return [];
      }

      // Retourner les objets modèles complets au lieu de juste les noms
      const models = await mlxBackend.listModels();
      return models;
    } catch (error: any) {
      logger.error('backend', 'Error listing MLX models', '', {
        error: error.message,
      });
      return [];
    }
  });

  // Obtenir la configuration actuelle
  ipcMain.handle('mlx:getConfig', async () => {
    return mlxConfig;
  });

  // Mettre à jour la configuration
  ipcMain.handle(
    'mlx:updateConfig',
    async (
      _,
      newConfig: {
        model?: string;
        llmModel?: string;
        pythonPath?: string;
        enabled?: boolean;
      }
    ) => {
      try {
        mlxConfig = {
          ...mlxConfig,
          ...newConfig,
        };

        logger.info('backend', 'MLX configuration updated', '', {
          config: mlxConfig,
        });

        // Redémarrer le service RAG si nécessaire
        if (mlxConfig.enabled && newConfig.model) {
          await textRAGService.shutdown();

          const { TextRAGService } = await import('./services/text-rag-service');
          const newService = new TextRAGService({
            model: mlxConfig.model,
            pythonPath: mlxConfig.pythonPath,
          });

          await newService.initialize();

          logger.info('backend', 'MLX RAG service restarted with new config', '');
        }

        return { success: true, config: mlxConfig };
      } catch (error: any) {
        logger.error('backend', 'Error updating MLX config', '', {
          error: error.message,
          newConfig,
        });
        throw new Error(`Erreur mise à jour config MLX: ${error.message}`);
      }
    }
  );

  // Tester la connexion MLX
  ipcMain.handle('mlx:test', async () => {
    try {
      const mlxBackend = new (
        await import('./services/backends/mlx/mlx-backend')
      ).MLXBackend(mlxConfig.pythonPath);
      const available = await mlxBackend.isAvailable();

      if (!available) {
        return {
          success: false,
          message:
            "sentence-transformers n'est pas installé. Installez-le avec : pip3 install sentence-transformers torch",
        };
      }

      const isReady = await textRAGService.isReady();

      if (!isReady) {
        await textRAGService.initialize();
      }

      const testResult = await textRAGService.getStatus();

      return {
        success: true,
        message: 'MLX est opérationnel et prêt à générer des embeddings',
        ...testResult,
      };
    } catch (error: any) {
      logger.error('backend', 'MLX test failed', '', {
        error: error.message,
        stack: error.stack,
      });
      return {
        success: false,
        message: `Erreur lors du test MLX : ${error.message}`,
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
        error: error.message,
      });
      throw new Error(`Erreur redémarrage MLX: ${error.message}`);
    }
  });

  // ============================================
  // LLM (nouveau - pour chat et génération)
  // ============================================

  // Initialiser le backend LLM
  ipcMain.handle('mlx:llm:initialize', async () => {
    try {
      if (mlxLLMBackend) {
        return { success: true, message: 'LLM backend already initialized' };
      }

      mlxLLMBackend = new MLXLLMBackend(mlxConfig.pythonPath);

      const available = await mlxLLMBackend.isAvailable();
      if (!available) {
        return {
          success: false,
          error: 'mlx-lm not available. Install with: pip3 install mlx-lm',
        };
      }

      await mlxLLMBackend.initialize();

      logger.info('mlx-llm', 'LLM backend initialized successfully', '');

      return { success: true };
    } catch (error: any) {
      logger.error('mlx-llm', 'Error initializing LLM backend', '', {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Charger un modèle LLM
  ipcMain.handle('mlx:llm:loadModel', async (_, modelPath: string) => {
    try {
      if (!mlxLLMBackend) {
        throw new Error('LLM backend not initialized');
      }

      await mlxLLMBackend.loadModel(modelPath);

      logger.info('mlx-llm', 'Model loaded', modelPath);

      return { success: true };
    } catch (error: any) {
      logger.error('mlx-llm', 'Error loading model', '', {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Décharger le modèle LLM
  ipcMain.handle('mlx:llm:unloadModel', async () => {
    try {
      if (!mlxLLMBackend) {
        return { success: true };
      }

      await mlxLLMBackend.unloadModel();

      logger.info('mlx-llm', 'Model unloaded', '');

      return { success: true };
    } catch (error: any) {
      logger.error('mlx-llm', 'Error unloading model', '', {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Chat avec MLX LLM (streaming)
  ipcMain.handle('mlx:llm:chat', async (event, request) => {
    try {
      if (!mlxLLMBackend) {
        throw new Error('LLM backend not initialized. Call mlx:llm:initialize first.');
      }

      const { messages, options } = request;

      // Créer un ID unique pour ce stream
      const streamId = `mlx-stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Envoyer l'ID du stream au renderer
      event.sender.send('mlx:llm:streamStart', { streamId });

      // Utiliser le chat avec streaming (AsyncIterable)
      const chatRequest = {
        messages,
        model: 'current',  // Le backend utilise le modèle actuel
        temperature: options?.temperature,
        maxTokens: options?.max_tokens,
        stream: true,
      };

      for await (const chunk of mlxLLMBackend.chat(chatRequest)) {
        // Envoyer chaque chunk au renderer
        event.sender.send('mlx:llm:streamChunk', {
          streamId,
          chunk,
        });
      }

      // Signaler la fin du stream
      event.sender.send('mlx:llm:streamEnd', { streamId });

      return { success: true, streamId };
    } catch (error: any) {
      logger.error('backend', 'Chat error', '', {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Génération de texte avec MLX LLM
  ipcMain.handle('mlx:llm:generate', async (_, request) => {
    try {
      if (!mlxLLMBackend) {
        throw new Error('LLM backend not initialized');
      }

      const { prompt, options } = request;

      // Convertir le prompt en message pour utiliser chatComplete
      const response = await mlxLLMBackend.chatComplete({
        messages: [{ role: 'user', content: prompt }],
        model: 'current',
        temperature: options?.temperature,
        maxTokens: options?.max_tokens,
        stream: false,
      });

      return {
        success: true,
        content: response.content,
        model: response.model,
      };
    } catch (error: any) {
      logger.error('backend', 'Generation error', '', {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Obtenir le statut du backend LLM
  ipcMain.handle('mlx:llm:getStatus', async () => {
    try {
      if (!mlxLLMBackend) {
        return {
          available: false,
          initialized: false,
          error: 'LLM backend not initialized',
        };
      }

      const status = await mlxLLMBackend.getStatus();
      return status;
    } catch (error: any) {
      return {
        available: false,
        initialized: false,
        error: error.message,
      };
    }
  });

  // ============================================
  // GESTION DE MODÈLES
  // ============================================

  // Initialiser le gestionnaire de modèles
  ipcMain.handle('mlx:models:initialize', async () => {
    try {
      const modelManager = getMLXModelManager();
      await modelManager.initialize();

      logger.info('mlx-models', 'Model manager initialized', '');

      return { success: true };
    } catch (error: any) {
      logger.error('mlx-models', 'Error initializing model manager', '', {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Lister les modèles LLM locaux
  ipcMain.handle('mlx:models:listLocal', async () => {
    try {
      const modelManager = getMLXModelManager();
      const models = await modelManager.listLocalModels();

      return { success: true, models };
    } catch (error: any) {
      logger.error('mlx-models', 'Error listing local models', '', {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
        models: [],
      };
    }
  });

  // Télécharger un modèle
  ipcMain.handle('mlx:models:download', async (event, repoId: string) => {
    try {
      const modelManager = getMLXModelManager();

      logger.info('backend', 'Starting model download', repoId);

      // Télécharger avec callback de progression
      const model = await modelManager.downloadModel(repoId, (progress) => {
        logger.debug('backend', 'Download progress callback', `${progress.percentage}% - ${repoId}`);
        event.sender.send('mlx:models:downloadProgress', progress);
      });

      logger.info('backend', 'Model downloaded successfully', repoId);

      return { success: true, model };
    } catch (error: any) {
      logger.error('backend', 'Error downloading model', repoId, {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Supprimer un modèle
  ipcMain.handle('mlx:models:delete', async (_, modelPath: string) => {
    try {
      const modelManager = getMLXModelManager();
      await modelManager.deleteModel(modelPath);

      logger.info('mlx-models', 'Model deleted successfully', modelPath);

      return { success: true };
    } catch (error: any) {
      logger.error('mlx-models', 'Error deleting model', modelPath, {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Vérifier si un modèle est téléchargé
  ipcMain.handle('mlx:models:isDownloaded', async (_, repoId: string) => {
    try {
      const modelManager = getMLXModelManager();
      const isDownloaded = await modelManager.isModelDownloaded(repoId);

      return { success: true, isDownloaded };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        isDownloaded: false,
      };
    }
  });

  // ============================================
  // STORE (Hugging Face)
  // ============================================

  // Lister les modèles disponibles sur HF
  ipcMain.handle('mlx:store:listAvailable', async (_, filters) => {
    try {
      const storeService = getMLXStoreService();
      const models = await storeService.listAvailableModels(filters);

      return { success: true, models };
    } catch (error: any) {
      logger.error('mlx-store', 'Error listing available models', '', {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
        models: [],
      };
    }
  });

  // Rechercher des modèles sur HF
  ipcMain.handle('mlx:store:search', async (_, query: string, limit?: number) => {
    try {
      const storeService = getMLXStoreService();
      const models = await storeService.searchModels(query, limit);

      return { success: true, models };
    } catch (error: any) {
      logger.error('mlx-store', 'Error searching models', query, {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
        models: [],
      };
    }
  });

  // Obtenir les détails d'un modèle
  ipcMain.handle('mlx:store:getModelInfo', async (_, repoId: string) => {
    try {
      const storeService = getMLXStoreService();
      const model = await storeService.getModelInfo(repoId);

      return { success: true, model };
    } catch (error: any) {
      logger.error('mlx-store', 'Error getting model info', repoId, {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
        model: null,
      };
    }
  });

  // Obtenir les modèles recommandés
  ipcMain.handle('mlx:store:getRecommended', async () => {
    try {
      const storeService = getMLXStoreService();
      const models = storeService.getRecommendedModels();

      return { success: true, models };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        models: [],
      };
    }
  });

  // Vider le cache du store
  ipcMain.handle('mlx:store:clearCache', async () => {
    try {
      const storeService = getMLXStoreService();
      storeService.clearCache();

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // ============================================
  // EMBEDDING MODELS MANAGEMENT
  // ============================================

  // Lister les modèles d'embedding
  ipcMain.handle('mlx:embeddings:list', async () => {
    try {
      const embeddingManager = getEmbeddingManager();
      const models = await embeddingManager.listModels();
      return models;
    } catch (error: any) {
      logger.error('mlx-models', 'Error listing embedding models', '', {
        error: error.message,
      });
      return [];
    }
  });

  // Vérifier si un modèle d'embedding est téléchargé
  ipcMain.handle('mlx:embeddings:isDownloaded', async (_, repoId: string) => {
    try {
      const embeddingManager = getEmbeddingManager();
      return embeddingManager.isModelDownloaded(repoId);
    } catch (error: any) {
      logger.error('mlx-models', 'Error checking embedding model', repoId, {
        error: error.message,
      });
      return false;
    }
  });

  // Télécharger un modèle d'embedding
  ipcMain.handle('mlx:embeddings:download', async (event, repoId: string) => {
    try {
      const embeddingManager = getEmbeddingManager();

      logger.info('mlx-models', 'Starting embedding model download', repoId);

      const path = await embeddingManager.downloadModel(repoId, (progress) => {
        event.sender.send('mlx:embeddings:downloadProgress', progress);
      });

      return { success: true, path };
    } catch (error: any) {
      logger.error('mlx-models', 'Embedding model download failed', repoId, {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Supprimer un modèle d'embedding
  ipcMain.handle('mlx:embeddings:delete', async (_, repoId: string) => {
    try {
      const embeddingManager = getEmbeddingManager();
      await embeddingManager.deleteModel(repoId);

      logger.info('mlx-models', 'Embedding model deleted', repoId);

      return { success: true };
    } catch (error: any) {
      logger.error('mlx-models', 'Failed to delete embedding model', repoId, {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Ajouter un modèle personnalisé
  ipcMain.handle('mlx:embeddings:addCustom', async (_, repoId: string) => {
    try {
      const embeddingManager = getEmbeddingManager();
      await embeddingManager.addCustomModel(repoId);

      logger.info('mlx-models', 'Added custom embedding model', repoId);

      return { success: true };
    } catch (error: any) {
      logger.error('mlx-models', 'Failed to add custom embedding model', repoId, {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Supprimer un modèle personnalisé de la liste
  ipcMain.handle('mlx:embeddings:removeCustom', async (_, repoId: string) => {
    try {
      const embeddingManager = getEmbeddingManager();
      await embeddingManager.removeCustomModel(repoId);

      logger.info('mlx-models', 'Removed custom embedding model', repoId);

      return { success: true };
    } catch (error: any) {
      logger.error('mlx-models', 'Failed to remove custom embedding model', repoId, {
        error: error.message,
      });
      return {
        success: false,
        error: error.message,
      };
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
