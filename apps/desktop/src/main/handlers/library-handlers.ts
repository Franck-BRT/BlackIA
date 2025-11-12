/**
 * IPC Handlers for Library Management
 * Expose library CRUD operations to renderer process
 */

import { ipcMain } from 'electron';
import { libraryService } from '../services/library-service';
import type { CreateLibraryInput, UpdateLibraryInput } from '../../renderer/src/types/library';

/**
 * Register all library-related IPC handlers
 */
export function registerLibraryHandlers() {
  // Create library
  ipcMain.handle('library:create', async (_, input: CreateLibraryInput) => {
    console.log('[IPC] library:create called with input:', input);
    try {
      const library = await libraryService.create(input);
      console.log('[IPC] library:create success:', library);
      return { success: true, data: library };
    } catch (error) {
      console.error('[IPC] library:create error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get all libraries
  ipcMain.handle('library:getAll', async () => {
    try {
      const libraries = await libraryService.getAll();
      return { success: true, data: libraries };
    } catch (error) {
      console.error('[IPC] library:getAll error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get library by ID
  ipcMain.handle('library:getById', async (_, id: string) => {
    try {
      const library = await libraryService.getById(id);
      return { success: true, data: library };
    } catch (error) {
      console.error('[IPC] library:getById error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Search libraries
  ipcMain.handle('library:search', async (_, query: string) => {
    try {
      const libraries = await libraryService.search(query);
      return { success: true, data: libraries };
    } catch (error) {
      console.error('[IPC] library:search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Update library
  ipcMain.handle('library:update', async (_, id: string, input: UpdateLibraryInput) => {
    try {
      const library = await libraryService.update(id, input);
      return { success: true, data: library };
    } catch (error) {
      console.error('[IPC] library:update error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Delete library
  ipcMain.handle('library:delete', async (_, id: string, deleteFiles: boolean = false) => {
    try {
      await libraryService.delete(id, deleteFiles);
      return { success: true };
    } catch (error) {
      console.error('[IPC] library:delete error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get library stats
  ipcMain.handle('library:getStats', async (_, libraryId: string) => {
    try {
      const stats = await libraryService.getStats(libraryId);
      return { success: true, data: stats };
    } catch (error) {
      console.error('[IPC] library:getStats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Update library stats
  ipcMain.handle('library:updateStats', async (_, libraryId: string) => {
    try {
      await libraryService.updateStats(libraryId);
      return { success: true };
    } catch (error) {
      console.error('[IPC] library:updateStats error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  // Get favorites
  ipcMain.handle('library:getFavorites', async () => {
    try {
      const libraries = await libraryService.getFavorites();
      return { success: true, data: libraries };
    } catch (error) {
      console.error('[IPC] library:getFavorites error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  console.log('[IPC] Library handlers registered');
}
