import React, { useState } from 'react';
import { Keyboard, RotateCcw, Edit2, Check, X, AlertCircle } from 'lucide-react';
import {
  useCustomKeyboardShortcuts,
  formatShortcutConfig,
  type ShortcutConfig,
} from '../../hooks/useCustomKeyboardShortcuts';

export function KeyboardShortcutsSettings() {
  const { shortcuts, updateShortcut, resetToDefaults, isShortcutUsed } = useCustomKeyboardShortcuts();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedKeys, setRecordedKeys] = useState<{
    key: string;
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
    meta: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Grouper les raccourcis par catégorie
  const categories = Array.from(new Set(shortcuts.map((s) => s.category))).sort();

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleStartEdit = (id: string) => {
    setEditingId(id);
    setIsRecording(false);
    setRecordedKeys(null);
    setError(null);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordedKeys(null);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isRecording) return;

    e.preventDefault();
    e.stopPropagation();

    // Ignorer les touches de modification seules
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      return;
    }

    const newKeys = {
      key: e.key,
      ctrl: e.ctrlKey || e.metaKey,
      shift: e.shiftKey,
      alt: e.altKey,
      meta: e.metaKey,
    };

    // Vérifier si la combinaison est déjà utilisée
    if (isShortcutUsed(newKeys.key, newKeys, editingId || undefined)) {
      setError('Cette combinaison est déjà utilisée');
      return;
    }

    setRecordedKeys(newKeys);
    setError(null);
    setIsRecording(false);
  };

  const handleSave = () => {
    if (!editingId || !recordedKeys) return;

    updateShortcut(editingId, {
      key: recordedKeys.key,
      ctrl: recordedKeys.ctrl,
      shift: recordedKeys.shift,
      alt: recordedKeys.alt,
      meta: recordedKeys.meta,
    });

    setEditingId(null);
    setRecordedKeys(null);
    setError(null);
    showNotification('success', '✅ Raccourci modifié avec succès');
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsRecording(false);
    setRecordedKeys(null);
    setError(null);
  };

  const handleReset = () => {
    if (confirm('Réinitialiser tous les raccourcis aux valeurs par défaut ?')) {
      resetToDefaults();
      setEditingId(null);
      setIsRecording(false);
      setRecordedKeys(null);
      setError(null);
      showNotification('success', '✅ Raccourcis réinitialisés');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Raccourcis clavier</h2>
          <p className="text-muted-foreground">
            Personnalisez les raccourcis clavier de l'application
          </p>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-2 glass-card hover:bg-white/10 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Réinitialiser</span>
        </button>
      </div>

      {/* Shortcuts list by category */}
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryShortcuts = shortcuts.filter((s) => s.category === category);

          return (
            <div key={category} className="glass-card rounded-xl overflow-hidden">
              {/* Category header */}
              <div className="bg-white/5 px-6 py-3 border-b border-white/10">
                <h3 className="font-semibold">{category}</h3>
              </div>

              {/* Shortcuts */}
              <div className="p-4 space-y-2">
                {categoryShortcuts.map((shortcut) => (
                  <div
                    key={shortcut.id}
                    className="flex items-center justify-between p-3 glass-card bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {/* Description */}
                    <div className="flex-1">
                      <div className="font-medium">{shortcut.description}</div>
                    </div>

                    {/* Shortcut display */}
                    {editingId === shortcut.id ? (
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={handleStartRecording}
                            onKeyDown={handleKeyDown}
                            className={`px-4 py-2 rounded-lg font-mono text-sm transition-colors ${
                              isRecording
                                ? 'bg-blue-500/20 border-2 border-blue-500 animate-pulse'
                                : 'glass-card border border-white/20 hover:bg-white/10'
                            }`}
                            autoFocus
                          >
                            {isRecording
                              ? 'Appuyez sur une touche...'
                              : recordedKeys
                                ? formatShortcutConfig({
                                    ...shortcut,
                                    ...recordedKeys,
                                  })
                                : 'Cliquez pour enregistrer'}
                          </button>
                          {error && (
                            <div className="flex items-center gap-1 text-red-400 text-xs">
                              <AlertCircle className="w-3 h-3" />
                              <span>{error}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleSave}
                            disabled={!recordedKeys}
                            className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Sauvegarder"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancel}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            title="Annuler"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <kbd className="px-3 py-1.5 glass-card border border-white/20 rounded-lg font-mono text-sm">
                          {formatShortcutConfig(shortcut)}
                        </kbd>
                        <button
                          onClick={() => handleStartEdit(shortcut.id)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Help text */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Keyboard className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            <p className="mb-2">
              <strong className="text-foreground">Pour modifier un raccourci :</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Cliquez sur l'icône d'édition à côté du raccourci</li>
              <li>Cliquez sur le bouton "Cliquez pour enregistrer"</li>
              <li>Appuyez sur la combinaison de touches souhaitée</li>
              <li>Cliquez sur la coche verte pour sauvegarder</li>
            </ol>
            <p className="mt-3">
              <strong className="text-foreground">Conseils :</strong>
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Utilisez Ctrl ou Cmd avec une lettre pour les raccourcis principaux</li>
              <li>Ajoutez Shift pour des variantes de raccourcis</li>
              <li>Évitez les raccourcis utilisés par le navigateur</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-[99999] animate-in fade-in slide-in-from-bottom-2">
          <div
            className={`glass-card rounded-xl p-4 flex items-center gap-3 min-w-[300px] ${
              notification.type === 'success'
                ? 'bg-green-500/20 border-green-500/50'
                : 'bg-red-500/20 border-red-500/50'
            }`}
          >
            {notification.type === 'success' ? (
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <div className="text-sm">{notification.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}
