import React, { useState } from 'react';
import { ChevronDown, ChevronUp, FileText, Image, ExternalLink, Eye, FolderOpen } from 'lucide-react';
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
 * - Liste pliable des sources groupées par document
 * - Scores de pertinence
 * - Extraits de texte
 * - Vignettes pour images
 * - Statistiques (temps, nombre de chunks)
 * - Bouton pour ouvrir le document source
 * - Clic pour voir la source complète
 */
export function RAGSources({ metadata, onViewSource, className = '' }: RAGSourcesProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!metadata.enabled || metadata.sources.length === 0) {
    return null;
  }

  // Grouper les sources par document
  const groupedSources = metadata.sources.reduce((acc, source) => {
    const key = `${source.attachmentId}-${source.fileName}`;
    if (!acc[key]) {
      acc[key] = {
        attachmentId: source.attachmentId,
        fileName: source.fileName,
        sources: [],
      };
    }
    acc[key].sources.push(source);
    return acc;
  }, {} as Record<string, { attachmentId: string; fileName: string; sources: RAGSource[] }>);

  const documentGroups = Object.values(groupedSources);

  const handleOpenDocument = async (attachmentId: string) => {
    try {
      const result = await window.electronAPI.attachments.open({ attachmentId });
      if (!result.success) {
        console.error('[RAGSources] Failed to open document:', result.error);
      }
    } catch (error) {
      console.error('[RAGSources] Error opening document:', error);
    }
  };

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
    <div className={`mt-4 glass-card rounded-xl p-4 border border-white/10 ${className}`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between group hover:bg-white/5 -m-2 p-2 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${getModeColor()}`}>
            {metadata.mode === 'text' ? (
              <FileText className="w-5 h-5" />
            ) : metadata.mode === 'vision' ? (
              <Eye className="w-5 h-5" />
            ) : (
              <FileText className="w-5 h-5" />
            )}
          </div>
          <div className="text-left">
            <h4 className="text-sm font-semibold">Sources RAG utilisées</h4>
            <p className="text-xs text-muted-foreground">
              {documentGroups.length} document{documentGroups.length > 1 ? 's' : ''} • {metadata.chunksUsed} chunk{metadata.chunksUsed > 1 ? 's' : ''} • {getModeLabel()}
              {metadata.searchTime && ` • ${metadata.searchTime}ms`}
            </p>
          </div>
        </div>
        <div className="text-muted-foreground group-hover:text-foreground transition-colors">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </div>
      </button>

      {/* Expanded Content - Grouped by Document */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {documentGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-2">
              {/* Document Header */}
              <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{group.fileName}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {group.sources.length} chunk{group.sources.length > 1 ? 's' : ''}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenDocument(group.attachmentId);
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs rounded-md glass-hover border border-white/10 hover:border-white/20 transition-all flex-shrink-0"
                  title="Ouvrir le document"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>Ouvrir</span>
                </button>
              </div>

              {/* Sources from this document */}
              <div className="space-y-2 pl-2">
                {group.sources.map((source, sourceIndex) => (
                  <div
                    key={sourceIndex}
                    className="block p-3 rounded-lg glass-hover border border-white/5 hover:border-white/20 hover:scale-[1.01] transition-all group cursor-pointer"
                    onClick={() => onViewSource?.(source)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-purple-400">
                            {source.type === 'text' ? `Chunk #${source.chunkIndex ?? sourceIndex}` : `Page ${source.page} • Patch #${source.patchIndex ?? sourceIndex}`}
                          </span>
                          <span className="text-xs text-green-400">
                            {formatScore(source.score)} pertinence
                          </span>
                        </div>

                        {/* Text chunk preview */}
                        {source.type === 'text' && source.chunkText && (
                          <p className="text-xs text-muted-foreground line-clamp-3 mb-2">
                            {source.chunkText}
                          </p>
                        )}

                        {/* Vision page info */}
                        {source.type === 'vision' && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Eye className="w-3 h-3" />
                            <span>Page {source.page}</span>
                            {source.patchIndex !== undefined && (
                              <>
                                <span>•</span>
                                <span>Région #{source.patchIndex}</span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Thumbnail for vision if available */}
                        {source.type === 'vision' && source.pageThumbnail && (
                          <div className="mt-2">
                            <img
                              src={source.pageThumbnail}
                              alt={`Page ${source.page}`}
                              className="max-h-32 rounded border border-white/10"
                            />
                          </div>
                        )}
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-purple-400 transition-colors flex-shrink-0 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Stats footer */}
          {metadata.totalTime && (
            <div className="pt-3 border-t border-white/5 text-xs text-muted-foreground">
              <p>
                Temps de recherche RAG : <span className="font-medium text-foreground">{metadata.totalTime}ms</span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
