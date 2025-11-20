import { ipcMain } from 'electron';
import { coletteVisionRAGService } from '../services/colette-vision-rag-service';
import { visionRAGService } from '../services/vision-rag-service'; // Keep for utility methods
import type { VisionRAGIndexParams, RAGSearchParams } from '../types/rag';

/**
 * Enregistrer tous les handlers IPC pour le VISION RAG
 */
export function registerVisionRAGHandlers(): void {
  // ==================== INDEXATION ====================

  /**
   * Indexer un document avec Vision RAG
   */
  ipcMain.handle(
    'vision-rag:index',
    async (_event, params: VisionRAGIndexParams) => {
      try {
        const result = await coletteVisionRAGService.indexDocument(params);
        return result; // Already has success/error structure
      } catch (error) {
        console.error('[VisionRAG] Error in indexDocument:', error);
        return {
          success: false,
          patchCount: 0,
          pageCount: 0,
          error: String(error),
        };
      }
    }
  );

  /**
   * Supprimer l'indexation d'un document
   */
  ipcMain.handle('vision-rag:delete', async (_event, attachmentId: string) => {
    try {
      await coletteVisionRAGService.deleteIndex(attachmentId);
      return { success: true, data: true };
    } catch (error) {
      console.error('[VisionRAG] Error in deleteDocument:', error);
      return { success: false, error: String(error) };
    }
  });

  // ==================== RECHERCHE ====================

  /**
   * Rechercher dans les documents indexés
   */
  ipcMain.handle('vision-rag:search', async (_event, params: RAGSearchParams) => {
    try {
      const result = await coletteVisionRAGService.search(params);
      return result; // Already has success/error structure
    } catch (error) {
      console.error('[VisionRAG] Error in search:', error);
      return {
        success: false,
        results: [],
        error: String(error),
      };
    }
  });

  // ==================== DOCUMENT PROCESSING ====================

  /**
   * Convertir un PDF en images
   */
  ipcMain.handle(
    'vision-rag:convertPDF',
    async (_event, pdfPath: string, outputDir: string, dpi: number = 200) => {
      try {
        const result = await visionRAGService.convertPDFToImages(pdfPath, outputDir, dpi);
        return result; // Already has success/error structure
      } catch (error) {
        console.error('[VisionRAG] Error in convertPDF:', error);
        return {
          success: false,
          error: String(error),
        };
      }
    }
  );

  // ==================== UTILITIES ====================

  /**
   * Vérifier l'environnement Python
   */
  ipcMain.handle('vision-rag:checkPython', async () => {
    try {
      const result = await visionRAGService.checkPythonEnvironment();
      return { success: true, data: result };
    } catch (error) {
      console.error('[VisionRAG] Error in checkPython:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Mettre à jour le modèle par défaut
   */
  ipcMain.handle('vision-rag:setDefaultModel', async (_event, model: string) => {
    try {
      visionRAGService.setDefaultModel(model);
      return { success: true, data: true };
    } catch (error) {
      console.error('[VisionRAG] Error in setDefaultModel:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Obtenir les statistiques
   */
  ipcMain.handle('vision-rag:getStats', async () => {
    try {
      // Return basic stats for now
      return { success: true, data: { indexed: 0, patches: 0 } };
    } catch (error) {
      console.error('[VisionRAG] Error in getStats:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[VisionRAG] ✅ IPC handlers registered');
}
