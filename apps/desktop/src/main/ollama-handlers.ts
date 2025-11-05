import { ipcMain } from 'electron';
import { OllamaClient } from '@blackia/ollama';

let ollamaClient: OllamaClient | null = null;

/**
 * Initialise le client Ollama
 */
function getOllamaClient(): OllamaClient {
  if (!ollamaClient) {
    ollamaClient = new OllamaClient({
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
      timeout: 120000, // 2 minutes pour les longues générations
      mode: 'local',
    });
  }
  return ollamaClient;
}

/**
 * Enregistre tous les handlers IPC pour Ollama
 */
export function registerOllamaHandlers(): void {
  // Vérifier si Ollama est disponible
  ipcMain.handle('ollama:isAvailable', async () => {
    try {
      const client = getOllamaClient();
      return await client.isAvailable();
    } catch (error: any) {
      console.error('Erreur lors de la vérification Ollama:', error);
      return false;
    }
  });

  // Récupérer la version d'Ollama
  ipcMain.handle('ollama:getVersion', async () => {
    try {
      const client = getOllamaClient();
      return await client.getVersion();
    } catch (error: any) {
      throw new Error(`Erreur version Ollama: ${error.message}`);
    }
  });

  // Lister les modèles disponibles
  ipcMain.handle('ollama:listModels', async () => {
    try {
      const client = getOllamaClient();
      return await client.listModels();
    } catch (error: any) {
      throw new Error(`Erreur liste modèles: ${error.message}`);
    }
  });

  // Récupérer les infos d'un modèle
  ipcMain.handle('ollama:getModelInfo', async (_event, modelName: string) => {
    try {
      const client = getOllamaClient();
      return await client.getModelInfo(modelName);
    } catch (error: any) {
      throw new Error(`Erreur info modèle: ${error.message}`);
    }
  });

  // Télécharger un modèle
  ipcMain.handle('ollama:pullModel', async (event, modelName: string) => {
    try {
      const client = getOllamaClient();
      await client.pullModel(modelName, (progress) => {
        // Envoyer la progression au renderer
        event.sender.send('ollama:pullProgress', {
          model: modelName,
          ...progress,
        });
      });
      return { success: true };
    } catch (error: any) {
      throw new Error(`Erreur téléchargement modèle: ${error.message}`);
    }
  });

  // Supprimer un modèle
  ipcMain.handle('ollama:deleteModel', async (_event, modelName: string) => {
    try {
      const client = getOllamaClient();
      await client.deleteModel(modelName);
      return { success: true };
    } catch (error: any) {
      throw new Error(`Erreur suppression modèle: ${error.message}`);
    }
  });

  // Chat sans streaming
  ipcMain.handle('ollama:chat', async (_event, request) => {
    try {
      const client = getOllamaClient();
      return await client.chat(request);
    } catch (error: any) {
      throw new Error(`Erreur chat: ${error.message}`);
    }
  });

  // Chat avec streaming
  ipcMain.handle('ollama:chatStream', async (event, request) => {
    try {
      const client = getOllamaClient();

      // Créer un ID unique pour ce stream
      const streamId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Envoyer l'ID du stream au renderer
      event.sender.send('ollama:streamStart', { streamId });

      await client.chatStream(request, (chunk) => {
        // Envoyer chaque chunk au renderer
        event.sender.send('ollama:streamChunk', {
          streamId,
          chunk,
        });
      });

      // Signaler la fin du stream
      event.sender.send('ollama:streamEnd', { streamId });

      return { success: true, streamId };
    } catch (error: any) {
      event.sender.send('ollama:streamError', {
        error: error.message,
      });
      throw new Error(`Erreur chat stream: ${error.message}`);
    }
  });

  // Generate sans streaming
  ipcMain.handle('ollama:generate', async (_event, request) => {
    try {
      const client = getOllamaClient();
      return await client.generate(request);
    } catch (error: any) {
      throw new Error(`Erreur génération: ${error.message}`);
    }
  });

  // Generate avec streaming
  ipcMain.handle('ollama:generateStream', async (event, request) => {
    try {
      const client = getOllamaClient();

      const streamId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      event.sender.send('ollama:streamStart', { streamId });

      await client.generateStream(request, (chunk) => {
        event.sender.send('ollama:streamChunk', {
          streamId,
          chunk,
        });
      });

      event.sender.send('ollama:streamEnd', { streamId });

      return { success: true, streamId };
    } catch (error: any) {
      event.sender.send('ollama:streamError', {
        error: error.message,
      });
      throw new Error(`Erreur generate stream: ${error.message}`);
    }
  });

  // Générer des embeddings
  ipcMain.handle('ollama:embeddings', async (_event, request) => {
    try {
      const client = getOllamaClient();
      return await client.embeddings(request);
    } catch (error: any) {
      throw new Error(`Erreur embeddings: ${error.message}`);
    }
  });

  // Configurer le client
  ipcMain.handle('ollama:setConfig', async (_event, config) => {
    try {
      const client = getOllamaClient();
      client.setConfig(config);
      return { success: true };
    } catch (error: any) {
      throw new Error(`Erreur configuration: ${error.message}`);
    }
  });

  // Récupérer la configuration
  ipcMain.handle('ollama:getConfig', async () => {
    try {
      const client = getOllamaClient();
      return client.getConfig();
    } catch (error: any) {
      throw new Error(`Erreur récupération config: ${error.message}`);
    }
  });

  console.log('✅ Handlers IPC Ollama enregistrés');
}
