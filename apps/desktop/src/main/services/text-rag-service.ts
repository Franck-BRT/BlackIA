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
import { MLXBackend } from './backends/mlx/mlx-backend';

/**
 * Text RAG Service avec MLX
 * Utilise MLX (Apple Silicon) pour les embeddings
 *
 * Avantages:
 * - 10-15x plus rapide qu'Ollama
 * - Pas de problèmes EOF
 * - Natif Apple Silicon
 * - Gestion automatique du cache de modèles
 *
 * Configuration:
 * - Modèle configurable (défaut: all-mpnet-base-v2, 768-dim)
 * - Python path auto-détecté
 * - Chunking personnalisable
 */
export class TextRAGService {
  private mlxBackend: MLXBackend | null = null;
  private defaultModel: string;
  private pythonPath: string;
  private isInitialized = false;

  constructor(
    mlxConfig: {
      model?: string;
      pythonPath?: string;
    } = {}
  ) {
    // Use all-mpnet-base-v2 (768-dim) to match LanceDB schema (was configured for nomic-embed-text)
    this.defaultModel = mlxConfig.model || 'sentence-transformers/all-mpnet-base-v2';
    this.pythonPath = mlxConfig.pythonPath || 'python3';

    logger.info('rag', 'TextRAGService initialized', `Model: ${this.defaultModel}`, {
      defaultModel: this.defaultModel,
      pythonPath: this.pythonPath
    });
  }

  /**
   * Initialise le backend MLX
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.info('rag', 'Initializing MLX backend', '');

      this.mlxBackend = new MLXBackend(this.pythonPath);

      const available = await this.mlxBackend.isAvailable();
      if (!available) {
        throw new Error('MLX backend not available. Install: pip3 install sentence-transformers torch');
      }

      await this.mlxBackend.initialize();
      this.isInitialized = true;

      logger.info('rag', 'MLX backend initialized successfully', 'Ready for embeddings');
    } catch (error) {
      logger.error('rag', 'MLX backend initialization failed', '', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Vérifie si le service est prêt
   */
  async isReady(): Promise<boolean> {
    if (!this.mlxBackend || !this.isInitialized) {
      return false;
    }

    try {
      const status = await this.mlxBackend.getStatus();
      return status.available && status.initialized;
    } catch {
      return false;
    }
  }

