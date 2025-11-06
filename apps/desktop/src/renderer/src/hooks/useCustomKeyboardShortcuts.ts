import { useState, useEffect, useCallback } from 'react';

export interface ShortcutConfig {
  id: string;
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  category: string;
}

const SHORTCUTS_STORAGE_KEY = 'keyboard_shortcuts';

// Raccourcis par défaut
const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  // Navigation
  {
    id: 'toggle_sidebar',
    key: 'b',
    ctrl: true,
    description: 'Afficher/Masquer la sidebar',
    category: 'Navigation',
  },
  {
    id: 'search_in_conversation',
    key: 'f',
    ctrl: true,
    description: 'Rechercher dans la conversation',
    category: 'Recherche',
  },
  {
    id: 'search_conversations',
    key: 'k',
    ctrl: true,
    description: 'Rechercher dans les conversations',
    category: 'Recherche',
  },
  // Actions
  {
    id: 'new_conversation',
    key: 'n',
    ctrl: true,
    description: 'Nouvelle conversation',
    category: 'Actions',
  },
  {
    id: 'save',
    key: 's',
    ctrl: true,
    description: 'Sauvegarder (déjà automatique)',
    category: 'Actions',
  },
  {
    id: 'open_settings',
    key: ',',
    ctrl: true,
    description: 'Ouvrir les paramètres',
    category: 'Actions',
  },
  // Chat
  {
    id: 'clear_chat',
    key: 'l',
    ctrl: true,
    description: 'Effacer la conversation',
    category: 'Chat',
  },
  {
    id: 'regenerate',
    key: 'r',
    ctrl: true,
    shift: true,
    description: 'Régénérer la dernière réponse',
    category: 'Chat',
  },
  // Aide
  {
    id: 'show_statistics',
    key: 's',
    ctrl: true,
    shift: true,
    description: 'Afficher les statistiques',
    category: 'Aide',
  },
  {
    id: 'show_shortcuts_1',
    key: '?',
    ctrl: true,
    description: 'Afficher les raccourcis clavier',
    category: 'Aide',
  },
  {
    id: 'show_shortcuts_2',
    key: '/',
    ctrl: true,
    description: 'Afficher les raccourcis clavier',
    category: 'Aide',
  },
];

/**
 * Hook pour gérer les raccourcis clavier personnalisables
 */
export function useCustomKeyboardShortcuts() {
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>(DEFAULT_SHORTCUTS);

  // Charger les raccourcis depuis localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ShortcutConfig[];
        setShortcuts(parsed);
        console.log('[useCustomKeyboardShortcuts] Chargé', parsed.length, 'raccourcis');
      }
    } catch (error) {
      console.error('[useCustomKeyboardShortcuts] Erreur lors du chargement:', error);
    }
  }, []);

  // Sauvegarder les raccourcis dans localStorage
  const saveToStorage = useCallback((shortcutsToSave: ShortcutConfig[]) => {
    try {
      localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(shortcutsToSave));
      console.log('[useCustomKeyboardShortcuts] Sauvegardé', shortcutsToSave.length, 'raccourcis');
    } catch (error) {
      console.error('[useCustomKeyboardShortcuts] Erreur lors de la sauvegarde:', error);
    }
  }, []);

  // Mettre à jour un raccourci
  const updateShortcut = useCallback(
    (id: string, updates: Partial<Omit<ShortcutConfig, 'id'>>) => {
      setShortcuts((prev) => {
        const updated = prev.map((shortcut) =>
          shortcut.id === id ? { ...shortcut, ...updates } : shortcut
        );
        saveToStorage(updated);
        return updated;
      });
      console.log('[useCustomKeyboardShortcuts] Raccourci mis à jour:', id);
    },
    [saveToStorage]
  );

  // Réinitialiser les raccourcis par défaut
  const resetToDefaults = useCallback(() => {
    setShortcuts(DEFAULT_SHORTCUTS);
    saveToStorage(DEFAULT_SHORTCUTS);
    console.log('[useCustomKeyboardShortcuts] Réinitialisé aux valeurs par défaut');
  }, [saveToStorage]);

  // Obtenir un raccourci par ID
  const getShortcutById = useCallback(
    (id: string): ShortcutConfig | null => {
      return shortcuts.find((s) => s.id === id) || null;
    },
    [shortcuts]
  );

  // Vérifier si une combinaison de touches est déjà utilisée
  const isShortcutUsed = useCallback(
    (
      key: string,
      modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean },
      excludeId?: string
    ): boolean => {
      return shortcuts.some((shortcut) => {
        if (excludeId && shortcut.id === excludeId) return false;

        return (
          shortcut.key.toLowerCase() === key.toLowerCase() &&
          !!shortcut.ctrl === !!modifiers.ctrl &&
          !!shortcut.shift === !!modifiers.shift &&
          !!shortcut.alt === !!modifiers.alt &&
          !!shortcut.meta === !!modifiers.meta
        );
      });
    },
    [shortcuts]
  );

  return {
    shortcuts,
    updateShortcut,
    resetToDefaults,
    getShortcutById,
    isShortcutUsed,
  };
}

/**
 * Formatte un raccourci pour l'affichage
 */
export function formatShortcutConfig(shortcut: ShortcutConfig): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.meta) parts.push('⌘');

  // Formater la clé
  let key = shortcut.key;
  if (key === ' ') key = 'Space';
  else if (key === 'Escape') key = 'Esc';
  else if (key.length === 1) key = key.toUpperCase();

  parts.push(key);

  return parts.join('+');
}
