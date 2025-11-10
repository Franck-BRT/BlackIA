import { ipcMain } from 'electron';
import { documentService } from '../services/document-service';
import type { NewDocument } from '../database/schema';

/**
 * Enregistrer tous les handlers IPC pour les documents généraux
 */
export function registerDocumentHandlers(): void {
  // ==================== CRUD ====================

  /**
   * Créer un nouveau document
   */
  ipcMain.handle('documents:create', async (_event, docData: Omit<NewDocument, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const doc = await documentService.create(docData);
      return { success: true, data: doc };
    } catch (error) {
      console.error('[Documents] Error in create:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupérer un document par ID
   */
  ipcMain.handle('documents:getById', async (_event, id: string) => {
    try {
      const doc = await documentService.getById(id);
      if (!doc) {
        return { success: false, error: 'Document not found' };
      }
      return { success: true, data: doc };
    } catch (error) {
      console.error('[Documents] Error in getById:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupérer tous les documents
   */
  ipcMain.handle('documents:getAll', async () => {
    try {
      const docs = await documentService.getAll();
      return { success: true, data: docs };
    } catch (error) {
      console.error('[Documents] Error in getAll:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Mettre à jour un document
   */
  ipcMain.handle('documents:update', async (_event, id: string, updates: Partial<Omit<NewDocument, 'id' | 'createdAt' | 'updatedAt'>>) => {
    try {
      const doc = await documentService.update(id, updates);
      return { success: true, data: doc };
    } catch (error) {
      console.error('[Documents] Error in update:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Supprimer un document
   */
  ipcMain.handle('documents:delete', async (_event, id: string) => {
    try {
      await documentService.delete(id);
      return { success: true, data: true };
    } catch (error) {
      console.error('[Documents] Error in delete:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Toggle favori
   */
  ipcMain.handle('documents:toggleFavorite', async (_event, id: string) => {
    try {
      const doc = await documentService.toggleFavorite(id);
      return { success: true, data: doc };
    } catch (error) {
      console.error('[Documents] Error in toggleFavorite:', error);
      return { success: false, error: String(error) };
    }
  });

  // ==================== SEARCH ====================

  /**
   * Rechercher dans les documents
   */
  ipcMain.handle('documents:search', async (_event, query: string) => {
    try {
      const results = await documentService.search(query);
      return { success: true, data: results };
    } catch (error) {
      console.error('[Documents] Error in search:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupérer les documents favoris
   */
  ipcMain.handle('documents:getFavorites', async () => {
    try {
      const docs = await documentService.getFavorites();
      return { success: true, data: docs };
    } catch (error) {
      console.error('[Documents] Error in getFavorites:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Documents] ✅ IPC handlers registered');
}
