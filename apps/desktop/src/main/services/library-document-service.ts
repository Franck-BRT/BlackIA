/**
 * Library Document Service
 * Gestion des documents dans les bibliothèques avec indexation RAG
 */

import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { getDatabase } from '../database/client';
import {
  libraryDocuments,
  manualChunks,
  libraries,
  type LibraryDocument,
  type NewLibraryDocument,
  type NewManualChunk,
} from '../database/schema';
import { eq, and, desc, like, inArray, or } from 'drizzle-orm';
import { extractText } from './text-extraction-service';
import { generateThumbnail, getThumbnailFilename } from './thumbnail-service';
import { textRAGService } from './text-rag-service';
import { visionRAGService } from './vision-rag-service';
import { hybridRAGService } from './hybrid-rag-service';
import { coletteVisionRAGService } from './colette-vision-rag-service';
import { vectorStore } from './vector-store';
import { recommendRAGMode } from '../types/rag';
import type { EntityType, StoredRAGMode, TextRAGResult, RAGSearchParams } from '../types/rag';
import { libraryService } from './library-service';

/**
 * Document with parsed JSON fields
 */
export type DocumentWithParsedFields = Omit<LibraryDocument, 'tags' | 'extractedMetadata'> & {
  tags: string[];
  extractedMetadata?: Record<string, unknown>;
};

/**
 * Filtres pour la recherche de documents
 */
export interface DocumentFilters {
  libraryId?: string;
  tags?: string[];
  mimeTypes?: string[];
  ragMode?: StoredRAGMode[];
  validationStatus?: ('pending' | 'validated' | 'needs_review' | 'rejected')[];
  isIndexedText?: boolean;
  isIndexedVision?: boolean;
  search?: string; // Recherche dans le nom
}

/**
 * Paramètres d'indexation
 */
export interface IndexDocumentParams {
  documentId: string;
  mode?: 'text' | 'vision' | 'hybrid' | 'auto';
  chunkSize?: number;
  chunkOverlap?: number;
  forceReindex?: boolean;
}

/**
 * Résultat d'indexation
 */
export interface IndexResult {
  success: boolean;
  chunkCount: number;
  patchCount: number;
  duration: number; // ms
  error?: string;
}

export class LibraryDocumentService {
  /**
   * Ajouter un document à une bibliothèque
   */
  async addDocument(params: {
    libraryId: string;
    filePath: string; // Chemin temporaire du fichier
    originalName: string;
    mimeType: string;
    tags?: string[];
  }): Promise<DocumentWithParsedFields> {
    const db = getDatabase();
    const startTime = Date.now();

    try {
      // 1. Vérifier que la bibliothèque existe
      const library = await libraryService.getById(params.libraryId);
      if (!library) {
        throw new Error(`Library not found: ${params.libraryId}`);
      }

      // 2. Générer un ID unique
      const id = randomUUID();

      // 3. Déterminer le chemin de destination
      const ext = path.extname(params.originalName);
      const filename = `${id}${ext}`;
      const destPath = path.join(library.storagePath, filename);

      // 4. Copier le fichier
      await fs.copyFile(params.filePath, destPath);

      // 5. Obtenir la taille
      const stats = await fs.stat(destPath);
      const size = stats.size;

      // 6. Extraire le texte automatiquement
      let extractedText: string | undefined;
      try {
        const autoExtractedText = await extractText(destPath, params.mimeType);
        if (autoExtractedText) {
          extractedText = autoExtractedText;
          console.log('[LibraryDocumentService] Text extracted:', {
            filename: params.originalName,
            textLength: autoExtractedText.length,
          });
        }
      } catch (error) {
        console.warn('[LibraryDocumentService] Text extraction failed:', error);
      }

      // 7. Générer une vignette pour les images
      let thumbnailPath: string | undefined;
      if (params.mimeType.startsWith('image/')) {
        try {
          const thumbFilename = getThumbnailFilename(filename);
          const thumbPath = path.join(library.storagePath, thumbFilename);

          const success = await generateThumbnail(destPath, thumbPath, params.mimeType, {
            width: 300,
            height: 300,
            fit: 'inside',
            quality: 80,
          });

          if (success) {
            thumbnailPath = thumbPath;
            console.log('[LibraryDocumentService] Thumbnail generated:', thumbFilename);
          }
        } catch (error) {
          console.warn('[LibraryDocumentService] Thumbnail generation failed:', error);
        }
      }

      // 8. Recommander le mode RAG
      const ragMode = recommendRAGMode(params.mimeType, extractedText);

      // 9. Créer l'entrée DB
      const now = new Date();
      const newDocument: NewLibraryDocument = {
        id,
        libraryId: params.libraryId,
        filename,
        originalName: params.originalName,
        mimeType: params.mimeType,
        size,
        filePath: destPath,
        thumbnailPath,
        extractedText,
        extractedMetadata: undefined,
        tags: JSON.stringify(params.tags || []),
        ragMode,
        isIndexedText: false,
        textEmbeddingModel: undefined,
        textChunkCount: 0,
        isIndexedVision: false,
        visionEmbeddingModel: undefined,
        visionPatchCount: 0,
        pageCount: 0,
        validationStatus: 'pending',
        validatedBy: undefined,
        validatedAt: undefined,
        validationNotes: undefined,
        lastIndexedAt: undefined,
        indexingDuration: undefined,
        indexingError: undefined,
        uploadedBy: undefined,
        isAnalyzed: false,
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      };

      const [document] = await db.insert(libraryDocuments).values(newDocument).returning();

      // 10. Mettre à jour les stats de la bibliothèque
      await libraryService.updateStats(params.libraryId);

      // 11. Auto-indexer si configuré
      const ragConfig = JSON.parse(library.ragConfig);
      if (ragConfig.autoIndex && ragMode !== 'none') {
        // Indexer en arrière-plan (ne pas attendre)
        this.indexDocument({ documentId: id }).catch((error) => {
          console.error('[LibraryDocumentService] Auto-indexing failed:', error);
        });
      }

      const duration = Date.now() - startTime;
      console.log('[LibraryDocumentService] Document added:', {
        id,
        libraryId: params.libraryId,
        filename: params.originalName,
        ragMode,
        duration: `${duration}ms`,
      });

      return this.parseDocument(document);
    } catch (error) {
      console.error('[LibraryDocumentService] Add document error:', error);
      throw error;
    }
  }

