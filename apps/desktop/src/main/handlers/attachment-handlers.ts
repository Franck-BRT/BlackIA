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
        fileName: string;
        buffer: Buffer;
        mimeType: string;
        entityType: EntityType;
        entityId: string;
        tags?: string[];
      }
    ) => {
      try {
        console.log('[Attachments] Upload request:', {
          fileName: params.fileName,
          mimeType: params.mimeType,
          entityType: params.entityType,
          entityId: params.entityId,
          bufferSize: params.buffer.length,
        });

        const attachment = await attachmentService.uploadFromBuffer(params);
        console.log('[Attachments] ✅ Upload successful:', attachment.id);
        return { success: true, attachment };
      } catch (error) {
        console.error('[Attachments] ❌ Error in upload:', error);
        return { success: false, error: String(error) };
      }
    }
  );

  // ==================== READ ====================

  /**
   * Récupérer un attachment par ID
   */
  ipcMain.handle('attachments:getById', async (_event, params: { attachmentId: string }) => {
    try {
      const attachment = await attachmentService.getById(params.attachmentId);
      if (!attachment) {
        return { success: false, error: 'Attachment not found' };
      }
      return { success: true, attachment };
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
    async (_event, params: { entityType: EntityType; entityId: string }) => {
      try {
        console.log('[Attachments] getByEntity request:', params);
        const attachments = await attachmentService.getByEntity(params.entityType, params.entityId);
        console.log('[Attachments] ✅ Found attachments:', attachments.length);
        return { success: true, attachments };
      } catch (error) {
        console.error('[Attachments] ❌ Error in getByEntity:', error);
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
  ipcMain.handle('attachments:delete', async (_event, params: { attachmentId: string }) => {
    try {
      console.log('[Attachments] Delete request:', params.attachmentId);
      await attachmentService.delete(params.attachmentId);
      console.log('[Attachments] ✅ Deleted successfully');
      return { success: true };
    } catch (error) {
      console.error('[Attachments] ❌ Error in delete:', error);
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

  // ==================== OPEN ====================

  /**
   * Ouvrir un fichier attachment
   */
  ipcMain.handle('attachments:open', async (_event, params: { attachmentId: string }) => {
    try {
      console.log('[Attachments] Open request:', params.attachmentId);
      await attachmentService.openFile(params.attachmentId);
      return { success: true };
    } catch (error) {
      console.error('[Attachments] ❌ Error in open:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Attachments] ✅ IPC handlers registered');
}