  /**
   * Génère un embedding avec MLX
   */
  private async generateEmbedding(text: string, model?: string): Promise<number[]> {
    if (!this.mlxBackend || !this.isInitialized) {
      await this.initialize();
    }

    const embeddingModel = model || this.defaultModel;

    logger.debug('rag', 'Generating embedding via MLX', `Model: ${embeddingModel}`, {
      model: embeddingModel,
      textLength: text.length
    });

    try {
      const response = await this.mlxBackend!.generateEmbedding({
        text,
        model: embeddingModel
      });

      if (Array.isArray(response.embeddings[0])) {
        // Batch response - prendre le premier
        return response.embeddings[0] as number[];
      }

      return response.embeddings as number[];
    } catch (error) {
      logger.error('rag', 'MLX embedding generation failed', '', {
        error: error instanceof Error ? error.message : String(error),
        model: embeddingModel
      });
      throw new Error(`Failed to generate embedding with MLX: ${error instanceof Error ? error.message : String(error)}`);
    }
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
      // S'assurer que MLX est initialisé
      if (!this.isInitialized) {
        await this.initialize();
      }

      logger.debug('rag', 'Starting text RAG indexing', `AttachmentId: ${params.attachmentId}`, {
        attachmentId: params.attachmentId,
        textLength: params.text.length,
        model: params.model || this.defaultModel,
      });

      // 1. Chunking
      const chunkSize = params.chunkingOptions?.chunkSize || 512;
      const chunkOverlap = params.chunkingOptions?.chunkOverlap || chunkSize * 0.1;
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

      // 2. Générer embeddings pour chaque chunk avec MLX
      const model = params.model || this.defaultModel;
      const chunkSchemas: TextRAGChunkSchema[] = [];

      for (const chunk of chunks) {
        try {
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

          logger.debug('rag', `Chunk ${chunk.index + 1}/${chunks.length} indexed`, `Vector dims: ${embedding.length}`);
        } catch (error) {
          logger.error('rag', `Failed to index chunk ${chunk.index}`, '', {
            error: error instanceof Error ? error.message : String(error),
            chunkIndex: chunk.index
          });
          throw error;
        }
      }

      // 3. Indexer dans LanceDB
      logger.debug('rag', 'Indexing chunks into vector store', `Inserting ${chunkSchemas.length} chunks`);
      await vectorStore.indexTextChunks(chunkSchemas);

      const totalTokens = chunks.reduce((sum, chunk) => sum + estimateTokenCount(chunk.text), 0);
      const duration = Date.now() - startTime;

      logger.info('rag', 'Text RAG indexing completed', `Indexed ${chunks.length} chunks in ${duration}ms`, {
        chunkCount: chunks.length,
        totalTokens,
        duration,
        model
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
        stack: error instanceof Error ? error.stack : undefined
      });

      return {
        success: false,
        chunkCount: 0,
        totalTokens: 0,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Recherche sémantique dans les chunks
   */
  async searchChunks(params: RAGSearchParams): Promise<TextRAGResult[]> {
    try {
      // S'assurer que MLX est initialisé
      if (!this.isInitialized) {
        await this.initialize();
      }

      logger.debug('rag', 'Starting semantic search', `Query: ${params.query.substring(0, 50)}...`, {
        queryLength: params.query.length,
        topK: params.topK || 10
      });

      // 1. Générer embedding de la query avec MLX
      const queryEmbedding = await this.generateEmbedding(params.query, this.defaultModel);

      // 2. Recherche vectorielle dans LanceDB
      const results = await vectorStore.searchTextChunks(
        queryEmbedding,
        params.topK || 10,
        params.filters
      );

      logger.debug('rag', 'Semantic search completed', `Found ${results.length} results`, {
        resultCount: results.length
      });

      return results;
    } catch (error) {
      logger.error('rag', 'Semantic search failed', '', {
        error: error instanceof Error ? error.message : String(error),
        query: params.query.substring(0, 50)
      });
      throw error;
    }
  }

  /**
   * Récupérer tous les chunks d'un document (sans recherche sémantique)
   */
  async getDocumentChunks(attachmentId: string): Promise<TextRAGResult[]> {
    try {
      logger.debug('rag', 'Getting chunks for document', `AttachmentId: ${attachmentId}`);

      const results = await vectorStore.getAllChunksByFilter({
        attachmentIds: [attachmentId]
      });

      logger.debug('rag', 'Retrieved document chunks', `Found ${results.length} chunks`, {
        attachmentId,
        chunkCount: results.length
      });

      return results;
    } catch (error) {
      logger.error('rag', 'Error getting document chunks', `AttachmentId: ${attachmentId}`, {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Supprimer les chunks d'un attachment
   */
  async deleteAttachmentChunks(attachmentId: string): Promise<void> {
    try {
      logger.debug('rag', 'Deleting attachment chunks', `AttachmentId: ${attachmentId}`);
      await vectorStore.deleteByAttachmentId(attachmentId);
      logger.info('rag', 'Attachment chunks deleted', `AttachmentId: ${attachmentId}`);
    } catch (error) {
      logger.error('rag', 'Failed to delete attachment chunks', '', {
        attachmentId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Obtenir les modèles disponibles
   */
  async getAvailableModels(): Promise<string[]> {
    if (!this.mlxBackend || !this.isInitialized) {
      await this.initialize();
    }

    const models = await this.mlxBackend!.listModels();
    return models.map(m => m.name);
  }

  /**
   * Obtenir le statut du service
   */
  async getStatus(): Promise<{
    initialized: boolean;
    backend: string;
    model: string;
    available: boolean;
  }> {
    if (!this.mlxBackend) {
      return {
        initialized: false,
        backend: 'mlx',
        model: this.defaultModel,
        available: false
      };
    }

    const status = await this.mlxBackend.getStatus();

    return {
      initialized: this.isInitialized && status.initialized,
      backend: 'mlx',
      model: this.defaultModel,
      available: status.available
    };
  }

  /**
   * Fermer le service et libérer les ressources
   */
  async shutdown(): Promise<void> {
    if (this.mlxBackend) {
      await this.mlxBackend.shutdown();
      this.mlxBackend = null;
    }
    this.isInitialized = false;
    logger.info('rag', 'TextRAGService shutdown', 'MLX backend closed');
  }

  // ============================================================================
  // MÉTHODES DE COMPATIBILITÉ BACKWARD (pour les anciens handlers)
  // ============================================================================

  /**
   * Alias pour indexDocument (compatibilité backward)
   */
  async reindexDocument(params: TextRAGIndexParams): Promise<{
    success: boolean;
    chunkCount: number;
    totalTokens: number;
    error?: string;
  }> {
    // Supprimer les anciens chunks avant de réindexer
    try {
      await this.deleteAttachmentChunks(params.attachmentId);
    } catch (error) {
      logger.warning('rag', 'Could not delete old chunks', `AttachmentId: ${params.attachmentId}`);
    }

    return this.indexDocument(params);
  }

  /**
   * Alias pour deleteAttachmentChunks (compatibilité backward)
   */
  async deleteDocument(attachmentId: string): Promise<void> {
    return this.deleteAttachmentChunks(attachmentId);
  }

  /**
   * Alias pour searchChunks (compatibilité backward)
   */
  async search(params: RAGSearchParams): Promise<TextRAGResult[]> {
    return this.searchChunks(params);
  }

  /**
   * Estimer le nombre de chunks qui seront générés
   */
  estimateChunking(text: string, chunkSize: number = 512, chunkOverlap: number = 51): {
    estimatedChunks: number;
    totalTokens: number;
  } {
    const tokens = estimateTokenCount(text);
    const effectiveChunkSize = chunkSize - chunkOverlap;
    const estimatedChunks = Math.ceil(tokens / effectiveChunkSize);

    return {
      estimatedChunks: Math.max(1, estimatedChunks),
      totalTokens: tokens
    };
  }

  /**
   * Vérifier la disponibilité de MLX (remplace checkOllamaAvailability)
   */
  async checkOllamaAvailability(): Promise<{
    available: boolean;
    backend: string;
    message: string;
  }> {
    try {
      const status = await this.getStatus();
      return {
        available: status.available,
        backend: 'mlx',
        message: status.available
          ? `MLX backend ready with model ${status.model}`
          : 'MLX backend not available. Install: pip3 install sentence-transformers torch'
      };
    } catch (error) {
      return {
        available: false,
        backend: 'mlx',
        message: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Vérifier si un modèle est disponible
   */
  async isModelAvailable(modelName: string): Promise<boolean> {
    try {
      const models = await this.getAvailableModels();
      return models.includes(modelName) || models.some(m => m.includes(modelName));
    } catch {
      return false;
    }
  }

  /**
   * Définir l'URL Ollama (obsolète avec MLX, mais gardé pour compatibilité)
   */
  setOllamaUrl(url: string): void {
    logger.warning('rag', 'setOllamaUrl called but MLX backend is in use', 'This setting is ignored with MLX');
  }

  /**
   * Définir le modèle par défaut
   */
  setDefaultModel(model: string): void {
    this.defaultModel = model;
    logger.info('rag', 'Default model updated', `New model: ${model}`, {
      model
    });
  }
}

// Export singleton instance avec configuration par défaut
export const textRAGService = new TextRAGService();
