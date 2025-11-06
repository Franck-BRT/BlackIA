import { useState, useEffect, useCallback } from 'react';
import type {
  Persona,
  CreatePersonaData,
  UpdatePersonaData,
  PersonaIpcResponse,
} from '../types/persona';

/**
 * Hook pour gérer les personas
 * Communique avec les IPC handlers pour les opérations CRUD
 */
export function usePersonas() {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger toutes les personas
  const loadPersonas = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response: PersonaIpcResponse<Persona[]> = await window.electronAPI.personas.getAll();

      if (response.success && response.data) {
        setPersonas(response.data);
      } else {
        setError(response.error || 'Failed to load personas');
      }
    } catch (err) {
      setError(String(err));
      console.error('[usePersonas] Error loading personas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    loadPersonas();
  }, [loadPersonas]);

  // Créer une nouvelle persona
  const createPersona = useCallback(
    async (data: CreatePersonaData): Promise<Persona | null> => {
      try {
        const response: PersonaIpcResponse<Persona> = await window.electronAPI.personas.create(data);

        if (response.success && response.data) {
          await loadPersonas(); // Recharger la liste
          return response.data;
        } else {
          setError(response.error || 'Failed to create persona');
          return null;
        }
      } catch (err) {
        setError(String(err));
        console.error('[usePersonas] Error creating persona:', err);
        return null;
      }
    },
    [loadPersonas]
  );

  // Mettre à jour une persona
  const updatePersona = useCallback(
    async (id: string, data: UpdatePersonaData): Promise<Persona | null> => {
      try {
        const response: PersonaIpcResponse<Persona> = await window.electronAPI.personas.update(id, data);

        if (response.success && response.data) {
          await loadPersonas(); // Recharger la liste
          return response.data;
        } else {
          setError(response.error || 'Failed to update persona');
          return null;
        }
      } catch (err) {
        setError(String(err));
        console.error('[usePersonas] Error updating persona:', err);
        return null;
      }
    },
    [loadPersonas]
  );

  // Supprimer une persona
  const deletePersona = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response: PersonaIpcResponse = await window.electronAPI.personas.delete(id);

        if (response.success) {
          await loadPersonas(); // Recharger la liste
          return true;
        } else {
          setError(response.error || 'Failed to delete persona');
          return false;
        }
      } catch (err) {
        setError(String(err));
        console.error('[usePersonas] Error deleting persona:', err);
        return false;
      }
    },
    [loadPersonas]
  );

  // Toggle favori
  const toggleFavorite = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response: PersonaIpcResponse<Persona> = await window.electronAPI.personas.toggleFavorite(id);

        if (response.success) {
          await loadPersonas();
          return true;
        } else {
          setError(response.error || 'Failed to toggle favorite');
          return false;
        }
      } catch (err) {
        setError(String(err));
        console.error('[usePersonas] Error toggling favorite:', err);
        return false;
      }
    },
    [loadPersonas]
  );

  // Dupliquer une persona
  const duplicatePersona = useCallback(
    async (id: string): Promise<Persona | null> => {
      try {
        const response: PersonaIpcResponse<Persona> = await window.electronAPI.personas.duplicate(id);

        if (response.success && response.data) {
          await loadPersonas();
          return response.data;
        } else {
          setError(response.error || 'Failed to duplicate persona');
          return null;
        }
      } catch (err) {
        setError(String(err));
        console.error('[usePersonas] Error duplicating persona:', err);
        return null;
      }
    },
    [loadPersonas]
  );

  // Incrémenter le compteur d'utilisation
  const incrementUsage = useCallback(async (id: string): Promise<void> => {
    try {
      await window.electronAPI.personas.incrementUsage(id);
    } catch (err) {
      console.error('[usePersonas] Error incrementing usage:', err);
    }
  }, []);

  // Rechercher des personas
  const searchPersonas = useCallback(async (query: string): Promise<Persona[]> => {
    try {
      const response: PersonaIpcResponse<Persona[]> = await window.electronAPI.personas.search(query);

      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (err) {
      console.error('[usePersonas] Error searching personas:', err);
      return [];
    }
  }, []);

  // Filtrer par catégorie
  const filterByCategory = useCallback(async (category: string): Promise<Persona[]> => {
    try {
      const response: PersonaIpcResponse<Persona[]> = await window.electronAPI.personas.filterByCategory(category);

      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (err) {
      console.error('[usePersonas] Error filtering personas:', err);
      return [];
    }
  }, []);

  // Récupérer les favorites
  const getFavorites = useCallback(async (): Promise<Persona[]> => {
    try {
      const response: PersonaIpcResponse<Persona[]> = await window.electronAPI.personas.getFavorites();

      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (err) {
      console.error('[usePersonas] Error getting favorites:', err);
      return [];
    }
  }, []);

  // Récupérer les catégories
  const getCategories = useCallback(async (): Promise<string[]> => {
    try {
      const response: PersonaIpcResponse<string[]> = await window.electronAPI.personas.getCategories();

      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (err) {
      console.error('[usePersonas] Error getting categories:', err);
      return [];
    }
  }, []);

  // Récupérer une persona par ID
  const getPersonaById = useCallback((id: string): Persona | undefined => {
    return personas.find((p) => p.id === id);
  }, [personas]);

  return {
    personas,
    loading,
    error,
    loadPersonas,
    createPersona,
    updatePersona,
    deletePersona,
    toggleFavorite,
    duplicatePersona,
    incrementUsage,
    searchPersonas,
    filterByCategory,
    getFavorites,
    getCategories,
    getPersonaById,
  };
}
