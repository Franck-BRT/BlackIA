import React, { useState, useEffect } from 'react';
import { X, Settings as SettingsIcon } from 'lucide-react';

export interface ChatSettingsData {
  temperature: number;
  maxTokens: number;
  topP: number;
  systemPrompt: string;
  syntaxTheme: string;
  showLineNumbers: boolean;
}

interface ChatSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ChatSettingsData;
  onSave: (settings: ChatSettingsData) => void;
}

export const DEFAULT_CHAT_SETTINGS: ChatSettingsData = {
  temperature: 0.7,
  maxTokens: 4096,
  topP: 0.9,
  systemPrompt: '',
  syntaxTheme: 'vscode-dark',
  showLineNumbers: false,
};

export function ChatSettings({ isOpen, onClose, settings, onSave }: ChatSettingsProps) {
  const [localSettings, setLocalSettings] = useState<ChatSettingsData>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_CHAT_SETTINGS);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card bg-gray-900/95 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold">Paramètres de Chat</h2>
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
          {/* Temperature */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Température
              <span className="ml-2 text-muted-foreground">({localSettings.temperature})</span>
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={localSettings.temperature}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, temperature: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Précis (0)</span>
              <span>Équilibré (1)</span>
              <span>Créatif (2)</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Contrôle la créativité des réponses. Plus la valeur est élevée, plus les réponses sont
              variées et créatives.
            </p>
          </div>

          {/* Max Tokens */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Tokens Maximum
              <span className="ml-2 text-muted-foreground">({localSettings.maxTokens})</span>
            </label>
            <input
              type="range"
              min="512"
              max="8192"
              step="512"
              value={localSettings.maxTokens}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, maxTokens: parseInt(e.target.value) })
              }
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>512</span>
              <span>2048</span>
              <span>4096</span>
              <span>8192</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Limite le nombre de tokens (mots) dans le contexte. Plus élevé = plus de mémoire, mais
              plus lent.
            </p>
          </div>

          {/* Top P */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Top P
              <span className="ml-2 text-muted-foreground">({localSettings.topP})</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={localSettings.topP}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, topP: parseFloat(e.target.value) })
              }
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Déterministe (0)</span>
              <span>Standard (0.9)</span>
              <span>Diversifié (1)</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Contrôle la diversité des réponses via nucleus sampling. 0.9 est recommandé.
            </p>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-sm font-medium mb-2">Prompt Système (Optionnel)</label>
            <textarea
              value={localSettings.systemPrompt}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, systemPrompt: e.target.value })
              }
              placeholder="Exemple: Tu es un assistant expert en programmation..."
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl resize-none outline-none focus:border-blue-500/50 transition-colors placeholder:text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Définit le comportement de l'IA. Laissez vide pour le comportement par défaut.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-semibold mb-4">Coloration Syntaxique</h3>

            {/* Syntax Theme */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Thème de Code</label>
              <select
                value={localSettings.syntaxTheme}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, syntaxTheme: e.target.value })
                }
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500/50 transition-colors cursor-pointer"
              >
                <option value="vscode-dark">VS Code Dark (Défaut)</option>
                <option value="github-light">GitHub Light</option>
                <option value="monokai">Monokai</option>
                <option value="dracula">Dracula</option>
                <option value="nord">Nord</option>
              </select>
              <p className="text-sm text-muted-foreground mt-2">
                Choisissez le thème de coloration pour les blocs de code.
              </p>
            </div>

            {/* Show Line Numbers */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.showLineNumbers}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, showLineNumbers: e.target.checked })
                  }
                  className="w-5 h-5 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                />
                <div>
                  <span className="text-sm font-medium">Afficher les numéros de ligne</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ajoute des numéros de ligne dans les blocs de code pour faciliter la référence.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-xl glass-hover hover:bg-yellow-500/20 transition-colors text-yellow-400"
          >
            Réinitialiser
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl glass-hover hover:bg-white/10 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 transition-colors text-blue-400"
            >
              Sauvegarder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
