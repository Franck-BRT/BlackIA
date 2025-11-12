import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Image, ExternalLink } from 'lucide-react';
import type { RAGSource, RAGMetadata } from '../../types/attachment';

interface RAGSourcesProps {
  metadata: RAGMetadata;
  onViewSource?: (source: RAGSource) => void;
  className?: string;
}

/**
 * RAGSources - Affichage des sources RAG utilisées dans une réponse
 *
 * Features:
 * - Liste pliable des sources
 * - Scores de pertinence
 * - Extraits de texte
 * - Vignettes pour images
 * - Statistiques (temps, nombre de chunks)
 * - Clic pour voir la source complète
 */
export function RAGSources({ metadata, onViewSource, className = '' }: RAGSourcesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!metadata.enabled || metadata.sources.length === 0) {
    return null;
  }

  const getModeLabel = () => {
    switch (metadata.mode) {
      case 'text':
        return 'Text RAG';
      case 'vision':
        return 'Vision RAG';
      case 'hybrid':
        return 'Hybrid RAG';
      default:
        return 'RAG';
    }
  };

  const getModeColor = () => {
    switch (metadata.mode) {
      case 'text':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'vision':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'hybrid':
        return 'bg-gradient-to-r from-blue-100 to-purple-100 text-purple-800 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const formatScore = (score: number) => {
    return `${(score * 100).toFixed(0)}%`;
  };

  return (
    <div
      className={`
        mt-3 rounded-lg border border-gray-200 dark:border-gray-700
        bg-gray-50 dark:bg-gray-800/50
        ${className}
      `}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="
          w-full flex items-center justify-between p-3
          hover:bg-gray-100 dark:hover:bg-gray-700/50
          transition-colors rounded-lg
        "
      >
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${getModeColor()}`}>
            {getModeLabel()}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {metadata.chunksUsed} source{metadata.chunksUsed > 1 ? 's' : ''}
          </span>
          {metadata.searchTime && (
            <span className="text-xs text-gray-500 dark:text-gray-500">
              • {metadata.searchTime}ms
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
          {metadata.sources.map((source, index) => (
            <div
              key={index}
              className="
                flex items-start gap-3 p-3 rounded-lg
                bg-white dark:bg-gray-800
                border border-gray-200 dark:border-gray-600
                hover:border-purple-300 dark:hover:border-purple-600
                transition-colors
                cursor-pointer
              "
              onClick={() => onViewSource?.(source)}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {source.type === 'text' ? (
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                ) : (
                  <Image className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {/* Filename and score */}
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {source.fileName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                    {formatScore(source.score)}
                  </span>
                </div>

                {/* Text chunk preview */}
                {source.type === 'text' && source.chunkText && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {source.chunkText}
                  </p>
                )}

                {/* Vision page info */}
                {source.type === 'vision' && source.page !== undefined && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Page {source.page}
                    {source.patchIndex !== undefined && ` • Patch ${source.patchIndex}`}
                  </p>
                )}

                {/* Chunk index for text */}
                {source.type === 'text' && source.chunkIndex !== undefined && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Chunk {source.chunkIndex}
                  </p>
                )}
              </div>

              {/* View icon */}
              <div className="flex-shrink-0">
                <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
              </div>
            </div>
          ))}

          {/* Stats footer */}
          {metadata.totalTime && (
            <div className="text-xs text-gray-500 dark:text-gray-500 text-center pt-2">
              Total: {metadata.totalTime}ms
            </div>
          )}
        </div>
      )}
    </div>
  );
}
