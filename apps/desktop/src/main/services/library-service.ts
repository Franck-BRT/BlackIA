/**
 * Library Service
 * Gestion des bibliothèques de documents
 */

import { randomUUID } from 'crypto';
import path from 'path';
import { app } from 'electron';
import fs from 'fs/promises';
import { getDatabase } from '../database/client';
import { libraries, libraryDocuments, type Library, type NewLibrary } from '../database/schema';
import { eq, desc, and, like, sql } from 'drizzle-orm';

/**
 * Configuration RAG par défaut
 */
const DEFAULT_RAG_CONFIG = {
  defaultMode: 'auto',
  text: {
    enabled: true,
    model: 'nomic-embed-text',
    chunkSize: 512,
    chunkOverlap: 10,
    separator: 'paragraph',
  },
  vision: {
    enabled: true,
    model: 'qwen2-vl-2b',
    resolution: 'medium',
    patchSize: 14,
  },
  hybrid: {
    enabled: true,
    fusionStrategy: 'rrf',
    textWeight: 0.5,
    visionWeight: 0.5,
    rrfConstant: 60,
  },
  autoIndex: true,
};

export interface CreateLibraryInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  ragConfig?: Record<string, unknown>;
  storagePath?: string;
  allowedTags?: string[];
}

export interface UpdateLibraryInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  ragConfig?: Record<string, unknown>;
  storagePath?: string;
  allowedTags?: string[];
  isFavorite?: boolean;
}

export interface LibraryStats {
  totalDocuments: number;
  documentsByType: Record<string, number>;
  documentsByStatus: Record<string, number>;
  indexedTextCount: number;
  indexedVisionCount: number;
  indexedHybridCount: number;
  notIndexedCount: number;
  totalChunks: number;
  averageChunksPerDocument: number;
  totalPatches: number;
  averagePatchesPerDocument: number;
  totalSize: number;
  averageDocumentSize: number;
  averageIndexingTime: number;
}

export class LibraryService {
  private defaultStoragePath: string;

  constructor() {
    // Dossier par défaut pour les bibliothèques
    this.defaultStoragePath = path.join(app.getPath('userData'), 'libraries');
    this.ensureStorageDirectory();
  }