  /**
   * Obtenir tous les documents d'une bibliothèque
   */
  async getDocuments(libraryId: string, filters?: DocumentFilters): Promise<DocumentWithParsedFields[]> {
    const db = getDatabase();
    try {
      let query = db.select().from(libraryDocuments).where(eq(libraryDocuments.libraryId, libraryId));

      // Appliquer les filtres
      const conditions = [eq(libraryDocuments.libraryId, libraryId)];

      if (filters) {
        if (filters.ragMode && filters.ragMode.length > 0) {
          conditions.push(inArray(libraryDocuments.ragMode, filters.ragMode));
        }
        if (filters.validationStatus && filters.validationStatus.length > 0) {
          conditions.push(inArray(libraryDocuments.validationStatus, filters.validationStatus));
        }
        if (filters.isIndexedText !== undefined) {
          conditions.push(eq(libraryDocuments.isIndexedText, filters.isIndexedText));
        }
        if (filters.isIndexedVision !== undefined) {
          conditions.push(eq(libraryDocuments.isIndexedVision, filters.isIndexedVision));
        }
        if (filters.search) {
          conditions.push(like(libraryDocuments.originalName, `%${filters.search}%`));
        }
      }

      const docs = await db
        .select()
        .from(libraryDocuments)
        .where(and(...conditions))
        .orderBy(desc(libraryDocuments.updatedAt));

      return docs.map(this.parseDocument);
    } catch (error) {
      console.error('[LibraryDocumentService] Get documents error:', error);
      throw error;
    }
  }

  /**
   * Obtenir un document par ID
   */
  async getById(id: string): Promise<DocumentWithParsedFields | null> {
    const db = getDatabase();
    const [doc] = await db.select().from(libraryDocuments).where(eq(libraryDocuments.id, id)).limit(1);

    return doc ? this.parseDocument(doc) : null;
  }

  /**
   * Mettre à jour un document
   */
  async update(
    id: string,
    updates: {
      originalName?: string;
      tags?: string[];
      ragMode?: StoredRAGMode;
      validationStatus?: 'pending' | 'validated' | 'needs_review' | 'rejected';
      validationNotes?: string;
      isFavorite?: boolean;
    }
  ): Promise<DocumentWithParsedFields> {
    const db = getDatabase();
    const now = new Date();
    const updateData: Partial<NewLibraryDocument> = {
      updatedAt: now,
    };

    if (updates.originalName !== undefined) updateData.originalName = updates.originalName;
    if (updates.ragMode !== undefined) updateData.ragMode = updates.ragMode;
    if (updates.validationStatus !== undefined) updateData.validationStatus = updates.validationStatus;
    if (updates.validationNotes !== undefined) updateData.validationNotes = updates.validationNotes;
    if (updates.isFavorite !== undefined) updateData.isFavorite = updates.isFavorite;
    if (updates.tags !== undefined) updateData.tags = JSON.stringify(updates.tags);

    if (updates.validationStatus === 'validated') {
      updateData.validatedAt = now;
      // TODO: add validatedBy from user context
    }

    const [doc] = await db.update(libraryDocuments).set(updateData).where(eq(libraryDocuments.id, id)).returning();

    console.log('[LibraryDocumentService] Document updated:', { id, updates });

    // Mettre à jour les stats de la bibliothèque
    const document = await this.getById(id);
    if (document) {
      await libraryService.updateStats(document.libraryId);
    }

    return this.parseDocument(doc);
  }

