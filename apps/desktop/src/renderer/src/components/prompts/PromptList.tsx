import React from 'react';
import { PromptCard } from './PromptCard';
import type { Prompt } from '../../types/prompt';

interface PromptListProps {
  prompts: Prompt[];
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (prompt: Prompt) => void;
  onDuplicate?: (prompt: Prompt) => void;
  onToggleFavorite?: (prompt: Prompt) => void;
  onUse?: (prompt: Prompt) => void;
}

export function PromptList({
  prompts,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onUse,
}: PromptListProps) {
  if (prompts.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {prompts.map((prompt) => (
        <PromptCard
          key={prompt.id}
          prompt={prompt}
          onEdit={onEdit}
          onDelete={onDelete}
          onDuplicate={onDuplicate}
          onToggleFavorite={onToggleFavorite}
          onUse={onUse}
        />
      ))}
    </div>
  );
}
