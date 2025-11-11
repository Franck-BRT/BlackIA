import axios from 'axios';
import * as cheerio from 'cheerio';
import type {
  WebSearchProviderConfig,
  WebSearchResult,
  WebSearchResponse,
} from '@blackia/shared';
import { logger } from './services/log-service';

/**
 * Cache simple en mémoire pour les résultats de recherche
 */
class SearchCache {
  private cache = new Map<string, { data: WebSearchResponse; expiry: number }>();

  set(key: string, data: WebSearchResponse, duration: number): void {
    const expiry = Date.now() + duration;
    this.cache.set(key, { data, expiry });
  }

  get(key: string): WebSearchResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }

    return { ...cached.data, cached: true };
  }

  clear(): void {
    this.cache.clear();
  }

  clearExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Service de recherche web avec support multi-providers
 */
export class WebSearchService {
  private cache = new SearchCache();
  private cacheEnabled: boolean;
  private cacheDuration: number;

  constructor(cacheEnabled = true, cacheDuration = 3600000) {
    this.cacheEnabled = cacheEnabled;
    this.cacheDuration = cacheDuration; // 1h par défaut

    // Nettoyer le cache toutes les 10 minutes
    setInterval(() => this.cache.clearExpired(), 600000);
  }

  /**
   * Effectue une recherche avec le provider spécifié
   */
  async search(
    query: string,
    provider: WebSearchProviderConfig,
    options: {
      maxResults?: number;
      language?: string;
      region?: string;
      safeSearch?: boolean;
      timeout?: number;
    } = {}
  ): Promise<WebSearchResponse> {
    const {
      maxResults = 5,
      language = 'fr',
      region = 'fr-FR',
      safeSearch = true,
      timeout = 10000,
    } = options;

    // Générer une clé de cache
    const cacheKey = `${provider.id}:${query}:${maxResults}:${language}:${region}`;

    // Vérifier le cache
    if (this.cacheEnabled) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logger.info('websearch', 'Résultat depuis le cache', query, { provider: provider.name });
        return cached;
      }
    }

    logger.info('websearch', 'Nouvelle recherche', `Query: "${query}" - Provider: ${provider.name}`, {
      query,
      provider: provider.name,
      maxResults,
      language,
      region,
      safeSearch
    });

    let results: WebSearchResult[];

    try {
      switch (provider.type) {
        case 'duckduckgo':
          results = await this.searchDuckDuckGo(query, maxResults, region, safeSearch, timeout);
          break;
        case 'brave':
          if (!provider.apiKey) {
            throw new Error('API Key Brave manquante');
          }
          results = await this.searchBrave(
            query,
            provider.apiKey,
            maxResults,
            language,
            safeSearch,
            timeout
          );
          break;
        case 'custom':
          if (!provider.baseUrl) {
            throw new Error('Base URL manquante pour le provider custom');
          }
          results = await this.searchCustom(
            query,
            provider.baseUrl,
            provider.apiKey,
            maxResults,
            timeout
          );
          break;
        default:
          throw new Error(`Provider non supporté: ${provider.type}`);
      }

      const response: WebSearchResponse = {
        query,
        results,
        provider: provider.name,
        timestamp: Date.now(),
        cached: false,
      };

      // Mettre en cache
      if (this.cacheEnabled && results.length > 0) {
        this.cache.set(cacheKey, response, this.cacheDuration);
        logger.debug('websearch', 'Résultats mis en cache', `${results.length} résultats`, { cacheKey });
      }

      logger.success('websearch', 'Recherche terminée avec succès', `${results.length} résultats trouvés pour "${query}"`, {
        resultsCount: results.length,
        provider: provider.name,
        cached: false
      });

      return response;
    } catch (error: any) {
      logger.error('websearch', 'Erreur lors de la recherche', error.message, {
        query,
        provider: provider.name,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Recherche avec DuckDuckGo (via HTML scraping)
   */
  private async searchDuckDuckGo(
    query: string,
    maxResults: number,
    region: string,
    safeSearch: boolean,
    timeout: number
  ): Promise<WebSearchResult[]> {
    try {
      // Utiliser DuckDuckGo Lite (version simplifiée) pour un scraping plus fiable
      const params = new URLSearchParams({
        q: query,
        kl: region.toLowerCase(),
      });

      if (safeSearch) {
        params.append('kp', '1'); // Safe search strict
      }

      const url = `https://lite.duckduckgo.com/lite/?${params.toString()}`;
      logger.info('websearch', 'DuckDuckGo - Envoi requête', url, {
        query,
        region,
        safeSearch,
        timeout
      });

      const response = await axios.get(url, {
        timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
      });

      logger.debug('websearch', 'DuckDuckGo - Réponse reçue', `Status: ${response.status}, Taille: ${response.data.length} octets`, {
        status: response.status,
        contentLength: response.data.length,
        contentType: response.headers['content-type']
      });

      const $ = cheerio.load(response.data);
      const results: WebSearchResult[] = [];
      const totalRows = $('tr').length;

      logger.debug('websearch', 'DuckDuckGo - Parsing HTML', `${totalRows} lignes de table trouvées`);

      // DuckDuckGo Lite utilise une structure de table simple
      // Chaque résultat est dans un tr avec plusieurs td
      $('tr').each((index, element) => {
        if (results.length >= maxResults) return false;

        const $row = $(element);

        // Les résultats ont généralement 4 td: numéro, lien, snippet, source
        const $cells = $row.find('td');
        if ($cells.length < 3) return; // Pas un résultat valide

        // Trouver le lien principal (dans la 2ème colonne généralement)
        const $linkCell = $cells.eq(1);
        const $link = $linkCell.find('a').first();

        if ($link.length === 0) return;

        let url = $link.attr('href');
        const title = $link.text().trim();

        // Extraire l'URL réelle depuis le lien de redirection DuckDuckGo
        if (url && url.includes('uddg=')) {
          try {
            const originalUrl = url;
            const urlParams = new URLSearchParams(url.split('?')[1]);
            const uddg = urlParams.get('uddg');
            if (uddg) {
              url = decodeURIComponent(uddg);
              logger.debug('websearch', 'DuckDuckGo - URL décodée', `${originalUrl} → ${url}`);
            }
          } catch (e) {
            logger.warning('websearch', 'DuckDuckGo - Erreur extraction URL', String(e));
          }
        }

        // Trouver le snippet (texte descriptif)
        let snippet = '';
        const $snippetCell = $cells.eq(2);
        if ($snippetCell.length > 0) {
          snippet = $snippetCell.text().trim();
        }

        // Si pas de snippet dans la cellule, chercher dans les éléments suivants
        if (!snippet) {
          const nextText = $row.next('tr').find('td').text().trim();
          if (nextText && !nextText.startsWith('http')) {
            snippet = nextText;
          }
        }

        if (title && url && url.startsWith('http')) {
          try {
            const urlObj = new URL(url);
            const result = {
              title,
              url,
              snippet: snippet || title,
              source: urlObj.hostname.replace('www.', ''),
            };
            results.push(result);
            logger.debug('websearch', 'DuckDuckGo - Résultat ajouté', title.substring(0, 60), {
              title,
              url,
              source: result.source,
              hasSnippet: !!snippet
            });
          } catch (e) {
            logger.warning('websearch', 'DuckDuckGo - URL invalide ignorée', url);
          }
        }
      });

      logger.info('websearch', 'DuckDuckGo - Parsing terminé', `${results.length} résultats extraits sur ${totalRows} lignes`, {
        resultsCount: results.length,
        totalRows,
        query
      });

      if (results.length === 0) {
        logger.warning('websearch', 'DuckDuckGo - Aucun résultat trouvé', `Structure HTML: ${$('tr').length} lignes de table, ${$('a').length} liens`, {
          totalRows: $('tr').length,
          totalLinks: $('a').length,
          query
        });
      }

      return results;
    } catch (error: any) {
      logger.error('websearch', 'Erreur DuckDuckGo', error.message, {
        query,
        error: error.message,
        stack: error.stack,
        code: error.code
      });
      throw new Error(`Erreur DuckDuckGo: ${error.message}`);
    }
  }

  /**
   * Recherche avec Brave Search API
   */
  private async searchBrave(
    query: string,
    apiKey: string,
    maxResults: number,
    language: string,
    safeSearch: boolean,
    timeout: number
  ): Promise<WebSearchResult[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        count: maxResults.toString(),
        search_lang: language,
        safesearch: safeSearch ? 'strict' : 'off',
      });

      const url = `https://api.search.brave.com/res/v1/web/search?${params.toString()}`;
      logger.info('websearch', 'Brave - Envoi requête API', url, {
        query,
        maxResults,
        language,
        safeSearch
      });

      const response = await axios.get(url, {
        timeout,
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey,
        },
      });

      logger.debug('websearch', 'Brave - Réponse reçue', `Status: ${response.status}`, {
        status: response.status,
        hasResults: !!response.data.web?.results
      });

      const results: WebSearchResult[] = [];

      if (response.data.web?.results && Array.isArray(response.data.web.results)) {
        for (const result of response.data.web.results) {
          const url = new URL(result.url);
          results.push({
            title: result.title,
            url: result.url,
            snippet: result.description || '',
            source: url.hostname.replace('www.', ''),
            publishedDate: result.age,
          });
        }
        logger.success('websearch', 'Brave - Résultats extraits', `${results.length} résultats`, {
          resultsCount: results.length,
          query
        });
      } else {
        logger.warning('websearch', 'Brave - Aucun résultat dans la réponse', 'Structure de réponse inattendue', {
          hasWeb: !!response.data.web,
          hasResults: !!response.data.web?.results,
          query
        });
      }

      return results;
    } catch (error: any) {
      logger.error('websearch', 'Erreur Brave Search', error.message, {
        query,
        error: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      throw new Error(`Erreur Brave: ${error.message}`);
    }
  }

  /**
   * Recherche avec provider custom (API compatible)
   */
  private async searchCustom(
    query: string,
    baseUrl: string,
    apiKey: string | undefined,
    maxResults: number,
    timeout: number
  ): Promise<WebSearchResult[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      logger.info('websearch', 'Custom Provider - Envoi requête', baseUrl, {
        query,
        maxResults,
        hasApiKey: !!apiKey
      });

      const response = await axios.post(
        baseUrl,
        {
          query,
          max_results: maxResults,
        },
        {
          timeout,
          headers,
        }
      );

      logger.debug('websearch', 'Custom Provider - Réponse reçue', `Status: ${response.status}`, {
        status: response.status,
        hasResults: !!response.data.results
      });

      // Format attendu: { results: [{ title, url, snippet, source? }] }
      if (response.data.results && Array.isArray(response.data.results)) {
        const results = response.data.results.map((r: any) => ({
          title: r.title || '',
          url: r.url || '',
          snippet: r.snippet || r.description || '',
          source: r.source,
        }));

        logger.success('websearch', 'Custom Provider - Résultats extraits', `${results.length} résultats`, {
          resultsCount: results.length,
          query
        });

        return results;
      }

      logger.warning('websearch', 'Custom Provider - Aucun résultat', 'Format de réponse inattendu', {
        hasResults: !!response.data.results,
        query
      });

      return [];
    } catch (error: any) {
      logger.error('websearch', 'Erreur Custom Provider', error.message, {
        baseUrl,
        query,
        error: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      throw new Error(`Erreur Custom Provider: ${error.message}`);
    }
  }

  /**
   * Récupère le contenu complet d'une URL
   */
  async fetchUrlContent(url: string, timeout = 10000): Promise<string> {
    try {
      logger.info('websearch', 'Fetch URL - Récupération contenu', url, { timeout });

      const response = await axios.get(url, {
        timeout,
        headers: {
          'User-Agent': 'BlackIA/1.0 (Desktop App)',
        },
        maxContentLength: 1024 * 1024, // 1MB max
      });

      logger.debug('websearch', 'Fetch URL - Réponse reçue', `Status: ${response.status}, Taille: ${response.data.length} octets`, {
        status: response.status,
        contentLength: response.data.length,
        contentType: response.headers['content-type']
      });

      // Extraire le texte du HTML (simple, pas de parsing complexe)
      const html = response.data;
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const finalText = text.substring(0, 10000); // Max 10k caractères

      logger.success('websearch', 'Fetch URL - Contenu extrait', `${finalText.length} caractères`, {
        url,
        textLength: finalText.length,
        originalLength: text.length
      });

      return finalText;
    } catch (error: any) {
      logger.error('websearch', 'Erreur fetch URL', error.message, {
        url,
        error: error.message,
        stack: error.stack,
        code: error.code
      });
      throw new Error(`Erreur fetch URL: ${error.message}`);
    }
  }

  /**
   * Nettoie le cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Configure le cache
   */
  setCache(enabled: boolean, duration?: number): void {
    this.cacheEnabled = enabled;
    if (duration !== undefined) {
      this.cacheDuration = duration;
    }
  }
}

// Instance singleton
let webSearchService: WebSearchService | null = null;

export function getWebSearchService(): WebSearchService {
  if (!webSearchService) {
    webSearchService = new WebSearchService();
  }
  return webSearchService;
}
