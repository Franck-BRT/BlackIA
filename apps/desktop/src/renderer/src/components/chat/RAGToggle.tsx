import React from 'react';
import { Brain, BrainCircuit, Eye, FileText, Sparkles } from 'lucide-react';

interface RAGToggleProps {
  enabled: boolean;
  mode: 'text' | 'vision' | 'hybrid' | 'auto';
  onToggle: () => void;
  onModeChange: (mode: 'text' | 'vision' | 'hybrid' | 'auto') => void;
  className?: string;
}

/**
 * RAGToggle - Toggle et sélecteur de mode RAG
 *
 * Features:
 * - Toggle on/off pour RAG
 * - Sélection du mode (text, vision, hybrid, auto)
 * - Icônes visuelles selon le mode
 * - Badge de statut
 */
export function RAGToggle({
  enabled,
  mode,
  onToggle,
  onModeChange,
  className = '',
}: RAGToggleProps) {
  const getModeIcon = () => {
    switch (mode) {
      case 'text':
        return <FileText className="w-4 h-4" />;
      case 'vision':
        return <Eye className="w-4 h-4" />;
      case 'hybrid':
        return <BrainCircuit className="w-4 h-4" />;
      case 'auto':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getModeLabel = () => {
    switch (mode) {
      case 'text':
        return 'Text';
      case 'vision':
        return 'Vision';
      case 'hybrid':
        return 'Hybrid';
      case 'auto':
        return 'Auto';
      default:
        return 'RAG';
    }
  };

  const getModeColor = () => {
    if (!enabled) return 'text-gray-400';
    switch (mode) {
      case 'text':
        return 'text-blue-600 dark:text-blue-400';
      case 'vision':
        return 'text-purple-600 dark:text-purple-400';
      case 'hybrid':
        return 'text-gradient-to-r from-blue-600 to-purple-600';
      case 'auto':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg
          transition-all duration-200
          ${
            enabled
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }
        `}
        title={enabled ? 'Désactiver RAG' : 'Activer RAG'}
      >
        <div className={getModeColor()}>{getModeIcon()}</div>
        <span className="text-sm font-medium">RAG</span>
        {enabled && (
          <span className="px-1.5 py-0.5 rounded text-xs bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200">
            ON
          </span>
        )}
      </button>

      {/* Mode Selector (only visible when enabled) */}
      {enabled && (
        <select
          value={mode}
          onChange={(e) => onModeChange(e.target.value as 'text' | 'vision' | 'hybrid' | 'auto')}
          className="
            px-3 py-2 rounded-lg text-sm
            bg-white dark:bg-gray-800
            border border-gray-300 dark:border-gray-600
            text-gray-900 dark:text-gray-100
            focus:outline-none focus:ring-2 focus:ring-purple-500
            cursor-pointer
          "
          title="Mode RAG"
        >
          <option value="auto">🎯 Auto</option>
          <option value="text">📝 Text</option>
          <option value="vision">👁️ Vision</option>
          <option value="hybrid">🔀 Hybrid</option>
        </select>
      )}
    </div>
  );
}
