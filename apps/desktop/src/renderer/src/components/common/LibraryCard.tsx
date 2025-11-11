import React, { ReactNode } from 'react';
import { Star, Edit, Copy, Trash2, Download } from 'lucide-react';

/**
 * Composant de carte générique pour les bibliothèques (Workflows, Prompts, Personas)
 * Unifie le style et la structure pour une maintenance simplifiée
 */

export interface LibraryCardAction {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger' | 'success';
  className?: string;
}

export interface LibraryCardProps {
  // Header
  icon: ReactNode; // Emoji ou composant d'icône
  iconColor?: string; // Classes Tailwind pour le gradient (ex: "from-purple-500 to-purple-600")
  title: string;
  badges?: { label: string; variant?: 'default' | 'primary' | 'success' }[];

  // Content
  description: string;
  metadata?: ReactNode; // Section flexible pour les infos spécifiques (tags, variables, nodes, etc.)
  preview?: ReactNode; // Prévisualisation optionnelle (ex: system prompt)

  // Footer
  stats?: { label: string; value: string | number }[];
  primaryAction?: {
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    variant?: 'default' | 'primary' | 'success';
  };

  // Actions (en haut à droite)
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
  additionalActions?: LibraryCardAction[];

  // Comportement
  onClick?: () => void;
  isProtected?: boolean; // Empêche la suppression (ex: personas par défaut)
}

export function LibraryCard({
  icon,
  iconColor = 'from-purple-500 to-purple-600',
  title,
  badges = [],
  description,
  metadata,
  preview,
  stats = [],
  primaryAction,
  isFavorite,
  onToggleFavorite,
  onEdit,
  onDuplicate,
  onDelete,
  onExport,
  additionalActions = [],
  onClick,
  isProtected = false,
}: LibraryCardProps) {
  const badgeVariants = {
    default: 'glass-lg text-muted-foreground',
    primary: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
  };

  const primaryActionVariants = {
    default: 'from-gray-500 to-gray-600',
    primary: 'from-purple-500 to-purple-600',
    success: 'from-green-500 to-green-600',
  };

  return (
    <div
      onClick={onClick}
      className={`glass-card rounded-xl p-6 hover:scale-[1.02] transition-all duration-200 group relative w-80 min-h-[420px] flex flex-col ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Header avec icône et actions */}
      <div className="flex items-start justify-between mb-4">
        {/* Icône/Avatar */}
        <div
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${iconColor} flex items-center justify-center text-3xl shadow-lg`}
        >
          {icon}
        </div>

        {/* Actions */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {onToggleFavorite && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={`p-2 rounded-lg hover:glass-lg transition-all ${
                isFavorite ? 'text-yellow-400' : 'text-muted-foreground'
              }`}
              title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Star className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          )}

          {onExport && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExport();
              }}
              className="p-2 rounded-lg hover:glass-lg transition-all text-muted-foreground hover:text-green-400"
              title="Exporter"
            >
              <Download className="w-4 h-4" />
            </button>
          )}

          {onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-2 rounded-lg hover:glass-lg transition-all text-muted-foreground hover:text-foreground"
              title="Éditer"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          {onDuplicate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              className="p-2 rounded-lg hover:glass-lg transition-all text-muted-foreground hover:text-foreground"
              title="Dupliquer"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}

          {additionalActions.map((action, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              className={`p-2 rounded-lg hover:glass-lg transition-all text-muted-foreground hover:text-foreground ${action.className || ''}`}
              title={action.label}
            >
              <action.icon className="w-4 h-4" />
            </button>
          ))}

          {!isProtected && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-2 rounded-lg hover:glass-lg transition-all text-muted-foreground hover:text-red-400"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Titre et badges */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold mb-1 flex items-center gap-2 flex-wrap">
          {title}
          {badges.map((badge, index) => (
            <span
              key={index}
              className={`text-xs px-2 py-0.5 rounded-full ${badgeVariants[badge.variant || 'default']}`}
            >
              {badge.label}
            </span>
          ))}
        </h3>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{description}</p>

      {/* Prévisualisation optionnelle */}
      {preview && <div className="mb-4 p-3 rounded-lg glass-lg">{preview}</div>}

      {/* Metadata (tags, variables, nodes, etc.) */}
      {metadata && <div className="mb-4">{metadata}</div>}

      {/* Spacer pour pousser le footer en bas */}
      <div className="flex-1"></div>

      {/* Footer avec stats et action principale */}
      <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-auto">
        {/* Stats */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          {stats.map((stat, index) => (
            <span key={index}>
              {stat.label}: {stat.value}
            </span>
          ))}
        </div>

        {/* Action principale */}
        {primaryAction && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              primaryAction.onClick();
            }}
            className={`px-4 py-2 bg-gradient-to-r ${primaryActionVariants[primaryAction.variant || 'primary']} rounded-lg text-sm font-medium hover:scale-105 transition-transform flex items-center gap-2`}
          >
            {primaryAction.icon && <primaryAction.icon className="w-4 h-4" />}
            {primaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
