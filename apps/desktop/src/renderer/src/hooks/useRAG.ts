import { useState, useCallback } from 'react';
import type {
  RAGSearchParams,
  TextRAGSearchResult,
  VisionRAGSearchResult,
  RAGSource,
  RAGMetadata,
} from '../types/attachment';

interface UseRAGOptions {
  enabled?: boolean;
  defaultMode?: 'text' | 'vision' | 'hybrid' | 'auto';
  topK?: number;
  minScore?: number;
}

interface RAGSearchResponse {
  success: boolean;
  results: Array<TextRAGSearchResult | VisionRAGSearchResult>;
  mode: 'text' | 'vision' | 'hybrid';
  error?: string;
}

/**
 * Hook useRAG - Recherche et contextualisation RAG
 *
 * Features:
 * - Recherche hybride (text + vision)
 * - Contextualisation automatique des messages
 * - Formatage des sources pour l'UI
 * - Support des différents modes RAG
 * - Génération de métadonnées pour les messages
 *
 * @example
 * const { search, contextualizeMessage, ragMetadata } = useRAG({
 *   enabled: true,
 *   defaultMode: 'auto',
 *   topK: 5,
 * });
 *
 * const context = await contextualizeMessage(userMessage, conversationId);
 * const enrichedMessage = `${context}\n\nUser: ${userMessage}`;
 */
