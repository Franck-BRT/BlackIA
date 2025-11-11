import { ipcMain } from 'electron';
import { getWebSearchService } from './web-search';
import type { WebSearchProviderConfig } from '@blackia/shared';

/**
 * Enregistre tous les handlers IPC pour la recherche web
 */
export function registerWebSearchHandlers(): void {
  const service = getWebSearchService();

  // Effectuer une recherche
  ipcMain.handle(
    'webSearch:search',
    async (
      _event,
      query: string,
      provider: WebSearchProviderConfig,
      options?: {
        maxResults?: number;
        language?: string;
        region?: string;
        safeSearch?: boolean;
        timeout?: number;
      }
    ) => {
      try {
        console.log('[IPC Handler] 🔍 webSearch:search appelé:', { query, provider: provider.name });
        const result = await service.search(query, provider, options);
        console.log('[IPC Handler] ✅ Recherche terminée:', result.results.length, 'résultats');
        return { success: true, data: result };
      } catch (error: any) {
        console.error('[IPC Handler] ❌ Erreur recherche:', error);
        return { success: false, error: error.message };
      }
    }
  );

  // Récupérer le contenu d'une URL
  ipcMain.handle('webSearch:fetchUrl', async (_event, url: string, timeout?: number) => {
    try {
      console.log('[IPC Handler] 🌐 webSearch:fetchUrl appelé:', url);
      const content = await service.fetchUrlContent(url, timeout);
      console.log('[IPC Handler] ✅ Contenu récupéré:', content.length, 'caractères');
      return { success: true, data: content };
    } catch (error: any) {
      console.error('[IPC Handler] ❌ Erreur fetch URL:', error);
      return { success: false, error: error.message };
    }
  });

  // Nettoyer le cache
  ipcMain.handle('webSearch:clearCache', async () => {
    try {
      console.log('[IPC Handler] 🧹 webSearch:clearCache appelé');
      service.clearCache();
      return { success: true };
    } catch (error: any) {
      console.error('[IPC Handler] ❌ Erreur clear cache:', error);
      return { success: false, error: error.message };
    }
  });

  // Configurer le cache
  ipcMain.handle(
    'webSearch:setCache',
    async (_event, enabled: boolean, duration?: number) => {
      try {
        console.log('[IPC Handler] ⚙️ webSearch:setCache appelé:', { enabled, duration });
        service.setCache(enabled, duration);
        return { success: true };
      } catch (error: any) {
        console.error('[IPC Handler] ❌ Erreur config cache:', error);
        return { success: false, error: error.message };
      }
    }
  );

  console.log('✅ Handlers IPC WebSearch enregistrés');
}
