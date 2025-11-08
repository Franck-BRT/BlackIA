import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Star } from 'lucide-react';
import type { Prompt } from '../../types/prompt';
import { PROMPT_COLOR_CLASSES } from '../../types/prompt';

interface PromptMentionDropdownProps {
  prompts: Prompt[];
  searchQuery: string;
  onSelect: (prompt: Prompt) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

export function PromptMentionDropdown({
  prompts,
  searchQuery,
  onSelect,
  onClose,
  position,
}: PromptMentionDropdownProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filtrer les prompts selon la recherche
  const filteredPrompts = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      // Pas de recherche : afficher tous, favoris en premier
      return prompts.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return a.name.localeCompare(b.name);
      });
    }

    // Filtrer par nom, description ou catégorie
    const filtered = prompts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
    );

    // Trier : correspondance exacte d'abord, puis favoris, puis alphabétique
    return filtered.sort((a, b) => {
      const aExact = a.name.toLowerCase() === query;
      const bExact = b.name.toLowerCase() === query;

      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;

      return a.name.localeCompare(b.name);
    });
  }, [prompts, searchQuery]);

  // Réinitialiser la sélection quand la liste change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredPrompts.length]);

  // Gestion du clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredPrompts.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredPrompts.length) % filteredPrompts.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredPrompts[selectedIndex]) {
            onSelect(filteredPrompts[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredPrompts, selectedIndex, onSelect, onClose]);

  // Auto-scroll vers l'élément sélectionné
  useEffect(() => {
    const selectedElement = document.getElementById(`prompt-mention-${selectedIndex}`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (filteredPrompts.length === 0) {
    return (
      <div
        className="absolute glass-card bg-gray-900/95 rounded-xl p-4 shadow-xl border border-white/10 z-[9999] min-w-[300px] max-w-[400px]"
        style={position ? { top: position.top, left: position.left } : {}}
      >
        <div className="text-center text-muted-foreground text-sm">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Aucun prompt trouvé</p>
          <p className="text-xs mt-1">Essayez un autre nom</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute glass-card bg-gray-900/95 rounded-xl shadow-xl border border-white/10 z-[9999] min-w-[300px] max-w-[400px] max-h-[400px] overflow-hidden flex flex-col"
      style={position ? { top: position.top, left: position.left } : {}}
    >
      {/* Header */}
      <div className="px-4 py-2 border-b border-white/10 flex-shrink-0">
        <div className="text-xs text-muted-foreground">
          {filteredPrompts.length} prompt{filteredPrompts.length > 1 ? 's' : ''} • ↑↓ pour naviguer • Enter pour sélectionner
        </div>
      </div>

      {/* Liste des prompts */}
      <div className="overflow-y-auto flex-1 p-2">
        {filteredPrompts.map((prompt, index) => {
          const colorGradient = PROMPT_COLOR_CLASSES[prompt.color] || PROMPT_COLOR_CLASSES.purple;
          const isSelected = index === selectedIndex;

          // Extraire les variables
          let variablesCount = 0;
          try {
            const vars = JSON.parse(prompt.variables);
            variablesCount = vars.length;
          } catch (e) {
            // ignore
          }

          return (
            <button
              key={prompt.id}
              id={`prompt-mention-${index}`}
              onClick={() => onSelect(prompt)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                isSelected
                  ? 'bg-green-500/20 ring-1 ring-green-500/50'
                  : 'hover:bg-white/5'
              }`}
            >
              {/* Icon */}
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorGradient} flex items-center justify-center text-lg flex-shrink-0`}
              >
                {prompt.icon}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{prompt.name}</span>
                  {prompt.isFavorite && (
                    <Star className="w-3 h-3 text-yellow-400 flex-shrink-0" fill="currentColor" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {prompt.category && <span className="truncate">{prompt.category}</span>}
                  {variablesCount > 0 && (
                    <>
                      {prompt.category && <span>•</span>}
                      <span>{variablesCount} variable{variablesCount > 1 ? 's' : ''}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Indicateur de sélection */}
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/10 flex-shrink-0">
        <div className="text-xs text-muted-foreground">
          💡 Le prompt sera inséré dans votre message
        </div>
      </div>
    </div>
  );
}
