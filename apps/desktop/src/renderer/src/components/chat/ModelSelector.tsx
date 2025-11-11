import React, { useEffect, useState } from 'react';
import { Download, Check, AlertCircle, RefreshCw } from 'lucide-react';
import type { OllamaModel } from '@blackia/ollama';
import { useSettings } from '../../contexts/SettingsContext';
import { getModelDisplayName } from '../../utils/modelAliases';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
}

export function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  const { settings } = useSettings();
  const { ollama } = settings;
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadModels = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('=== DEBUG ModelSelector ===');
      console.log('Ollama enabled:', ollama.enabled);
      console.log('window.electronAPI:', window.electronAPI);
      console.log('window.electronAPI.ollama:', window.electronAPI?.ollama);

      // Vérifier si Ollama est activé dans les paramètres
      if (!ollama.enabled) {
        setError('Ollama est désactivé. Activez-le dans Paramètres > AI Locale.');
        setModels([]);
        return;
      }

      if (!window.electronAPI?.ollama) {
        setError('API Ollama non disponible. Redémarrez l\'application.');
        setModels([]);
        return;
      }

      const isAvailable = await window.electronAPI.ollama.isAvailable();
      console.log('isAvailable:', isAvailable);

      if (!isAvailable) {
        setError('Ollama n\'est pas accessible. Assurez-vous qu\'il est démarré.');
        setModels([]);
        return;
      }

      const modelsList = await window.electronAPI.ollama.listModels();
      console.log('modelsList:', modelsList);
      setModels(modelsList);

      // Si aucun modèle n'est sélectionné et qu'il y en a, sélectionner le premier
      if (!selectedModel && modelsList.length > 0) {
        onModelChange(modelsList[0].name);
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement des modèles:', err);
      setError(err.message || 'Erreur lors du chargement des modèles');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, [ollama.enabled]); // Recharger quand Ollama est activé/désactivé

  const selectedModelDisplayName = selectedModel
    ? getModelDisplayName(selectedModel, ollama.modelAliases)
    : 'Sélectionner un modèle';

  // Déterminer la couleur de l'indicateur
  const indicatorColor = error
    ? 'bg-red-400'
    : models.length > 0
      ? 'bg-green-400'
      : 'bg-yellow-400';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="header-btn glass-card gap-3 px-4 min-w-[200px]"
      >
        <div className={`w-2 h-2 rounded-full ${indicatorColor} animate-pulse`} />
        <span className="flex-1 text-left truncate">
          {isLoading ? 'Chargement...' : error ? 'Erreur' : selectedModelDisplayName}
        </span>
        <RefreshCw
          className={`w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            loadModels();
          }}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[9998]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-80 glass-card bg-gray-900/95 rounded-xl p-2 z-[9999] max-h-96 overflow-y-auto">
            {error ? (
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                  <AlertCircle className="w-5 h-5" />
                  <span>Connexion perdue</span>
                </div>
                <p className="text-xs text-muted-foreground pl-7">{error}</p>
                {!ollama.enabled && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-blue-400">
                      💡 Allez dans <span className="font-semibold">Paramètres → AI Locale</span> pour activer Ollama
                    </p>
                  </div>
                )}
              </div>
            ) : models.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                <Download className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p>Aucun modèle disponible</p>
                <p className="text-xs mt-1">
                  Utilisez <code className="bg-white/10 px-1 rounded">ollama pull</code>
                </p>
              </div>
            ) : (
              models.map((model) => {
                const displayName = getModelDisplayName(model.name, ollama.modelAliases);
                const hasAlias = ollama.modelAliases[model.name] !== undefined;

                return (
                  <button
                    key={model.name}
                    onClick={() => {
                      onModelChange(model.name);
                      setIsOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-3 text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{displayName}</div>
                      {hasAlias && (
                        <div className="text-xs text-muted-foreground/70 font-mono truncate">
                          {model.name}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {(model.size / 1024 / 1024 / 1024).toFixed(1)} GB • {model.details.parameter_size}
                      </div>
                    </div>
                    {model.name === selectedModel && (
                      <Check className="w-4 h-4 text-green-400" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
