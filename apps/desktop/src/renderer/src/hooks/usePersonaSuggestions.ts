import { useState, useEffect, useCallback } from 'react';
import {
  PersonaSuggestionKeyword,
  PersonaSuggestionKeywordParsed,
  CreatePersonaSuggestionKeywordData,
  UpdatePersonaSuggestionKeywordData,
  PersonaSuggestionIpcResponse,
} from '../types/persona-suggestion';

/**
 * Hook pour gérer les suggestions de personas
 */
export const usePersonaSuggestions = () => {
  const [keywords, setKeywords] = useState<PersonaSuggestionKeywordParsed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Parse les keywords de la DB (JSON string -> array)
   */
  const parseKeyword = (keyword: PersonaSuggestionKeyword): PersonaSuggestionKeywordParsed => {
    return {
      ...keyword,
      categories: JSON.parse(keyword.categories),
    };
  };

  /**
   * Charge tous les keywords
   */
  const loadKeywords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: PersonaSuggestionIpcResponse<PersonaSuggestionKeyword[]> =
        await window.electron.ipcRenderer.invoke('persona-suggestions:get-all');

      if (response.success && response.data) {
        setKeywords(response.data.map(parseKeyword));
      } else {
        setError(response.error || 'Failed to load keywords');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Charge uniquement les keywords actifs
   */
  const loadActiveKeywords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: PersonaSuggestionIpcResponse<PersonaSuggestionKeyword[]> =
        await window.electron.ipcRenderer.invoke('persona-suggestions:get-active');

      if (response.success && response.data) {
        setKeywords(response.data.map(parseKeyword));
      } else {
        setError(response.error || 'Failed to load active keywords');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Crée un nouveau keyword
   */
  const createKeyword = useCallback(async (data: CreatePersonaSuggestionKeywordData) => {
    try {
      const response: PersonaSuggestionIpcResponse<PersonaSuggestionKeyword> =
        await window.electron.ipcRenderer.invoke('persona-suggestions:create', data);

      if (response.success && response.data) {
        setKeywords((prev) => [...prev, parseKeyword(response.data!)]);
        return { success: true, data: parseKeyword(response.data) };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Met à jour un keyword
   */
  const updateKeyword = useCallback(
    async (id: string, data: UpdatePersonaSuggestionKeywordData) => {
      try {
        const response: PersonaSuggestionIpcResponse<PersonaSuggestionKeyword> =
          await window.electron.ipcRenderer.invoke('persona-suggestions:update', id, data);

        if (response.success && response.data) {
          setKeywords((prev) =>
            prev.map((k) => (k.id === id ? parseKeyword(response.data!) : k))
          );
          return { success: true, data: parseKeyword(response.data) };
        } else {
          return { success: false, error: response.error };
        }
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    []
  );

  /**
   * Supprime un keyword
   */
  const deleteKeyword = useCallback(async (id: string) => {
    try {
      const response: PersonaSuggestionIpcResponse =
        await window.electron.ipcRenderer.invoke('persona-suggestions:delete', id);

      if (response.success) {
        setKeywords((prev) => prev.filter((k) => k.id !== id));
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Bascule l'état actif/inactif
   */
  const toggleActive = useCallback(async (id: string) => {
    try {
      const response: PersonaSuggestionIpcResponse<PersonaSuggestionKeyword> =
        await window.electron.ipcRenderer.invoke('persona-suggestions:toggle-active', id);

      if (response.success && response.data) {
        setKeywords((prev) =>
          prev.map((k) => (k.id === id ? parseKeyword(response.data!) : k))
        );
        return { success: true, data: parseKeyword(response.data) };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Recherche des keywords
   */
  const searchKeywords = useCallback(async (query: string) => {
    try {
      const response: PersonaSuggestionIpcResponse<PersonaSuggestionKeyword[]> =
        await window.electron.ipcRenderer.invoke('persona-suggestions:search', query);

      if (response.success && response.data) {
        return { success: true, data: response.data.map(parseKeyword) };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  /**
   * Initialise les keywords par défaut
   */
  const initializeDefaults = useCallback(async () => {
    try {
      const response: PersonaSuggestionIpcResponse =
        await window.electron.ipcRenderer.invoke('persona-suggestions:initialize-defaults');

      if (response.success) {
        await loadKeywords();
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [loadKeywords]);

  /**
   * Réinitialise aux valeurs par défaut
   */
  const resetToDefaults = useCallback(async () => {
    try {
      const response: PersonaSuggestionIpcResponse =
        await window.electron.ipcRenderer.invoke('persona-suggestions:reset-to-defaults');

      if (response.success) {
        await loadKeywords();
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [loadKeywords]);

  /**
   * Récupère les statistiques
   */
  const getStats = useCallback(async () => {
    try {
      const response: PersonaSuggestionIpcResponse<{
        total: number;
        active: number;
        inactive: number;
        defaultKeywords: number;
        customKeywords: number;
        categoryCounts: Record<string, number>;
      }> = await window.electron.ipcRenderer.invoke('persona-suggestions:get-stats');

      if (response.success && response.data) {
        return { success: true, data: response.data };
      } else {
        return { success: false, error: response.error };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, []);

  // Charger les keywords au montage
  useEffect(() => {
    loadKeywords();
  }, [loadKeywords]);

  return {
    keywords,
    loading,
    error,
    loadKeywords,
    loadActiveKeywords,
    createKeyword,
    updateKeyword,
    deleteKeyword,
    toggleActive,
    searchKeywords,
    initializeDefaults,
    resetToDefaults,
    getStats,
  };
};
