import { useMemo, useEffect, Dispatch, SetStateAction } from 'react';
import type { OllamaMessage } from '@blackia/ollama';

interface UseChatSearchParams {
  messages: OllamaMessage[];
  chatSearchQuery: string;
  setChatSearchQuery: Dispatch<SetStateAction<string>>;
  currentSearchIndex: number;
  setCurrentSearchIndex: Dispatch<SetStateAction<number>>;
  isChatSearchOpen: boolean;
  setIsChatSearchOpen: Dispatch<SetStateAction<boolean>>;
}

interface SearchResult {
  totalCount: number;
  messageOccurrences: Array<{ messageIndex: number; startIndex: number; count: number }>;
}

/**
 * Hook pour gérer la recherche dans le chat
 * Calcul des résultats, navigation, raccourcis clavier
 */
export function useChatSearch({
  messages,
  chatSearchQuery,
  setChatSearchQuery,
  currentSearchIndex,
  setCurrentSearchIndex,
  isChatSearchOpen,
  setIsChatSearchOpen,
}: UseChatSearchParams) {
  // Calculer les résultats de recherche
  const searchResults = useMemo<SearchResult>(() => {
    if (!chatSearchQuery.trim()) {
      return { totalCount: 0, messageOccurrences: [] };
    }

    const query = chatSearchQuery.toLowerCase();
    const escapedQuery = chatSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'gi');

    let totalCount = 0;
    const messageOccurrences: Array<{ messageIndex: number; startIndex: number; count: number }> = [];

    messages.forEach((message, messageIndex) => {
      const matches = message.content.match(regex);
      if (matches && matches.length > 0) {
        messageOccurrences.push({
          messageIndex,
          startIndex: totalCount,
          count: matches.length,
        });
        totalCount += matches.length;
      }
    });

    return { totalCount, messageOccurrences };
  }, [messages, chatSearchQuery]);

  // Gestion de la recherche
  const handleChatSearchChange = (query: string) => {
    setChatSearchQuery(query);
    setCurrentSearchIndex(0);
  };

  const handleSearchNext = () => {
    if (searchResults.totalCount > 0) {
      setCurrentSearchIndex((prev) => (prev + 1) % searchResults.totalCount);
    }
  };

  const handleSearchPrevious = () => {
    if (searchResults.totalCount > 0) {
      setCurrentSearchIndex((prev) => (prev - 1 + searchResults.totalCount) % searchResults.totalCount);
    }
  };

  const handleCloseChatSearch = () => {
    setIsChatSearchOpen(false);
    setChatSearchQuery('');
    setCurrentSearchIndex(0);
  };

  // Raccourcis clavier pour la recherche
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F ou Cmd+F pour ouvrir la recherche
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsChatSearchOpen(true);
      }

      // Escape pour fermer la recherche
      if (e.key === 'Escape' && isChatSearchOpen) {
        handleCloseChatSearch();
      }

      // Enter pour aller au suivant, Shift+Enter pour aller au précédent
      if (isChatSearchOpen && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          handleSearchPrevious();
        } else {
          handleSearchNext();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isChatSearchOpen, searchResults.totalCount]);

  // Auto-scroll vers le résultat actif
  useEffect(() => {
    if (isChatSearchOpen && chatSearchQuery && searchResults.totalCount > 0) {
      // Utiliser setTimeout pour laisser le DOM se mettre à jour
      setTimeout(() => {
        const activeElement = document.getElementById('active-search-result');
        if (activeElement) {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [currentSearchIndex, isChatSearchOpen, chatSearchQuery, searchResults.totalCount]);

  return {
    searchResults,
    handleChatSearchChange,
    handleSearchNext,
    handleSearchPrevious,
    handleCloseChatSearch,
  };
}
