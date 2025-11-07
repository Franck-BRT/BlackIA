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

  // Charger les tags depuis localStorage et synchroniser avec le backend
  useEffect(() => {
    const loadTags = async () => {
      try {
        // 1. Charger les tags depuis localStorage
        const stored = localStorage.getItem(TAGS_STORAGE_KEY);
        let localTags: Tag[] = [];
        if (stored) {
          localTags = JSON.parse(stored) as Tag[];
          console.log('[useTags] Chargé', localTags.length, 'tags depuis localStorage');

          // Nettoyer les tags orphelins (dont le nom est l'ID)
          const orphanCount = localTags.filter((t) => t.name.startsWith('tag-')).length;
          if (orphanCount > 0) {
            localTags = localTags.filter((t) => !t.name.startsWith('tag-'));
            console.log('[useTags] Nettoyé', orphanCount, 'tags orphelins');
            // Sauvegarder les tags nettoyés
            localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(localTags));
          }
        }

        // 2. Charger les tags synchronisés depuis le backend (personas)
        if (window.electronAPI?.tags?.getSynced) {
          const result = await window.electronAPI.tags.getSynced();
          if (result.success && result.data && result.data.length > 0) {
            console.log('[useTags] Chargé', result.data.length, 'tags synchronisés depuis le backend');

            // Nettoyer aussi les tags orphelins du backend
            const backendTags = (result.data as Tag[]).filter((t) => !t.name.startsWith('tag-'));

            // 3. Fusionner les tags - éviter les duplicates par ID
            const existingIds = new Set(localTags.map((t) => t.id));
            const newTags = backendTags.filter((t: Tag) => !existingIds.has(t.id));

            if (newTags.length > 0) {
              console.log('[useTags] Fusion de', newTags.length, 'nouveaux tags depuis le backend');
              const mergedTags = [...localTags, ...newTags];
              setTags(mergedTags);
              localStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(mergedTags));
            } else {
              setTags(localTags);
            }
          } else {
            setTags(localTags);
          }
        } else {
          setTags(localTags);
        }
      } catch (error) {
        console.error('[useTags] Erreur lors du chargement:', error);
      }
    };

    loadTags();
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
