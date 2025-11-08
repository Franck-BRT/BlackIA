import { ipcMain } from 'electron';
import { PromptService } from '../services/prompt-service';
import type { Prompt } from '../services/prompt-service';

/**
 * IPC Handlers pour la gestion des Prompts
 */

export function registerPromptHandlers() {
  /**
   * Récupère tous les prompts
   */
  ipcMain.handle('prompts:getAll', async () => {
    try {
      const allPrompts = await PromptService.getAll();
      // Trier par usageCount décroissant, puis par favoris
      const sorted = allPrompts.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return b.usageCount - a.usageCount;
      });
      return { success: true, data: sorted };
    } catch (error) {
      console.error('[Prompts] Error fetching all prompts:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupère un prompt par ID
   */
  ipcMain.handle('prompts:getById', async (_event, id: string) => {
    try {
      const prompt = await PromptService.getById(id);

      if (!prompt) {
        return { success: false, error: 'Prompt not found' };
      }

      return { success: true, data: prompt };
    } catch (error) {
      console.error('[Prompts] Error fetching prompt:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Crée un nouveau prompt
   */
  ipcMain.handle('prompts:create', async (_event, data: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
    try {
      const newPrompt = await PromptService.create(data);
      return { success: true, data: newPrompt };
    } catch (error) {
      console.error('[Prompts] Error creating prompt:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Met à jour un prompt existant
   */
  ipcMain.handle('prompts:update', async (_event, id: string, data: Partial<Prompt>) => {
    try {
      const updated = await PromptService.update(id, data);

      if (!updated) {
        return { success: false, error: 'Prompt not found' };
      }

      return { success: true, data: updated };
    } catch (error) {
      console.error('[Prompts] Error updating prompt:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Supprime un prompt
   */
  ipcMain.handle('prompts:delete', async (_event, id: string) => {
    try {
      const deleted = await PromptService.delete(id);

      if (!deleted) {
        return { success: false, error: 'Prompt not found' };
      }

      return { success: true };
    } catch (error) {
      console.error('[Prompts] Error deleting prompt:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Recherche des prompts par texte
   */
  ipcMain.handle('prompts:search', async (_event, query: string) => {
    try {
      const results = await PromptService.search(query);
      return { success: true, data: results };
    } catch (error) {
      console.error('[Prompts] Error searching prompts:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Filtre les prompts par catégorie
   */
  ipcMain.handle('prompts:filterByCategory', async (_event, category: string) => {
    try {
      const results = await PromptService.filterByCategory(category);
      return { success: true, data: results };
    } catch (error) {
      console.error('[Prompts] Error filtering prompts:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupère les prompts favoris
   */
  ipcMain.handle('prompts:getFavorites', async () => {
    try {
      const results = await PromptService.getFavorites();
      return { success: true, data: results };
    } catch (error) {
      console.error('[Prompts] Error fetching favorites:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Toggle le statut favori d'un prompt
   */
  ipcMain.handle('prompts:toggleFavorite', async (_event, id: string) => {
    try {
      const updated = await PromptService.toggleFavorite(id);

      if (!updated) {
        return { success: false, error: 'Prompt not found' };
      }

      return { success: true, data: updated };
    } catch (error) {
      console.error('[Prompts] Error toggling favorite:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Incrémente le compteur d'utilisation d'un prompt
   */
  ipcMain.handle('prompts:incrementUsage', async (_event, id: string) => {
    try {
      await PromptService.incrementUsage(id);
      return { success: true };
    } catch (error) {
      console.error('[Prompts] Error incrementing usage:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Duplique un prompt
   */
  ipcMain.handle('prompts:duplicate', async (_event, id: string) => {
    try {
      const duplicate = await PromptService.duplicate(id);

      if (!duplicate) {
        return { success: false, error: 'Prompt not found' };
      }

      return { success: true, data: duplicate };
    } catch (error) {
      console.error('[Prompts] Error duplicating prompt:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupère toutes les catégories uniques
   */
  ipcMain.handle('prompts:getCategories', async () => {
    try {
      const categories = await PromptService.getCategories();
      return { success: true, data: categories };
    } catch (error) {
      console.error('[Prompts] Error fetching categories:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[IPC] Prompt handlers registered');
}
