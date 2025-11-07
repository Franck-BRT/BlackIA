import { ipcMain } from 'electron';
import { personaSuggestionService } from '../services/persona-suggestion-service';
import { DEFAULT_KEYWORDS } from '../../shared/default-keywords';

/**
 * Handlers IPC pour la gestion des suggestions de personas
 */

// Récupérer tous les keywords
ipcMain.handle('persona-suggestions:get-all', async () => {
  try {
    const keywords = await personaSuggestionService.getAllKeywords();
    return { success: true, data: keywords };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Récupérer les keywords actifs
ipcMain.handle('persona-suggestions:get-active', async () => {
  try {
    const keywords = await personaSuggestionService.getActiveKeywords();
    return { success: true, data: keywords };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Récupérer un keyword par ID
ipcMain.handle('persona-suggestions:get-by-id', async (_, id: string) => {
  try {
    const keyword = await personaSuggestionService.getKeywordById(id);
    return { success: true, data: keyword };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Créer un nouveau keyword
ipcMain.handle(
  'persona-suggestions:create',
  async (_, data: { keyword: string; categories: string[]; isActive?: boolean }) => {
    try {
      const keyword = await personaSuggestionService.createKeyword(data);
      return { success: true, data: keyword };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
);

// Mettre à jour un keyword
ipcMain.handle(
  'persona-suggestions:update',
  async (_, id: string, data: { keyword?: string; categories?: string[]; isActive?: boolean }) => {
    try {
      const keyword = await personaSuggestionService.updateKeyword(id, data);
      return { success: true, data: keyword };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
);

// Supprimer un keyword
ipcMain.handle('persona-suggestions:delete', async (_, id: string) => {
  try {
    await personaSuggestionService.deleteKeyword(id);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Basculer l'état actif/inactif
ipcMain.handle('persona-suggestions:toggle-active', async (_, id: string) => {
  try {
    const keyword = await personaSuggestionService.toggleKeywordActive(id);
    return { success: true, data: keyword };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Rechercher des keywords
ipcMain.handle('persona-suggestions:search', async (_, query: string) => {
  try {
    const keywords = await personaSuggestionService.searchKeywords(query);
    return { success: true, data: keywords };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Initialiser les keywords par défaut
ipcMain.handle('persona-suggestions:initialize-defaults', async () => {
  try {
    await personaSuggestionService.initializeDefaultKeywords(DEFAULT_KEYWORDS);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Réinitialiser aux valeurs par défaut
ipcMain.handle('persona-suggestions:reset-to-defaults', async () => {
  try {
    await personaSuggestionService.resetToDefaults(DEFAULT_KEYWORDS);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Obtenir les statistiques
ipcMain.handle('persona-suggestions:get-stats', async () => {
  try {
    const stats = await personaSuggestionService.getKeywordStats();
    return { success: true, data: stats };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
