/**
 * Create Library Modal
 * Modal for creating a new library
 */

import React, { useState, useEffect } from 'react';
import { X, FolderOpen, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@blackia/ui';
import type { CreateLibraryInput } from '../../types/library';

interface CreateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: CreateLibraryInput) => Promise<void>;
}

interface EmbeddingModel {
  name: string;
  downloaded: boolean;
  modality?: 'text' | 'vision' | 'multimodal';
  backend?: 'sentence-transformers' | 'mlx' | 'colette';
  description?: string;
}

const ICON_OPTIONS = ['📚', '📖', '📝', '📄', '📋', '🗂️', '📁', '💼', '🎓', '🔬', '⚗️', '🧪'];
const COLOR_OPTIONS = [
  { name: 'Bleu', value: 'blue' },
  { name: 'Violet', value: 'purple' },
  { name: 'Vert', value: 'green' },
  { name: 'Rouge', value: 'red' },
  { name: 'Orange', value: 'orange' },
  { name: 'Rose', value: 'pink' },
  { name: 'Cyan', value: 'cyan' },
  { name: 'Jaune', value: 'yellow' },
];

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

export function CreateLibraryModal({ isOpen, onClose, onCreate }: CreateLibraryModalProps) {
  const [formData, setFormData] = useState<CreateLibraryInput>({
    name: '',
    description: '',
    color: 'blue',
    icon: '📚',
    storagePath: undefined,
    ragConfig: {
      defaultMode: 'auto',
      autoIndex: true,
      text: {
        enabled: true,
        model: undefined,
        chunkSize: 512,
        chunkOverlap: 10,
        separator: 'paragraph',
        customSeparator: '',
      },
      vision: {
        enabled: true,
        model: undefined,
        patchSize: 256,
        patchOverlap: 20,
      },
      hybrid: {
        enabled: true,
        fusionStrategy: 'weighted',
        textWeight: 0.6,
        visionWeight: 0.4,
      },
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<EmbeddingModel[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
      let models: EmbeddingModel[] = [];
      if (result.success && result.data) {
        models = result.data;
      } else if (Array.isArray(result)) {
        models = result;
      }
      setAvailableModels(models);
    } catch (error) {
      console.error('[CreateLibraryModal] Failed to load models:', error);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSelectFolder = async () => {
    try {
      const result = await window.electronAPI.dialog.selectFolder();
      if (result.success && result.path) {
        setFormData({ ...formData, storagePath: result.path });
      }
    } catch (error) {
      console.error('[CreateLibraryModal] Failed to select folder:', error);
      setError('Erreur lors de la sélection du dossier');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    console.log('[CreateLibraryModal] handleSubmit called', formData);

    if (!formData.name.trim()) {
      setError('Le nom est requis');
      return;
    }

    setLoading(true);
    try {
      console.log('[CreateLibraryModal] Calling onCreate with:', formData);
      await onCreate(formData);
      console.log('[CreateLibraryModal] onCreate completed successfully');
      onClose();
      // Reset form
      setFormData({
        name: '',
        description: '',
        color: 'blue',
        icon: '📚',
        ragConfig: formData.ragConfig,
      });
    } catch (err) {
      console.error('[CreateLibraryModal] Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-xl font-semibold text-neutral-100">Nouvelle bibliothèque</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Nom <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
              placeholder="Ma bibliothèque"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 resize-none"
              placeholder="Description de la bibliothèque..."
              rows={3}
              disabled={loading}
            />
          </div>

          {/* Storage Path */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Emplacement de stockage
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.storagePath || ''}
                readOnly
                className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none"
                placeholder="Par défaut: ~/Library/Application Support/BlackIA/libraries/{nom}"
                disabled={loading}
              />
              <button
                type="button"
                onClick={handleSelectFolder}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg transition-colors flex items-center gap-2"
                disabled={loading}
              >
                <FolderOpen className="w-4 h-4" />
                Choisir
              </button>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Laissez vide pour utiliser l'emplacement par défaut
            </p>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">Icône</label>
            <div className="grid grid-cols-12 gap-2">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormData({ ...formData, icon })}
                  className={`p-3 rounded-lg text-2xl transition-colors ${
                    formData.icon === icon
                      ? 'bg-blue-600 ring-2 ring-blue-500'
                      : 'bg-neutral-800 hover:bg-neutral-700'
                  }`}
                  disabled={loading}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">Couleur</label>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_OPTIONS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, color: color.value })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.color === color.value
                      ? `bg-${color.value}-600 text-white ring-2 ring-${color.value}-500`
                      : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                  }`}
                  disabled={loading}
                >
                  {color.name}
                </button>
              ))}
            </div>
          </div>

          {/* RAG Config */}
          <div className="border-t border-neutral-800 pt-6">
            <label className="block text-sm font-medium text-neutral-200 mb-4">
              Configuration RAG par défaut
            </label>

            {/* Auto-index */}
            <div className="flex items-center gap-3 mb-6 p-3 bg-neutral-800/50 rounded-lg">
              <input
                type="checkbox"
                id="autoIndex"
                checked={formData.ragConfig.autoIndex}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ragConfig: { ...formData.ragConfig, autoIndex: e.target.checked },
                  })
                }
                className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-blue-600 focus:ring-blue-500"
                disabled={loading}
              />
              <label htmlFor="autoIndex" className="text-sm text-neutral-300">
                Indexer automatiquement les nouveaux documents
              </label>
            </div>

            <div className="space-y-5">
              {/* Chunk Size */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-200 mb-2">
                  Taille des chunks
                  <span className="text-xs text-neutral-400 font-normal">({formData.ragConfig.text.chunkSize} caractères)</span>
                </label>
                <input
                  type="range"
                  min="128"
                  max="2048"
                  step="64"
                  value={formData.ragConfig.text.chunkSize}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ragConfig: {
                        ...formData.ragConfig,
                        text: { ...formData.ragConfig.text, chunkSize: parseInt(e.target.value) },
                      },
                    })
                  }
                  className="w-full"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-neutral-500 mt-1">
                  <span>128</span>
                  <span>512</span>
                  <span>1024</span>
                  <span>2048</span>
                </div>
              </div>

              {/* Chunk Overlap */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-neutral-200 mb-2">
                  Recouvrement
                  <span className="text-xs text-neutral-400 font-normal">
                    ({formData.ragConfig.text.chunkOverlap} caractères / {Math.round((formData.ragConfig.text.chunkOverlap / formData.ragConfig.text.chunkSize) * 100)}%)
                  </span>
                </label>
                <input
                  type="range"
                  min="0"
                  max={Math.floor(formData.ragConfig.text.chunkSize / 2)}
                  step="10"
                  value={formData.ragConfig.text.chunkOverlap}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ragConfig: {
                        ...formData.ragConfig,
                        text: { ...formData.ragConfig.text, chunkOverlap: parseInt(e.target.value) },
                      },
                    })
                  }
                  className="w-full"
                  disabled={loading}
                />
                <div className="flex justify-between text-xs text-neutral-500 mt-1">
                  <span>0%</span>
                  <span>10%</span>
                  <span>25%</span>
                  <span>50%</span>
                </div>
              </div>

              {/* Separator */}
              <div>
                <label className="text-sm font-medium text-neutral-200 mb-2 block">
                  Séparateur de chunks
                </label>
                <div className="space-y-2">
                  {SEPARATOR_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                        formData.ragConfig.text.separator === option.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-neutral-700 hover:border-neutral-600'
                      )}
                    >
                      <input
                        type="radio"
                        name="separator"
                        value={option.value}
                        checked={formData.ragConfig.text.separator === option.value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ragConfig: {
                              ...formData.ragConfig,
                              text: { ...formData.ragConfig.text, separator: e.target.value as any },
                            },
                          })
                        }
                        className="mt-1"
                        disabled={loading}
                      />
                      <div className="flex-1">
                        <div className="text-sm text-neutral-100">{option.label}</div>
                        <div className="text-xs text-neutral-400">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>

                {formData.ragConfig.text.separator === 'custom' && (
                  <input
                    type="text"
                    placeholder="Ex: \\n---\\n"
                    value={formData.ragConfig.text.customSeparator}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ragConfig: {
                          ...formData.ragConfig,
                          text: { ...formData.ragConfig.text, customSeparator: e.target.value },
                        },
                      })
                    }
                    className="mt-2 w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                    disabled={loading}
                  />
                )}
              </div>

              {/* Mode */}
              <div>
                <label className="text-sm font-medium text-neutral-200 mb-2 block">
                  Mode d'indexation par défaut
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {MODE_OPTIONS.map((option) => (
                    <label
                      key={option.value}
                      className={cn(
                        'flex flex-col gap-1 p-3 rounded-lg border cursor-pointer transition-colors',
                        formData.ragConfig.defaultMode === option.value
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-neutral-700 hover:border-neutral-600'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="mode"
                          value={option.value}
                          checked={formData.ragConfig.defaultMode === option.value}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              ragConfig: { ...formData.ragConfig, defaultMode: e.target.value as any },
                            })
                          }
                          disabled={loading}
                        />
                        <span className="text-sm text-neutral-100">{option.label}</span>
                      </div>
                      <span className="text-xs text-neutral-400 ml-6">{option.description}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Model Selection */}
              <div className="space-y-4 border-t border-neutral-800 pt-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-neutral-200">Modèles par défaut</h4>
                  {loadingModels && <span className="text-xs text-neutral-400">Chargement...</span>}
                </div>

                {/* Text Model */}
                {(formData.ragConfig.defaultMode === 'text' || formData.ragConfig.defaultMode === 'hybrid' || formData.ragConfig.defaultMode === 'auto') && (
                  <div>
                    <label className="flex items-center gap-2 text-sm text-neutral-300 mb-2">
                      Modèle pour RAG textuel
                      <Info className="w-3 h-3 text-neutral-500" />
                    </label>
                    <select
                      value={formData.ragConfig.text.model || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ragConfig: {
                            ...formData.ragConfig,
                            text: { ...formData.ragConfig.text, model: e.target.value || undefined },
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-blue-500"
                      disabled={loading}
                    >
                      <option value="">Utiliser le modèle par défaut</option>
                      {availableModels.filter(m => m.downloaded && (m.modality === 'text' || m.modality === 'multimodal' || !m.modality)).map((model) => (
                        <option key={model.name} value={model.name}>
                          {model.name.split('/').pop()}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Vision Model */}
                {(formData.ragConfig.defaultMode === 'vision' || formData.ragConfig.defaultMode === 'hybrid') && (
                  <div>
                    <label className="flex items-center gap-2 text-sm text-neutral-300 mb-2">
                      Modèle pour RAG visuel
                      <Info className="w-3 h-3 text-neutral-500" />
                    </label>
                    <select
                      value={formData.ragConfig.vision.model || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ragConfig: {
                            ...formData.ragConfig,
                            vision: { ...formData.ragConfig.vision, model: e.target.value || undefined },
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-100 focus:outline-none focus:border-blue-500"
                      disabled={loading}
                    >
                      <option value="">Utiliser le modèle par défaut</option>

                      {/* Colette Models */}
                      {availableModels.filter(m => m.downloaded && m.backend === 'colette').length > 0 && (
                        <optgroup label="Colette/ColPali (Multi-plateforme)">
                          {availableModels.filter(m => m.downloaded && m.backend === 'colette').map((model) => (
                            <option key={model.name} value={model.name}>
                              {model.name.split('/').pop()}
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {/* MLX Models */}
                      {availableModels.filter(m => m.downloaded && m.backend === 'mlx').length > 0 && (
                        <optgroup label="MLX (Apple Silicon uniquement)">
                          {availableModels.filter(m => m.downloaded && m.backend === 'mlx').map((model) => (
                            <option key={model.name} value={model.name}>
                              {model.name.split('/').pop()}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
