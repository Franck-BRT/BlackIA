import React from 'react';
import { Plus, Check } from 'lucide-react';
import type { Tag } from '../../hooks/useTags';

interface TagSelectorProps {
  availableTags: Tag[];
  selectedTagIds: string[];
  onToggleTag: (tagId: string) => void;
  onCreateTag: () => void;
}

export function TagSelector({
  availableTags,
  selectedTagIds,
  onToggleTag,
  onCreateTag,
}: TagSelectorProps) {
  return (
    <div className="w-64">
      {/* Header */}
      <div className="px-3 py-2 border-b border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Tags</span>
          <button
            type="button"
            onClick={onCreateTag}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Créer un nouveau tag"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tags list */}
      <div className="max-h-64 overflow-y-auto">
        {availableTags.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            <p>Aucun tag</p>
            <button
              type="button"
              onClick={onCreateTag}
              className="mt-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              Créer le premier tag
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {availableTags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <button
                  type="button"
                  key={tag.id}
                  onClick={() => onToggleTag(tag.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-white/10 hover:bg-white/15'
                      : 'hover:bg-white/5'
                  }`}
                >
                  {/* Icon */}
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 text-sm"
                    style={{ backgroundColor: tag.color + '40' }}
                  >
                    {tag.icon || '🏷️'}
                  </div>

                  {/* Name */}
                  <span className="flex-1 text-left text-sm">{tag.name}</span>

                  {/* Check mark */}
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
