import { ipcMain } from 'electron';
import { getWebSearchService } from './web-search';
import type { WebSearchProviderConfig } from '@blackia/shared';
import { logger } from './services/log-service';

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
        logger.info('websearch', 'IPC Handler - webSearch:search appelé', `Query: "${query}" - Provider: ${provider.name}`, {
          query,
          provider: provider.name,
          options
        });

        const result = await service.search(query, provider, options);

        logger.success('websearch', 'IPC Handler - Recherche terminée', `${result.results.length} résultats retournés`, {
          resultsCount: result.results.length,
          cached: result.cached,
          query,
          provider: provider.name
        });

        return { success: true, data: result };
      } catch (error: any) {
        logger.error('websearch', 'IPC Handler - Erreur recherche', error.message, {
          query,
          provider: provider.name,
          error: error.message,
          stack: error.stack
        });
        return { success: false, error: error.message };
      }
    }
  );

  // Récupérer le contenu d'une URL
  ipcMain.handle('webSearch:fetchUrl', async (_event, url: string, timeout?: number) => {
    try {
      logger.info('websearch', 'IPC Handler - webSearch:fetchUrl appelé', url, { url, timeout });
      const content = await service.fetchUrlContent(url, timeout);
      logger.success('websearch', 'IPC Handler - Contenu récupéré', `${content.length} caractères`, {
        url,
        contentLength: content.length
      });
      return { success: true, data: content };
    } catch (error: any) {
      logger.error('websearch', 'IPC Handler - Erreur fetch URL', error.message, {
        url,
        error: error.message,
        stack: error.stack
      });
      return { success: false, error: error.message };
    }
  });

  // Nettoyer le cache
  ipcMain.handle('webSearch:clearCache', async () => {
    try {
      logger.info('websearch', 'IPC Handler - webSearch:clearCache appelé', 'Nettoyage du cache de recherche');
      service.clearCache();
      logger.success('websearch', 'IPC Handler - Cache nettoyé', 'Cache vidé avec succès');
      return { success: true };
    } catch (error: any) {
      logger.error('websearch', 'IPC Handler - Erreur clear cache', error.message, {
        error: error.message,
        stack: error.stack
      });
      return { success: false, error: error.message };
    }
  });

  // Configurer le cache
  ipcMain.handle(
    'webSearch:setCache',
    async (_event, enabled: boolean, duration?: number) => {
      try {
        logger.info('websearch', 'IPC Handler - webSearch:setCache appelé', `Enabled: ${enabled}, Duration: ${duration}ms`, {
          enabled,
          duration
        });
        service.setCache(enabled, duration);
        logger.success('websearch', 'IPC Handler - Cache configuré', 'Configuration du cache mise à jour');
        return { success: true };
      } catch (error: any) {
        logger.error('websearch', 'IPC Handler - Erreur config cache', error.message, {
          enabled,
          duration,
          error: error.message,
          stack: error.stack
        });
        return { success: false, error: error.message };
      }
    }
  );

  logger.info('websearch', 'Handlers IPC enregistrés', 'Tous les handlers WebSearch sont prêts');
}
