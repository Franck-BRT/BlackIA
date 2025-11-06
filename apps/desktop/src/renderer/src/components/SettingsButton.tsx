import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import type { AppModule } from '@blackia/shared/types';

interface SettingsButtonProps {
  module: AppModule;
  variant?: 'icon' | 'button' | 'link';
  className?: string;
}

/**
 * Bouton pour accéder aux paramètres avec le contexte du module actuel
 */
export function SettingsButton({ module, variant = 'icon', className = '' }: SettingsButtonProps) {
  const baseClasses = 'transition-all duration-200';

  if (variant === 'icon') {
    return (
      <Link
        to={`/settings?from=${module}`}
        className={`${baseClasses} p-2 rounded-lg glass-card hover:glass-lg group ${className}`}
        title={`Paramètres ${module}`}
      >
        <Settings className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
      </Link>
    );
  }

  if (variant === 'button') {
    return (
      <Link
        to={`/settings?from=${module}`}
        className={`${baseClasses} flex items-center gap-2 px-4 py-2 rounded-lg glass-card hover:glass-lg font-medium text-sm ${className}`}
      >
        <Settings className="w-4 h-4" />
        <span>Paramètres</span>
      </Link>
    );
  }

  // variant === 'link'
  return (
    <Link
      to={`/settings?from=${module}`}
      className={`${baseClasses} flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground ${className}`}
    >
      <Settings className="w-4 h-4" />
      <span>Paramètres</span>
    </Link>
  );
}
