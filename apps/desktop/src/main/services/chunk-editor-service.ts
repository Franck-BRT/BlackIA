/**
 * Chunk Editor Service
 * Gestion de l'édition des chunks RAG (split, merge, edit, delete)
 */

import { randomUUID } from 'crypto';
import { db } from '../database/client';
import { manualChunks, type NewManualChunk, type ManualChunk } from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { textRAGService } from './text-rag-service';
import { vectorStore } from './vector-store';
import { chunkText, estimateTokenCount, type TextChunk } from '../types/rag';

/**
 * Chunk avec informations complètes
 */
export interface FullChunk {
  id: string;
  documentId: string;
  text: string;
  chunkIndex: number;
  tokenCount: number;
  score?: number;
  vector?: number[];

  // Position dans le document
  position?: {
    startOffset: number;
    endOffset: number;
    page?: number;
    line?: number;
  };

  // Modification manuelle
  manualChunk?: ManualChunk;
  isModified: boolean;

  // Métadonnées
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/**
 * Résultat d'édition de chunk
 */
export interface EditChunkResult {
  success: boolean;
  chunk?: FullChunk;
  manualChunk?: ManualChunk;
  error?: string;
}

/**
 * Résultat de division de chunk
 */
export interface SplitChunkResult {
  success: boolean;
  chunks?: [FullChunk, FullChunk];
  error?: string;
}

/**
 * Résultat de fusion de chunks
 */
export interface MergeChunksResult {
  success: boolean;
  chunk?: FullChunk;
  error?: string;
}

export class ChunkEditorService {
  /**
   * Obtenir tous les chunks d'un document
   */
  async getDocumentChunks(documentId: string): Promise<FullChunk[]> {
    try {
      // 1. Récupérer les chunks de LanceDB via textRAGService
      const textChunks = await textRAGService.getDocumentChunks(documentId);

      // 2. Récupérer les chunks manuels de SQLite
      const manualChunksMap = new Map<string, ManualChunk>();
      const dbManualChunks = await db
        .select()
        .from(manualChunks)
        .where(eq(manualChunks.documentId, documentId));

      for (const mc of dbManualChunks) {
        manualChunksMap.set(mc.originalChunkId, mc);
      }

      // 3. Combiner les données
      const fullChunks: FullChunk[] = textChunks.map((tc) => {
        const manual = manualChunksMap.get(tc.chunkId);

        return {
          id: tc.chunkId,
          documentId: tc.attachmentId,
          text: manual ? manual.modifiedText : tc.text,
          chunkIndex: tc.metadata.chunkIndex,
          tokenCount: estimateTokenCount(tc.text),
          score: tc.score,
          vector: tc.vector,
          position: {
            startOffset: tc.metadata.lineStart || 0,
            endOffset: tc.metadata.lineEnd || 0,
            page: tc.metadata.page,
          },
          manualChunk: manual,
          isModified: !!manual,
          metadata: tc.metadata,
          createdAt: new Date(),
        };
      });

      return fullChunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
    } catch (error) {
      console.error('[ChunkEditorService] Get chunks error:', error);
      return [];
    }
  }

  /**
   * Obtenir un chunk par ID
   */
  async getChunkById(chunkId: string, documentId: string): Promise<FullChunk | null> {
    const chunks = await this.getDocumentChunks(documentId);
    return chunks.find((c) => c.id === chunkId) || null;
  }

