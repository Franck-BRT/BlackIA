import { ipcMain, dialog } from 'electron';
import { attachmentService } from '../services/attachment-service';
import type { EntityType } from '../types/rag';

/**
 * Enregistrer tous les handlers IPC pour les attachments
 */
export function registerAttachmentHandlers(): void {
  // ==================== UPLOAD ====================

  /**
   * Ouvrir une dialog pour sélectionner un fichier
   */
  ipcMain.handle('attachments:selectFile', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'md'] },
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
          { name: 'Code', extensions: ['js', 'ts', 'py', 'java', 'cpp', 'rs'] },
        ],
      });

      if (result.canceled) {
        return { success: false, canceled: true };
      }

      return { success: true, filePaths: result.filePaths };
    } catch (error) {
      console.error('[Attachments] Error in selectFile:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Upload un fichier
   */
  ipcMain.handle(
    'attachments:upload',
    async (
      _event,
      params: {
        filePath: string;
        originalName: string;
        mimeType: string;
        entityType: EntityType;
        entityId: string;
        tags?: string[];
        extractedText?: string;
      }
    ) => {
      try {
        const attachment = await attachmentService.upload(params);
        return { success: true, data: attachment };
      } catch (error) {
        console.error('[Attachments] Error in upload:', error);
        return { success: false, error: String(error) };
      }
    }
  );

  // ==================== READ ====================

  /**
   * Récupérer un attachment par ID
   */
  ipcMain.handle('attachments:getById', async (_event, id: string) => {
    try {
      const attachment = await attachmentService.getById(id);
      if (!attachment) {
        return { success: false, error: 'Attachment not found' };
      }
      return { success: true, data: attachment };
    } catch (error) {
      console.error('[Attachments] Error in getById:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupérer tous les attachments d'une entité
   */
  ipcMain.handle(
    'attachments:getByEntity',
    async (_event, entityType: EntityType, entityId: string) => {
      try {
        const attachments = await attachmentService.getByEntity(entityType, entityId);
        return { success: true, data: attachments };
      } catch (error) {
        console.error('[Attachments] Error in getByEntity:', error);
        return { success: false, error: String(error) };
      }
    }
  );

  /**
   * Récupérer tous les attachments
   */
  ipcMain.handle('attachments:getAll', async () => {
    try {
      const attachments = await attachmentService.getAll();
      return { success: true, data: attachments };
    } catch (error) {
      console.error('[Attachments] Error in getAll:', error);
      return { success: false, error: String(error) };
    }
  });

  // ==================== UPDATE ====================

  /**
   * Mettre à jour un attachment
   */
  ipcMain.handle('attachments:update', async (_event, id: string, updates: any) => {
    try {
      const attachment = await attachmentService.update(id, updates);
      return { success: true, data: attachment };
    } catch (error) {
      console.error('[Attachments] Error in update:', error);
      return { success: false, error: String(error) };
    }
  });

  // ==================== TAGS ====================

  /**
   * Ajouter des tags
   */
  ipcMain.handle('attachments:addTags', async (_event, id: string, tags: string[]) => {
    try {
      const attachment = await attachmentService.addTags(id, tags);
      return { success: true, data: attachment };
    } catch (error) {
      console.error('[Attachments] Error in addTags:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Retirer des tags
   */
  ipcMain.handle('attachments:removeTags', async (_event, id: string, tags: string[]) => {
    try {
      const attachment = await attachmentService.removeTags(id, tags);
      return { success: true, data: attachment };
    } catch (error) {
      console.error('[Attachments] Error in removeTags:', error);
      return { success: false, error: String(error) };
    }
  });

  // ==================== DELETE ====================

  /**
   * Supprimer un attachment
   */
  ipcMain.handle('attachments:delete', async (_event, id: string) => {
    try {
      await attachmentService.delete(id);
      return { success: true, data: true };
    } catch (error) {
      console.error('[Attachments] Error in delete:', error);
      return { success: false, error: String(error) };
    }
  });

  // ==================== SEARCH ====================

  /**
   * Rechercher par tags
   */
  ipcMain.handle('attachments:searchByTags', async (_event, tags: string[]) => {
    try {
      const attachments = await attachmentService.searchByTags(tags);
      return { success: true, data: attachments };
    } catch (error) {
      console.error('[Attachments] Error in searchByTags:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Rechercher par nom
   */
  ipcMain.handle('attachments:searchByName', async (_event, query: string) => {
    try {
      const attachments = await attachmentService.searchByName(query);
      return { success: true, data: attachments };
    } catch (error) {
      console.error('[Attachments] Error in searchByName:', error);
      return { success: false, error: String(error) };
    }
  });

  // ==================== STATS ====================

  /**
   * Obtenir les statistiques
   */
  ipcMain.handle('attachments:getStats', async () => {
    try {
      const stats = await attachmentService.getStats();
      return { success: true, data: stats };
    } catch (error) {
      console.error('[Attachments] Error in getStats:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Attachments] ✅ IPC handlers registered');
}
