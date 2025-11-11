import React from 'react';
import { PersonaCard } from './PersonaCard';
import type { Persona } from '../../types/persona';

interface PersonaListProps {
  personas: Persona[];
  onEdit?: (persona: Persona) => void;
  onDelete?: (persona: Persona) => void;
  onDuplicate?: (persona: Persona) => void;
  onToggleFavorite?: (persona: Persona) => void;
  onTest?: (persona: Persona) => void;
  emptyMessage?: string;
}

export function PersonaList({
  personas,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onTest,
  emptyMessage = 'Aucune persona trouvée',
}: PersonaListProps) {
  if (personas.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
      {personas.map((persona) => (
        <PersonaCard
          key={persona.id}
          persona={persona}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onToggleFavorite={onToggleFavorite}
          onTest={onTest}
        />
      ))}
    </div>
  );
}