  /**
   * S'assurer que le dossier de stockage existe
   */
  private async ensureStorageDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.defaultStoragePath, { recursive: true });
    } catch (error) {
      console.error('[LibraryService] Failed to create storage directory:', error);
    }
  }

  /**
   * Créer une nouvelle bibliothèque
   */
  async create(input: CreateLibraryInput): Promise<Library> {
    const db = getDatabase();
    const id = randomUUID();
    const now = new Date();

    // Storage path: soit custom, soit default/{slug}
    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const storagePath = input.storagePath || path.join(this.defaultStoragePath, slug);

    // Créer le dossier de stockage
    await fs.mkdir(storagePath, { recursive: true });

    // RAG config: merge avec default
    const ragConfig = {
      ...DEFAULT_RAG_CONFIG,
      ...(input.ragConfig || {}),
    };

    const newLibrary: NewLibrary = {
      id,
      name: input.name,
      description: input.description || '',
      color: input.color || 'blue',
      icon: input.icon || '📚',
      ragConfig: JSON.stringify(ragConfig),
      storagePath,
      documentCount: 0,
      totalSize: 0,
      totalChunks: 0,
      totalPatches: 0,
      allowedTags: JSON.stringify(input.allowedTags || []),
      isFavorite: false,
      createdAt: now,
      updatedAt: now,
    };

    const [library] = await db.insert(libraries).values(newLibrary).returning();

    console.log('[LibraryService] Library created:', { id, name: input.name });

    return library;
  }

  /**
   * Obtenir toutes les bibliothèques
   */
  async getAll(): Promise<Library[]> {
    const db = getDatabase();
    const result = await db
      .select()
      .from(libraries)
      .orderBy(desc(libraries.updatedAt));

    return result;
  }

  /**
   * Obtenir une bibliothèque par ID
   */
  async getById(id: string): Promise<Library | null> {
    const db = getDatabase();
    const [library] = await db
      .select()
      .from(libraries)
      .where(eq(libraries.id, id))
      .limit(1);

    return library || null;
  }

  /**
   * Rechercher des bibliothèques par nom
   */
  async search(query: string): Promise<Library[]> {
    const db = getDatabase();
    const result = await db
      .select()
      .from(libraries)
      .where(like(libraries.name, `%${query}%`))
      .orderBy(desc(libraries.updatedAt));

    return result;
  }

  /**
   * Mettre à jour une bibliothèque
   */
  async update(id: string, input: UpdateLibraryInput): Promise<Library> {
    const db = getDatabase();
    const now = new Date();

    // Préparer les updates
    const updates: Partial<NewLibrary> = {
      updatedAt: now,
    };

    if (input.name !== undefined) updates.name = input.name;
    if (input.description !== undefined) updates.description = input.description;
    if (input.color !== undefined) updates.color = input.color;
    if (input.icon !== undefined) updates.icon = input.icon;
    if (input.isFavorite !== undefined) updates.isFavorite = input.isFavorite;

    if (input.ragConfig !== undefined) {
      // Merge avec config existante
      const existing = await this.getById(id);
      if (existing) {
        const currentConfig = JSON.parse(existing.ragConfig);
        const mergedConfig = {
          ...currentConfig,
          ...input.ragConfig,
        };
        updates.ragConfig = JSON.stringify(mergedConfig);
      }
    }

    if (input.allowedTags !== undefined) {
      updates.allowedTags = JSON.stringify(input.allowedTags);
    }

    if (input.storagePath !== undefined) {
      // Créer le nouveau dossier
      await fs.mkdir(input.storagePath, { recursive: true });
      updates.storagePath = input.storagePath;
      // TODO: Option pour migrer les fichiers existants ?
    }

    const [library] = await db
      .update(libraries)
      .set(updates)
      .where(eq(libraries.id, id))
      .returning();

    console.log('[LibraryService] Library updated:', { id, updates });

    return library;
  }

  /**
   * Supprimer une bibliothèque
   */
  async delete(id: string, deleteFiles: boolean = false): Promise<void> {
    const db = getDatabase();
    const library = await this.getById(id);
    if (!library) {
      throw new Error(`Library not found: ${id}`);
    }

    // Supprimer de la DB (cascade vers library_documents et manual_chunks)
    await db.delete(libraries).where(eq(libraries.id, id));

    // Supprimer les fichiers physiques si demandé
    if (deleteFiles && library.storagePath) {
      try {
        await fs.rm(library.storagePath, { recursive: true, force: true });
        console.log('[LibraryService] Files deleted:', library.storagePath);
      } catch (error) {
        console.error('[LibraryService] Failed to delete files:', error);
      }
    }

    console.log('[LibraryService] Library deleted:', { id, deleteFiles });
  }

  /**
   * Obtenir les statistiques d'une bibliothèque
   */
  async getStats(libraryId: string): Promise<LibraryStats> {
    const db = getDatabase();
    // Récupérer tous les documents de la bibliothèque
    const docs = await db
      .select()
      .from(libraryDocuments)
      .where(eq(libraryDocuments.libraryId, libraryId));

    if (docs.length === 0) {
      return {
        totalDocuments: 0,
        documentsByType: {},
        documentsByStatus: {},
        indexedTextCount: 0,
        indexedVisionCount: 0,
        indexedHybridCount: 0,
        notIndexedCount: 0,
        totalChunks: 0,
        averageChunksPerDocument: 0,
        totalPatches: 0,
        averagePatchesPerDocument: 0,
        totalSize: 0,
        averageDocumentSize: 0,
        averageIndexingTime: 0,
      };
    }

    // Calculer les stats
    const documentsByType: Record<string, number> = {};
    const documentsByStatus: Record<string, number> = {};
    let indexedTextCount = 0;
    let indexedVisionCount = 0;
    let indexedHybridCount = 0;
    let notIndexedCount = 0;
    let totalChunks = 0;
    let totalPatches = 0;
    let totalSize = 0;
    let totalIndexingTime = 0;
    let indexedDocsCount = 0;

    for (const doc of docs) {
      // Par type
      documentsByType[doc.mimeType] = (documentsByType[doc.mimeType] || 0) + 1;

      // Par status
      documentsByStatus[doc.validationStatus] = (documentsByStatus[doc.validationStatus] || 0) + 1;

      // Indexation
      if (doc.ragMode === 'text' && doc.isIndexedText) indexedTextCount++;
      else if (doc.ragMode === 'vision' && doc.isIndexedVision) indexedVisionCount++;
      else if (doc.ragMode === 'hybrid' && doc.isIndexedText && doc.isIndexedVision) indexedHybridCount++;
      else notIndexedCount++;

      // Chunks & patches
      totalChunks += doc.textChunkCount;
      totalPatches += doc.visionPatchCount;

      // Size
      totalSize += doc.size;

      // Indexing time
      if (doc.indexingDuration) {
        totalIndexingTime += doc.indexingDuration;
        indexedDocsCount++;
      }
    }

    return {
      totalDocuments: docs.length,
      documentsByType,
      documentsByStatus,
      indexedTextCount,
      indexedVisionCount,
      indexedHybridCount,
      notIndexedCount,
      totalChunks,
      averageChunksPerDocument: docs.length > 0 ? totalChunks / docs.length : 0,
      totalPatches,
      averagePatchesPerDocument: docs.length > 0 ? totalPatches / docs.length : 0,
      totalSize,
      averageDocumentSize: docs.length > 0 ? totalSize / docs.length : 0,
      averageIndexingTime: indexedDocsCount > 0 ? totalIndexingTime / indexedDocsCount : 0,
    };
  }

  /**
   * Mettre à jour les statistiques d'une bibliothèque (dénormalisé)
   */
  async updateStats(libraryId: string): Promise<void> {
    const db = getDatabase();
    const stats = await this.getStats(libraryId);

    await db
      .update(libraries)
      .set({
        documentCount: stats.totalDocuments,
        totalSize: stats.totalSize,
        totalChunks: stats.totalChunks,
        totalPatches: stats.totalPatches,
        updatedAt: new Date(),
      })
      .where(eq(libraries.id, libraryId));

    console.log('[LibraryService] Stats updated for library:', libraryId);
  }

  /**
   * Obtenir toutes les bibliothèques favorites
   */
  async getFavorites(): Promise<Library[]> {
    const db = getDatabase();
    const result = await db
      .select()
      .from(libraries)
      .where(eq(libraries.isFavorite, true))
      .orderBy(desc(libraries.updatedAt));

    return result;
  }

  /**
   * Vérifier si une bibliothèque existe
   */
  async exists(id: string): Promise<boolean> {
    const library = await this.getById(id);
    return library !== null;
  }

  /**
   * Obtenir le chemin de stockage par défaut
   */
  getDefaultStoragePath(): string {
    return this.defaultStoragePath;
  }

  /**
   * Générer un chemin de stockage unique pour une bibliothèque
   */
  generateStoragePath(name: string): string {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return path.join(this.defaultStoragePath, slug);
  }
}

// Export singleton instance
export const libraryService = new LibraryService();
