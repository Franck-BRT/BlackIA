import { useSettings } from '../../contexts/SettingsContext';
import type { KeyboardShortcut } from '@blackia/shared/types';

export function KeyboardShortcutsSection() {
  const { settings, updateKeyboardShortcuts } = useSettings();
  const { keyboardShortcuts } = settings;

  const toggleShortcut = (id: string, enabled: boolean) => {
    const updated = keyboardShortcuts.map((shortcut) =>
      shortcut.id === id ? { ...shortcut, enabled } : shortcut
    );
    updateKeyboardShortcuts(updated);
  };

  const formatKeys = (keys: string[]) => {
    return keys.join(' + ');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Raccourcis clavier</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Gérez les raccourcis clavier pour améliorer votre productivité
        </p>
      </div>

      <div className="space-y-2">
        {keyboardShortcuts.map((shortcut) => (
          <div
            key={shortcut.id}
            className="flex items-center justify-between p-4 glass-card rounded-lg"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">{shortcut.action}</span>
                <code className="px-2 py-1 text-xs bg-muted rounded">
                  {formatKeys(shortcut.keys)}
                </code>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {shortcut.description}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4">
              <input
                type="checkbox"
                checked={shortcut.enabled}
                onChange={(e) => toggleShortcut(shortcut.id, e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        ))}
      </div>

      <div className="p-4 glass-card rounded-lg bg-accent/50">
        <p className="text-xs text-muted-foreground">
          💡 Astuce : Utilisez les raccourcis clavier pour naviguer rapidement dans
          l'application et augmenter votre productivité.
        </p>
      </div>
    </div>
  );
}
