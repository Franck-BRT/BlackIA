/**
 * Create Library Modal
 * Modal for creating a new library
 */

import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { CreateLibraryInput } from '../../types/library';

interface CreateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: CreateLibraryInput) => Promise<void>;
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

export function CreateLibraryModal({ isOpen, onClose, onCreate }: CreateLibraryModalProps) {
  const [formData, setFormData] = useState<CreateLibraryInput>({
    name: '',
    description: '',
    color: 'blue',
    icon: '📚',
    ragConfig: {
      defaultMode: 'auto',
      autoIndex: true,
      text: {
        enabled: true,
        model: 'nomic-embed-text',
        chunkSize: 512,
        chunkOverlap: 10,
        separator: 'paragraph',
      },
      vision: {
        enabled: false,
        model: 'qwen2-vl-2b',
        patchSize: 256,
        patchOverlap: 20,
      },
      hybrid: {
        enabled: false,
        fusionStrategy: 'weighted',
        textWeight: 0.6,
        visionWeight: 0.4,
      },
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Le nom est requis');
      return;
    }

    setLoading(true);
    try {
      await onCreate(formData);
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
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-3">
              Configuration RAG
            </label>

            {/* Auto-index */}
            <div className="flex items-center gap-3 mb-4">
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

            {/* Text RAG */}
            <div className="p-4 bg-neutral-800 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="textEnabled"
                  checked={formData.ragConfig.text.enabled}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ragConfig: {
                        ...formData.ragConfig,
                        text: { ...formData.ragConfig.text, enabled: e.target.checked },
                      },
                    })
                  }
                  className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-blue-600 focus:ring-blue-500"
                  disabled={loading}
                />
                <label htmlFor="textEnabled" className="text-sm font-medium text-neutral-200">
                  Text RAG
                </label>
              </div>

              {formData.ragConfig.text.enabled && (
                <div className="ml-7 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">
                        Taille des chunks
                      </label>
                      <input
                        type="number"
                        value={formData.ragConfig.text.chunkSize}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ragConfig: {
                              ...formData.ragConfig,
                              text: {
                                ...formData.ragConfig.text,
                                chunkSize: parseInt(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-sm text-neutral-100 focus:outline-none focus:border-blue-500"
                        min={128}
                        max={4096}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">
                        Recouvrement (%)
                      </label>
                      <input
                        type="number"
                        value={formData.ragConfig.text.chunkOverlap}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ragConfig: {
                              ...formData.ragConfig,
                              text: {
                                ...formData.ragConfig.text,
                                chunkOverlap: parseInt(e.target.value),
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-sm text-neutral-100 focus:outline-none focus:border-blue-500"
                        min={0}
                        max={50}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
              )}
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
