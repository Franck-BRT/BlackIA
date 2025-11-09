import { ipcMain } from 'electron';
import { DocumentationService } from '../services/documentation-db-service';
import type { NewDocumentation } from '../database/schema';

/**
 * Enregistrer tous les handlers IPC pour la documentation
 */
export function registerDocumentationHandlers(): void {
  // ==================== CRUD ====================

  /**
   * Créer un nouveau document
   */
  ipcMain.handle('documentation:create', async (_event, docData: Omit<NewDocumentation, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const doc = await DocumentationService.create(docData);
      return { success: true, data: doc };
    } catch (error) {
      console.error('[Documentation] Error in create:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupérer un document par ID
   */
  ipcMain.handle('documentation:getById', async (_event, id: string) => {
    try {
      const doc = await DocumentationService.getById(id);
      if (!doc) {
        return { success: false, error: 'Document not found' };
      }
      return { success: true, data: doc };
    } catch (error) {
      console.error('[Documentation] Error in getById:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupérer un document par slug
   */
  ipcMain.handle('documentation:getBySlug', async (_event, slug: string) => {
    try {
      const doc = await DocumentationService.getBySlug(slug);
      if (!doc) {
        return { success: false, error: 'Document not found' };
      }
      return { success: true, data: doc };
    } catch (error) {
      console.error('[Documentation] Error in getBySlug:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupérer tous les documents
   */
  ipcMain.handle('documentation:getAll', async () => {
    try {
      const docs = await DocumentationService.getAll();
      return { success: true, data: docs };
    } catch (error) {
      console.error('[Documentation] Error in getAll:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupérer les documents par catégorie
   */
  ipcMain.handle('documentation:getByCategory', async (_event, category: string) => {
    try {
      const docs = await DocumentationService.getByCategory(category);
      return { success: true, data: docs };
    } catch (error) {
      console.error('[Documentation] Error in getByCategory:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupérer les documents par parent
   */
  ipcMain.handle('documentation:getByParent', async (_event, parentSlug: string | null) => {
    try {
      const docs = await DocumentationService.getByParent(parentSlug);
      return { success: true, data: docs };
    } catch (error) {
      console.error('[Documentation] Error in getByParent:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Mettre à jour un document
   */
  ipcMain.handle('documentation:update', async (_event, id: string, updates: Partial<NewDocumentation>) => {
    try {
      const doc = await DocumentationService.update(id, updates);
      if (!doc) {
        return { success: false, error: 'Document not found' };
      }
      return { success: true, data: doc };
    } catch (error) {
      console.error('[Documentation] Error in update:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Supprimer un document
   */
  ipcMain.handle('documentation:delete', async (_event, id: string) => {
    try {
      const success = await DocumentationService.delete(id);
      return { success, data: success };
    } catch (error) {
      console.error('[Documentation] Error in delete:', error);
      return { success: false, error: String(error) };
    }
  });

  // ==================== SEARCH ====================

  /**
   * Rechercher dans la documentation
   */
  ipcMain.handle('documentation:search', async (_event, query: string, limit?: number) => {
    try {
      const results = await DocumentationService.search(query, limit);
      return { success: true, data: results };
    } catch (error) {
      console.error('[Documentation] Error in search:', error);
      return { success: false, error: String(error) };
    }
  });

  // ==================== NAVIGATION ====================

  /**
   * Récupérer l'arbre de navigation
   */
  ipcMain.handle('documentation:getTree', async () => {
    try {
      const tree = await DocumentationService.getTree();
      return { success: true, data: tree };
    } catch (error) {
      console.error('[Documentation] Error in getTree:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupérer le breadcrumb pour un document
   */
  ipcMain.handle('documentation:getBreadcrumbs', async (_event, slug: string) => {
    try {
      const breadcrumbs = await DocumentationService.getBreadcrumbs(slug);
      return { success: true, data: breadcrumbs };
    } catch (error) {
      console.error('[Documentation] Error in getBreadcrumbs:', error);
      return { success: false, error: String(error) };
    }
  });

  // ==================== STATS ====================

  /**
   * Récupérer les statistiques
   */
  ipcMain.handle('documentation:getStats', async () => {
    try {
      const stats = await DocumentationService.getStats();
      return { success: true, data: stats };
    } catch (error) {
      console.error('[Documentation] Error in getStats:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[Documentation] ✅ IPC handlers registered');
}
