import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  resultsCount?: number;
}

export function SearchBar({ searchQuery, onSearchChange, resultsCount }: SearchBarProps) {
  return (
    <div className="p-4 border-b border-white/10">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher dans les conversations..."
          className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 transition-colors text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-white/10 transition-colors"
            title="Effacer la recherche"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>
      {searchQuery && resultsCount !== undefined && (
        <div className="mt-2 text-xs text-muted-foreground text-center">
          {resultsCount === 0
            ? 'Aucun résultat'
            : `${resultsCount} résultat${resultsCount > 1 ? 's' : ''} trouvé${resultsCount > 1 ? 's' : ''}`}
        </div>
      )}
    </div>
  );
}
