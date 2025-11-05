import { useState, useEffect, useCallback } from 'react';
import type { Folder } from './useConversations';

const FOLDERS_STORAGE_KEY = 'folders';

/**
 * Hook pour gérer les dossiers personnalisés
 */
export function useFolders() {
  const [folders, setFolders] = useState<Folder[]>([]);

  // Charger les dossiers depuis localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FOLDERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Folder[];
        setFolders(parsed);
        console.log('[useFolders] Chargé', parsed.length, 'dossiers');
      }
    } catch (error) {
      console.error('[useFolders] Erreur lors du chargement:', error);
    }
  }, []);

  // Sauvegarder les dossiers dans localStorage
  const saveToStorage = useCallback((foldersToSave: Folder[]) => {
    try {
      localStorage.setItem(FOLDERS_STORAGE_KEY, JSON.stringify(foldersToSave));
      console.log('[useFolders] Sauvegardé', foldersToSave.length, 'dossiers');
    } catch (error) {
      console.error('[useFolders] Erreur lors de la sauvegarde:', error);
    }
  }, []);

  // Créer un nouveau dossier
  const createFolder = useCallback((name: string, color?: string): Folder => {
    const newFolder: Folder = {
      id: `folder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      color: color || '#3b82f6', // Bleu par défaut
      createdAt: Date.now(),
    };

    setFolders((prev) => {
      const updated = [...prev, newFolder];
      saveToStorage(updated);
      return updated;
    });

    console.log('[useFolders] Dossier créé:', newFolder.id);
    return newFolder;
  }, [saveToStorage]);

  // Renommer un dossier
  const renameFolder = useCallback((id: string, newName: string) => {
    setFolders((prev) => {
      const updated = prev.map((folder) =>
        folder.id === id ? { ...folder, name: newName } : folder
      );
      saveToStorage(updated);
      return updated;
    });

    console.log('[useFolders] Dossier renommé:', id);
  }, [saveToStorage]);

  // Changer la couleur d'un dossier
  const changeFolderColor = useCallback((id: string, color: string) => {
    setFolders((prev) => {
      const updated = prev.map((folder) =>
        folder.id === id ? { ...folder, color } : folder
      );
      saveToStorage(updated);
      return updated;
    });

    console.log('[useFolders] Couleur du dossier changée:', id);
  }, [saveToStorage]);

  // Supprimer un dossier
  const deleteFolder = useCallback((id: string) => {
    setFolders((prev) => {
      const updated = prev.filter((folder) => folder.id !== id);
      saveToStorage(updated);
      return updated;
    });

    console.log('[useFolders] Dossier supprimé:', id);
  }, [saveToStorage]);

  // Obtenir un dossier par ID
  const getFolderById = useCallback((id: string): Folder | null => {
    return folders.find((f) => f.id === id) || null;
  }, [folders]);

  return {
    folders,
    createFolder,
    renameFolder,
    changeFolderColor,
    deleteFolder,
    getFolderById,
  };
}
