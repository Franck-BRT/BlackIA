/**
 * Text RAG Service V2
 * Utilise le Backend Manager pour supporter plusieurs backends (MLX, Ollama, etc.)
 *
 * Migration de text-rag-service.ts vers l'architecture multi-backend
 */

import { randomUUID } from 'crypto';
import {
  chunkText,
  estimateTokenCount,
  type TextRAGIndexParams,
  type RAGSearchParams,
  type TextRAGResult,
  type TextChunk,
  type TextRAGChunkSchema,
} from '../types/rag';
import { vectorStore } from './vector-store';
import { logger } from './log-service';
import { backendManager } from './backends';

/**
 * Text RAG Service V2
 * Gère l'indexation et la recherche de texte avec le Backend Manager
 *
 * Flow:
 * 1. Chunking du texte (500 tokens, 50 overlap)
 * 2. Génération embeddings via Backend Manager (MLX ou Ollama)
 * 3. Stockage dans LanceDB (vector store)
 * 4. Recherche vectorielle + re-ranking
 */
export class TextRAGServiceV2 {
  private defaultModel: string;

  constructor(defaultModel: string = 'nomic-embed-text') {
    this.defaultModel = defaultModel;
  }

  /**
   * Initialiser le service (appelé au démarrage de l'app)
   */
  async initialize(): Promise<void> {
    // Le Backend Manager est déjà initialisé dans main.ts
    const activeBackend = backendManager.getActiveBackendType();
    logger.info('rag', 'TextRAGServiceV2 initialized', `Active backend: ${activeBackend}`, {
      activeBackend,
      defaultModel: this.defaultModel
    });
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
      logger.debug('rag', 'Starting text RAG indexing', `AttachmentId: ${params.attachmentId}`, {
        attachmentId: params.attachmentId,
        textLength: params.text.length,
        model: params.model || this.defaultModel,
        backend: backendManager.getActiveBackendType()
      });

      // 1. Chunking
      const chunkSize = params.chunkingOptions?.chunkSize || 500;
      const chunkOverlap = params.chunkingOptions?.chunkOverlap || 50;
      const separator = params.chunkingOptions?.separator || '\n\n';

      const chunks = chunkText(params.text, chunkSize, chunkOverlap, separator);

      if (chunks.length === 0) {
        logger.warning('rag', 'No chunks generated', `Text too short for document ${params.attachmentId}`);
        return {
          success: true,
          chunkCount: 0,
          totalTokens: 0,
        };
      }

      logger.debug('rag', 'Chunks generated', `Generated ${chunks.length} chunks for document ${params.attachmentId}`, {
        chunkCount: chunks.length,
        chunkSize,
        chunkOverlap
      });

      // 2. Générer embeddings pour chaque chunk via Backend Manager
      const model = params.model || this.defaultModel;
      const chunkSchemas: TextRAGChunkSchema[] = [];

      for (const chunk of chunks) {
        // Utiliser le Backend Manager au lieu d'appeler Ollama directement
        const embeddingResponse = await backendManager.generateEmbedding({
          text: chunk.text,
          model,
        });

        const embedding = Array.isArray(embeddingResponse.embeddings)
          ? embeddingResponse.embeddings as number[]
          : embeddingResponse.embeddings;

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
          createdAt: new Date().toISOString(),
        };

        chunkSchemas.push(schema);
      }

      logger.debug('rag', 'Embeddings generated', `Generated embeddings for ${chunkSchemas.length} chunks`, {
        chunkCount: chunkSchemas.length,
        firstChunkId: chunkSchemas[0]?.id,
        firstChunkAttachmentId: chunkSchemas[0]?.attachmentId,
      });

      // 3. Stocker dans LanceDB
      logger.debug('rag', 'Inserting chunks into LanceDB', `Inserting ${chunkSchemas.length} chunks`);
      await vectorStore.indexTextChunks(chunkSchemas);

      logger.debug('rag', 'Chunks inserted into LanceDB', `Successfully inserted ${chunkSchemas.length} chunks`);

      // 4. Statistiques
      const totalTokens = chunks.reduce((sum, chunk) => sum + estimateTokenCount(chunk.text), 0);
      const duration = Date.now() - startTime;

