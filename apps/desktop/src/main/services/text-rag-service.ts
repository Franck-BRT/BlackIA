import axios from 'axios';
import { randomUUID } from 'crypto';
import http from 'http';
import https from 'https';
import { execSync } from 'child_process';
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
import { logger } from './log-service';

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
    logger.info('rag', 'TextRAGService initialized', `Ollama URL: ${ollamaBaseUrl}, Model: ${defaultModel}`, {
      ollamaBaseUrl,
      defaultModel
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

      logger.debug('rag', 'Embeddings generated', `Generated embeddings for ${chunkSchemas.length} chunks`, {
        chunkCount: chunkSchemas.length,
        firstChunkId: chunkSchemas[0]?.id,
        firstChunkAttachmentId: chunkSchemas[0]?.attachmentId
      });

      // 3. Stocker dans LanceDB
      logger.debug('rag', 'Inserting chunks into LanceDB', `Inserting ${chunkSchemas.length} chunks`);
      await vectorStore.indexTextChunks(chunkSchemas);
      logger.debug('rag', 'Chunks inserted into LanceDB', `Successfully inserted ${chunkSchemas.length} chunks`);

      const duration = Date.now() - startTime;
      const totalTokens = chunks.reduce((sum, chunk) => sum + estimateTokenCount(chunk.text), 0);

      logger.info('rag', 'Text RAG indexing completed', `Indexed ${chunks.length} chunks in ${duration}ms`, {
        chunkCount: chunks.length,
        totalTokens,
        duration,
        attachmentId: params.attachmentId
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
   * Générer un embedding via curl (fallback method quand axios échoue)
   * Utilise curl pour appeler l'API Ollama, ce qui peut mieux gérer les connexions
   */
  private generateEmbeddingViaCLI(text: string, model: string): number[] {
    try {
      logger.debug('rag', 'Generating embedding via curl', `Model: ${model}, calling Ollama API via curl`, {
        model,
        textLength: text.length,
        url: `${this.ollamaBaseUrl}/api/embeddings`
      });

      // Créer le payload JSON
      const payload = {
        model,
        prompt: text
      };

      // Échapper les guillemets dans le JSON
      const jsonPayload = JSON.stringify(JSON.stringify(payload));

      // Utiliser curl pour appeler l'API Ollama
      const command = `curl -s -X POST ${this.ollamaBaseUrl}/api/embeddings \
        -H "Content-Type: application/json" \
        -H "Connection: close" \
        -d ${jsonPayload} \
        --max-time 120`;

      const output = execSync(command, {
        encoding: 'utf-8',
        timeout: 120000, // 2 minutes timeout
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });

      // Parse la réponse JSON
      const response = JSON.parse(output.trim());

      if (!response.embedding || !Array.isArray(response.embedding)) {
        throw new Error(`Invalid response from Ollama: ${output.substring(0, 200)}`);
      }

      logger.debug('rag', 'curl embedding generated successfully', `Got ${response.embedding.length} dimensions`, {
        dimensions: response.embedding.length,
        model
      });

      return response.embedding;
    } catch (error) {
      logger.error('rag', 'curl embedding generation failed', `Model: ${model}`, {
        error: error instanceof Error ? error.message : String(error),
        model
      });
      throw new Error(`Failed to generate embedding via curl: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Générer un embedding via Ollama
   */
  private async generateEmbedding(text: string, model: string): Promise<number[]> {
    try {
      const url = `${this.ollamaBaseUrl}/api/embeddings`;
      logger.debug('rag', 'Generating embedding', `Model: ${model}, URL: ${url}`, {
        model,
        ollamaUrl: this.ollamaBaseUrl,
        textLength: text.length
      });

      const response = await axios.post<OllamaEmbeddingsResponse>(
        url,
        {
          model,
          prompt: text,
        },
        {
          timeout: 120000, // 2 minutes timeout (first load can be slow)
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Connection': 'close', // Force close connection (fix Ollama keep-alive bug)
          },
          // Disable HTTP keep-alive to prevent connection reuse issues with Ollama
          httpAgent: new http.Agent({ keepAlive: false }),
          httpsAgent: new https.Agent({ keepAlive: false }),
        }
      );

      logger.debug('rag', 'Embedding generated successfully', `Got ${response.data.embedding?.length || 0} dimensions`, {
        dimensions: response.data.embedding?.length,
        model
      });

      if (!response.data.embedding) {
        throw new Error('No embedding returned from Ollama');
      }

      return response.data.embedding;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          logger.error('rag', 'Cannot connect to Ollama', 'Connection refused', {
            url: this.ollamaBaseUrl,
            error: error.message
          });
          throw new Error(
            'Cannot connect to Ollama. Make sure Ollama is running (http://localhost:11434)'
          );
        }
        if (error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
          logger.error('rag', 'Ollama connection timeout', `Code: ${error.code}`, {
            code: error.code,
            message: error.message
          });
          throw new Error(`Ollama connection error: ${error.code}`);
        }
        if (error.response?.status === 404) {
          logger.error('rag', 'Ollama model not found', `Model: ${model}`, {
            model,
            status: 404
          });
          throw new Error(
            `Model "${model}" not found. Run: ollama pull ${model}`
          );
        }
        if (error.response?.status === 500) {
          const errorMsg = error.response?.data?.error || 'Internal server error';

          // Check if it's the EOF error - use curl fallback
          if (errorMsg.includes('EOF') && errorMsg.includes('embedding')) {
            logger.warning('rag', 'Ollama HTTP API failed with EOF error, trying curl fallback', errorMsg);
            try {
              return this.generateEmbeddingViaCLI(text, model);
            } catch (curlError) {
              logger.error('rag', 'Both HTTP API and curl fallback failed', 'All methods exhausted', {
                httpError: errorMsg,
                curlError: curlError instanceof Error ? curlError.message : String(curlError)
              });
              throw new Error(`Failed to generate embedding: HTTP API and curl both failed`);
            }
          }

          logger.error('rag', 'Ollama server error 500', errorMsg, {
            status: 500,
            errorMessage: errorMsg,
            responseData: error.response?.data,
            requestUrl: error.config?.url,
            requestData: error.config?.data,
          });
          throw new Error(
            `Ollama server error (500): ${errorMsg}. This usually means the model is not properly loaded or incompatible.`
          );
        }
        // Log détaillé pour autres erreurs HTTP
        logger.error('rag', 'Ollama HTTP error', `Status: ${error.response?.status}`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url,
          method: error.config?.method,
        });
      } else {
        logger.error('rag', 'Embedding generation error', 'Non-HTTP error', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
      }
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
      logger.debug('rag', 'Getting chunks for document', `AttachmentId: ${attachmentId}`);

      // Recherche avec un vecteur normalisé (on veut juste récupérer tous les chunks)
      // Note: LanceDB ne supporte pas de "get all by filter", on doit passer par search
      // Important: On ne peut pas utiliser un vecteur de zéros car la similarité cosinus
      // divise par la magnitude, ce qui causerait une division par zéro
      const dummyVector = new Array(768).fill(1.0 / Math.sqrt(768)); // Vecteur unitaire normalisé

      const results = await vectorStore.searchTextChunks(dummyVector, 1000, {
        attachmentIds: [attachmentId],
      });

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
   * Mettre à jour l'URL Ollama (pour settings)
   */
  setOllamaUrl(url: string): void {
    const oldUrl = this.ollamaBaseUrl;
    this.ollamaBaseUrl = url;
    logger.info('rag', 'Ollama URL updated', `Changed from ${oldUrl} to ${url}`, {
      oldUrl,
      newUrl: url
    });
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
