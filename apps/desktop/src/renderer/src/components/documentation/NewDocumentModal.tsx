import React, { useState } from 'react';
import { X } from 'lucide-react';

interface NewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (metadata: DocumentMetadata) => void;
  importedContent?: string;
}

export interface DocumentMetadata {
  title: string;
  slug: string;
  category: 'guide' | 'features' | 'roadmap' | 'api' | 'faq' | 'changelog';
  description?: string;
  icon?: string;
  content?: string;
}

export function NewDocumentModal({ isOpen, onClose, onConfirm, importedContent }: NewDocumentModalProps) {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<DocumentMetadata['category']>('guide');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('📄');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !slug) {
      alert('Le titre et le slug sont requis');
      return;
    }

    onConfirm({
      title,
      slug: `${category}/${slug}`,
      category,
      description,
      icon,
      content: importedContent,
    });

    // Reset form
    setTitle('');
    setSlug('');
    setCategory('guide');
    setDescription('');
    setIcon('📄');
  };

  // Auto-generate slug from title
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug) {
      const generatedSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      setSlug(generatedSlug);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="glass-card p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">
            {importedContent ? 'Importer un document' : 'Nouveau document'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Titre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
              placeholder="Mon nouveau document"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Slug <span className="text-red-400">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{category}/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
                placeholder="mon-document"
                pattern="[a-z0-9-]+"
                title="Uniquement des lettres minuscules, chiffres et tirets"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              URL finale: {category}/{slug || 'mon-document'}
            </p>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Catégorie <span className="text-red-400">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentMetadata['category'])}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
              required
            >
              <option value="guide">📖 Guide</option>
              <option value="features">⚡ Fonctionnalités</option>
              <option value="roadmap">🗺️ Roadmap</option>
              <option value="api">🔧 API & Technique</option>
              <option value="faq">❓ FAQ</option>
              <option value="changelog">📝 Changelog</option>
            </select>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Icône (emoji)
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none"
              placeholder="📄"
              maxLength={2}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-purple-500 focus:outline-none resize-none"
              rows={3}
              placeholder="Brève description du document..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 transition-colors"
            >
              {importedContent ? 'Importer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
