import { eq, and } from 'drizzle-orm';
import { getDatabase } from '../database/client';
import { attachments, type NewAttachment } from '../database/schema';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { app } from 'electron';
import type { EntityType, StoredRAGMode } from '../types/rag';
import { recommendRAGMode } from '../types/rag';
import { extractText } from './text-extraction-service';
import { generateThumbnail, getThumbnailFilename } from './thumbnail-service';

/**
 * Attachment with parsed JSON fields
 * DB stores tags/metadata as JSON strings, we parse them here
 */
export type AttachmentWithParsedFields = Omit<
  typeof attachments.$inferSelect,
  'tags' | 'extractedMetadata'
> & {
  tags: string[];
  extractedMetadata?: Record<string, unknown>;
};

/**
 * Attachment Service
 * Gère les fichiers attachés (upload, stockage, métadonnées, CRUD)
 *
 * Features:
 * - Upload de fichiers dans userData/attachments/
 * - Métadonnées SQLite via Drizzle
 * - Relation polymorphique (message, workflow, document, etc.)
 * - Tags manuels
 * - RAG mode recommandation
 */
export class AttachmentService {
  private attachmentsDir: string;

  constructor() {
    // Répertoire de stockage: userData/attachments/
    const userDataPath = app.getPath('userData');
    this.attachmentsDir = path.join(userDataPath, 'attachments');
  }

