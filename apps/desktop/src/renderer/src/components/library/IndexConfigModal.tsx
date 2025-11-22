/**
 * Modal de configuration de l'indexation
 * Permet de configurer les paramètres avant la réindexation
 */

import React, { useState, useEffect } from 'react';
import { X, Settings, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@blackia/ui';

interface EmbeddingModel {
  name: string;
  downloaded: boolean;
  modality?: 'text' | 'vision' | 'multimodal';
  backend?: 'sentence-transformers' | 'mlx' | 'colette';
  description?: string;
}

interface IndexConfig {
  chunkSize: number;
  chunkOverlap: number;
  separator: 'paragraph' | 'sentence' | 'line' | 'custom';
  customSeparator?: string;
  mode: 'text' | 'vision' | 'hybrid' | 'auto';
  textModel?: string;
  visionModel?: string;
  forceReindex: boolean;
}

interface IndexConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: IndexConfig) => void;
  currentConfig?: Partial<IndexConfig>;
}

const SEPARATOR_OPTIONS = [
  { value: 'paragraph', label: 'Paragraphe (\\n\\n)', description: 'Sépare sur les doubles sauts de ligne' },
  { value: 'sentence', label: 'Phrase (.!?)', description: 'Sépare sur les fins de phrase' },
  { value: 'line', label: 'Ligne (\\n)', description: 'Sépare sur les sauts de ligne simples' },
  { value: 'custom', label: 'Personnalisé', description: 'Définir votre propre séparateur' },
] as const;

const MODE_OPTIONS = [
  { value: 'auto', label: 'Auto', description: 'Détection automatique selon le type de document' },
  { value: 'text', label: 'Text RAG', description: 'Indexation textuelle uniquement' },
  { value: 'vision', label: 'Vision RAG', description: 'Indexation visuelle uniquement (PDFs)' },
  { value: 'hybrid', label: 'Hybride', description: 'Combinaison text + vision' },
] as const;

