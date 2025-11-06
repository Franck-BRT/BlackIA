import { useState, useEffect, useCallback } from 'react';

export interface Tag {
  id: string;
  name: string;
  color: string;
  icon?: string; // Emoji ou icône
  createdAt: number;
}

const TAGS_STORAGE_KEY = 'tags';

/**
 * Hook pour gérer les tags des conversations
 */
export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);

  // Charger les tags depuis localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(TAGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Tag[];
        setTags(parsed);
        console.log('[useTags] Chargé', parsed.length, 'tags');
      }
    } catch (error) {
      console.error('[useTags] Erreur lors du chargement:', error);
    }
  }, []);

  // Sauvegarder les tags dans localStorage
  const saveToStorage = useCallback((tagsToSave: Tag[]) => {
    try {
      localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tagsToSave));
      console.log('[useTags] Sauvegardé', tagsToSave.length, 'tags');
    } catch (error) {
      console.error('[useTags] Erreur lors de la sauvegarde:', error);
    }
  }, []);

  // Créer un nouveau tag
  const createTag = useCallback((name: string, color: string, icon?: string): Tag => {
    const newTag: Tag = {
      id: `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      color,
      icon,
      createdAt: Date.now(),
    };

    setTags((prev) => {
      const updated = [...prev, newTag];
      saveToStorage(updated);
      return updated;
    });

    console.log('[useTags] Tag créé:', newTag.id);
    return newTag;
  }, [saveToStorage]);

  // Mettre à jour un tag
  const updateTag = useCallback((id: string, updates: Partial<Omit<Tag, 'id' | 'createdAt'>>) => {
    setTags((prev) => {
      const updated = prev.map((tag) =>
        tag.id === id ? { ...tag, ...updates } : tag
      );
      saveToStorage(updated);
      return updated;
    });

    console.log('[useTags] Tag mis à jour:', id);
  }, [saveToStorage]);

  // Supprimer un tag
  const deleteTag = useCallback((id: string) => {
    setTags((prev) => {
      const updated = prev.filter((tag) => tag.id !== id);
      saveToStorage(updated);
      return updated;
    });

    console.log('[useTags] Tag supprimé:', id);
  }, [saveToStorage]);

  // Obtenir un tag par ID
  const getTagById = useCallback((id: string): Tag | null => {
    return tags.find((t) => t.id === id) || null;
  }, [tags]);

  // Obtenir plusieurs tags par IDs
  const getTagsByIds = useCallback((ids: string[]): Tag[] => {
    return tags.filter((t) => ids.includes(t.id));
  }, [tags]);

  // Importer des tags (pour les backups)
  const importTags = useCallback((tagsToImport: Tag[], mode: 'merge' | 'replace') => {
    setTags((prev) => {
      let updated: Tag[];

      if (mode === 'replace') {
        updated = tagsToImport;
        console.log('[useTags] Tags importés (remplacement):', tagsToImport.length);
      } else {
        // Fusionner - éviter les duplicates par ID
        const existingIds = new Set(prev.map((t) => t.id));
        const newTags = tagsToImport.filter((t) => !existingIds.has(t.id));
        updated = [...prev, ...newTags];
        console.log('[useTags] Tags importés (fusion):', newTags.length, 'nouveaux tags');
      }

      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  return {
    tags,
    createTag,
    updateTag,
    deleteTag,
    getTagById,
    getTagsByIds,
    importTags,
  };
}