  /**
   * Supprimer un document
   */
  async delete(id: string): Promise<void> {
    const db = getDatabase();
    const doc = await this.getById(id);
    if (!doc) {
      throw new Error(`Document not found: ${id}`);
    }

    // 1. Supprimer les index RAG
    await this.deleteIndex(id);

    // 2. Supprimer les fichiers physiques
    try {
      await fs.unlink(doc.filePath);
      if (doc.thumbnailPath) {
        await fs.unlink(doc.thumbnailPath);
      }
    } catch (error) {
      console.warn('[LibraryDocumentService] Failed to delete files:', error);
    }

    // 3. Supprimer de la DB (cascade vers manual_chunks)
    await db.delete(libraryDocuments).where(eq(libraryDocuments.id, id));

    // 4. Mettre à jour les stats
    await libraryService.updateStats(doc.libraryId);

    console.log('[LibraryDocumentService] Document deleted:', { id });
  }

  /**
   * Indexer un document (TEXT, VISION, ou HYBRID)
   */
  async indexDocument(params: IndexDocumentParams): Promise<IndexResult> {
    const db = getDatabase();
    const startTime = Date.now();

    try {
      const doc = await this.getById(params.documentId);
      if (!doc) {
        throw new Error(`Document not found: ${params.documentId}`);
      }

      const library = await libraryService.getById(doc.libraryId);
      if (!library) {
        throw new Error(`Library not found: ${doc.libraryId}`);
      }

      // Obtenir la config RAG de la bibliothèque
      const ragConfig = JSON.parse(library.ragConfig);
      const mode = params.mode || doc.ragMode;

      let chunkCount = 0;
      let patchCount = 0;

      // Supprimer l'ancien index avant de réindexer
      console.log('[LibraryDocumentService] Deleting old index before reindexing document:', params.documentId);
      await this.deleteIndex(params.documentId);

      // TEXT RAG
      if (mode === 'text' || mode === 'hybrid') {
        if (!doc.extractedText || doc.extractedText.length === 0) {
          console.warn('[LibraryDocumentService] No text to index for document:', params.documentId);
        } else {
          console.log('[LibraryDocumentService] Indexing text with attachmentId:', doc.id);
          const textResult = await textRAGService.indexDocument({
            text: doc.extractedText,
            attachmentId: doc.id,
            entityType: 'document' as EntityType,
            entityId: doc.libraryId,
            model: ragConfig.text.model,
            chunkingOptions: {
              chunkSize: params.chunkSize || ragConfig.text.chunkSize,
              chunkOverlap: params.chunkOverlap || (ragConfig.text.chunkSize * ragConfig.text.chunkOverlap) / 100,
              separator: this.getSeparator(ragConfig.text.separator, ragConfig.text.customSeparator),
            },
          });

          if (textResult.success) {
            chunkCount = textResult.chunkCount;
            await db
              .update(libraryDocuments)
              .set({
                isIndexedText: true,
                textEmbeddingModel: ragConfig.text.model,
                textChunkCount: chunkCount,
              })
              .where(eq(libraryDocuments.id, doc.id));
          } else {
            throw new Error(textResult.error || 'Text indexing failed');
          }
        }
      }

      // VISION RAG with Colette
      if (mode === 'vision' || mode === 'hybrid') {
        const canIndexVision = this.canIndexVision(doc.mimeType);

        if (!canIndexVision) {
          console.warn('[LibraryDocumentService] Document type not supported for vision RAG:', doc.mimeType);
        } else {
          console.log('[LibraryDocumentService] Starting vision indexation with Colette...');

          const visionResult = await coletteVisionRAGService.indexDocument({
            imagePaths: [doc.filePath], // Colette handles PDF to image conversion internally
            attachmentId: doc.id,
            entityType: 'document' as EntityType,
            entityId: doc.libraryId,
            model: ragConfig.vision.model || 'vidore/colpali',
          });

          if (visionResult.success) {
            patchCount = visionResult.patchCount;
            await db
              .update(libraryDocuments)
              .set({
                isIndexedVision: true,
                visionEmbeddingModel: visionResult.model,
                visionPatchCount: patchCount,
                pageCount: visionResult.pageCount,
              })
              .where(eq(libraryDocuments.id, doc.id));

            console.log('[LibraryDocumentService] Vision indexation completed:', {
              patchCount,
              pageCount: visionResult.pageCount,
              model: visionResult.model,
            });
          } else {
            console.error('[LibraryDocumentService] Vision indexation failed:', visionResult.error);
            throw new Error(visionResult.error || 'Vision indexing failed');
          }
        }
      }

      // Mettre à jour les métadonnées d'indexation
      const duration = Date.now() - startTime;
      await db
        .update(libraryDocuments)
        .set({
          lastIndexedAt: new Date(),
          indexingDuration: duration,
          indexingError: undefined,
        })
        .where(eq(libraryDocuments.id, doc.id));

      // Mettre à jour les stats de la bibliothèque
      await libraryService.updateStats(doc.libraryId);

      console.log('[LibraryDocumentService] Document indexed:', {
        documentId: params.documentId,
        mode,
        chunkCount,
        patchCount,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        chunkCount,
        patchCount,
        duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Enregistrer l'erreur dans la DB
      await db
        .update(libraryDocuments)
        .set({
          indexingError: errorMessage,
          indexingDuration: duration,
        })
        .where(eq(libraryDocuments.id, params.documentId));

      console.error('[LibraryDocumentService] Indexing error:', error);

      return {
        success: false,
        chunkCount: 0,
        patchCount: 0,
        duration,
        error: errorMessage,
      };
    }
  }

  /**
   * Supprimer l'index d'un document
   */
  async deleteIndex(documentId: string): Promise<void> {
    const db = getDatabase();
    try {
      // Supprimer de LanceDB (ne pas bloquer si ça échoue)
      try {
        await vectorStore.deleteByAttachmentId(documentId);
        console.log('[LibraryDocumentService] Vector store index deleted for:', documentId);
      } catch (vectorError) {
        // Log mais ne pas bloquer la suppression si l'index n'existe pas
        console.warn('[LibraryDocumentService] Could not delete vector store index (may not exist):', vectorError);
      }

      // Réinitialiser les flags d'indexation
      await db
        .update(libraryDocuments)
        .set({
          isIndexedText: false,
          textChunkCount: 0,
          isIndexedVision: false,
          visionPatchCount: 0,
          lastIndexedAt: undefined,
          indexingError: undefined,
        })
        .where(eq(libraryDocuments.id, documentId));

      console.log('[LibraryDocumentService] Index metadata reset for document:', documentId);
    } catch (error) {
      console.error('[LibraryDocumentService] Delete index error:', error);
      // Ne pas relancer l'erreur pour permettre la suppression du document
      // même si l'index ne peut pas être supprimé
      console.warn('[LibraryDocumentService] Continuing with document deletion despite index error');
    }
  }

  /**
   * Obtenir les chunks d'un document
   */
  async getChunks(documentId: string): Promise<TextRAGResult[]> {
    try {
      const chunks = await textRAGService.getDocumentChunks(documentId);
      return chunks;
    } catch (error) {
      console.error('[LibraryDocumentService] Get chunks error:', error);
      return [];
    }
  }

  /**
   * Rechercher dans une bibliothèque
   */
  async searchInLibrary(params: RAGSearchParams & { libraryId: string }): Promise<any[]> {
    try {
      // Obtenir tous les documents de la bibliothèque
      const docs = await this.getDocuments(params.libraryId);
      const documentIds = docs.map((d) => d.id);

      // Rechercher dans les chunks
      const searchParams: RAGSearchParams = {
        ...params,
        filters: {
          ...params.filters,
          attachmentIds: documentIds,
        },
      };

      const result = await hybridRAGService.search(searchParams);

      return result.results;
    } catch (error) {
      console.error('[LibraryDocumentService] Search error:', error);
      return [];
    }
  }

  /**
   * Helpers
   */

  private parseDocument(doc: LibraryDocument): DocumentWithParsedFields {
    return {
      ...doc,
      tags: JSON.parse(doc.tags),
      extractedMetadata: doc.extractedMetadata ? JSON.parse(doc.extractedMetadata) : undefined,
    };
  }

  private getSeparator(type: string, custom?: string): string {
    switch (type) {
      case 'paragraph':
        return '\n\n';
      case 'sentence':
        return '. ';
      case 'line':
        return '\n';
      case 'custom':
        return custom || '\n\n';
      default:
        return '\n\n';
    }
  }

  /**
   * Check if a document can be indexed with vision RAG
   */
  private canIndexVision(mimeType: string): boolean {
    const supportedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    return supportedTypes.includes(mimeType);
  }
}

// Export singleton instance
export const libraryDocumentService = new LibraryDocumentService();