export function useRAG({
  enabled = true,
  defaultMode = 'auto',
  topK = 5,
  minScore = 0.7,
}: UseRAGOptions = {}) {
  const [isSearching, setIsSearching] = useState(false);
  const [lastResults, setLastResults] = useState<Array<TextRAGSearchResult | VisionRAGSearchResult>>([]);
  const [lastMetadata, setLastMetadata] = useState<RAGMetadata | null>(null);

  /**
   * Rechercher dans les documents indexés
   */
  const search = useCallback(
    async (params: Omit<RAGSearchParams, 'topK' | 'minScore'>): Promise<RAGSearchResponse> => {
      if (!enabled) {
        return {
          success: false,
          results: [],
          mode: 'text',
          error: 'RAG is disabled',
        };
      }

      try {
        setIsSearching(true);

        const searchParams: RAGSearchParams = {
          ...params,
          mode: params.mode || defaultMode,
          topK: topK,
          minScore: minScore,
        };

        // Appeler l'API hybride qui gère automatiquement le routing
        const result = await window.api.hybridRAG.search(searchParams);

        if (result.success) {
          setLastResults(result.results || []);
          return {
            success: true,
            results: result.results || [],
            mode: result.mode || 'text',
          };
        } else {
          return {
            success: false,
            results: [],
            mode: 'text',
            error: result.error || 'Search failed',
          };
        }
      } catch (err) {
        console.error('[useRAG] Search error:', err);
        return {
          success: false,
          results: [],
          mode: 'text',
          error: err instanceof Error ? err.message : 'Unknown error',
        };
      } finally {
        setIsSearching(false);
      }
    },
    [enabled, defaultMode, topK, minScore]
  );

  /**
   * Convertir les résultats RAG en sources formatées pour l'UI
   */
  const formatSources = useCallback(
    (results: Array<TextRAGSearchResult | VisionRAGSearchResult>): RAGSource[] => {
      return results.map((result) => {
        // Vérifier si c'est un résultat text ou vision
        if ('chunkId' in result) {
          // Text result
          return {
            attachmentId: result.attachmentId,
            fileName: result.metadata.originalName,
            score: result.score,
            type: 'text',
            chunkText: result.text,
            chunkIndex: result.metadata.chunkIndex,
          };
        } else {
          // Vision result
          return {
            attachmentId: result.attachmentId,
            fileName: result.metadata.originalName,
            score: result.score,
            type: 'vision',
            page: result.metadata.pageNumber,
            pageThumbnail: result.pageThumbnail,
            patchIndex: result.patchIndex,
          };
        }
      });
    },
    []
  );

  /**
   * Contextualiser un message utilisateur avec les résultats RAG
   * Retourne le contexte formaté à injecter dans le prompt
   */
  const contextualizeMessage = useCallback(
    async (
      userMessage: string,
      options: {
        conversationId?: string;
        entityType?: 'conversation' | 'message';
        entityId?: string;
        mode?: 'text' | 'vision' | 'hybrid' | 'auto';
        attachmentIds?: string[]; // CRITICAL: Filter by attachment IDs
      } = {}
    ): Promise<{
      context: string;
      sources: RAGSource[];
      metadata: RAGMetadata;
    }> => {
      if (!enabled) {
        return {
          context: '',
          sources: [],
          metadata: {
            mode: 'text',
            enabled: false,
            chunksUsed: 0,
            sources: [],
          },
        };
      }

      const startTime = Date.now();

      // Rechercher les documents pertinents
      const searchResult = await search({
        query: userMessage,
        mode: options.mode,
        filters: {
          conversationId: options.conversationId,
          entityType: options.entityType,
          entityId: options.entityId,
          attachmentIds: options.attachmentIds, // CRITICAL: Pass attachment IDs for filtering
        },
      });

      const searchTime = Date.now() - startTime;

      if (!searchResult.success || searchResult.results.length === 0) {
        const metadata: RAGMetadata = {
          mode: searchResult.mode,
          enabled: true,
          chunksUsed: 0,
          sources: [],
          searchTime,
          totalTime: searchTime,
        };
        setLastMetadata(metadata);

        return {
          context: '',
          sources: [],
          metadata,
        };
      }

      // Formater les sources
      const sources = formatSources(searchResult.results);

      // Construire le contexte textuel
      let context = '# Contexte depuis les documents\n\n';

      if (searchResult.mode === 'text' || searchResult.mode === 'hybrid') {
        // Ajouter les chunks de texte
        const textResults = searchResult.results.filter((r) => 'chunkId' in r) as TextRAGSearchResult[];
        if (textResults.length > 0) {
          context += '## Extraits textuels pertinents:\n\n';
          textResults.forEach((result, i) => {
            context += `### Source ${i + 1}: ${result.metadata.originalName}\n`;
            context += `${result.text}\n\n`;
          });
        }
      }

      if (searchResult.mode === 'vision' || searchResult.mode === 'hybrid') {
        // Ajouter les références visuelles
        const visionResults = searchResult.results.filter((r) => 'patchId' in r) as VisionRAGSearchResult[];
        if (visionResults.length > 0) {
          context += '## Références visuelles:\n\n';
          visionResults.forEach((result, i) => {
            context += `- ${result.metadata.originalName} (page ${result.metadata.pageNumber})\n`;
          });
          context += '\n';
        }
      }

      context += '---\n\n';

      // Générer les métadonnées
      const totalTime = Date.now() - startTime;
      const metadata: RAGMetadata = {
        mode: searchResult.mode,
        enabled: true,
        chunksUsed: searchResult.results.length,
        sources,
        searchTime,
        totalTime,
      };

      setLastMetadata(metadata);

      return {
        context,
        sources,
        metadata,
      };
    },
    [enabled, search, formatSources]
  );

  /**
   * Créer un prompt enrichi avec le contexte RAG
   */
  const enrichPrompt = useCallback(
    async (
      userMessage: string,
      systemPrompt?: string,
      options: Parameters<typeof contextualizeMessage>[1] = {}
    ): Promise<{
      enrichedPrompt: string;
      ragMetadata: RAGMetadata;
    }> => {
      const { context, metadata } = await contextualizeMessage(userMessage, options);

      let enrichedPrompt = '';

      // Ajouter le system prompt si fourni
      if (systemPrompt) {
        enrichedPrompt += `${systemPrompt}\n\n`;
      }

      // Ajouter le contexte RAG
      if (context) {
        enrichedPrompt += `${context}\n`;
      }

      // Ajouter le message utilisateur
      enrichedPrompt += `User: ${userMessage}`;

      return {
        enrichedPrompt,
        ragMetadata: metadata,
      };
    },
    [contextualizeMessage]
  );

  /**
   * Obtenir les statistiques RAG
   */
  const getStats = useCallback(async () => {
    try {
      const [textStats, visionStats, hybridStats] = await Promise.all([
        window.api.textRAG.getStats(),
        window.api.visionRAG.getStats(),
        window.api.hybridRAG.getStats(),
      ]);

      return {
        text: textStats,
        vision: visionStats,
        hybrid: hybridStats,
      };
    } catch (err) {
      console.error('[useRAG] Get stats error:', err);
      return null;
    }
  }, []);

  return {
    // State
    isSearching,
    lastResults,
    lastMetadata,

    // Actions
    search,
    contextualizeMessage,
    enrichPrompt,
    formatSources,
    getStats,

    // Config
    enabled,
    defaultMode,
    topK,
    minScore,
  };
}
