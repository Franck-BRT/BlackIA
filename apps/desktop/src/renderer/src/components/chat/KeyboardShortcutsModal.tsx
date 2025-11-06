import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { KeyboardShortcut, formatShortcut, isMacOS } from '../../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

export function KeyboardShortcutsModal({ isOpen, onClose, shortcuts }: KeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  // Grouper les raccourcis par catégorie
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'Général';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);

  const isMac = isMacOS();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card bg-gray-900/95 rounded-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Keyboard className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold">Raccourcis Clavier</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-hover hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Info macOS */}
          {isMac && (
            <div className="glass-card bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <p className="text-sm text-blue-400">
                <strong>Note:</strong> Sur macOS, utilisez <kbd className="px-2 py-1 bg-white/10 rounded">⌘ Cmd</kbd> au lieu de <kbd className="px-2 py-1 bg-white/10 rounded">Ctrl</kbd>
              </p>
            </div>
          )}

          {/* Raccourcis par catégorie */}
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold mb-3 text-blue-400">{category}</h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg glass-hover hover:bg-white/5 transition-colors"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {formatShortcut(shortcut).split('+').map((part, i, arr) => (
                        <React.Fragment key={i}>
                          <kbd className="px-3 py-1.5 bg-white/10 rounded-lg text-sm font-mono border border-white/20">
                            {part}
                          </kbd>
                          {i < arr.length - 1 && <span className="text-muted-foreground">+</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <p className="text-sm text-muted-foreground">
            Appuyez sur <kbd className="px-2 py-1 bg-white/10 rounded">Ctrl+?</kbd> ou <kbd className="px-2 py-1 bg-white/10 rounded">Ctrl+/</kbd> pour afficher cette aide
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 transition-colors text-blue-400"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