  /**
   * Initialiser le service (créer les répertoires)
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.attachmentsDir, { recursive: true });
      console.log('[AttachmentService] Initialized. Storage:', this.attachmentsDir);
    } catch (error) {
      console.error('[AttachmentService] Initialization error:', error);
      throw error;
    }
  }

  /**
   * Upload un fichier et créer l'attachment
   */
  async upload(params: {
    filePath: string; // Chemin temporaire du fichier
    originalName: string;
    mimeType: string;
    entityType: EntityType;
    entityId: string;
    tags?: string[];
    extractedText?: string;
  }): Promise<AttachmentWithParsedFields> {
    try {
      const db = getDatabase();
      const now = new Date();

      // 1. Générer un ID unique
      const id = randomUUID();

      // 2. Déterminer le chemin de destination
      const ext = path.extname(params.originalName);
      const filename = `${id}${ext}`;
      const destPath = path.join(this.attachmentsDir, filename);

      // 3. Copier le fichier
      await fs.copyFile(params.filePath, destPath);

      // 4. Obtenir la taille du fichier
      const stats = await fs.stat(destPath);
      const size = stats.size;

      // 5. Extraire le texte automatiquement (si applicable)
      let extractedText = params.extractedText;
      if (!extractedText) {
        try {
          const autoExtractedText = await extractText(destPath, params.mimeType);
          if (autoExtractedText) {
            extractedText = autoExtractedText;
            console.log('[AttachmentService] Text extracted:', {
              filename: params.originalName,
              textLength: autoExtractedText.length,
            });
          }
        } catch (error) {
          console.warn('[AttachmentService] Text extraction failed:', error);
          // Continue sans texte extrait
        }
      }

      // 6. Générer une vignette automatiquement (si applicable)
      let thumbnailPath: string | undefined = undefined;
      if (params.mimeType.startsWith('image/')) {
        try {
          const thumbFilename = getThumbnailFilename(filename);
          const thumbPath = path.join(this.attachmentsDir, thumbFilename);

          const success = await generateThumbnail(destPath, thumbPath, params.mimeType, {
            width: 300,
            height: 300,
            fit: 'inside',
            quality: 80,
          });

          if (success) {
            thumbnailPath = thumbPath;
            console.log('[AttachmentService] Thumbnail generated:', thumbFilename);
          }
        } catch (error) {
          console.warn('[AttachmentService] Thumbnail generation failed:', error);
          // Continue sans vignette
        }
      }

      // 7. Recommander le mode RAG
      const ragMode = recommendRAGMode(params.mimeType, extractedText);

      // 8. Créer l'entrée DB
      const newAttachment: NewAttachment = {
        id,
        filename,
        originalName: params.originalName,
        mimeType: params.mimeType,
        size,
        filePath: destPath,
        thumbnailPath,
        extractedText,
        extractedMetadata: undefined,
        entityType: params.entityType,
        entityId: params.entityId,
        tags: JSON.stringify(params.tags || []),
        ragMode,
        isIndexedText: false,
        textEmbeddingModel: undefined,
        textChunkCount: 0,
        isIndexedVision: false,
        visionEmbeddingModel: undefined,
        visionPatchCount: 0,
        pageCount: 0,
        lastIndexedAt: undefined,
        indexingDuration: undefined,
        indexingError: undefined,
        uploadedBy: undefined, // TODO: ajouter user context
        isAnalyzed: false,
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(attachments).values(newAttachment);

      console.log('[AttachmentService] Uploaded:', {
        id,
        originalName: params.originalName,
        size,
        ragMode,
      });

      // Return with parsed fields
      return {
        ...newAttachment,
        tags: params.tags || [],
        extractedMetadata: undefined,
      } as AttachmentWithParsedFields;
    } catch (error) {
      console.error('[AttachmentService] Upload error:', error);
      throw error;
    }
  }

  /**
   * Récupérer un attachment par ID
   */
  async getById(id: string): Promise<AttachmentWithParsedFields | null> {
    try {
      const db = getDatabase();
      const result = await db.select().from(attachments).where(eq(attachments.id, id)).limit(1);

      if (!result[0]) {
        return null;
      }

      // Parser les champs JSON
      const attachment = result[0];
      return {
        ...attachment,
        tags: JSON.parse(attachment.tags as string) as string[],
        extractedMetadata: attachment.extractedMetadata
          ? JSON.parse(attachment.extractedMetadata as string)
          : undefined,
      } as AttachmentWithParsedFields;
    } catch (error) {
      console.error('[AttachmentService] Get by ID error:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les attachments d'une entité
   */
  async getByEntity(entityType: EntityType, entityId: string): Promise<AttachmentWithParsedFields[]> {
    try {
      const db = getDatabase();
      const results = await db
        .select()
        .from(attachments)
        .where(and(eq(attachments.entityType, entityType), eq(attachments.entityId, entityId)))
        .orderBy(attachments.createdAt);

      // Parser les champs JSON
      return results.map((attachment) => ({
        ...attachment,
        tags: JSON.parse(attachment.tags as string) as string[],
        extractedMetadata: attachment.extractedMetadata
          ? JSON.parse(attachment.extractedMetadata as string)
          : undefined,
      })) as AttachmentWithParsedFields[];
    } catch (error) {
      console.error('[AttachmentService] Get by entity error:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les attachments
   */
  async getAll(): Promise<AttachmentWithParsedFields[]> {
    try {
      const db = getDatabase();
      const results = await db.select().from(attachments).orderBy(attachments.createdAt);

      // Parser les champs JSON
      return results.map((attachment) => ({
        ...attachment,
        tags: JSON.parse(attachment.tags as string) as string[],
        extractedMetadata: attachment.extractedMetadata
          ? JSON.parse(attachment.extractedMetadata as string)
          : undefined,
      })) as AttachmentWithParsedFields[];
    } catch (error) {
      console.error('[AttachmentService] Get all error:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un attachment
   */
  async update(
    id: string,
    updates: Partial<Omit<AttachmentWithParsedFields, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<AttachmentWithParsedFields> {
    try {
      const db = getDatabase();
      const now = new Date();

      // Convertir les champs JSON si nécessaire
      const updateData: any = {
        ...updates,
        updatedAt: now,
      };

      if (updates.tags) {
        updateData.tags = JSON.stringify(updates.tags);
      }

      if (updates.extractedMetadata) {
        updateData.extractedMetadata = JSON.stringify(updates.extractedMetadata);
      }

      await db.update(attachments).set(updateData).where(eq(attachments.id, id));

      const updated = await this.getById(id);
      if (!updated) {
        throw new Error(`Attachment not found: ${id}`);
      }

      console.log('[AttachmentService] Updated:', id);
      return updated;
    } catch (error) {
      console.error('[AttachmentService] Update error:', error);
      throw error;
    }
  }

  /**
   * Ajouter des tags à un attachment
   */
  async addTags(id: string, newTags: string[]): Promise<AttachmentWithParsedFields> {
    try {
      const attachment = await this.getById(id);
      if (!attachment) {
        throw new Error(`Attachment not found: ${id}`);
      }

      const currentTags = attachment.tags || [];
      const uniqueTags = Array.from(new Set([...currentTags, ...newTags]));

      return await this.update(id, { tags: uniqueTags });
    } catch (error) {
      console.error('[AttachmentService] Add tags error:', error);
      throw error;
    }
  }

  /**
   * Retirer des tags d'un attachment
   */
  async removeTags(id: string, tagsToRemove: string[]): Promise<AttachmentWithParsedFields> {
    try {
      const attachment = await this.getById(id);
      if (!attachment) {
        throw new Error(`Attachment not found: ${id}`);
      }

      const currentTags = attachment.tags || [];
      const filteredTags = currentTags.filter((tag) => !tagsToRemove.includes(tag));

      return await this.update(id, { tags: filteredTags });
    } catch (error) {
      console.error('[AttachmentService] Remove tags error:', error);
      throw error;
    }
  }

  /**
   * Supprimer un attachment (fichier + DB)
   */
  async delete(id: string): Promise<void> {
    try {
      const attachment = await this.getById(id);
      if (!attachment) {
        throw new Error(`Attachment not found: ${id}`);
      }

      const db = getDatabase();

      // 1. Supprimer le fichier
      try {
        await fs.unlink(attachment.filePath);
        console.log('[AttachmentService] Deleted file:', attachment.filePath);
      } catch (error) {
        console.warn('[AttachmentService] File deletion warning:', error);
        // Continue même si le fichier n'existe pas
      }

      // 2. Supprimer le thumbnail si existe
      if (attachment.thumbnailPath) {
        try {
          await fs.unlink(attachment.thumbnailPath);
        } catch (error) {
          console.warn('[AttachmentService] Thumbnail deletion warning:', error);
        }
      }

      // 3. Supprimer de la DB
      await db.delete(attachments).where(eq(attachments.id, id));

      console.log('[AttachmentService] Deleted attachment:', id);
    } catch (error) {
      console.error('[AttachmentService] Delete error:', error);
      throw error;
    }
  }

  /**
   * Rechercher des attachments par tags
   */
  async searchByTags(tags: string[]): Promise<AttachmentWithParsedFields[]> {
    try {
      const allAttachments = await this.getAll();

      // Filtrer par tags
      return allAttachments.filter((attachment) => {
        const attachmentTags = attachment.tags || [];
        return tags.some((tag) => attachmentTags.includes(tag));
      });
    } catch (error) {
      console.error('[AttachmentService] Search by tags error:', error);
      throw error;
    }
  }

  /**
   * Rechercher des attachments par nom
   */
  async searchByName(query: string): Promise<AttachmentWithParsedFields[]> {
    try {
      const allAttachments = await this.getAll();
      const lowerQuery = query.toLowerCase();

      return allAttachments.filter((attachment) =>
        attachment.originalName.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('[AttachmentService] Search by name error:', error);
      throw error;
    }
  }

  /**
   * Obtenir le chemin absolu d'un attachment
   */
  getFilePath(filename: string): string {
    return path.join(this.attachmentsDir, filename);
  }

  /**
   * Obtenir des statistiques
   */
  async getStats(): Promise<{
    totalCount: number;
    totalSize: number;
    byEntityType: Record<EntityType, number>;
    byMimeType: Record<string, number>;
    indexedText: number;
    indexedVision: number;
  }> {
    try {
      const allAttachments = await this.getAll();

      const stats = {
        totalCount: allAttachments.length,
        totalSize: allAttachments.reduce((sum, a) => sum + a.size, 0),
        byEntityType: {} as Record<EntityType, number>,
        byMimeType: {} as Record<string, number>,
        indexedText: allAttachments.filter((a) => a.isIndexedText).length,
        indexedVision: allAttachments.filter((a) => a.isIndexedVision).length,
      };

      // Compter par entity type
      allAttachments.forEach((a: AttachmentWithParsedFields) => {
        stats.byEntityType[a.entityType] = (stats.byEntityType[a.entityType] || 0) + 1;
        stats.byMimeType[a.mimeType] = (stats.byMimeType[a.mimeType] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('[AttachmentService] Get stats error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const attachmentService = new AttachmentService();