export function IndexConfigModal({ isOpen, onClose, onConfirm, currentConfig }: IndexConfigModalProps) {
  const [config, setConfig] = useState<IndexConfig>({
    chunkSize: currentConfig?.chunkSize || 512,
    chunkOverlap: currentConfig?.chunkOverlap || 10,
    separator: currentConfig?.separator || 'paragraph',
    customSeparator: currentConfig?.customSeparator || '',
    mode: currentConfig?.mode || 'auto',
    textModel: currentConfig?.textModel,
    visionModel: currentConfig?.visionModel,
    forceReindex: currentConfig?.forceReindex ?? true,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [availableModels, setAvailableModels] = useState<EmbeddingModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Charger les modèles disponibles quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      loadAvailableModels();
    }
  }, [isOpen]);

  const loadAvailableModels = async () => {
    setLoadingModels(true);
    try {
      const result = await window.electronAPI.mlx.embeddings.list();
      // Handle both response formats
      let models: EmbeddingModel[] = [];
      if (result.success && result.data) {
        models = result.data;
      } else if (Array.isArray(result)) {
        models = result;
      }
      setAvailableModels(models);
    } catch (error) {
      console.error('[IndexConfigModal] Failed to load models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  // Réinitialiser quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && currentConfig) {
      setConfig({
        chunkSize: currentConfig.chunkSize || 512,
        chunkOverlap: currentConfig.chunkOverlap || 10,
        separator: currentConfig.separator || 'paragraph',
        customSeparator: currentConfig.customSeparator || '',
        mode: currentConfig.mode || 'auto',
        textModel: currentConfig.textModel,
        visionModel: currentConfig.visionModel,
        forceReindex: currentConfig.forceReindex ?? true,
      });
    }
  }, [isOpen, currentConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(config);
    onClose();
  };

  const overlapPercent = Math.round((config.chunkOverlap / config.chunkSize) * 100);

  // Helper pour vérifier si un modèle est compatible avec un mode
  const isModelCompatible = (model: EmbeddingModel, requiredModality: 'text' | 'vision') => {
    if (!model.modality) return true; // Si pas de modalité spécifiée, on assume compatible
    return model.modality === requiredModality || model.modality === 'multimodal';
  };

  // Filtrer les modèles selon leur compatibilité
  const downloadedModels = availableModels.filter(m => m.downloaded);
  const textCompatibleModels = downloadedModels.filter(m => isModelCompatible(m, 'text'));
  const visionCompatibleModels = downloadedModels.filter(m => isModelCompatible(m, 'vision'));

  // Séparer les modèles vision par backend
  const coletteModels = visionCompatibleModels.filter(m => m.backend === 'colette');
  const mlxModels = visionCompatibleModels.filter(m => m.backend === 'mlx');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-neutral-100">Configuration de l'indexation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-6">
          {/* Taille des chunks */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-200 mb-2">
              Taille des chunks
              <span className="text-xs text-neutral-400 font-normal">({config.chunkSize} caractères)</span>
            </label>
            <input
              type="range"
              min="128"
              max="2048"
              step="64"
              value={config.chunkSize}
              onChange={(e) => setConfig({ ...config, chunkSize: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>128 (petit)</span>
              <span>512 (défaut)</span>
              <span>1024 (moyen)</span>
              <span>2048 (grand)</span>
            </div>
            <p className="text-xs text-neutral-400 mt-2 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Des chunks plus petits donnent des résultats plus précis mais peuvent perdre du contexte. Des chunks plus grands préservent le contexte mais sont moins précis.</span>
            </p>
          </div>

          {/* Recouvrement */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-neutral-200 mb-2">
              Recouvrement (overlap)
              <span className="text-xs text-neutral-400 font-normal">({config.chunkOverlap} caractères / {overlapPercent}%)</span>
            </label>
            <input
              type="range"
              min="0"
              max={Math.floor(config.chunkSize / 2)}
              step="10"
              value={config.chunkOverlap}
              onChange={(e) => setConfig({ ...config, chunkOverlap: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-neutral-500 mt-1">
              <span>0% (aucun)</span>
              <span>10% (défaut)</span>
              <span>25%</span>
              <span>50% (max)</span>
            </div>
            <p className="text-xs text-neutral-400 mt-2 flex items-start gap-1">
              <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>Le recouvrement permet de conserver le contexte entre les chunks. Un overlap de 10-20% est recommandé.</span>
            </p>
          </div>

          {/* Séparateur */}
          <div>
            <label className="text-sm font-medium text-neutral-200 mb-2 block">
              Séparateur de chunks
            </label>
            <div className="space-y-2">
              {SEPARATOR_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    config.separator === option.value
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-neutral-700 hover:border-neutral-600"
                  )}
                >
                  <input
                    type="radio"
                    name="separator"
                    value={option.value}
                    checked={config.separator === option.value}
                    onChange={(e) => setConfig({ ...config, separator: e.target.value as any })}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="text-sm text-neutral-100">{option.label}</div>
                    <div className="text-xs text-neutral-400">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>

            {config.separator === 'custom' && (
              <input
                type="text"
                placeholder="Ex: \\n---\\n"
                value={config.customSeparator}
                onChange={(e) => setConfig({ ...config, customSeparator: e.target.value })}
                className="mt-2 w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
              />
            )}
          </div>

          {/* Mode d'indexation */}
          <div>
            <label className="text-sm font-medium text-neutral-200 mb-2 block">
              Mode d'indexation
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MODE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-colors",
                    config.mode === option.value
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-neutral-700 hover:border-neutral-600"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="mode"
                      value={option.value}
                      checked={config.mode === option.value}
                      onChange={(e) => setConfig({ ...config, mode: e.target.value as any })}
                    />
                    <span className="text-sm text-neutral-100">{option.label}</span>
                  </div>
                  <span className="text-xs text-neutral-400 ml-6">{option.description}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sélection des modèles */}
          <div className="space-y-4 border-t border-neutral-800 pt-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-neutral-200">Modèles d'embedding</h3>
              {loadingModels && <span className="text-xs text-neutral-400">Chargement...</span>}
            </div>

            {/* Modèle pour RAG textuel */}
            {(config.mode === 'text' || config.mode === 'hybrid' || config.mode === 'auto') && (
              <div>
                <label className="flex items-center gap-2 text-sm text-neutral-300 mb-2">
                  Modèle pour RAG textuel
                  <Info className="w-3 h-3 text-neutral-500" />
                </label>
                <select
                  value={config.textModel || ''}
                  onChange={(e) => setConfig({ ...config, textModel: e.target.value || undefined })}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Utiliser le modèle par défaut</option>
                  {textCompatibleModels.map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.name.split('/').pop()} {model.modality === 'text' && '(Text only)'}
                    </option>
                  ))}
                </select>
                {textCompatibleModels.length === 0 && !loadingModels && (
                  <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Aucun modèle compatible avec le RAG textuel n'est téléchargé
                  </p>
                )}
              </div>
            )}

            {/* Modèle pour RAG visuel */}
            {(config.mode === 'vision' || config.mode === 'hybrid' || config.mode === 'auto') && (
              <div>
                <label className="flex items-center gap-2 text-sm text-neutral-300 mb-2">
                  Modèle pour RAG visuel
                  <Info className="w-3 h-3 text-neutral-500" />
                </label>
                <select
                  value={config.visionModel || ''}
                  onChange={(e) => setConfig({ ...config, visionModel: e.target.value || undefined })}
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="">Utiliser le modèle par défaut</option>

                  {/* Colette/ColPali models (PyTorch - Multi-platform) */}
                  {coletteModels.length > 0 && (
                    <optgroup label="Colette/ColPali (PyTorch - Multi-plateforme)">
                      {coletteModels.map((model) => (
                        <option key={model.name} value={model.name}>
                          {model.name.split('/').pop()} {model.modality === 'multimodal' && '(Multimodal)'}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {/* MLX models (Apple Silicon only) */}
                  {mlxModels.length > 0 && (
                    <optgroup label="MLX (Apple Silicon uniquement)">
                      {mlxModels.map((model) => (
                        <option key={model.name} value={model.name}>
                          {model.name.split('/').pop()} {model.modality === 'multimodal' && '(Multimodal)'}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                {/* Info sur les backends */}
                {visionCompatibleModels.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {coletteModels.length > 0 && (
                      <p className="text-xs text-neutral-400 flex items-start gap-1">
                        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span><strong>Colette/ColPali:</strong> Modèles PyTorch fonctionnant sur toutes plateformes (Mac, Windows, Linux)</span>
                      </p>
                    )}
                    {mlxModels.length > 0 && (
                      <p className="text-xs text-neutral-400 flex items-start gap-1">
                        <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span><strong>MLX:</strong> Modèles optimisés pour Apple Silicon (M1/M2/M3) - performances maximales sur Mac</span>
                      </p>
                    )}
                  </div>
                )}

                {visionCompatibleModels.length === 0 && !loadingModels && (
                  <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Aucun modèle compatible avec le RAG visuel n'est téléchargé. Téléchargez un modèle ColPali (vidore/colpali) ou MLX (mlx-community/Qwen2-VL-*).
                  </p>
                )}
              </div>
            )}

            {/* Info sur les modèles multimodaux */}
            {(config.mode === 'hybrid' || config.mode === 'auto') && (
              <p className="text-xs text-neutral-400 flex items-start gap-1">
                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>
                  {config.mode === 'auto'
                    ? "Le mode auto détecte automatiquement si le document nécessite une indexation textuelle, visuelle ou les deux."
                    : "Le mode hybride combine les embeddings textuels et visuels. Pour le RAG visuel, des modèles multimodaux (comme CLIP) seront nécessaires."
                  }
                </span>
              </p>
            )}
          </div>

          {/* Options avancées */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {showAdvanced ? '▼' : '▶'} Options avancées
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 pl-4 border-l-2 border-neutral-700">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.forceReindex}
                    onChange={(e) => setConfig({ ...config, forceReindex: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-neutral-200">Forcer la réindexation</span>
                  <span className="text-xs text-neutral-400">(supprimer l'index existant)</span>
                </label>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-800 bg-neutral-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-neutral-700 hover:bg-white/5 transition-colors text-sm"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Appliquer et réindexer
          </button>
        </div>
      </div>
    </div>
  );
}
