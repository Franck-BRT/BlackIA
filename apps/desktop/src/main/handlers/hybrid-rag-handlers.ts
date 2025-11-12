import { ipcMain } from 'electron';
import { hybridRAGService } from '../services/hybrid-rag-service';
import type { RAGSearchParams } from '../types/rag';

/**
 * Enregistrer tous les handlers IPC pour le HYBRID RAG
 */
export function registerHybridRAGHandlers(): void {
  // ==================== RECHERCHE ====================

  /**
   * Recherche hybride (text + vision avec RRF)
   */
  ipcMain.handle('hybridRAG:search', async (_event, params: RAGSearchParams) => {
    try {
      const result = await hybridRAGService.search(params);
      return result; // Already has success/error/mode structure
    } catch (error) {
      console.error('[HybridRAG] Error in search:', error);
      return {
        success: false,
        results: [],
        mode: 'text' as const,
        error: String(error),
      };
    }
  });

  // ==================== CONFIGURATION ====================

  /**
   * Configurer le K constant pour RRF
   */
  ipcMain.handle('hybridRAG:setRRFConstant', async (_event, k: number) => {
    try {
      hybridRAGService.setRRFConstant(k);
      return { success: true, data: k };
    } catch (error) {
      console.error('[HybridRAG] Error in setRRFConstant:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Obtenir le K constant actuel
   */
  ipcMain.handle('hybridRAG:getRRFConstant', async () => {
    try {
      const k = hybridRAGService.getRRFConstant();
      return { success: true, data: k };
    } catch (error) {
      console.error('[HybridRAG] Error in getRRFConstant:', error);
      return { success: false, error: String(error) };
    }
  });

  // ==================== STATISTIQUES ====================

  /**
   * Obtenir les statistiques RAG hybride
   */
  ipcMain.handle('hybridRAG:getStats', async () => {
    try {
      const stats = await hybridRAGService.getStats();
      return { success: true, data: stats };
    } catch (error) {
      console.error('[HybridRAG] Error in getStats:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[HybridRAG] ✅ IPC handlers registered');
}
