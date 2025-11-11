import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  path: string;
  color: string; // Gradient classes ex: "from-blue-500 to-cyan-500"
  disabled?: boolean;
}

/**
 * Carte de fonctionnalité pour la page d'accueil
 * Utilise la taille dynamique des paramètres et le style moderne unifié
 */
export function FeatureCard({
  icon: Icon,
  title,
  description,
  path,
  color,
  disabled = false,
}: FeatureCardProps) {
  // Récupérer la taille de carte depuis les paramètres
  const { settings } = useSettings();
  const cardSize = settings.appearance.cardSize || 320;
  const minHeight = Math.round((cardSize / 320) * 280); // Plus petit ratio pour les features

  const CardContent = (
    <div
      style={{
        width: `${cardSize}px`,
        minHeight: `${minHeight}px`,
      }}
      className={`glass-card rounded-xl p-6 hover:scale-[1.02] transition-all duration-200 group relative flex flex-col ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
    >
      {/* Icon */}
      <div
        className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}
      >
        <Icon className="w-8 h-8 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {description}
        </p>

        {/* Spacer */}
        <div className="flex-1"></div>

        {/* Arrow indicator */}
        {!disabled && (
          <div className="flex items-center justify-end mt-auto">
            <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
              <span>Ouvrir</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Si disabled, retourner juste le contenu sans lien
  if (disabled || path === '#') {
    return CardContent;
  }

  // Sinon, wrapper dans un Link
  return (
    <Link to={path} className="block">
      {CardContent}
    </Link>
  );
}
