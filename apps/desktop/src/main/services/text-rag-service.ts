import axios from 'axios';
import { randomUUID } from 'crypto';
import {
  chunkText,
  estimateTokenCount,
  type TextRAGIndexParams,
  type RAGSearchParams,
  type TextRAGResult,
  type TextChunk,
  type TextRAGChunkSchema,
  type OllamaEmbeddingsResponse,
} from '../types/rag';
import { vectorStore } from './vector-store';

/**
 * Text RAG Service
 * Gère l'indexation et la recherche de texte avec embeddings Ollama
 *
 * Flow:
 * 1. Chunking du texte (500 tokens, 50 overlap)
 * 2. Génération embeddings via Ollama (nomic-embed-text: 768 dims)
 * 3. Stockage dans LanceDB (vector store)
 * 4. Recherche vectorielle + re-ranking
 */
export class TextRAGService {
  private ollamaBaseUrl: string;
  private defaultModel: string;

  constructor(ollamaBaseUrl: string = 'http://localhost:11434', defaultModel: string = 'nomic-embed-text') {
    this.ollamaBaseUrl = ollamaBaseUrl;
    this.defaultModel = defaultModel;
  }

  /**
   * Indexer un document texte
   */
  async indexDocument(params: TextRAGIndexParams): Promise<{
    success: boolean;
    chunkCount: number;
    totalTokens: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      console.log('[TextRAG] Indexing document:', {
        attachmentId: params.attachmentId,
        textLength: params.text.length,
        model: params.model || this.defaultModel,
      });

      // 1. Chunking
      const chunkSize = params.chunkingOptions?.chunkSize || 500;
      const chunkOverlap = params.chunkingOptions?.chunkOverlap || 50;
      const separator = params.chunkingOptions?.separator || '\n\n';

      const chunks = chunkText(params.text, chunkSize, chunkOverlap, separator);

      if (chunks.length === 0) {
        console.warn('[TextRAG] No chunks generated (text too short?)');
        return {
          success: true,
          chunkCount: 0,
          totalTokens: 0,
        };
      }

      console.log('[TextRAG] Generated', chunks.length, 'chunks');

      // 2. Générer embeddings pour chaque chunk
      const model = params.model || this.defaultModel;
      const chunkSchemas: TextRAGChunkSchema[] = [];

      for (const chunk of chunks) {
        const embedding = await this.generateEmbedding(chunk.text, model);

        const schema: TextRAGChunkSchema = {
          id: `${params.attachmentId}-chunk-${chunk.index}`,
          attachmentId: params.attachmentId,
          chunkIndex: chunk.index,
          text: chunk.text,
          vector: embedding,
          entityType: params.entityType,
          entityId: params.entityId,
          metadata: JSON.stringify({
            originalName: params.attachmentId,
            ...chunk.metadata,
          }),
          createdAt: Date.now(),
        };

        chunkSchemas.push(schema);
      }

      // 3. Stocker dans LanceDB
      await vectorStore.indexTextChunks(chunkSchemas);

      const duration = Date.now() - startTime;
      const totalTokens = chunks.reduce((sum, chunk) => sum + estimateTokenCount(chunk.text), 0);

      console.log('[TextRAG] Indexed successfully:', {
        chunkCount: chunks.length,
        totalTokens,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        chunkCount: chunks.length,
        totalTokens,
      };
    } catch (error) {
      console.error('[TextRAG] Indexing error:', error);
      return {
        success: false,
        chunkCount: 0,
        totalTokens: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Rechercher dans les documents indexés
   */
  async search(params: RAGSearchParams): Promise<{
    success: boolean;
    results: TextRAGResult[];
    error?: string;
  }> {
    try {
      const startTime = Date.now();

      console.log('[TextRAG] Searching:', {
        query: params.query.substring(0, 100),
        topK: params.topK || 10,
        filters: params.filters,
      });

      // 1. Générer embedding de la query
      const queryEmbedding = await this.generateEmbedding(params.query, this.defaultModel);

      // 2. Recherche vectorielle dans LanceDB
      const topK = params.topK || 10;
      const results = await vectorStore.searchTextChunks(queryEmbedding, topK, params.filters);

      // 3. Filtrer par score minimum si spécifié
      const minScore = params.minScore || 0;
      const filteredResults = results.filter((r) => r.score >= minScore);

      const duration = Date.now() - startTime;

      console.log('[TextRAG] Search completed:', {
        resultsCount: filteredResults.length,
        topScore: filteredResults[0]?.score,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        results: filteredResults,
      };
    } catch (error) {
      console.error('[TextRAG] Search error:', error);
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Supprimer l'indexation d'un document
   */
  async deleteDocument(attachmentId: string): Promise<void> {
    try {
      console.log('[TextRAG] Deleting document:', attachmentId);
      await vectorStore.deleteByAttachmentId(attachmentId);
      console.log('[TextRAG] Deleted successfully');
    } catch (error) {
      console.error('[TextRAG] Delete error:', error);
      throw error;
    }
  }

  /**
   * Générer un embedding via Ollama
   */
  private async generateEmbedding(text: string, model: string): Promise<number[]> {
    try {
      const response = await axios.post<OllamaEmbeddingsResponse>(
        `${this.ollamaBaseUrl}/api/embeddings`,
        {
          model,
          prompt: text,
        },
        {
          timeout: 30000, // 30s timeout
        }
      );

      if (!response.data.embedding) {
        throw new Error('No embedding returned from Ollama');
      }

      return response.data.embedding;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error(
            'Cannot connect to Ollama. Make sure Ollama is running (http://localhost:11434)'
          );
        }
        if (error.response?.status === 404) {
          throw new Error(
            `Model "${model}" not found. Run: ollama pull ${model}`
          );
        }
        if (error.response?.status === 500) {
          const errorMsg = error.response?.data?.error || 'Internal server error';
          throw new Error(
            `Ollama server error (500): ${errorMsg}. This usually means the model is not properly loaded or incompatible.`
          );
        }
        // Log détaillé pour autres erreurs HTTP
        console.error('[TextRAG] Ollama HTTP error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
        });
      }
      console.error('[TextRAG] Embedding generation error:', error);
      throw error;
    }
  }

  /**
   * Vérifier si Ollama est disponible
   */
  async checkOllamaAvailability(): Promise<{
    available: boolean;
    models: string[];
    error?: string;
  }> {
    try {
      const response = await axios.get(`${this.ollamaBaseUrl}/api/tags`, {
        timeout: 5000,
      });

      const models = response.data.models?.map((m: any) => m.name) || [];

      return {
        available: true,
        models,
      };
    } catch (error) {
      console.error('[TextRAG] Ollama check error:', error);
      return {
        available: false,
        models: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Vérifier si un modèle d'embedding est disponible
   */
  async isModelAvailable(model: string): Promise<boolean> {
    const check = await this.checkOllamaAvailability();
    return check.models.includes(model);
  }

  /**
   * Re-indexer tous les chunks d'un document (après modification)
   */
  async reindexDocument(params: TextRAGIndexParams): Promise<{
    success: boolean;
    chunkCount: number;
    totalTokens: number;
    error?: string;
  }> {
    try {
      // 1. Supprimer l'ancienne indexation
      await this.deleteDocument(params.attachmentId);

      // 2. Ré-indexer
      return await this.indexDocument(params);
    } catch (error) {
      console.error('[TextRAG] Reindex error:', error);
      return {
        success: false,
        chunkCount: 0,
        totalTokens: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Obtenir les chunks d'un document spécifique (pour debug/preview)
   */
  async getDocumentChunks(attachmentId: string): Promise<TextRAGResult[]> {
    try {
      // Recherche avec un vecteur dummy (on veut juste récupérer tous les chunks)
      // Note: LanceDB ne supporte pas de "get all by filter", on doit passer par search
      const dummyVector = new Array(768).fill(0); // 768 dims pour nomic-embed-text

      const results = await vectorStore.searchTextChunks(dummyVector, 1000, {
        attachmentIds: [attachmentId],
      });

      return results.sort((a, b) => a.metadata.chunkIndex - b.metadata.chunkIndex);
    } catch (error) {
      console.error('[TextRAG] Get chunks error:', error);
      return [];
    }
  }

  /**
   * Calculer des statistiques de chunking pour un texte
   * (utile pour preview avant indexation)
   */
  estimateChunking(
    text: string,
    chunkSize: number = 500,
    chunkOverlap: number = 50
  ): {
    estimatedChunkCount: number;
    totalTokens: number;
    avgChunkTokens: number;
  } {
    const chunks = chunkText(text, chunkSize, chunkOverlap);
    const totalTokens = estimateTokenCount(text);
    const avgChunkTokens = chunks.length > 0 ? totalTokens / chunks.length : 0;

    return {
      estimatedChunkCount: chunks.length,
      totalTokens,
      avgChunkTokens: Math.round(avgChunkTokens),
    };
  }

  /**
   * Mettre à jour l'URL Ollama (pour settings)
   */
  setOllamaUrl(url: string): void {
    this.ollamaBaseUrl = url;
    console.log('[TextRAG] Ollama URL updated:', url);
  }

  /**
   * Mettre à jour le modèle par défaut (pour settings)
   */
  setDefaultModel(model: string): void {
    this.defaultModel = model;
    console.log('[TextRAG] Default model updated:', model);
  }
}

// Export singleton instance
export const textRAGService = new TextRAGService();
