/**
 * IPC Handlers for Chunk Editor
 * Expose chunk editing operations (split, merge, edit, delete) to renderer process
 */

import { ipcMain } from 'electron';
import { chunkEditorService } from '../services/chunk-editor-service';
import { logger } from '../services/log-service';

/**
 * Register all chunk editor-related IPC handlers
 */
export function registerChunkEditorHandlers() {
  // Get document chunks
  ipcMain.handle('chunk-editor:getDocumentChunks', async (_, documentId: string) => {
    try {
      logger.debug('rag', 'IPC getDocumentChunks called', `DocumentId: ${documentId}`);
      const chunks = await chunkEditorService.getDocumentChunks(documentId);
      logger.debug('rag', 'IPC getDocumentChunks result', `Returned ${chunks.length} chunks for document ${documentId}`, {
        documentId,
        chunkCount: chunks.length,
        firstChunk: chunks.length > 0 ? {
          id: chunks[0].id,
          documentId: chunks[0].documentId,
          textPreview: chunks[0].text.substring(0, 50)
        } : null
      });
      return { success: true, data: chunks };
    } catch (error) {
      logger.error('rag', 'IPC getDocumentChunks error', `DocumentId: ${documentId}`, {
        documentId,
        error: error instanceof Error ? error.message : String(error)
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get chunk by ID
  ipcMain.handle('chunk-editor:getChunkById', async (_, chunkId: string, documentId: string) => {
    try {
      const chunk = await chunkEditorService.getChunkById(chunkId, documentId);
      return { success: true, data: chunk };
    } catch (error) {
      console.error('[IPC] chunk-editor:getChunkById error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Edit chunk
  ipcMain.handle(
    'chunk-editor:editChunk',
    async (
      _,
      params: {
        chunkId: string;
        documentId: string;
        modifiedText: string;
        reason: string;
        modifiedBy?: string;
      }
    ) => {
      try {
        const result = await chunkEditorService.editChunk(params);
        return { success: result.success, data: result };
      } catch (error) {
        console.error('[IPC] chunk-editor:editChunk error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Split chunk
  ipcMain.handle(
    'chunk-editor:splitChunk',
    async (
      _,
      params: {
        chunkId: string;
        documentId: string;
        splitPosition: number;
      }
    ) => {
      try {
        const result = await chunkEditorService.splitChunk(params);
        return { success: result.success, data: result };
      } catch (error) {
        console.error('[IPC] chunk-editor:splitChunk error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Merge chunks
  ipcMain.handle(
    'chunk-editor:mergeChunks',
    async (
      _,
      params: {
        chunk1Id: string;
        chunk2Id: string;
        documentId: string;
      }
    ) => {
      try {
        const result = await chunkEditorService.mergeChunks(params);
        return { success: result.success, data: result };
      } catch (error) {
        console.error('[IPC] chunk-editor:mergeChunks error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Delete chunk
  ipcMain.handle(
    'chunk-editor:deleteChunk',
    async (
      _,
      params: {
        chunkId: string;
        documentId: string;
        reason?: string;
      }
    ) => {
      try {
        const result = await chunkEditorService.deleteChunk(params);
        return { success: result.success, data: result };
      } catch (error) {
        console.error('[IPC] chunk-editor:deleteChunk error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Insert chunk
  ipcMain.handle(
    'chunk-editor:insertChunk',
    async (
      _,
      params: {
        documentId: string;
        afterChunkId: string;
        text: string;
        reason?: string;
      }
    ) => {
      try {
        const result = await chunkEditorService.insertChunk(params);
        return { success: result.success, data: result };
      } catch (error) {
        console.error('[IPC] chunk-editor:insertChunk error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get chunks for text selection
  ipcMain.handle(
    'chunk-editor:getChunksForTextSelection',
    async (
      _,
      params: {
        documentId: string;
        startOffset: number;
        endOffset: number;
      }
    ) => {
      try {
        const chunks = await chunkEditorService.getChunksForTextSelection(params);
        return { success: true, data: chunks };
      } catch (error) {
        console.error('[IPC] chunk-editor:getChunksForTextSelection error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get text position for chunk
  ipcMain.handle('chunk-editor:getTextPositionForChunk', async (_, chunkId: string, documentId: string) => {
    try {
      const position = await chunkEditorService.getTextPositionForChunk(chunkId, documentId);
      return { success: true, data: position };
    } catch (error) {
      console.error('[IPC] chunk-editor:getTextPositionForChunk error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  logger.info('rag', 'Chunk editor handlers registered', 'All IPC handlers for chunk editor are ready');
}
