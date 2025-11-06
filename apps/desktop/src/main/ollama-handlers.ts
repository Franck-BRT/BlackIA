import { ipcMain } from 'electron';
import { OllamaClient } from '@blackia/ollama';

let ollamaClient: OllamaClient | null = null;

// Map pour garder trace des streams actifs et pouvoir les stopper
const activeStreams = new Map<string, AbortController>();

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
    console.log('[IPC Handler] 🚀 ollama:chatStream appelé');
    console.log('[IPC Handler] Request:', JSON.stringify(request, null, 2));

    // Créer un ID unique pour ce stream
    const streamId = `stream-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('[IPC Handler] StreamId créé:', streamId);

    try {
      const client = getOllamaClient();
      console.log('[IPC Handler] Client Ollama récupéré');

      // Créer un AbortController pour ce stream
      const abortController = new AbortController();
      activeStreams.set(streamId, abortController);
      console.log('[IPC Handler] AbortController enregistré pour streamId:', streamId);

      // Envoyer l'ID du stream au renderer
      console.log('[IPC Handler] 📤 Envoi event ollama:streamStart');
      event.sender.send('ollama:streamStart', { streamId });

      let chunkCount = 0;
      console.log('[IPC Handler] ⏳ Début du chatStream...');

      await client.chatStream(
        request,
        (chunk) => {
          chunkCount++;
          console.log('[IPC Handler] 📦 Chunk #' + chunkCount + ' reçu du client');
          console.log('[IPC Handler] Chunk data:', JSON.stringify(chunk).substring(0, 150));

          // Envoyer chaque chunk au renderer
          console.log('[IPC Handler] 📤 Envoi event ollama:streamChunk #' + chunkCount);
          event.sender.send('ollama:streamChunk', {
            streamId,
            chunk,
          });
          console.log('[IPC Handler] ✅ Event ollama:streamChunk #' + chunkCount + ' envoyé');
        },
        abortController.signal
      );

      console.log('[IPC Handler] ✅ chatStream terminé, total chunks:', chunkCount);

      // Signaler la fin du stream
      console.log('[IPC Handler] 📤 Envoi event ollama:streamEnd');
      event.sender.send('ollama:streamEnd', { streamId });

      console.log('[IPC Handler] 🎉 Handler ollama:chatStream terminé avec succès');
      return { success: true, streamId };
    } catch (error: any) {
      const isUserStopped = error.message?.includes('Stream arrêté par l\'utilisateur') ||
                            error.message?.includes('aborted');

      if (isUserStopped) {
        console.log('[IPC Handler] 🛑 Stream arrêté par l\'utilisateur (catch)');
        // Envoyer streamEnd avec le flag stopped
        event.sender.send('ollama:streamEnd', { streamId, stopped: true });
        return { success: true, streamId, stopped: true };
      } else {
        // Vraie erreur
        console.error('[IPC Handler] ❌ Erreur dans chatStream:', error);
        event.sender.send('ollama:streamEnd', { streamId, stopped: false });
        event.sender.send('ollama:streamError', {
          streamId,
          error: error.message,
        });
        throw new Error(`Erreur chat stream: ${error.message}`);
      }
    } finally {
      // Nettoyer le stream de la map
      activeStreams.delete(streamId);
      console.log('[IPC Handler] 🧹 Stream retiré de la map active');
    }
  });

  // Stopper un stream en cours
  ipcMain.handle('ollama:stopStream', async (_event, streamId: string) => {
    console.log('[IPC Handler] 🛑 Demande d\'arrêt du stream:', streamId);

    const abortController = activeStreams.get(streamId);
    if (abortController) {
      console.log('[IPC Handler] ✅ AbortController trouvé, appel de abort()');
      abortController.abort();
      activeStreams.delete(streamId);
      return { success: true, stopped: true };
    } else {
      console.log('[IPC Handler] ⚠️ Stream non trouvé ou déjà terminé:', streamId);
      return { success: false, reason: 'Stream non trouvé ou déjà terminé' };
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
