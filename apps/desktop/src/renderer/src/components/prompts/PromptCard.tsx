import React from 'react';
import { Star, Edit, Copy, Trash2, FileText, Variable, Download } from 'lucide-react';
import type { Prompt } from '../../types/prompt';
import { PROMPT_COLOR_CLASSES, extractVariables } from '../../types/prompt';
import { useTags } from '../../hooks/useTags';
import { useSettings } from '../../contexts/SettingsContext';

interface PromptCardProps {
  prompt: Prompt;
  onEdit?: (prompt: Prompt) => void;
  onDelete?: (prompt: Prompt) => void;
  onDuplicate?: (prompt: Prompt) => void;
  onToggleFavorite?: (prompt: Prompt) => void;
  onUse?: (prompt: Prompt) => void;
}

export function PromptCard({
  prompt,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onUse,
}: PromptCardProps) {
  const colorGradient = PROMPT_COLOR_CLASSES[prompt.color] || PROMPT_COLOR_CLASSES.purple;
  const { tags: allTags } = useTags();

  // Récupérer la taille de carte depuis les paramètres
  const { settings } = useSettings();
  const cardSize = settings.appearance.cardSize || 320;
  const minHeight = Math.round((cardSize / 320) * 420);

  // Parser les tags JSON
  let rawTags: string[] = [];
  try {
    rawTags = JSON.parse(prompt.tags);
  } catch (e) {
    // Ignore parsing errors
  }

  // Fonction pour résoudre un tag (ID ou nom) vers son nom lisible
  // Retourne null si le tag n'existe pas (pour pouvoir le filtrer)
  const resolveTagName = (tagValue: string): string | null => {
    // Si c'est un ID (commence par "tag-"), chercher le nom
    if (tagValue.startsWith('tag-')) {
      const tag = allTags.find((t) => t.id === tagValue);
      return tag ? tag.name : null; // Retourner null si non trouvé
    }
    // Sinon, c'est déjà un nom (ancien système)
    return tagValue;
  };

  // Résoudre tous les tags et filtrer ceux qui n'existent plus
  const tags = rawTags
    .map(resolveTagName)
    .filter((name): name is string => name !== null);

  // Extraire les variables
  const variables = extractVariables(prompt.content);

  // Fonction pour exporter ce prompt
  const handleExport = () => {
    try {
      const jsonData = JSON.stringify([prompt], null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `prompt-${prompt.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[PromptCard] Error exporting prompt:', error);
      alert('Erreur lors de l\'export du prompt');
    }
  };

  return (
    <div
      style={{
        width: `${cardSize}px`,
        minHeight: `${minHeight}px`,
      }}
      className="glass-card rounded-xl p-6 hover:scale-[1.02] transition-all duration-200 group relative flex flex-col"
    >
      {/* Header avec icône et actions */}
      <div className="flex items-start justify-between mb-4">
        {/* Icône */}
        <div
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorGradient} flex items-center justify-center text-3xl`}
        >
          {prompt.icon}
        </div>

        {/* Actions */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(prompt)}
              className={`p-2 rounded-lg hover:glass-lg transition-all ${
                prompt.isFavorite ? 'text-yellow-400' : 'text-muted-foreground'
              }`}
              title={prompt.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Star className="w-4 h-4" fill={prompt.isFavorite ? 'currentColor' : 'none'} />
            </button>
          )}

          <button
            onClick={handleExport}
            className="p-2 rounded-lg hover:glass-lg transition-all text-muted-foreground hover:text-green-400"
            title="Exporter ce prompt"
          >
            <Download className="w-4 h-4" />
          </button>

          {onEdit && (
            <button
              onClick={() => onEdit(prompt)}
              className="p-2 rounded-lg hover:glass-lg transition-all text-muted-foreground hover:text-foreground"
              title="Éditer"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          {onDuplicate && (
            <button
              onClick={() => onDuplicate(prompt)}
              className="p-2 rounded-lg hover:glass-lg transition-all text-muted-foreground hover:text-foreground"
              title="Dupliquer"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={() => onDelete(prompt)}
              className="p-2 rounded-lg hover:glass-lg transition-all text-red-400 hover:text-red-300"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Nom */}
      <h3 className="text-lg font-semibold mb-2">{prompt.name}</h3>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{prompt.description}</p>

      {/* Variables */}
      {variables.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {variables.map((variable, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg glass-card text-xs"
            >
              <Variable className="w-3 h-3" />
              {variable}
            </span>
          ))}
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 rounded-lg glass-card text-xs text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="px-2 py-1 text-xs text-muted-foreground">+{tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Spacer pour pousser le footer en bas */}
      <div className="flex-1"></div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
        <div className="flex gap-4 text-xs text-muted-foreground">
          {prompt.category && <span>{prompt.category}</span>}
          <span>{prompt.usageCount} utilisations</span>
        </div>

        {onUse && (
          <button
            onClick={() => onUse(prompt)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-sm font-medium hover:scale-105 transition-transform flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Utiliser
          </button>
        )}
      </div>
    </div>
  );
}
