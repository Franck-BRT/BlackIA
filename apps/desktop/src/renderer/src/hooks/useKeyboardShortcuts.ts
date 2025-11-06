import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  category?: string;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Hook pour gérer les raccourcis clavier globaux
 */
export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignorer si on est dans un input ou textarea (sauf pour certains raccourcis spéciaux)
      const target = event.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch) {
          // Permettre certains raccourcis même dans les inputs (comme Ctrl+S, Ctrl+F, etc.)
          const allowedInInputs = ['f', 's', 'k', 'n', '?', '/'];
          if (isInput && !allowedInInputs.includes(shortcut.key.toLowerCase())) {
            continue;
          }

          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

/**
 * Formatte un raccourci pour l'affichage
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
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

/**
 * Détecte si on est sur macOS
 */
export function isMacOS(): boolean {
  return navigator.platform.toLowerCase().includes('mac');
}
