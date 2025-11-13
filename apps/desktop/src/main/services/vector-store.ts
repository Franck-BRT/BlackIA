import path from 'path';
import { app } from 'electron';
import type {
  TextRAGChunkSchema,
  VisionRAGPatchSchema,
  RAGSearchFilters,
  TextRAGResult,
  VisionRAGResult,
  RAGStats,
  EntityType,
} from '../types/rag';
import { logger } from './log-service';

/**
 * LanceDB Vector Store Service
 * Gère les collections vectorielles pour TEXT RAG et VISION RAG
 *
 * Collections:
 * - text_rag_chunks: Embeddings textuels (768 dims via Ollama)
 * - vision_rag_patches: Embeddings visuels multi-vecteurs (1024x128 via MLX-VLM)
 */
export class VectorStoreService {
  private dbPath: string;
  private db: any = null; // LanceDB connection
  private textCollection: any = null;
  private visionCollection: any = null;

  private readonly TEXT_COLLECTION = 'text_rag_chunks';
  private readonly VISION_COLLECTION = 'vision_rag_patches';

  constructor() {
    // Store LanceDB in userData/lancedb/
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'lancedb');
  }

  /**
   * Initialise la connexion LanceDB et crée les collections si nécessaire
   */
  async initialize(): Promise<void> {
    try {
      // Dynamic import de vectordb (Node.js LanceDB client)
      // Vérifier si le module est disponible
      let lancedb: any;
      try {
        lancedb = await import('vectordb');
      } catch (importError) {
        console.warn('[VectorStore] ⚠️  vectordb module not installed. Install with: pnpm add vectordb apache-arrow');
        console.warn('[VectorStore] Vector store will not be available until dependencies are installed.');
        // Ne pas throw ici, permettre au service de démarrer sans vector store
        return;
      }

      // Connexion à la base
      this.db = await lancedb.connect(this.dbPath);
      console.log('[VectorStore] Connected to LanceDB at:', this.dbPath);

      // Créer ou ouvrir les collections
      await this.ensureCollections();

      console.log('[VectorStore] Initialized successfully');
    } catch (error) {
      console.error('[VectorStore] Initialization error:', error);
      console.warn('[VectorStore] Vector store will not be available. Error:', error);
      // Ne pas throw pour permettre au reste de l'app de fonctionner
    }
  }

  /**
   * S'assure que les collections existent
   */
  private async ensureCollections(): Promise<void> {
    const existingTables = await this.db.tableNames();

    // Collection TEXT RAG
    if (!existingTables.includes(this.TEXT_COLLECTION)) {
      console.log('[VectorStore] Creating text_rag_chunks collection...');
      // LanceDB créera la collection à la première insertion
      // On stocke juste la référence
    }

    // Collection VISION RAG
    if (!existingTables.includes(this.VISION_COLLECTION)) {
      console.log('[VectorStore] Creating vision_rag_patches collection...');
    }

    // Ouvrir les collections (lazy loading)
    try {
      this.textCollection = await this.db.openTable(this.TEXT_COLLECTION);
      console.log('[VectorStore] Opened text_rag_chunks collection');
    } catch {
      // Collection n'existe pas encore, sera créée à la première insertion
      this.textCollection = null;
    }

    try {
      this.visionCollection = await this.db.openTable(this.VISION_COLLECTION);
      console.log('[VectorStore] Opened vision_rag_patches collection');
    } catch {
      // Collection n'existe pas encore
      this.visionCollection = null;
    }
  }

  /**
   * TEXT RAG: Indexer des chunks de texte
   */
  async indexTextChunks(chunks: TextRAGChunkSchema[]): Promise<void> {
    if (!this.db) {
      throw new Error('VectorStore not initialized. Install dependencies: pnpm add vectordb apache-arrow');
    }

    try {
      logger.debug('rag', 'Indexing text chunks into LanceDB', `Inserting ${chunks.length} chunks`, {
        chunkCount: chunks.length,
        firstChunk: chunks[0] ? {
          id: chunks[0].id,
          attachmentId: chunks[0].attachmentId,
          chunkIndex: chunks[0].chunkIndex,
          textPreview: chunks[0].text.substring(0, 50)
        } : null
      });

      if (!this.textCollection) {
        // Première insertion - créer la collection
        this.textCollection = await this.db.createTable(this.TEXT_COLLECTION, chunks);
        logger.info('rag', 'LanceDB text collection created', `Created text_rag_chunks collection with ${chunks.length} chunks`, {
          collectionName: this.TEXT_COLLECTION,
          chunkCount: chunks.length
        });
      } else {
        // Ajouter à la collection existante
        await this.textCollection.add(chunks);
        logger.info('rag', 'LanceDB chunks added', `Added ${chunks.length} text chunks to existing collection`, {
          chunkCount: chunks.length
        });
      }
    } catch (error) {
      logger.error('rag', 'LanceDB indexing failed', 'Error indexing text chunks', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        chunkCount: chunks.length
      });
      throw error;
    }
  }

  /**
   * VISION RAG: Indexer des patches d'images
   */
  async indexVisionPatches(patches: VisionRAGPatchSchema[]): Promise<void> {
    if (!this.db) {
      throw new Error('VectorStore not initialized');
    }

    try {
      if (!this.visionCollection) {
        // Première insertion - créer la collection
        this.visionCollection = await this.db.createTable(this.VISION_COLLECTION, patches);
        console.log('[VectorStore] Created vision_rag_patches collection with', patches.length, 'patches');
      } else {
        // Ajouter à la collection existante
        await this.visionCollection.add(patches);
        console.log('[VectorStore] Added', patches.length, 'vision patches');
      }
    } catch (error) {
      console.error('[VectorStore] Error indexing vision patches:', error);
      throw error;
    }
  }

  /**
   * TEXT RAG: Récupérer tous les chunks par filtre (sans recherche vectorielle)
   * Utilisé pour récupérer tous les chunks d'un document sans faire de recherche sémantique
   */
  async getAllChunksByFilter(
    filters: RAGSearchFilters,
    limit: number = 1000
  ): Promise<TextRAGResult[]> {
    if (!this.textCollection) {
      logger.warning('rag', 'No text collection available', 'Text collection not initialized');
      return [];
    }

    try {
      logger.debug('rag', 'LanceDB getAllChunksByFilter starting', `Filters: ${JSON.stringify(filters)}`, {
        limit,
        filters
      });

      // Construire la clause WHERE
      const whereClauses: string[] = [];

      if (filters.entityType) {
        whereClauses.push(`"entityType" = '${filters.entityType}'`);
      }
      if (filters.entityId) {
        whereClauses.push(`"entityId" = '${filters.entityId}'`);
      }
      if (filters.attachmentIds && filters.attachmentIds.length > 0) {
        const attachmentFilter = filters.attachmentIds
          .map((id) => `'${id}'`)
          .join(', ');
        whereClauses.push(`"attachmentId" IN (${attachmentFilter})`);
      }

      if (whereClauses.length === 0) {
        logger.warning('rag', 'No filters provided for getAllChunksByFilter', 'This could return all chunks');
      }

      const whereClause = whereClauses.join(' AND ');
      logger.debug('rag', 'Applying LanceDB WHERE clause', whereClause, {
        whereClause,
        filters
      });

      // LanceDB 0.4.x: Pour récupérer tous les chunks sans recherche vectorielle,
      // on utilise limit() directement sur la collection, puis on applique le filtre WHERE
      let query = this.textCollection.limit(limit);

      if (whereClause) {
        query = query.where(whereClause);
      }

      const results = await query.execute();

      logger.debug('rag', 'LanceDB query completed', `Returned ${results.length} results`, {
        resultCount: results.length
      });

      // Transformer en TextRAGResult
      return results.map((row: any) => {
        const metadata = typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata;

        return {
          chunkId: row.id,
          attachmentId: row.attachmentId,
          text: row.text,
          score: 1.0, // Pas de score de similarité puisque ce n'est pas une recherche
          vector: row.vector,
          metadata: {
            originalName: metadata.originalName || '',
            entityType: row.entityType as EntityType,
            chunkIndex: row.chunkIndex,
            page: metadata.page,
            lineStart: metadata.lineStart,
            lineEnd: metadata.lineEnd,
          },
        };
      });
    } catch (error) {
      logger.error('rag', 'Error in getAllChunksByFilter', '', {
        error: error instanceof Error ? error.message : String(error),
        filters
      });
      throw error;
    }
  }

  /**
   * TEXT RAG: Recherche vectorielle
   */
  async searchTextChunks(
    queryEmbedding: number[],
    topK: number = 10,
    filters?: RAGSearchFilters
  ): Promise<TextRAGResult[]> {
    if (!this.textCollection) {
      logger.warning('rag', 'No text collection available', 'Text collection not initialized');
      return [];
    }

    try {
      logger.debug('rag', 'LanceDB text search starting', `Filters: ${JSON.stringify(filters)}`, {
        topK,
        filters
      });

      // Recherche vectorielle avec LanceDB
      let query = this.textCollection
        .search(queryEmbedding)
        .limit(topK)
        .metricType('cosine'); // Cosine similarity

      // Appliquer les filtres
      // Note: LanceDB est sensible à la casse, les noms de colonnes doivent être entre guillemets doubles
      if (filters) {
        if (filters.entityType) {
          query = query.where(`"entityType" = '${filters.entityType}'`);
        }
        if (filters.entityId) {
          query = query.where(`"entityId" = '${filters.entityId}'`);
        }
        if (filters.attachmentIds && filters.attachmentIds.length > 0) {
          const attachmentFilter = filters.attachmentIds
            .map((id) => `'${id}'`)
            .join(', ');
          const whereClause = `"attachmentId" IN (${attachmentFilter})`;
          logger.debug('rag', 'Applying LanceDB WHERE clause', whereClause, {
            attachmentIds: filters.attachmentIds,
            whereClause
          });
          query = query.where(whereClause);
        }
      }

      logger.debug('rag', 'Executing LanceDB query', 'Query built, executing search');
      const results = await query.execute();
      logger.debug('rag', 'LanceDB query completed', `Returned ${results.length} results`, {
        resultCount: results.length
      });

      // Transformer en TextRAGResult
      return results.map((row: any) => {
        const metadata = typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata;

        return {
          chunkId: row.id,
          attachmentId: row.attachmentId,
          text: row.text,
          score: row._distance ? 1 - row._distance : 0, // Convert distance to similarity
          vector: row.vector,
          metadata: {
            originalName: metadata.originalName || '',
            entityType: row.entityType as EntityType,
            chunkIndex: row.chunkIndex,
            page: metadata.page,
            lineStart: metadata.lineStart,
            lineEnd: metadata.lineEnd,
          },
        };
      });
    } catch (error) {
      console.error('[VectorStore] Error searching text chunks:', error);
      throw error;
    }
  }

  /**
   * VISION RAG: Recherche avec late interaction (MaxSim) pour Colette/ColPali
   * Implémente le MaxSim proprement : pour chaque document, on calcule max(sim) pour chaque
   * token de la query, puis on somme les max pour obtenir le score final
   */
  async searchVisionPatchesWithMaxSim(
    queryEmbedding: number[][], // [query_patches, dims]
    topK: number = 10,
    filters?: RAGSearchFilters
  ): Promise<VisionRAGResult[]> {
    if (!this.visionCollection) {
      console.warn('[VectorStore] No vision collection available');
      return [];
    }

    try {
      console.log('[VectorStore] MaxSim search with query shape:', [
        queryEmbedding.length,
        queryEmbedding[0]?.length || 0,
      ]);

      // 1. Récupérer tous les candidats (on pourrait optimiser avec un pre-filtering)
      let query = this.visionCollection.limit(1000); // Limit to avoid memory issues

      // Appliquer les filtres
      // Note: LanceDB est sensible à la casse, les noms de colonnes doivent être entre guillemets doubles
      if (filters) {
        if (filters.entityType) {
          query = query.where(`"entityType" = '${filters.entityType}'`);
        }
        if (filters.entityId) {
          query = query.where(`"entityId" = '${filters.entityId}'`);
        }
        if (filters.attachmentIds && filters.attachmentIds.length > 0) {
          const attachmentFilter = filters.attachmentIds
            .map((id) => `'${id}'`)
            .join(', ');
          query = query.where(`"attachmentId" IN (${attachmentFilter})`);
        }
      }

      const candidates = await query.execute();

      console.log('[VectorStore] Found', candidates.length, 'candidates for MaxSim');

      // 2. Calculer MaxSim pour chaque document
      const scoredResults = candidates.map((row: any) => {
        const patchVectors = typeof row.patchVectors === 'string'
          ? JSON.parse(row.patchVectors)
          : row.patchVectors;

        // Calculer MaxSim
        const maxSimScore = this.computeMaxSim(queryEmbedding, patchVectors);

        const metadata = typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata;

        return {
          patchId: row.id,
          attachmentId: row.attachmentId,
          pageIndex: row.pageIndex,
          patchIndex: 0,
          score: maxSimScore,
          patchVectors,
          metadata: {
            originalName: metadata.originalName || '',
            entityType: row.entityType as EntityType,
            pageNumber: row.pageIndex + 1,
            imageBase64: row.imageBase64,
          },
        };
      });

      // 3. Trier par score décroissant et prendre top K
      scoredResults.sort((a: VisionRAGResult, b: VisionRAGResult) => b.score - a.score);
      const topResults = scoredResults.slice(0, topK);

      console.log('[VectorStore] MaxSim top scores:', topResults.slice(0, 3).map((r: VisionRAGResult) => r.score));

      return topResults;
    } catch (error) {
      console.error('[VectorStore] Error in MaxSim search:', error);
      throw error;
    }
  }

  /**
   * Calculer le MaxSim score entre query patches et document patches
   * MaxSim(Q, D) = Σ_i max_j cos_sim(q_i, d_j)
   */
  private computeMaxSim(queryPatches: number[][], docPatches: number[][]): number {
    if (!queryPatches.length || !docPatches.length) {
      return 0;
    }

    let totalScore = 0;

    // Pour chaque patch de la query
    for (const qPatch of queryPatches) {
      let maxSim = -Infinity;

      // Trouver le max de similarité avec tous les patches du document
      for (const dPatch of docPatches) {
        const sim = this.cosineSimilarity(qPatch, dPatch);
        maxSim = Math.max(maxSim, sim);
      }

      // Sommer les max
      totalScore += maxSim;
    }

    return totalScore;
  }

  /**
   * Calculer la similarité cosinus entre deux vecteurs
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      console.warn('[VectorStore] Vector length mismatch in cosine similarity');
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * VISION RAG: Recherche avec late interaction (MaxSim)
   * NOTE: Le MaxSim sera calculé côté Python, ici on fait une recherche ANN classique
   */
  async searchVisionPatches(
    queryEmbedding: number[],
    topK: number = 10,
    filters?: RAGSearchFilters
  ): Promise<VisionRAGResult[]> {
    if (!this.visionCollection) {
      console.warn('[VectorStore] No vision collection available');
      return [];
    }

    try {
      // Note: Pour ColPali/late interaction, la vraie recherche MaxSim se fait en Python
      // Ici on récupère les candidats pour le re-ranking
      let query = this.visionCollection
        .search(queryEmbedding)
        .limit(topK * 5) // Récupérer plus de candidats pour le re-ranking
        .metricType('cosine');

      // Appliquer les filtres
      // Note: LanceDB est sensible à la casse, les noms de colonnes doivent être entre guillemets doubles
      if (filters) {
        if (filters.entityType) {
          query = query.where(`"entityType" = '${filters.entityType}'`);
        }
        if (filters.entityId) {
          query = query.where(`"entityId" = '${filters.entityId}'`);
        }
        if (filters.attachmentIds && filters.attachmentIds.length > 0) {
          const attachmentFilter = filters.attachmentIds
            .map((id) => `'${id}'`)
            .join(', ');
          query = query.where(`"attachmentId" IN (${attachmentFilter})`);
        }
      }

      const results = await query.execute();

      // Transformer en VisionRAGResult
      return results.slice(0, topK).map((row: any) => {
        const metadata = typeof row.metadata === 'string'
          ? JSON.parse(row.metadata)
          : row.metadata;

        const patchVectors = typeof row.patchVectors === 'string'
          ? JSON.parse(row.patchVectors)
          : row.patchVectors;

        return {
          patchId: row.id,
          attachmentId: row.attachmentId,
          pageIndex: row.pageIndex,
          patchIndex: 0, // TODO: extraire du metadata
          score: row._distance ? 1 - row._distance : 0,
          patchVectors,
          metadata: {
            originalName: metadata.originalName || '',
            entityType: row.entityType as EntityType,
            pageNumber: row.pageIndex + 1,
            imageBase64: row.imageBase64,
          },
        };
      });
    } catch (error) {
      console.error('[VectorStore] Error searching vision patches:', error);
      throw error;
    }
  }

  /**
   * Supprimer tous les chunks/patches d'un attachment
   */
  async deleteByAttachmentId(attachmentId: string): Promise<void> {
    let textDeleted = false;
    let visionDeleted = false;

    // Supprimer des text chunks
    if (this.textCollection) {
      try {
        await this.textCollection.delete(`attachmentId = '${attachmentId}'`);
        console.log('[VectorStore] Deleted text chunks for attachment:', attachmentId);
        textDeleted = true;
      } catch (error) {
        console.warn('[VectorStore] Could not delete text chunks (may not exist):', error);
      }
    }

    // Supprimer des vision patches
    if (this.visionCollection) {
      try {
        await this.visionCollection.delete(`attachmentId = '${attachmentId}'`);
        console.log('[VectorStore] Deleted vision patches for attachment:', attachmentId);
        visionDeleted = true;
      } catch (error) {
        console.warn('[VectorStore] Could not delete vision patches (may not exist):', error);
      }
    }

    // Log le résultat
    if (textDeleted || visionDeleted) {
      console.log('[VectorStore] Successfully deleted vectors for attachment:', attachmentId);
    } else {
      console.log('[VectorStore] No vectors found for attachment (may not have been indexed):', attachmentId);
    }
  }

  /**
   * Supprimer tous les chunks/patches d'une entité
   */
  async deleteByEntityId(entityType: EntityType, entityId: string): Promise<void> {
    try {
      const filter = `entityType = '${entityType}' AND entityId = '${entityId}'`;

      if (this.textCollection) {
        await this.textCollection.delete(filter);
        console.log('[VectorStore] Deleted text chunks for entity:', entityType, entityId);
      }

      if (this.visionCollection) {
        await this.visionCollection.delete(filter);
        console.log('[VectorStore] Deleted vision patches for entity:', entityType, entityId);
      }
    } catch (error) {
      console.error('[VectorStore] Error deleting by entity ID:', error);
      throw error;
    }
  }

  /**
   * Compacter les collections (optimisation)
   */
  async compact(): Promise<void> {
    try {
      if (this.textCollection) {
        await this.textCollection.optimize();
        console.log('[VectorStore] Compacted text collection');
      }

      if (this.visionCollection) {
        await this.visionCollection.optimize();
        console.log('[VectorStore] Compacted vision collection');
      }
    } catch (error) {
      console.error('[VectorStore] Error compacting:', error);
      throw error;
    }
  }

  /**
   * Obtenir des statistiques
   */
  async getStats(): Promise<{
    textChunkCount: number;
    visionPatchCount: number;
    textStorageSize: number;
    visionStorageSize: number;
  }> {
    try {
      let textChunkCount = 0;
      let visionPatchCount = 0;

      if (this.textCollection) {
        textChunkCount = await this.textCollection.countRows();
      }

      if (this.visionCollection) {
        visionPatchCount = await this.visionCollection.countRows();
      }

      // LanceDB ne fournit pas directement la taille, on estime
      const textStorageSize = textChunkCount * 768 * 4; // 768 dims * 4 bytes
      const visionStorageSize = visionPatchCount * 1024 * 128 * 4; // 1024 patches * 128 dims * 4 bytes

      return {
        textChunkCount,
        visionPatchCount,
        textStorageSize,
        visionStorageSize,
      };
    } catch (error) {
      console.error('[VectorStore] Error getting stats:', error);
      return {
        textChunkCount: 0,
        visionPatchCount: 0,
        textStorageSize: 0,
        visionStorageSize: 0,
      };
    }
  }

  /**
   * Nettoyer les orphelins (chunks/patches sans attachment correspondant)
   */
  async cleanOrphans(validAttachmentIds: string[]): Promise<number> {
    let deletedCount = 0;

    try {
      // Créer un filtre NOT IN avec les IDs valides
      const validIdsFilter = validAttachmentIds.map((id) => `'${id}'`).join(', ');
      const orphanFilter = `attachmentId NOT IN (${validIdsFilter})`;

      if (this.textCollection) {
        const beforeCount = await this.textCollection.countRows();
        await this.textCollection.delete(orphanFilter);
        const afterCount = await this.textCollection.countRows();
        deletedCount += beforeCount - afterCount;
      }

      if (this.visionCollection) {
        const beforeCount = await this.visionCollection.countRows();
        await this.visionCollection.delete(orphanFilter);
        const afterCount = await this.visionCollection.countRows();
        deletedCount += beforeCount - afterCount;
      }

      console.log('[VectorStore] Cleaned', deletedCount, 'orphan entries');
      return deletedCount;
    } catch (error) {
      console.error('[VectorStore] Error cleaning orphans:', error);
      throw error;
    }
  }

  /**
   * Fermer la connexion
   */
  async close(): Promise<void> {
    // LanceDB ne nécessite pas de fermeture explicite
    this.db = null;
    this.textCollection = null;
    this.visionCollection = null;
    console.log('[VectorStore] Closed connection');
  }
}

// Export singleton instance
export const vectorStore = new VectorStoreService();
