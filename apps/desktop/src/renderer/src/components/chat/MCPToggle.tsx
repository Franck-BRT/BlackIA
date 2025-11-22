/**
 * MCP Toggle Button
 * Toggle pour activer/désactiver les outils MCP dans le chat
 */

import React from 'react';
import { Zap, Loader2, AlertCircle } from 'lucide-react';

interface MCPToggleProps {
  enabled: boolean;
  isExecuting?: boolean;
  onToggle: (enabled: boolean) => void;
  enabledToolsCount?: number;
  hasError?: boolean;
}

export function MCPToggle({
  enabled,
  isExecuting,
  onToggle,
  enabledToolsCount = 0,
  hasError = false,
}: MCPToggleProps) {
  return (
    <button
      onClick={() => onToggle(!enabled)}
      className={`header-btn gap-2 px-3 transition-all ${
        enabled
          ? hasError
            ? 'glass-card border border-orange-500/30 bg-orange-500/10'
            : 'glass-card border border-purple-500/30 bg-purple-500/10'
          : 'glass-hover'
      }`}
      title={
        enabled
          ? hasError
            ? 'Outils MCP activés (erreur)'
            : `Outils MCP activés (${enabledToolsCount} outils)`
          : 'Activer les outils système'
      }
      disabled={isExecuting}
    >
      {isExecuting ? (
        <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
      ) : hasError ? (
        <AlertCircle className={`w-5 h-5 flex-shrink-0 ${enabled ? 'text-orange-400' : ''}`} />
      ) : (
        <Zap className={`w-5 h-5 flex-shrink-0 ${enabled ? 'text-purple-400' : ''}`} />
      )}
      <span className="text-sm font-medium">Outils</span>
      {enabled && !hasError && (
        <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
      )}
      {enabledToolsCount > 0 && enabled && (
        <span className="text-xs text-white/60">({enabledToolsCount})</span>
      )}
    </button>
  );
}
