import { useState, useEffect } from 'react';
import { DocumentationSidebar } from './DocumentationSidebar';
import { DocumentationViewer } from './DocumentationViewer';
import { DocumentationSearch } from './DocumentationSearch';
import { DocumentationTOC } from './DocumentationTOC';
import { DocumentationBreadcrumbs } from './DocumentationBreadcrumbs';
import type { Documentation } from '../../../../main/database/schema';

/**
 * Vue principale de la documentation intégrée
 * Layout 3-panel: Sidebar | Content | TOC
 */
export function DocumentationView() {
  const [currentDoc, setCurrentDoc] = useState<Documentation | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<Documentation[]>([]);
  const [showTOC, setShowTOC] = useState(true);

  // Charger le document d'accueil au montage
  useEffect(() => {
    loadWelcomeDoc();
  }, []);

  // Charger le breadcrumb quand le document change
  useEffect(() => {
    if (currentDoc) {
      loadBreadcrumbs(currentDoc.slug);
    }
  }, [currentDoc]);

  /**
   * Charger le document d'accueil
   */
  const loadWelcomeDoc = async () => {
    try {
      // Essayer de charger le doc "accueil" ou le premier doc disponible
      const result = await window.electronAPI.documentation.getBySlug('accueil');
      if (result.success && result.data) {
        setCurrentDoc(result.data);
      } else {
        // Fallback: charger le premier document disponible
        const allDocs = await window.electronAPI.documentation.getAll();
        if (allDocs.success && allDocs.data.length > 0) {
          setCurrentDoc(allDocs.data[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load welcome doc:', error);
    }
  };

  /**
   * Charger le breadcrumb pour un document
   */
  const loadBreadcrumbs = async (slug: string) => {
    try {
      const result = await window.electronAPI.documentation.getBreadcrumbs(slug);
      if (result.success) {
        setBreadcrumbs(result.data);
      }
    } catch (error) {
      console.error('Failed to load breadcrumbs:', error);
    }
  };

  /**
   * Naviguer vers un document
   */
  const handleNavigate = async (slug: string) => {
    try {
      const result = await window.electronAPI.documentation.getBySlug(slug);
      if (result.success && result.data) {
        setCurrentDoc(result.data);
        setIsSearching(false);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Failed to navigate to doc:', error);
    }
  };

  /**
   * Gérer la recherche
   */
  const handleSearch = async (query: string) => {
    if (!query || query.trim().length < 2) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const result = await window.electronAPI.documentation.search(query, 20);
      if (result.success) {
        setSearchResults(result.data);
      }
    } catch (error) {
      console.error('Failed to search docs:', error);
      setSearchResults([]);
    }
  };

  /**
   * Sélectionner un résultat de recherche
   */
  const handleSelectSearchResult = (doc: Documentation) => {
    setCurrentDoc(doc);
    setIsSearching(false);
    setSearchResults([]);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Left Sidebar - Navigation */}
      <DocumentationSidebar
        currentSlug={currentDoc?.slug}
        onNavigate={handleNavigate}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header: Search + Breadcrumbs */}
        <div className="border-b border-white/10 bg-background/95 backdrop-blur-xl">
          <div className="p-4">
            <DocumentationSearch
              onSearch={handleSearch}
              results={searchResults}
              isSearching={isSearching}
              onSelectResult={handleSelectSearchResult}
            />
          </div>
          {breadcrumbs.length > 0 && (
            <div className="px-4 pb-3">
              <DocumentationBreadcrumbs
                breadcrumbs={breadcrumbs}
                onNavigate={handleNavigate}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Content - Markdown Viewer */}
          <div className="flex-1 overflow-auto">
            {currentDoc ? (
              <DocumentationViewer doc={currentDoc} />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg mb-2">📚 Bienvenue dans la Documentation</p>
                  <p className="text-sm">
                    Sélectionnez un document dans la barre latérale pour commencer
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar - Table of Contents */}
          {showTOC && currentDoc && (
            <DocumentationTOC
              content={currentDoc.content}
              onClose={() => setShowTOC(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
