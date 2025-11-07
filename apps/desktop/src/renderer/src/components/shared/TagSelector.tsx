import React, { useState } from 'react';
import { X, Plus, Tag as TagIcon } from 'lucide-react';
import { useTags, type Tag } from '../../hooks/useTags';

interface TagSelectorProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

const TAG_COLORS = [
  { name: 'Rouge', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Jaune', value: '#eab308' },
  { name: 'Vert', value: '#22c55e' },
  { name: 'Bleu', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Violet', value: '#a855f7' },
  { name: 'Rose', value: '#ec4899' },
  { name: 'Gris', value: '#6b7280' },
];

export function TagSelector({ selectedTagIds, onChange }: TagSelectorProps) {
  const { tags, createTag } = useTags();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[4].value); // Bleu par défaut
  const [newTagIcon, setNewTagIcon] = useState('🏷️');

  const selectedTags = tags.filter((tag) => selectedTagIds.includes(tag.id));
  const availableTags = tags.filter((tag) => !selectedTagIds.includes(tag.id));

  const handleToggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      // Retirer le tag
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      // Ajouter le tag
      onChange([...selectedTagIds, tagId]);
    }
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;

    const newTag = createTag(newTagName.trim(), newTagColor, newTagIcon);
    onChange([...selectedTagIds, newTag.id]);

    // Réinitialiser le formulaire
    setNewTagName('');
    setNewTagColor(TAG_COLORS[4].value);
    setNewTagIcon('🏷️');
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-3">
      {/* Tags sélectionnés */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleToggleTag(tag.id)}
              className="px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-all hover:opacity-80"
              style={{
                backgroundColor: `${tag.color}20`,
                border: `1px solid ${tag.color}40`,
                color: tag.color,
              }}
            >
              {tag.icon && <span>{tag.icon}</span>}
              <span>{tag.name}</span>
              <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      {/* Tags disponibles */}
      {availableTags.length > 0 && (
        <div>
          <label className="block text-xs font-medium mb-2 text-muted-foreground">
            Tags disponibles
          </label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleToggleTag(tag.id)}
                className="px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm glass-card hover:glass-lg transition-all"
              >
                {tag.icon && <span>{tag.icon}</span>}
                <span>{tag.name}</span>
                <Plus className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bouton créer nouveau tag */}
      {!showCreateForm && (
        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="w-full px-4 py-2 glass-card rounded-lg hover:glass-lg transition-all flex items-center justify-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" />
          Créer un nouveau tag
        </button>
      )}

      {/* Formulaire création tag */}
      {showCreateForm && (
        <div className="glass-card rounded-lg p-4 space-y-3 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Nouveau tag</label>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="p-1 rounded hover:bg-white/5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nom du tag */}
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Nom du tag..."
            className="w-full px-3 py-2 bg-background/50 border border-border/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
            autoFocus
          />

          {/* Icône du tag */}
          <div>
            <label className="block text-xs font-medium mb-2 text-muted-foreground">
              Icône (emoji)
            </label>
            <input
              type="text"
              value={newTagIcon}
              onChange={(e) => setNewTagIcon(e.target.value)}
              placeholder="🏷️"
              maxLength={2}
              className="w-full px-3 py-2 bg-background/50 border border-border/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
            />
          </div>

          {/* Couleur */}
          <div>
            <label className="block text-xs font-medium mb-2 text-muted-foreground">
              Couleur
            </label>
            <div className="grid grid-cols-9 gap-2">
              {TAG_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setNewTagColor(color.value)}
                  className={`w-8 h-8 rounded-lg transition-all ${
                    newTagColor === color.value
                      ? 'ring-2 ring-offset-2 ring-offset-background scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: color.value,
                    ringColor: color.value,
                  }}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Aperçu */}
          <div>
            <label className="block text-xs font-medium mb-2 text-muted-foreground">
              Aperçu
            </label>
            <div
              className="inline-flex px-3 py-1.5 rounded-lg items-center gap-2 text-sm"
              style={{
                backgroundColor: `${newTagColor}20`,
                border: `1px solid ${newTagColor}40`,
                color: newTagColor,
              }}
            >
              {newTagIcon && <span>{newTagIcon}</span>}
              <span>{newTagName || 'Nom du tag'}</span>
            </div>
          </div>

          {/* Boutons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleCreateTag}
              disabled={!newTagName.trim()}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg hover:scale-105 transition-transform text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              Créer le tag
            </button>
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-2 glass-card rounded-lg hover:glass-lg transition-all text-sm"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {selectedTags.length === 0 && availableTags.length === 0 && !showCreateForm && (
        <div className="text-center py-4 glass-card rounded-lg border border-dashed border-border/30">
          <TagIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            Aucun tag pour le moment. Créez-en un !
          </p>
        </div>
      )}
    </div>
  );
}
