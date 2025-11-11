import { Star, Edit, Copy, Trash2, Play } from 'lucide-react';

interface CardSizePreviewProps {
  cardSize: number;
}

/**
 * Composant d'aperçu pour la taille des cartes
 * Affiche une carte d'exemple avec la taille sélectionnée
 */
export function CardSizePreview({ cardSize }: CardSizePreviewProps) {
  // Calculer la hauteur minimale proportionnellement
  const minHeight = Math.round((cardSize / 320) * 420);

  return (
    <div className="flex justify-center items-center p-8 glass-lg rounded-xl">
      <div
        style={{
          width: `${cardSize}px`,
          minHeight: `${minHeight}px`,
        }}
        className="glass-card rounded-xl p-6 transition-all duration-300 group relative flex flex-col"
      >
        {/* Header avec icône et actions */}
        <div className="flex items-start justify-between mb-4">
          {/* Icône */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg">
            ⚡
          </div>

          {/* Actions */}
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 rounded-lg hover:glass-lg transition-all text-muted-foreground hover:text-yellow-400">
              <Star className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:glass-lg transition-all text-muted-foreground hover:text-foreground">
              <Edit className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:glass-lg transition-all text-muted-foreground hover:text-foreground">
              <Copy className="w-4 h-4" />
            </button>
            <button className="p-2 rounded-lg hover:glass-lg transition-all text-muted-foreground hover:text-red-400">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Titre */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
            Exemple de carte
            <span className="text-xs px-2 py-0.5 rounded-full glass-lg text-muted-foreground">
              Aperçu
            </span>
          </h3>
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          Ceci est un aperçu de la taille de carte que vous avez sélectionnée. Toutes les cartes (Workflows, Prompts, Personas) utiliseront cette taille.
        </p>

        {/* Metadata */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 rounded-lg glass-card text-xs text-muted-foreground">
              #exemple
            </span>
            <span className="px-2 py-1 rounded-lg glass-card text-xs text-muted-foreground">
              #aperçu
            </span>
          </div>
        </div>

        {/* Spacer pour pousser le footer en bas */}
        <div className="flex-1"></div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>Taille: {cardSize}px</span>
          </div>

          <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg text-sm font-medium flex items-center gap-2">
            <Play className="w-4 h-4" />
            Action
          </button>
        </div>
      </div>
    </div>
  );
}
