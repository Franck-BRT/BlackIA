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

  /**
   * Récupérer les patches d'un document pour visualisation dans la bibliothèque
   */
  ipcMain.handle('vision-rag:getDocumentPatches', async (_event, attachmentId: string) => {
    try {
      const patches = await coletteVisionRAGService.getDocumentPatches(attachmentId);
      return { success: true, data: patches };
    } catch (error) {
      console.error('[VisionRAG] Error in getDocumentPatches:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Réinitialiser la collection Vision RAG (supprime et recrée)
   */
  ipcMain.handle('vision-rag:recreateCollection', async () => {
    try {
      const { vectorStore } = await import('../services/vector-store');
      await vectorStore.recreateVisionCollection();
      return { success: true, message: 'Vision collection recreated successfully' };
    } catch (error) {
      console.error('[VisionRAG] Error in recreateCollection:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupérer les informations de debug pour un document Vision RAG
   */
  ipcMain.handle('vision-rag:getDebugInfo', async (_event, attachmentId: string) => {
    try {
      const { vectorStore } = await import('../services/vector-store');

      // Récupérer les patches bruts
      const rawPatches = await vectorStore.getVisionPatchesByAttachment(attachmentId);

      // Formater les patches
      const patches = await coletteVisionRAGService.getDocumentPatches(attachmentId);

      // Récupérer des infos sur la collection
      let collectionInfo = null;
      try {
        const visionCollection = (vectorStore as any).visionCollection;
        if (visionCollection) {
          // Essayer de compter le total de patches dans la collection
          const allPatches = await visionCollection
            .search([0.0])
            .limit(200000)
            .nprobes(100)
            .execute();

          // Grouper par attachmentId
          const byAttachment: Record<string, number> = {};
          allPatches.forEach((p: any) => {
            byAttachment[p.attachmentId] = (byAttachment[p.attachmentId] || 0) + 1;
          });

          collectionInfo = {
            totalPatches: allPatches.length,
            patchesByAttachment: byAttachment,
            sampleAttachmentIds: Object.keys(byAttachment).slice(0, 5),
          };
        }
      } catch (collErr) {
        collectionInfo = { error: String(collErr) };
      }

      // Tronquer les imageBase64 pour éviter un JSON trop gros
      const truncateBase64 = (str: string | undefined): string => {
        if (!str) return 'undefined';
        if (!str.startsWith('data:image')) return 'not_base64';
        return str.substring(0, 100) + '... [truncated, length: ' + str.length + ']';
      };

      const debugInfo = {
        attachmentId,
        timestamp: new Date().toISOString(),
        rawPatchesCount: rawPatches.length,
        formattedPatchesCount: patches.length,
        collectionInfo,
        rawPatchesSample: rawPatches.slice(0, 2).map((p: any) => {
          const metadata = typeof p.metadata === 'string' ? JSON.parse(p.metadata) : p.metadata;
          return {
            id: p.id,
            pageIndex: p.pageIndex,
            attachmentId: p.attachmentId,
            hasMetadata: !!p.metadata,
            hasPatchVectors: !!p.patchVectors,
            metadataType: typeof p.metadata,
            metadataPreview: {
              ...metadata,
              imageBase64: truncateBase64(metadata?.imageBase64),
            },
          };
        }),
        formattedPatchesSample: patches.slice(0, 2).map(p => ({
          ...p,
          pageThumbnail: truncateBase64(p.pageThumbnail),
          metadata: {
            ...p.metadata,
            imageBase64: truncateBase64(p.metadata?.imageBase64),
          },
        })),
      };

      return { success: true, data: debugInfo };
    } catch (error) {
      console.error('[VisionRAG] Error in getDebugInfo:', error);
      return {
        success: false,
        error: String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };
    }
  });

  console.log('[VisionRAG] ✅ IPC handlers registered');
}