  /**
   * Modifier le texte d'un chunk
   */
  async editChunk(params: {
    chunkId: string;
    documentId: string;
    modifiedText: string;
    reason: string;
    modifiedBy?: string;
  }): Promise<EditChunkResult> {
    try {
      const now = new Date();

      // 1. Vérifier si le chunk existe
      const chunk = await this.getChunkById(params.chunkId, params.documentId);
      if (!chunk) {
        return {
          success: false,
          error: `Chunk not found: ${params.chunkId}`,
        };
      }

      // 2. Créer ou mettre à jour le manual_chunk
      const existingManual = chunk.manualChunk;

      if (existingManual) {
        // Mettre à jour
        const [updated] = await db
          .update(manualChunks)
          .set({
            modifiedText: params.modifiedText,
            reason: params.reason,
            modifiedAt: now,
          })
          .where(eq(manualChunks.id, existingManual.id))
          .returning();

        console.log('[ChunkEditorService] Manual chunk updated:', { chunkId: params.chunkId });

        return {
          success: true,
          manualChunk: updated,
        };
      } else {
        // Créer
        const newManual: NewManualChunk = {
          id: randomUUID(),
          documentId: params.documentId,
          originalChunkId: params.chunkId,
          modifiedText: params.modifiedText,
          reason: params.reason,
          modifiedBy: params.modifiedBy || 'unknown',
          modifiedAt: now,
        };

        const [created] = await db.insert(manualChunks).values(newManual).returning();

        console.log('[ChunkEditorService] Manual chunk created:', { chunkId: params.chunkId });

        return {
          success: true,
          manualChunk: created,
        };
      }
    } catch (error) {
      console.error('[ChunkEditorService] Edit chunk error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Diviser un chunk en deux
   */
  async splitChunk(params: {
    chunkId: string;
    documentId: string;
    splitPosition: number; // Position de split (index de caractère)
  }): Promise<SplitChunkResult> {
    try {
      // 1. Récupérer le chunk original
      const chunk = await this.getChunkById(params.chunkId, params.documentId);
      if (!chunk) {
        return {
          success: false,
          error: `Chunk not found: ${params.chunkId}`,
        };
      }

      // 2. Diviser le texte
      const text = chunk.text;
      if (params.splitPosition <= 0 || params.splitPosition >= text.length) {
        return {
          success: false,
          error: `Invalid split position: ${params.splitPosition}`,
        };
      }

      const text1 = text.substring(0, params.splitPosition).trim();
      const text2 = text.substring(params.splitPosition).trim();

      if (text1.length === 0 || text2.length === 0) {
        return {
          success: false,
          error: 'Split would result in empty chunk',
        };
      }

      // 3. Créer deux manual chunks
      const now = new Date();

      const manual1: NewManualChunk = {
        id: randomUUID(),
        documentId: params.documentId,
        originalChunkId: params.chunkId,
        modifiedText: text1,
        reason: `Split chunk at position ${params.splitPosition} (part 1/2)`,
        modifiedBy: 'system',
        modifiedAt: now,
      };

      const manual2Id = randomUUID();
      const manual2: NewManualChunk = {
        id: manual2Id,
        documentId: params.documentId,
        originalChunkId: `${params.chunkId}-split-${manual2Id}`, // Générer un nouvel ID
        modifiedText: text2,
        reason: `Split chunk at position ${params.splitPosition} (part 2/2)`,
        modifiedBy: 'system',
        modifiedAt: now,
      };

      // 4. Insérer en DB
      await db.insert(manualChunks).values([manual1, manual2]);

      // Note: Pour un vrai split, il faudrait aussi :
      // - Créer un nouveau chunk dans LanceDB pour la partie 2
      // - Regénérer l'embedding pour les deux parties
      // - Mettre à jour les index
      // Pour l'instant, on se contente de créer deux manual chunks

      console.log('[ChunkEditorService] Chunk split:', {
        originalId: params.chunkId,
        splitPosition: params.splitPosition,
      });

      return {
        success: true,
        // TODO: retourner les deux nouveaux chunks
      };
    } catch (error) {
      console.error('[ChunkEditorService] Split chunk error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fusionner deux chunks consécutifs
   */
  async mergeChunks(params: {
    chunk1Id: string;
    chunk2Id: string;
    documentId: string;
  }): Promise<MergeChunksResult> {
    try {
      // 1. Récupérer les deux chunks
      const chunk1 = await this.getChunkById(params.chunk1Id, params.documentId);
      const chunk2 = await this.getChunkById(params.chunk2Id, params.documentId);

      if (!chunk1 || !chunk2) {
        return {
          success: false,
          error: 'One or both chunks not found',
        };
      }

      // 2. Vérifier qu'ils sont consécutifs
      if (Math.abs(chunk1.chunkIndex - chunk2.chunkIndex) !== 1) {
        return {
          success: false,
          error: 'Chunks are not consecutive',
        };
      }

      // 3. Fusionner les textes (dans l'ordre)
      const [first, second] = chunk1.chunkIndex < chunk2.chunkIndex ? [chunk1, chunk2] : [chunk2, chunk1];
      const mergedText = `${first.text} ${second.text}`;

      // 4. Créer un manual chunk pour le premier
      const now = new Date();
      const manual: NewManualChunk = {
        id: randomUUID(),
        documentId: params.documentId,
        originalChunkId: first.id,
        modifiedText: mergedText,
        reason: `Merged with chunk ${second.id}`,
        modifiedBy: 'system',
        modifiedAt: now,
      };

      await db.insert(manualChunks).values(manual);

      // 5. Marquer le deuxième chunk comme "supprimé" en créant un manual chunk vide
      const deleted: NewManualChunk = {
        id: randomUUID(),
        documentId: params.documentId,
        originalChunkId: second.id,
        modifiedText: '', // Texte vide = supprimé
        reason: `Merged into chunk ${first.id}`,
        modifiedBy: 'system',
        modifiedAt: now,
      };

      await db.insert(manualChunks).values(deleted);

      // Note: Pour un vrai merge, il faudrait aussi :
      // - Supprimer le chunk 2 de LanceDB
      // - Regénérer l'embedding pour le chunk fusionné
      // - Mettre à jour les index

      console.log('[ChunkEditorService] Chunks merged:', {
        chunk1Id: first.id,
        chunk2Id: second.id,
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error('[ChunkEditorService] Merge chunks error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Supprimer un chunk (marquer comme vide)
   */
  async deleteChunk(params: {
    chunkId: string;
    documentId: string;
    reason?: string;
  }): Promise<EditChunkResult> {
    try {
      const now = new Date();

      // Créer un manual chunk avec texte vide
      const manual: NewManualChunk = {
        id: randomUUID(),
        documentId: params.documentId,
        originalChunkId: params.chunkId,
        modifiedText: '',
        reason: params.reason || 'Chunk deleted',
        modifiedBy: 'system',
        modifiedAt: now,
      };

      const [created] = await db.insert(manualChunks).values(manual).returning();

      console.log('[ChunkEditorService] Chunk deleted:', { chunkId: params.chunkId });

      return {
        success: true,
        manualChunk: created,
      };
    } catch (error) {
      console.error('[ChunkEditorService] Delete chunk error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Insérer un nouveau chunk après un chunk existant
   */
  async insertChunk(params: {
    documentId: string;
    afterChunkId: string;
    text: string;
    reason?: string;
  }): Promise<EditChunkResult> {
    try {
      const now = new Date();
      const newChunkId = randomUUID();

      // Créer un manual chunk avec un nouvel ID
      const manual: NewManualChunk = {
        id: randomUUID(),
        documentId: params.documentId,
        originalChunkId: `new-${newChunkId}`,
        modifiedText: params.text,
        reason: params.reason || `Inserted after chunk ${params.afterChunkId}`,
        modifiedBy: 'system',
        modifiedAt: now,
      };

      const [created] = await db.insert(manualChunks).values(manual).returning();

      console.log('[ChunkEditorService] Chunk inserted:', {
        afterChunkId: params.afterChunkId,
        newChunkId,
      });

      return {
        success: true,
        manualChunk: created,
      };
    } catch (error) {
      console.error('[ChunkEditorService] Insert chunk error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Obtenir les chunks pour une sélection de texte dans le document source
   */
  async getChunksForTextSelection(params: {
    documentId: string;
    startOffset: number;
    endOffset: number;
  }): Promise<FullChunk[]> {
    try {
      const allChunks = await this.getDocumentChunks(params.documentId);

      // Filtrer les chunks qui intersectent avec la sélection
      const matchingChunks = allChunks.filter((chunk) => {
        if (!chunk.position) return false;

        const chunkStart = chunk.position.startOffset;
        const chunkEnd = chunk.position.endOffset;

        // Vérifier si les ranges se chevauchent
        return chunkStart <= params.endOffset && chunkEnd >= params.startOffset;
      });

      return matchingChunks;
    } catch (error) {
      console.error('[ChunkEditorService] Get chunks for selection error:', error);
      return [];
    }
  }

  /**
   * Obtenir la position dans le texte source d'un chunk
   */
  async getTextPositionForChunk(chunkId: string, documentId: string): Promise<{
    startOffset: number;
    endOffset: number;
  } | null> {
    try {
      const chunk = await this.getChunkById(chunkId, documentId);
      if (!chunk || !chunk.position) {
        return null;
      }

      return {
        startOffset: chunk.position.startOffset,
        endOffset: chunk.position.endOffset,
      };
    } catch (error) {
      console.error('[ChunkEditorService] Get text position error:', error);
      return null;
    }
  }

  /**
   * Régénérer un chunk avec de nouveaux paramètres
   */
  async regenerateChunk(params: {
    chunkId: string;
    documentId: string;
    newChunkSize?: number;
    newOverlap?: number;
  }): Promise<EditChunkResult> {
    try {
      // TODO: Implémenter la régénération de chunk
      // 1. Récupérer le texte original du document
      // 2. Re-chunker juste cette partie
      // 3. Regénérer l'embedding
      // 4. Mettre à jour LanceDB

      console.log('[ChunkEditorService] Regenerate chunk (not implemented):', params);

      return {
        success: false,
        error: 'Regenerate chunk not yet implemented',
      };
    } catch (error) {
      console.error('[ChunkEditorService] Regenerate chunk error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const chunkEditorService = new ChunkEditorService();
