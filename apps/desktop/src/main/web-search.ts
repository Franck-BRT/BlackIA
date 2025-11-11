import axios from 'axios';
import * as cheerio from 'cheerio';
import type {
  WebSearchProviderConfig,
  WebSearchResult,
  WebSearchResponse,
} from '@blackia/shared';

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
        console.log('[WebSearch] 📦 Résultat depuis le cache:', query);
        return cached;
      }
    }

    console.log('[WebSearch] 🔍 Recherche:', { query, provider: provider.name, maxResults });

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
      }

      console.log('[WebSearch] ✅ Recherche terminée:', results.length, 'résultats');
      return response;
    } catch (error: any) {
      console.error('[WebSearch] ❌ Erreur:', error.message);
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
      // Utiliser DuckDuckGo HTML pour obtenir de vrais résultats de recherche
      const params = new URLSearchParams({
        q: query,
        kl: region.toLowerCase(),
        t: 'h_', // HTML mode
      });

      if (safeSearch) {
        params.append('kp', '1'); // Safe search strict
      }

      const response = await axios.get(`https://html.duckduckgo.com/html/?${params.toString()}`, {
        timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
      });

      const $ = cheerio.load(response.data);
      const results: WebSearchResult[] = [];

      // Extraire les résultats de recherche
      $('.result').each((index, element) => {
        if (results.length >= maxResults) return false;

        const $result = $(element);
        const $link = $result.find('.result__a');
        const $snippet = $result.find('.result__snippet');
        const $url = $result.find('.result__url');

        const title = $link.text().trim();
        const snippet = $snippet.text().trim();
        let url = $link.attr('href');

        // DuckDuckGo utilise des URLs de redirection, extraire l'URL réelle
        if (url && url.startsWith('/l/?')) {
          try {
            const urlParams = new URLSearchParams(url.substring(3));
            const uddg = urlParams.get('uddg');
            if (uddg) {
              url = decodeURIComponent(uddg);
            }
          } catch (e) {
            // Fallback à l'URL affichée
            url = $url.text().trim();
            if (url && !url.startsWith('http')) {
              url = 'https://' + url;
            }
          }
        }

        if (title && url && snippet) {
          try {
            const urlObj = new URL(url);
            results.push({
              title,
              url,
              snippet,
              source: urlObj.hostname.replace('www.', ''),
            });
          } catch (e) {
            // URL invalide, ignorer ce résultat
            console.warn('[WebSearch] URL invalide ignorée:', url);
          }
        }
      });

      console.log('[WebSearch] DuckDuckGo HTML parsing:', results.length, 'résultats trouvés');
      return results;
    } catch (error: any) {
      console.error('[WebSearch] Erreur DuckDuckGo:', error.message);
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

      const response = await axios.get(`https://api.search.brave.com/res/v1/web/search?${params.toString()}`, {
        timeout,
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey,
        },
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
      }

      return results;
    } catch (error: any) {
      console.error('[WebSearch] Erreur Brave:', error.message);
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

      // Format attendu: { results: [{ title, url, snippet, source? }] }
      if (response.data.results && Array.isArray(response.data.results)) {
        return response.data.results.map((r: any) => ({
          title: r.title || '',
          url: r.url || '',
          snippet: r.snippet || r.description || '',
          source: r.source,
        }));
      }

      return [];
    } catch (error: any) {
      console.error('[WebSearch] Erreur Custom Provider:', error.message);
      throw new Error(`Erreur Custom Provider: ${error.message}`);
    }
  }

  /**
   * Récupère le contenu complet d'une URL
   */
  async fetchUrlContent(url: string, timeout = 10000): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout,
        headers: {
          'User-Agent': 'BlackIA/1.0 (Desktop App)',
        },
        maxContentLength: 1024 * 1024, // 1MB max
      });

      // Extraire le texte du HTML (simple, pas de parsing complexe)
      const html = response.data;
      const text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      return text.substring(0, 10000); // Max 10k caractères
    } catch (error: any) {
      console.error('[WebSearch] Erreur fetch URL:', error.message);
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
