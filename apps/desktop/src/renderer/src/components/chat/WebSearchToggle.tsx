import React from 'react';
import { Globe, Loader2 } from 'lucide-react';

interface WebSearchToggleProps {
  enabled: boolean;
  isSearching?: boolean;
  onToggle: (enabled: boolean) => void;
  providerName?: string;
}

export function WebSearchToggle({ enabled, isSearching, onToggle, providerName }: WebSearchToggleProps) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      className={`header-btn gap-2 px-3 transition-all ${
        enabled
          ? 'glass-card border border-green-500/30 bg-green-500/10'
          : 'glass-hover'
      }`}
      title={enabled ? `Recherche web activée (${providerName || 'DuckDuckGo'})` : 'Activer la recherche web'}
      disabled={isSearching}
    >
      {isSearching ? (
        <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
      ) : (
        <Globe className={`w-5 h-5 flex-shrink-0 ${enabled ? 'text-green-400' : ''}`} />
      )}
      <span className="text-sm font-medium">Web</span>
      {enabled && (
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
      )}
    </button>
  );
}
