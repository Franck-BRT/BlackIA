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
      if (!this.textCollection) {
        // Première insertion - créer la collection
        this.textCollection = await this.db.createTable(this.TEXT_COLLECTION, chunks);
        console.log('[VectorStore] Created text_rag_chunks collection with', chunks.length, 'chunks');
      } else {
        // Ajouter à la collection existante
        await this.textCollection.add(chunks);
        console.log('[VectorStore] Added', chunks.length, 'text chunks');
      }
    } catch (error) {
      console.error('[VectorStore] Error indexing text chunks:', error);
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
   * TEXT RAG: Recherche vectorielle
   */
  async searchTextChunks(
    queryEmbedding: number[],
    topK: number = 10,
    filters?: RAGSearchFilters
  ): Promise<TextRAGResult[]> {
    if (!this.textCollection) {
      console.warn('[VectorStore] No text collection available');
      return [];
    }

    try {
      // Recherche vectorielle avec LanceDB
      let query = this.textCollection
        .search(queryEmbedding)
        .limit(topK)
        .metricType('cosine'); // Cosine similarity

      // Appliquer les filtres
      if (filters) {
        if (filters.entityType) {
          query = query.where(`entityType = '${filters.entityType}'`);
        }
        if (filters.entityId) {
          query = query.where(`entityId = '${filters.entityId}'`);
        }
        if (filters.attachmentIds && filters.attachmentIds.length > 0) {
          const attachmentFilter = filters.attachmentIds
            .map((id) => `'${id}'`)
            .join(', ');
          query = query.where(`attachmentId IN (${attachmentFilter})`);
        }
      }

      const results = await query.execute();

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
      if (filters) {
        if (filters.entityType) {
          query = query.where(`entityType = '${filters.entityType}'`);
        }
        if (filters.entityId) {
          query = query.where(`entityId = '${filters.entityId}'`);
        }
        if (filters.attachmentIds && filters.attachmentIds.length > 0) {
          const attachmentFilter = filters.attachmentIds
            .map((id) => `'${id}'`)
            .join(', ');
          query = query.where(`attachmentId IN (${attachmentFilter})`);
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
    try {
      // Supprimer des text chunks
      if (this.textCollection) {
        await this.textCollection.delete(`attachmentId = '${attachmentId}'`);
        console.log('[VectorStore] Deleted text chunks for attachment:', attachmentId);
      }

      // Supprimer des vision patches
      if (this.visionCollection) {
        await this.visionCollection.delete(`attachmentId = '${attachmentId}'`);
        console.log('[VectorStore] Deleted vision patches for attachment:', attachmentId);
      }
    } catch (error) {
      console.error('[VectorStore] Error deleting by attachment ID:', error);
      throw error;
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
