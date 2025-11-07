import React from 'react';
import { Star, Edit, Copy, Trash2, Play } from 'lucide-react';
import type { Persona } from '../../types/persona';
import { PERSONA_COLOR_CLASSES } from '../../types/persona';
import { useTags } from '../../hooks/useTags';

interface PersonaCardProps {
  persona: Persona;
  onEdit?: (persona: Persona) => void;
  onDelete?: (persona: Persona) => void;
  onDuplicate?: (persona: Persona) => void;
  onToggleFavorite?: (persona: Persona) => void;
  onTest?: (persona: Persona) => void;
}

export function PersonaCard({
  persona,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onTest,
}: PersonaCardProps) {
  const colorGradient = PERSONA_COLOR_CLASSES[persona.color] || PERSONA_COLOR_CLASSES.purple;
  const { tags: allTags } = useTags();

  // Parser les tags JSON
  let tags: string[] = [];
  try {
    tags = JSON.parse(persona.tags);
  } catch (e) {
    // Ignore parsing errors
  }

  // Fonction pour résoudre un tag (ID ou nom) vers son nom lisible
  const resolveTagName = (tagValue: string): string => {
    // Si c'est un ID (commence par "tag-"), chercher le nom
    if (tagValue.startsWith('tag-')) {
      const tag = allTags.find((t) => t.id === tagValue);
      return tag ? tag.name : tagValue;
    }
    // Sinon, c'est déjà un nom
    return tagValue;
  };

  return (
    <div className="glass-card rounded-xl p-6 hover:scale-[1.02] transition-all duration-200 group relative">
      {/* Header avec avatar et actions */}
      <div className="flex items-start justify-between mb-4">
        {/* Avatar */}
        <div
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorGradient} flex items-center justify-center text-3xl`}
        >
          {persona.avatar}
        </div>

        {/* Actions */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(persona)}
              className={`p-2 rounded-lg hover:glass-lg transition-all ${
                persona.isFavorite ? 'text-yellow-400' : 'text-muted-foreground'
              }`}
              title={persona.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Star className="w-4 h-4" fill={persona.isFavorite ? 'currentColor' : 'none'} />
            </button>
          )}

          {onEdit && (
            <button
              onClick={() => onEdit(persona)}
              className="p-2 rounded-lg hover:glass-lg transition-all text-muted-foreground hover:text-foreground"
              title="Éditer"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          {onDuplicate && (
            <button
              onClick={() => onDuplicate(persona)}
              className="p-2 rounded-lg hover:glass-lg transition-all text-muted-foreground hover:text-foreground"
              title="Dupliquer"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}

          {onTest && (
            <button
              onClick={() => onTest(persona)}
              className="p-2 rounded-lg hover:glass-lg transition-all text-muted-foreground hover:text-foreground"
              title="Tester"
            >
              <Play className="w-4 h-4" />
            </button>
          )}

          {!persona.isDefault && onDelete && (
            <button
              onClick={() => onDelete(persona)}
              className="p-2 rounded-lg hover:glass-lg transition-all text-muted-foreground hover:text-red-400"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Nom et catégorie */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
          {persona.name}
          {persona.isDefault && (
            <span className="text-xs px-2 py-0.5 rounded-full glass-lg text-muted-foreground">
              Défaut
            </span>
          )}
        </h3>
        {persona.category && (
          <p className="text-sm text-muted-foreground">{persona.category}</p>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{persona.description}</p>

      {/* System prompt preview */}
      <div className="mb-4 p-3 rounded-lg glass-lg">
        <p className="text-xs text-muted-foreground line-clamp-2 font-mono">
          {persona.systemPrompt}
        </p>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="text-xs px-2 py-1 rounded-md glass-lg text-muted-foreground"
            >
              {resolveTagName(tag)}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-xs px-2 py-1 rounded-md glass-lg text-muted-foreground">
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer avec stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/20">
        <span>{persona.usageCount} utilisations</span>
        {persona.model && <span className="font-mono">{persona.model}</span>}
        {persona.temperature !== null && persona.temperature !== undefined && (
          <span>T: {persona.temperature}</span>
        )}
      </div>
    </div>
  );
}
