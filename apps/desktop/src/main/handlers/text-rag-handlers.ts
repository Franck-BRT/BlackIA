import { ipcMain } from 'electron';
import { textRAGService } from '../services/text-rag-service';
import type { TextRAGIndexParams, RAGSearchParams } from '../types/rag';

/**
 * Enregistrer tous les handlers IPC pour le TEXT RAG
 */
export function registerTextRAGHandlers(): void {
  // ==================== INDEXATION ====================

  /**
   * Indexer un document texte
   */
  ipcMain.handle(
    'text-rag:index',
    async (_event, params: TextRAGIndexParams) => {
      try {
        const result = await textRAGService.indexDocument(params);
        return result; // Already has success/error structure
      } catch (error) {
        console.error('[TextRAG] Error in indexDocument:', error);
        return {
          success: false,
          chunkCount: 0,
          totalTokens: 0,
          error: String(error),
        };
      }
    }
  );

  /**
   * Re-indexer un document texte (après modification)
   */
  ipcMain.handle(
    'text-rag:reindex',
    async (_event, params: TextRAGIndexParams) => {
      try {
        const result = await textRAGService.reindexDocument(params);
        return result;
      } catch (error) {
        console.error('[TextRAG] Error in reindexDocument:', error);
        return {
          success: false,
          chunkCount: 0,
          totalTokens: 0,
          error: String(error),
        };
      }
    }
  );

  /**
   * Supprimer l'indexation d'un document
   */
  ipcMain.handle('text-rag:delete', async (_event, attachmentId: string) => {
    try {
      await textRAGService.deleteDocument(attachmentId);
      return { success: true, data: true };
    } catch (error) {
      console.error('[TextRAG] Error in deleteDocument:', error);
      return { success: false, error: String(error) };
    }
  });

  // ==================== RECHERCHE ====================

  /**
   * Rechercher dans les documents indexés
   */
  ipcMain.handle('text-rag:search', async (_event, params: RAGSearchParams) => {
    try {
      const result = await textRAGService.search(params);
      return result; // Already has success/error structure
    } catch (error) {
      console.error('[TextRAG] Error in search:', error);
      return {
        success: false,
        results: [],
        error: String(error),
      };
    }
  });

  /**
   * Obtenir les chunks d'un document (pour debug/preview)
   */
  ipcMain.handle('text-rag:getDocumentChunks', async (_event, attachmentId: string) => {
    try {
      const chunks = await textRAGService.getDocumentChunks(attachmentId);
      return { success: true, data: chunks };
    } catch (error) {
      console.error('[TextRAG] Error in getDocumentChunks:', error);
      return { success: false, error: String(error) };
    }
  });

  // ==================== UTILITIES ====================

  /**
   * Estimer le chunking d'un texte (avant indexation)
   */
  ipcMain.handle(
    'text-rag:estimateChunking',
    async (
      _event,
      text: string,
      chunkSize: number = 500,
      chunkOverlap: number = 50
    ) => {
      try {
        const estimate = textRAGService.estimateChunking(text, chunkSize, chunkOverlap);
        return { success: true, data: estimate };
      } catch (error) {
        console.error('[TextRAG] Error in estimateChunking:', error);
        return { success: false, error: String(error) };
      }
    }
  );

  /**
   * Vérifier la disponibilité d'Ollama
   */
  ipcMain.handle('text-rag:checkOllama', async () => {
    try {
      const result = await textRAGService.checkOllamaAvailability();
      return { success: true, data: result };
    } catch (error) {
      console.error('[TextRAG] Error in checkOllama:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Vérifier si un modèle est disponible
   */
  ipcMain.handle('text-rag:isModelAvailable', async (_event, model: string) => {
    try {
      const available = await textRAGService.isModelAvailable(model);
      return { success: true, data: available };
    } catch (error) {
      console.error('[TextRAG] Error in isModelAvailable:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Mettre à jour l'URL Ollama
   */
  ipcMain.handle('text-rag:setOllamaUrl', async (_event, url: string) => {
    try {
      textRAGService.setOllamaUrl(url);
      return { success: true, data: true };
    } catch (error) {
      console.error('[TextRAG] Error in setOllamaUrl:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Mettre à jour le modèle par défaut
   */
  ipcMain.handle('text-rag:setDefaultModel', async (_event, model: string) => {
    try {
      textRAGService.setDefaultModel(model);
      return { success: true, data: true };
    } catch (error) {
      console.error('[TextRAG] Error in setDefaultModel:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Obtenir les statistiques
   */
  ipcMain.handle('text-rag:getStats', async () => {
    try {
      // Return basic stats for now
      return { success: true, data: { indexed: 0, chunks: 0 } };
    } catch (error) {
      console.error('[TextRAG] Error in getStats:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[TextRAG] ✅ IPC handlers registered');
}
