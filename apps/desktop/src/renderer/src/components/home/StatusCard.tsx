import React from 'react';

type StatusType = 'online' | 'warning' | 'offline';

interface StatusCardProps {
  title: string;
  description: string;
  status: StatusType;
}

/**
 * Carte de statut pour la page d'accueil
 * Affiche l'état des services (Système, Ollama, MLX)
 */
export function StatusCard({ title, description, status }: StatusCardProps) {
  const statusColors = {
    online: 'bg-green-500',
    warning: 'bg-yellow-500',
    offline: 'bg-red-500',
  };

  const statusLabels = {
    online: 'En ligne',
    warning: 'Attention',
    offline: 'Hors ligne',
  };

  return (
    <div className="glass-card rounded-xl p-6 hover:scale-[1.01] transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">{title}</h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColors[status]} ${status === 'online' ? 'animate-pulse' : ''}`} />
          <span className="text-xs text-muted-foreground">{statusLabels[status]}</span>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
