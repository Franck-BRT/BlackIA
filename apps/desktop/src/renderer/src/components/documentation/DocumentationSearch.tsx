import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import type { Documentation } from '../../../../main/database/schema';

interface SearchResult extends Documentation {
  snippet: string;
  rank: number;
}

interface DocumentationSearchProps {
  onSearch: (query: string) => void;
  results: SearchResult[];
  isSearching: boolean;
  onSelectResult: (doc: Documentation) => void;
}

/**
 * Barre de recherche avec résultats instantanés
 * Utilise FTS5 pour recherche full-text rapide
 */
export function DocumentationSearch({
  onSearch,
  results,
  isSearching,
  onSelectResult,
}: DocumentationSearchProps) {
  const [query, setQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Gérer les clics en dehors pour fermer les résultats
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl + K pour focus search
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Escape pour fermer
      if (e.key === 'Escape') {
        setShowResults(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Afficher les résultats quand la recherche est active
  useEffect(() => {
    if (isSearching && results.length > 0) {
      setShowResults(true);
    }
  }, [isSearching, results]);

  /**
   * Gérer le changement de query
   */
  const handleQueryChange = (newQuery: string) => {
    setQuery(newQuery);
    onSearch(newQuery);
  };

  /**
   * Clear search
   */
  const handleClear = () => {
    setQuery('');
    onSearch('');
    setShowResults(false);
  };

  /**
   * Sélectionner un résultat
   */
  const handleSelectResult = (result: SearchResult) => {
    onSelectResult(result);
    setShowResults(false);
    setQuery('');
  };

  /**
   * Extraire et nettoyer le snippet HTML
   */
  const cleanSnippet = (snippet: string) => {
    // Le snippet peut contenir des balises <mark> pour les highlights
    return snippet;
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Rechercher dans la documentation... (⌘K)"
          className="
            w-full pl-10 pr-10 py-3 rounded-lg
            bg-white/5 border border-white/10
            text-white placeholder-gray-500
            focus:outline-none focus:border-purple-500/50
            transition-colors
          "
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="absolute top-full mt-2 w-full glass-card rounded-lg border border-white/10 shadow-2xl max-h-96 overflow-auto z-50">
          <div className="p-2">
            {/* Results count */}
            <div className="px-3 py-2 text-xs text-muted-foreground">
              {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
            </div>

            {/* Results list */}
            <div className="space-y-1">
              {results.map((result, index) => (
                <button
                  key={`${result.id}-${index}`}
                  onClick={() => handleSelectResult(result)}
                  className="
                    w-full text-left p-3 rounded-lg
                    hover:bg-white/10
                    transition-colors
                    group
                  "
                >
                  {/* Title with icon */}
                  <div className="flex items-center gap-2 mb-1">
                    {result.icon && <span className="text-lg">{result.icon}</span>}
                    <span className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                      {result.title}
                    </span>
                  </div>

                  {/* Category badge */}
                  <div className="mb-2">
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-400">
                      {result.category}
                    </span>
                  </div>

                  {/* Snippet with highlights */}
                  <div
                    className="text-sm text-gray-400 line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html: cleanSnippet(result.snippet),
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* No results */}
      {showResults && query && results.length === 0 && !isSearching && (
        <div className="absolute top-full mt-2 w-full glass-card rounded-lg border border-white/10 shadow-2xl p-6 z-50">
          <div className="text-center text-muted-foreground">
            <p className="text-sm">Aucun résultat pour "{query}"</p>
            <p className="text-xs mt-2">Essayez avec d'autres mots-clés</p>
          </div>
        </div>
      )}
    </div>
  );
}
