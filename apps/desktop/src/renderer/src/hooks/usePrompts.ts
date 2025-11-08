import { useState, useEffect, useCallback } from 'react';
import type {
  Prompt,
  CreatePromptData,
  UpdatePromptData,
  PromptIpcResponse,
} from '../types/prompt';
import { extractVariables } from '../types/prompt';

/**
 * Parse le champ variables JSON en tableau
 */
function parsePrompt(prompt: Prompt): Prompt {
  try {
    // Parser les variables stockées
    const storedVariables = prompt.variables ? JSON.parse(prompt.variables) : [];

    // Extraire les variables depuis le contenu
    const contentVariables = extractVariables(prompt.content);

    // Synchroniser : utiliser celles du contenu comme source de vérité
    return {
      ...prompt,
      variables: JSON.stringify(contentVariables),
    };
  } catch (err) {
    console.error('[usePrompts] Error parsing prompt:', prompt.id, err);
  }
  return prompt;
}

/**
 * Hook pour gérer les prompts
 * Communique avec les IPC handlers pour les opérations CRUD
 */
export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger tous les prompts
  const loadPrompts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response: PromptIpcResponse<Prompt[]> = await window.electronAPI.prompts.getAll();

      if (response.success && response.data) {
        // Parser les variables pour chaque prompt
        const parsedPrompts = response.data.map(parsePrompt);
        console.log('[usePrompts] Prompts chargés et parsés:', parsedPrompts.length);
        setPrompts(parsedPrompts);
      } else {
        setError(response.error || 'Failed to load prompts');
      }
    } catch (err) {
      setError(String(err));
      console.error('[usePrompts] Error loading prompts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    loadPrompts();
  }, [loadPrompts]);

  // Créer un nouveau prompt
  const createPrompt = useCallback(
    async (data: CreatePromptData): Promise<Prompt | null> => {
      try {
        const response: PromptIpcResponse<Prompt> = await window.electronAPI.prompts.create(data);

        if (response.success && response.data) {
          await loadPrompts(); // Recharger la liste
          return parsePrompt(response.data);
        } else {
          setError(response.error || 'Failed to create prompt');
          return null;
        }
      } catch (err) {
        setError(String(err));
        console.error('[usePrompts] Error creating prompt:', err);
        return null;
      }
    },
    [loadPrompts]
  );

  // Mettre à jour un prompt
  const updatePrompt = useCallback(
    async (id: string, data: UpdatePromptData): Promise<Prompt | null> => {
      try {
        const response: PromptIpcResponse<Prompt> = await window.electronAPI.prompts.update(id, data);

        if (response.success && response.data) {
          await loadPrompts(); // Recharger la liste
          return parsePrompt(response.data);
        } else {
          setError(response.error || 'Failed to update prompt');
          return null;
        }
      } catch (err) {
        setError(String(err));
        console.error('[usePrompts] Error updating prompt:', err);
        return null;
      }
    },
    [loadPrompts]
  );

  // Supprimer un prompt
  const deletePrompt = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response: PromptIpcResponse = await window.electronAPI.prompts.delete(id);

        if (response.success) {
          await loadPrompts(); // Recharger la liste
          return true;
        } else {
          setError(response.error || 'Failed to delete prompt');
          return false;
        }
      } catch (err) {
        setError(String(err));
        console.error('[usePrompts] Error deleting prompt:', err);
        return false;
      }
    },
    [loadPrompts]
  );

  // Toggle favori
  const toggleFavorite = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response: PromptIpcResponse<Prompt> = await window.electronAPI.prompts.toggleFavorite(id);

        if (response.success) {
          await loadPrompts();
          return true;
        } else {
          setError(response.error || 'Failed to toggle favorite');
          return false;
        }
      } catch (err) {
        setError(String(err));
        console.error('[usePrompts] Error toggling favorite:', err);
        return false;
      }
    },
    [loadPrompts]
  );

  // Dupliquer un prompt
  const duplicatePrompt = useCallback(
    async (id: string): Promise<Prompt | null> => {
      try {
        const response: PromptIpcResponse<Prompt> = await window.electronAPI.prompts.duplicate(id);

        if (response.success && response.data) {
          await loadPrompts();
          return parsePrompt(response.data);
        } else {
          setError(response.error || 'Failed to duplicate prompt');
          return null;
        }
      } catch (err) {
        setError(String(err));
        console.error('[usePrompts] Error duplicating prompt:', err);
        return null;
      }
    },
    [loadPrompts]
  );

  // Incrémenter le compteur d'utilisation
  const incrementUsage = useCallback(async (id: string): Promise<void> => {
    try {
      await window.electronAPI.prompts.incrementUsage(id);
    } catch (err) {
      console.error('[usePrompts] Error incrementing usage:', err);
    }
  }, []);

  // Rechercher des prompts
  const searchPrompts = useCallback(async (query: string): Promise<Prompt[]> => {
    try {
      const response: PromptIpcResponse<Prompt[]> = await window.electronAPI.prompts.search(query);

      if (response.success && response.data) {
        return response.data.map(parsePrompt);
      }
      return [];
    } catch (err) {
      console.error('[usePrompts] Error searching prompts:', err);
      return [];
    }
  }, []);

  // Filtrer par catégorie
  const filterByCategory = useCallback(async (category: string): Promise<Prompt[]> => {
    try {
      const response: PromptIpcResponse<Prompt[]> = await window.electronAPI.prompts.filterByCategory(category);

      if (response.success && response.data) {
        return response.data.map(parsePrompt);
      }
      return [];
    } catch (err) {
      console.error('[usePrompts] Error filtering prompts:', err);
      return [];
    }
  }, []);

  // Récupérer les favoris
  const getFavorites = useCallback(async (): Promise<Prompt[]> => {
    try {
      const response: PromptIpcResponse<Prompt[]> = await window.electronAPI.prompts.getFavorites();

      if (response.success && response.data) {
        return response.data.map(parsePrompt);
      }
      return [];
    } catch (err) {
      console.error('[usePrompts] Error getting favorites:', err);
      return [];
    }
  }, []);

  // Récupérer les catégories
  const getCategories = useCallback(async (): Promise<string[]> => {
    try {
      const response: PromptIpcResponse<string[]> = await window.electronAPI.prompts.getCategories();

      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (err) {
      console.error('[usePrompts] Error getting categories:', err);
      return [];
    }
  }, []);

  // Récupérer un prompt par ID
  const getPromptById = useCallback((id: string): Prompt | undefined => {
    return prompts.find((p) => p.id === id);
  }, [prompts]);

  return {
    prompts,
    loading,
    error,
    loadPrompts,
    createPrompt,
    updatePrompt,
    deletePrompt,
    toggleFavorite,
    duplicatePrompt,
    incrementUsage,
    searchPrompts,
    filterByCategory,
    getFavorites,
    getCategories,
    getPromptById,
  };
}
