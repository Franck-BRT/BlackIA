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
import { logger } from './log-service';

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
   * Upload un fichier depuis un Buffer (frontend)
   */
  async uploadFromBuffer(params: {
    fileName: string;
    buffer: Buffer;
    mimeType: string;
    entityType: EntityType;
    entityId: string;
    tags?: string[];
  }): Promise<AttachmentWithParsedFields> {
    try {
      logger.info('attachments', 'Upload from buffer started', undefined, {
        fileName: params.fileName,
        mimeType: params.mimeType,
        entityType: params.entityType,
        entityId: params.entityId,
        bufferSize: params.buffer.length,
      });

      // Vérifier que le répertoire existe
      await fs.mkdir(this.attachmentsDir, { recursive: true });

      const db = getDatabase();
      const now = new Date();

      // 1. Générer un ID unique
      const id = randomUUID();
      logger.info('attachments', 'Generated attachment ID', undefined, { id });

      // 2. Déterminer le chemin de destination
      const ext = path.extname(params.fileName);
      const filename = `${id}${ext}`;
      const destPath = path.join(this.attachmentsDir, filename);

      // 3. Écrire le buffer sur disque
      await fs.writeFile(destPath, params.buffer);
      logger.success('attachments', 'File written to disk', undefined, { destPath });

      // 4. Obtenir la taille du fichier
      const size = params.buffer.length;

      // 5. Extraire le texte automatiquement (si applicable)
      let extractedText: string | undefined = undefined;
      try {
        const autoExtractedText = await extractText(destPath, params.mimeType);
        if (autoExtractedText) {
          extractedText = autoExtractedText;
          logger.success('attachments', 'Text extracted from file', undefined, {
            filename: params.fileName,
            textLength: autoExtractedText.length,
          });
        } else {
          logger.info('attachments', 'No text extracted (not a text document)', undefined, {
            filename: params.fileName,
            mimeType: params.mimeType,
          });
        }
      } catch (error) {
        logger.warning('attachments', 'Text extraction failed', String(error), {
          filename: params.fileName,
        });
        // Continue sans texte extrait
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
          }
        } catch (error) {
          logger.warning('attachments', 'Thumbnail generation failed', String(error));
          // Continue sans vignette
        }
      }

      // 7. Recommander le mode RAG
      const ragMode = recommendRAGMode(params.mimeType, extractedText);
      logger.info('attachments', 'RAG mode determined', undefined, {
        ragMode,
        hasExtractedText: !!extractedText,
        textLength: extractedText?.length || 0,
      });

      // 8. Créer l'entrée DB
      const newAttachment: NewAttachment = {
        id,
        filename,
        originalName: params.fileName,
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
        uploadedBy: undefined,
        isAnalyzed: false,
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(attachments).values(newAttachment);

      logger.success('attachments', 'File uploaded successfully', undefined, {
        id,
        originalName: params.fileName,
        size,
        ragMode,
      });

      // 9. Index automatiquement pour RAG si du texte a été extrait
      if (extractedText && extractedText.length > 0 && (ragMode === 'text' || ragMode === 'hybrid')) {
        logger.info('attachments', 'Starting auto-indexing for RAG', undefined, {
          attachmentId: id,
          ragMode,
          textLength: extractedText.length,
        });

        // Import dynamique pour éviter les dépendances circulaires
        const { textRAGService } = await import('./text-rag-service');

        try {
          // MLX backend utilise automatiquement le modèle par défaut (sentence-transformers/all-MiniLM-L6-v2)
          // Pas besoin de vérifier la disponibilité du modèle, MLX est initialisé à la demande
          const indexResult = await textRAGService.indexDocument({
            attachmentId: id,
            text: extractedText,
            entityType: params.entityType,
            entityId: params.entityId,
            // model non spécifié = utilise le modèle par défaut du service
            chunkingOptions: {
              chunkSize: 500,
              chunkOverlap: 50,
              separator: '\n\n',
            },
          });

          if (indexResult.success) {
            logger.success('attachments', 'Auto-indexing completed successfully', undefined, {
              attachmentId: id,
              chunkCount: indexResult.chunkCount,
              totalTokens: indexResult.totalTokens,
            });

            // Mettre à jour le statut d'indexation dans la DB
            await db
              .update(attachments)
              .set({
                isIndexedText: true,
                textEmbeddingModel: 'sentence-transformers/all-MiniLM-L6-v2',
                textChunkCount: indexResult.chunkCount,
                lastIndexedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(attachments.id, id));

            // Mettre à jour l'objet de retour
            newAttachment.isIndexedText = true;
            newAttachment.textEmbeddingModel = 'sentence-transformers/all-MiniLM-L6-v2';
            newAttachment.textChunkCount = indexResult.chunkCount;
            newAttachment.lastIndexedAt = new Date();
          } else {
            const errorMsg = indexResult.error || 'Unknown error during indexing';
            logger.warning('attachments', 'Auto-indexing failed', errorMsg, {
              attachmentId: id,
            });

            // Si l'erreur concerne MLX, donner des instructions
            if (errorMsg.includes('not available') || errorMsg.includes('sentence-transformers')) {
              logger.warning('attachments', 'MLX backend issue detected', 'The MLX embeddings backend may not be properly configured', {
                suggestion: 'Run: bash apps/desktop/scripts/setup-mlx.sh',
                note: 'File content will still be available to the AI without RAG indexing',
              });
            }

            // Enregistrer l'erreur dans la DB
            await db
              .update(attachments)
              .set({
                indexingError: errorMsg,
                updatedAt: new Date(),
              })
              .where(eq(attachments.id, id));
          }
        } catch (indexError) {
          const errorMsg = indexError instanceof Error ? indexError.message : String(indexError);
          logger.error('attachments', 'Auto-indexing error', errorMsg, {
            attachmentId: id,
            note: 'File uploaded successfully but indexing failed. Content is still accessible without RAG.',
          });

          // Enregistrer l'erreur dans la DB
          await db
            .update(attachments)
            .set({
              indexingError: errorMsg,
              updatedAt: new Date(),
            })
            .where(eq(attachments.id, id));
        }
      } else {
        logger.info('attachments', 'Auto-indexing skipped', undefined, {
          attachmentId: id,
          reason: extractedText
            ? `RAG mode is '${ragMode}' (need 'text' or 'hybrid')`
            : 'No text extracted from file',
          ragMode,
          hasExtractedText: !!extractedText,
        });
      }

      // Return with parsed fields
      return {
        ...newAttachment,
        tags: params.tags || [],
        extractedMetadata: undefined,
      } as AttachmentWithParsedFields;
    } catch (error) {
      logger.error('attachments', 'Upload from buffer failed', String(error), {
        fileName: params.fileName,
        error: error instanceof Error ? error.message : String(error),
      });
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
   * Lire le contenu brut d'un fichier attaché
   */
  async readFile(id: string): Promise<{ success: boolean; buffer?: Buffer; mimeType?: string; error?: string }> {
    try {
      const attachment = await this.getById(id);
      if (!attachment) {
        return { success: false, error: 'Attachment not found' };
      }

      // Lire le fichier depuis le disque
      const buffer = await fs.readFile(attachment.filePath);

      return {
        success: true,
        buffer,
        mimeType: attachment.mimeType,
      };
    } catch (error) {
      console.error('[AttachmentService] ❌ Read file error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
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

  /**
   * Ouvrir un fichier avec l'application par défaut
   */
  async openFile(id: string): Promise<void> {
    try {
      const attachment = await this.getById(id);
      if (!attachment) {
        throw new Error(`Attachment ${id} not found`);
      }

      // Utiliser shell.openPath pour ouvrir le fichier
      const { shell } = require('electron');
      const result = await shell.openPath(attachment.filePath);

      if (result) {
        console.warn('[AttachmentService] Failed to open file:', result);
        throw new Error(`Failed to open file: ${result}`);
      }

      console.log('[AttachmentService] ✅ File opened:', attachment.originalName);
    } catch (error) {
      console.error('[AttachmentService] ❌ Open file error:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const attachmentService = new AttachmentService();
