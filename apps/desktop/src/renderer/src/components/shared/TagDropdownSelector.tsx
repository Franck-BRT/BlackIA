import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { Tag } from '../../hooks/useTags';

interface TagDropdownSelectorProps {
  availableTags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onCreateTag: () => void;
}

export function TagDropdownSelector({
  availableTags,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
}: TagDropdownSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedTags = availableTags.filter((tag) => selectedTagIds.includes(tag.id));
  const unselectedTags = availableTags.filter((tag) => !selectedTagIds.includes(tag.id));

  const handleSelectTag = (tagId: string) => {
    onToggleTag(tagId);
    setIsOpen(false);
  };

  return (
    <div className="space-y-3">
      {/* Tags sélectionnés */}
      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTags.map((tag) => (
            <div
              key={tag.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all"
              style={{
                backgroundColor: `${tag.color}20`,
                border: `1px solid ${tag.color}40`,
                color: tag.color,
              }}
            >
              {tag.icon && <span>{tag.icon}</span>}
              <span>{tag.name}</span>
              <button
                type="button"
                onClick={() => onToggleTag(tag.id)}
                className="hover:opacity-70 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dropdown et bouton créer */}
      <div className="flex gap-2">
        {/* Dropdown pour sélectionner un tag */}
        <div className="flex-1 relative">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-4 py-2 glass-card rounded-lg text-left flex items-center justify-between hover:glass-lg transition-all"
          >
            <span className="text-sm text-muted-foreground">
              {unselectedTags.length === 0
                ? 'Tous les tags sont sélectionnés'
                : 'Sélectionner un tag...'}
            </span>
            <svg
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {isOpen && unselectedTags.length > 0 && (
            <>
              {/* Backdrop pour fermer le dropdown */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />

              {/* Menu */}
              <div className="absolute top-full left-0 right-0 mt-1 glass-card rounded-lg border border-border/20 shadow-xl z-20 max-h-64 overflow-y-auto">
                {unselectedTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleSelectTag(tag.id)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {/* Icon */}
                    <div
                      className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-sm"
                      style={{ backgroundColor: tag.color + '40' }}
                    >
                      {tag.icon || '🏷️'}
                    </div>

                    {/* Name */}
                    <span className="text-sm">{tag.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bouton créer un nouveau tag */}
        <button
          type="button"
          onClick={onCreateTag}
          className="px-4 py-2 glass-card rounded-lg hover:glass-lg transition-all flex items-center gap-2 whitespace-nowrap"
          title="Créer un nouveau tag"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Nouveau tag</span>
        </button>
      </div>

      {/* Message si aucun tag disponible */}
      {availableTags.length === 0 && (
        <div className="text-center py-4 glass-card rounded-lg border border-dashed border-border/30">
          <p className="text-sm text-muted-foreground mb-2">Aucun tag disponible</p>
          <button
            type="button"
            onClick={onCreateTag}
            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Créer le premier tag
          </button>
        </div>
      )}
    </div>
  );
}