      logger.info('rag', 'Text RAG indexing completed', `Indexed ${chunks.length} chunks in ${duration}ms`, {
        chunkCount: chunks.length,
        totalTokens,
        duration,
        attachmentId: params.attachmentId,
      });

      return {
        success: true,
        chunkCount: chunks.length,
        totalTokens,
      };
    } catch (error) {
      logger.error('rag', 'Text RAG indexing failed', `AttachmentId: ${params.attachmentId}`, {
        attachmentId: params.attachmentId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        chunkCount: 0,
        totalTokens: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Rechercher des chunks similaires
   */
  async search(params: RAGSearchParams): Promise<TextRAGResult[]> {
    try {
      logger.debug('rag', 'Text RAG search starting', `Query length: ${params.query.length}`, {
        queryLength: params.query.length,
        topK: params.topK || 10,
        backend: backendManager.getActiveBackendType()
      });

      // 1. Générer l'embedding de la query via Backend Manager
      const model = params.model || this.defaultModel;
      const embeddingResponse = await backendManager.generateEmbedding({
        text: params.query,
        model,
      });

      const queryEmbedding = Array.isArray(embeddingResponse.embeddings)
        ? embeddingResponse.embeddings as number[]
        : embeddingResponse.embeddings;

      logger.debug('rag', 'Query embedding generated', `Dimensions: ${queryEmbedding.length}`);

      // 2. Recherche vectorielle dans LanceDB
      const results = await vectorStore.searchTextChunks(
        queryEmbedding,
        params.topK || 10,
        params.filters
      );

      logger.debug('rag', 'Text RAG search completed', `Found ${results.length} results`, {
        resultCount: results.length,
        topScore: results[0]?.score,
      });

      return results;
    } catch (error) {
      logger.error('rag', 'Text RAG search error', '', {
        error: error instanceof Error ? error.message : String(error),
        query: params.query.substring(0, 100),
      });
      return [];
    }
  }

  /**
   * Supprimer l'indexation d'un document
   */
  async deleteDocument(attachmentId: string): Promise<void> {
    try {
      logger.debug('rag', 'Deleting document index', `AttachmentId: ${attachmentId}`);
      await vectorStore.deleteByAttachmentId(attachmentId);
      logger.info('rag', 'Document index deleted', attachmentId);
    } catch (error) {
      logger.error('rag', 'Delete document error', `AttachmentId: ${attachmentId}`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Ré-indexer un document
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
      logger.error('rag', 'Reindex error', `AttachmentId: ${params.attachmentId}`, {
        error: error instanceof Error ? error.message : String(error),
      });
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
      logger.debug('rag', 'Getting chunks for document', `AttachmentId: ${attachmentId}`);

      // Utiliser getAllChunksByFilter pour récupérer tous les chunks sans recherche vectorielle
      const results = await vectorStore.getAllChunksByFilter(
        { attachmentIds: [attachmentId] },
        1000
      );

      logger.debug('rag', 'Chunks retrieval result', `Found ${results.length} chunks for document ${attachmentId}`, {
        count: results.length,
        attachmentId,
        firstChunk: results.length > 0 ? {
          chunkId: results[0].chunkId,
          attachmentId: results[0].attachmentId,
          textPreview: results[0].text.substring(0, 100),
        } : null
      });

      return results.sort((a, b) => a.metadata.chunkIndex - b.metadata.chunkIndex);
    } catch (error) {
      logger.error('rag', 'Error getting document chunks', `AttachmentId: ${attachmentId}`, {
        error: error instanceof Error ? error.message : String(error)
      });
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
   * Obtenir le backend actif
   */
  getActiveBackend(): string | null {
    return backendManager.getActiveBackendType();
  }

  /**
   * Basculer vers un backend spécifique
   */
  async switchBackend(backendType: 'mlx' | 'ollama-external' | 'ollama-embedded'): Promise<void> {
    await backendManager.switchBackend(backendType);
    logger.info('rag', 'Switched to backend', backendType);
  }
}

// Export singleton instance
export const textRAGServiceV2 = new TextRAGServiceV2();
