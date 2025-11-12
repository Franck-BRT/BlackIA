/**
 * Hook for Library Management
 * Provides CRUD operations and state management for libraries
 */

import { useState, useEffect, useCallback } from 'react';
import type { Library, CreateLibraryInput, UpdateLibraryInput, LibraryStats } from '../types/library';

interface UseLibrariesReturn {
  libraries: Library[];
  loading: boolean;
  error: string | null;
  refreshLibraries: () => Promise<void>;
  createLibrary: (input: CreateLibraryInput) => Promise<Library | null>;
  updateLibrary: (id: string, input: UpdateLibraryInput) => Promise<Library | null>;
  deleteLibrary: (id: string, deleteFiles?: boolean) => Promise<boolean>;
  getLibraryById: (id: string) => Promise<Library | null>;
  searchLibraries: (query: string) => Promise<Library[]>;
  getLibraryStats: (libraryId: string) => Promise<LibraryStats | null>;
  updateLibraryStats: (libraryId: string) => Promise<void>;
  getFavorites: () => Promise<Library[]>;
}

export function useLibraries(): UseLibrariesReturn {
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all libraries
  const refreshLibraries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.library.getAll();
      if (result.success && result.data) {
        setLibraries(result.data);
      } else {
        setError(result.error || 'Failed to load libraries');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('[useLibraries] Load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create library
  const createLibrary = useCallback(async (input: CreateLibraryInput): Promise<Library | null> => {
    setError(null);
    console.log('[useLibraries] createLibrary called with input:', input);
    try {
      console.log('[useLibraries] Calling window.electronAPI.library.create...');
      const result = await window.electronAPI.library.create(input);
      console.log('[useLibraries] IPC result:', result);
      if (result.success && result.data) {
        console.log('[useLibraries] Library created successfully, refreshing list...');
        await refreshLibraries();
        return result.data;
      } else {
        console.error('[useLibraries] Create failed:', result.error);
        setError(result.error || 'Failed to create library');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useLibraries] Create error:', err);
      return null;
    }
  }, [refreshLibraries]);

  // Update library
  const updateLibrary = useCallback(async (id: string, input: UpdateLibraryInput): Promise<Library | null> => {
    setError(null);
    try {
      const result = await window.electronAPI.library.update(id, input);
      if (result.success && result.data) {
        await refreshLibraries();
        return result.data;
      } else {
        setError(result.error || 'Failed to update library');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useLibraries] Update error:', err);
      return null;
    }
  }, [refreshLibraries]);

  // Delete library
  const deleteLibrary = useCallback(async (id: string, deleteFiles = false): Promise<boolean> => {
    setError(null);
    try {
      const result = await window.electronAPI.library.delete(id, deleteFiles);
      if (result.success) {
        await refreshLibraries();
        return true;
      } else {
        setError(result.error || 'Failed to delete library');
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useLibraries] Delete error:', err);
      return false;
    }
  }, [refreshLibraries]);

  // Get library by ID
  const getLibraryById = useCallback(async (id: string): Promise<Library | null> => {
    setError(null);
    try {
      const result = await window.electronAPI.library.getById(id);
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to get library');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useLibraries] GetById error:', err);
      return null;
    }
  }, []);

  // Search libraries
  const searchLibraries = useCallback(async (query: string): Promise<Library[]> => {
    setError(null);
    try {
      const result = await window.electronAPI.library.search(query);
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to search libraries');
        return [];
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useLibraries] Search error:', err);
      return [];
    }
  }, []);

  // Get library stats
  const getLibraryStats = useCallback(async (libraryId: string): Promise<LibraryStats | null> => {
    setError(null);
    try {
      const result = await window.electronAPI.library.getStats(libraryId);
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to get library stats');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useLibraries] GetStats error:', err);
      return null;
    }
  }, []);

  // Update library stats
  const updateLibraryStats = useCallback(async (libraryId: string): Promise<void> => {
    setError(null);
    try {
      const result = await window.electronAPI.library.updateStats(libraryId);
      if (!result.success) {
        setError(result.error || 'Failed to update library stats');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useLibraries] UpdateStats error:', err);
    }
  }, []);

  // Get favorites
  const getFavorites = useCallback(async (): Promise<Library[]> => {
    setError(null);
    try {
      const result = await window.electronAPI.library.getFavorites();
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to get favorites');
        return [];
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useLibraries] GetFavorites error:', err);
      return [];
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshLibraries();
  }, [refreshLibraries]);

  return {
    libraries,
    loading,
    error,
    refreshLibraries,
    createLibrary,
    updateLibrary,
    deleteLibrary,
    getLibraryById,
    searchLibraries,
    getLibraryStats,
    updateLibraryStats,
    getFavorites,
  };
}
