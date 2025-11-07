import React, { useState, useEffect, useMemo } from 'react';
import { User, Star } from 'lucide-react';
import type { Persona } from '../../types/persona';
import { PERSONA_COLOR_CLASSES } from '../../types/persona';

interface PersonaMentionDropdownProps {
  personas: Persona[];
  searchQuery: string;
  onSelect: (persona: Persona) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

export function PersonaMentionDropdown({
  personas,
  searchQuery,
  onSelect,
  onClose,
  position,
}: PersonaMentionDropdownProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filtrer les personas selon la recherche
  const filteredPersonas = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) {
      // Pas de recherche : afficher tous, favoris en premier
      return personas.sort((a, b) => {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return a.name.localeCompare(b.name);
      });
    }

    // Filtrer par nom, description ou catégorie
    const filtered = personas.filter(
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
  }, [personas, searchQuery]);

  // Réinitialiser la sélection quand la liste change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredPersonas.length]);

  // Gestion du clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % filteredPersonas.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + filteredPersonas.length) % filteredPersonas.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredPersonas[selectedIndex]) {
            onSelect(filteredPersonas[selectedIndex]);
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
  }, [filteredPersonas, selectedIndex, onSelect, onClose]);

  // Auto-scroll vers l'élément sélectionné
  useEffect(() => {
    const selectedElement = document.getElementById(`persona-mention-${selectedIndex}`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  if (filteredPersonas.length === 0) {
    return (
      <div
        className="absolute glass-card bg-gray-900/95 rounded-xl p-4 shadow-xl border border-white/10 z-[9999] min-w-[300px] max-w-[400px]"
        style={position ? { top: position.top, left: position.left } : {}}
      >
        <div className="text-center text-muted-foreground text-sm">
          <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>Aucun persona trouvé</p>
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
          {filteredPersonas.length} persona{filteredPersonas.length > 1 ? 's' : ''} • ↑↓ pour naviguer • Enter pour sélectionner
        </div>
      </div>

      {/* Liste des personas */}
      <div className="overflow-y-auto flex-1 p-2">
        {filteredPersonas.map((persona, index) => {
          const colorGradient = PERSONA_COLOR_CLASSES[persona.color] || PERSONA_COLOR_CLASSES.purple;
          const isSelected = index === selectedIndex;

          return (
            <button
              key={persona.id}
              id={`persona-mention-${index}`}
              onClick={() => onSelect(persona)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left ${
                isSelected
                  ? 'bg-blue-500/20 ring-1 ring-blue-500/50'
                  : 'hover:bg-white/5'
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorGradient} flex items-center justify-center text-lg flex-shrink-0`}
              >
                {persona.avatar}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{persona.name}</span>
                  {persona.isFavorite && (
                    <Star className="w-3 h-3 text-yellow-400 flex-shrink-0" fill="currentColor" />
                  )}
                </div>
                {persona.category && (
                  <div className="text-xs text-muted-foreground truncate">{persona.category}</div>
                )}
              </div>

              {/* Indicateur de sélection */}
              {isSelected && (
                <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/10 flex-shrink-0">
        <div className="text-xs text-muted-foreground">
          💡 Le persona sera appliqué uniquement à ce message
        </div>
      </div>
    </div>
  );
}
