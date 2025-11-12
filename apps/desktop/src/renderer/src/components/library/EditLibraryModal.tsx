/**
 * Edit Library Modal
 * Modal for editing an existing library
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Library, UpdateLibraryInput } from '../../types/library';

interface EditLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  library: Library | null;
  onUpdate: (id: string, input: UpdateLibraryInput) => Promise<void>;
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

export function EditLibraryModal({ isOpen, onClose, library, onUpdate }: EditLibraryModalProps) {
  const [formData, setFormData] = useState<UpdateLibraryInput>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with library data
  useEffect(() => {
    if (library) {
      setFormData({
        name: library.name,
        description: library.description,
        color: library.color,
        icon: library.icon,
        isFavorite: library.isFavorite,
      });
    }
  }, [library]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!library) return;

    if (formData.name && !formData.name.trim()) {
      setError('Le nom ne peut pas être vide');
      return;
    }

    setLoading(true);
    try {
      await onUpdate(library.id, formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !library) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-xl font-semibold text-neutral-100">Modifier la bibliothèque</h2>
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
              value={formData.name || ''}
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
              value={formData.description || ''}
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

          {/* Favorite */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isFavorite"
              checked={formData.isFavorite || false}
              onChange={(e) => setFormData({ ...formData, isFavorite: e.target.checked })}
              className="w-4 h-4 rounded border-neutral-700 bg-neutral-800 text-blue-600 focus:ring-blue-500"
              disabled={loading}
            />
            <label htmlFor="isFavorite" className="text-sm text-neutral-300">
              Marquer comme favori
            </label>
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
              disabled={loading || (formData.name && !formData.name.trim())}
            >
              {loading ? 'Modification...' : 'Modifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
