import React from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';

interface ChatSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentIndex: number;
  totalResults: number;
  onPrevious: () => void;
  onNext: () => void;
  onClose: () => void;
}

export function ChatSearchBar({
  searchQuery,
  onSearchChange,
  currentIndex,
  totalResults,
  onPrevious,
  onNext,
  onClose,
}: ChatSearchBarProps) {
  return (
    <div className="absolute top-4 right-4 z-50 flex items-center gap-2 glass-card bg-gray-900/95 rounded-xl p-2 shadow-xl border border-white/10">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher dans la conversation..."
          className="w-64 pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 transition-colors text-sm"
          autoFocus
        />
      </div>

      {/* Results Counter and Navigation */}
      {searchQuery && (
        <>
          <div className="flex items-center gap-1 px-2 text-sm text-muted-foreground whitespace-nowrap">
            {totalResults === 0 ? (
              <span>Aucun résultat</span>
            ) : (
              <span>
                {currentIndex + 1} sur {totalResults}
              </span>
            )}
          </div>

          {totalResults > 0 && (
            <>
              <button
                onClick={onPrevious}
                disabled={totalResults === 0}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Résultat précédent (Shift+Enter)"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={onNext}
                disabled={totalResults === 0}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Résultat suivant (Enter)"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </>
          )}
        </>
      )}

      {/* Close Button */}
      <button
        onClick={onClose}
        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
        title="Fermer la recherche (Escape)"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
