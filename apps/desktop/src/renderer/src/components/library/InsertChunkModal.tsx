/**
 * Insert Chunk Modal
 * Modal for inserting a new chunk manually
 */

import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface InsertChunkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (text: string, reason: string) => Promise<void>;
}

export function InsertChunkModal({ isOpen, onClose, onInsert }: InsertChunkModalProps) {
  const [text, setText] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!text.trim()) {
      setError('Le texte du chunk est requis');
      return;
    }

    setLoading(true);
    try {
      await onInsert(text, reason || 'Manually inserted');
      setText('');
      setReason('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'insertion');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-xl font-semibold text-neutral-100">Insérer un nouveau chunk</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
            disabled={loading}
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

          {/* Chunk Text */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Texte du chunk <span className="text-red-400">*</span>
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Entrez le texte du nouveau chunk..."
              className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 resize-none font-mono"
              rows={8}
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-neutral-400 mt-2">
              {text.length} caractères
            </p>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">
              Raison de l'insertion
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Pourquoi ce chunk est ajouté..."
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
              disabled={loading}
            />
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
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loading || !text.trim()}
            >
              <Plus className="w-4 h-4" />
              {loading ? 'Insertion...' : 'Insérer le chunk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
