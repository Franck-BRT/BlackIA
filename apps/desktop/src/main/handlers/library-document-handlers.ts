/**
 * IPC Handlers for Library Documents
 * Expose document management and RAG indexation to renderer process
 */

import { ipcMain } from 'electron';
import { libraryDocumentService, type DocumentFilters, type IndexDocumentParams } from '../services/library-document-service';
import type { StoredRAGMode, RAGSearchParams } from '../types/rag';

/**
 * Register all library document-related IPC handlers
 */
export function registerLibraryDocumentHandlers() {
  // Add document to library
  ipcMain.handle(
    'library-document:add',
    async (
      _,
      params: {
        libraryId: string;
        filePath: string;
        originalName: string;
        mimeType: string;
        tags?: string[];
      }
    ) => {
      try {
        const document = await libraryDocumentService.addDocument(params);
        return { success: true, data: document };
      } catch (error) {
        console.error('[IPC] library-document:add error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Get documents from library
  ipcMain.handle('library-document:getDocuments', async (_, libraryId: string, filters?: DocumentFilters) => {
    try {
      const documents = await libraryDocumentService.getDocuments(libraryId, filters);
      return { success: true, data: documents };
    } catch (error) {
      console.error('[IPC] library-document:getDocuments error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get document by ID
  ipcMain.handle('library-document:getById', async (_, id: string) => {
    try {
      const document = await libraryDocumentService.getById(id);
      return { success: true, data: document };
    } catch (error) {
      console.error('[IPC] library-document:getById error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Update document
  ipcMain.handle(
    'library-document:update',
    async (
      _,
      id: string,
      updates: {
        originalName?: string;
        tags?: string[];
        ragMode?: StoredRAGMode;
        validationStatus?: 'pending' | 'validated' | 'needs_review' | 'rejected';
        validationNotes?: string;
        isFavorite?: boolean;
      }
    ) => {
      try {
        const document = await libraryDocumentService.update(id, updates);
        return { success: true, data: document };
      } catch (error) {
        console.error('[IPC] library-document:update error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }
  );

  // Delete document
  ipcMain.handle('library-document:delete', async (_, id: string) => {
    console.log('[IPC] library-document:delete - Starting deletion for:', id);
    try {
      await libraryDocumentService.delete(id);
      console.log('[IPC] library-document:delete - Successfully deleted:', id);
      return { success: true };
    } catch (error) {
      console.error('[IPC] library-document:delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Index document (RAG)
  ipcMain.handle('library-document:index', async (_, params: IndexDocumentParams) => {
    try {
      const result = await libraryDocumentService.indexDocument(params);
      return { success: true, data: result };
    } catch (error) {
      console.error('[IPC] library-document:index error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Delete index
  ipcMain.handle('library-document:deleteIndex', async (_, documentId: string) => {
    try {
      await libraryDocumentService.deleteIndex(documentId);
      return { success: true };
    } catch (error) {
      console.error('[IPC] library-document:deleteIndex error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get chunks
  ipcMain.handle('library-document:getChunks', async (_, documentId: string) => {
    try {
      const chunks = await libraryDocumentService.getChunks(documentId);
      return { success: true, data: chunks };
    } catch (error) {
      console.error('[IPC] library-document:getChunks error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Search in library
  ipcMain.handle('library-document:search', async (_, params: RAGSearchParams & { libraryId: string }) => {
    try {
      const results = await libraryDocumentService.searchInLibrary(params);
      return { success: true, data: results };
    } catch (error) {
      console.error('[IPC] library-document:search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  console.log('[IPC] Library document handlers registered');
}
