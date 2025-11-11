import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, Globe } from 'lucide-react';
import type { WebSearchResult } from '@blackia/shared';

interface SourcesListProps {
  results: WebSearchResult[];
  query: string;
  provider: string;
  defaultCollapsed?: boolean;
}

export function SourcesList({ results, query, provider, defaultCollapsed = false }: SourcesListProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  if (results.length === 0) return null;

  return (
    <div className="mt-4 glass-card rounded-xl p-4 border border-white/10">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between group hover:bg-white/5 -m-2 p-2 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-blue-400" />
          <div className="text-left">
            <h4 className="text-sm font-semibold">Sources web utilisées</h4>
            <p className="text-xs text-muted-foreground">
              {results.length} résultat{results.length > 1 ? 's' : ''} via {provider}
            </p>
          </div>
        </div>
        <div className="text-muted-foreground group-hover:text-foreground transition-colors">
          {isCollapsed ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronUp className="w-5 h-5" />
          )}
        </div>
      </button>

      {/* Sources List */}
      {!isCollapsed && (
        <div className="mt-4 space-y-3">
          {results.map((result, index) => (
            <a
              key={index}
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg glass-hover border border-white/5 hover:border-white/20 hover:scale-[1.01] transition-all group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-blue-400">#{index + 1}</span>
                    <h5 className="text-sm font-medium truncate group-hover:text-blue-400 transition-colors">
                      {result.title}
                    </h5>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {result.snippet}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{result.source || new URL(result.url).hostname}</span>
                    {result.publishedDate && (
                      <>
                        <span>•</span>
                        <span>{result.publishedDate}</span>
                      </>
                    )}
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted-foreground group-hover:text-blue-400 transition-colors flex-shrink-0" />
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Footer info */}
      {!isCollapsed && (
        <div className="mt-4 pt-3 border-t border-white/5 text-xs text-muted-foreground">
          <p>
            Recherche effectuée pour : <span className="font-medium text-foreground">"{query}"</span>
          </p>
        </div>
      )}
    </div>
  );
}
