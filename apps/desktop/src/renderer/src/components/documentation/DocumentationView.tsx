import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Upload } from 'lucide-react';
import { DocumentationSidebar } from './DocumentationSidebar';
import { DocumentationViewer } from './DocumentationViewer';
import { DocumentationSearch } from './DocumentationSearch';
import { DocumentationTOC } from './DocumentationTOC';
import { DocumentationBreadcrumbs } from './DocumentationBreadcrumbs';
import { NewDocumentModal, type DocumentMetadata } from './NewDocumentModal';
import type { Documentation } from '../../../../main/database/schema';

/**
 * Vue principale de la documentation intégrée
 * Layout 3-panel: Sidebar | Content | TOC
 */
export function DocumentationView() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentDoc, setCurrentDoc] = useState<Documentation | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<Documentation[]>([]);
  const [showTOC, setShowTOC] = useState(true);
  const [showNewDocModal, setShowNewDocModal] = useState(false);
  const [importedContent, setImportedContent] = useState<string | undefined>();

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

  /**
   * Créer un nouveau document
   */
  const handleNewDocument = () => {
    setImportedContent(undefined);
    setShowNewDocModal(true);
  };

  /**
   * Importer un fichier markdown
   */
  const handleImportFile = () => {
    fileInputRef.current?.click();
  };

  /**
   * Gérer la sélection de fichier
   */
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportedContent(content);
      setShowNewDocModal(true);
    };
    reader.readAsText(file);

    // Reset input
    e.target.value = '';
  };

  /**
   * Confirmer la création/import du document
   */
  const handleConfirmNewDocument = async (metadata: DocumentMetadata) => {
    try {
      const newDoc = {
        slug: metadata.slug,
        title: metadata.title,
        content: metadata.content || '# ' + metadata.title + '\n\nCommencez à écrire votre documentation...',
        category: metadata.category,
        description: metadata.description || '',
        icon: metadata.icon || '📄',
        parentSlug: null,
        order: 0,
        tags: '[]',
        version: '1.0',
        published: true,
      };

      const result = await window.electronAPI.documentation.create(newDoc);

      if (result.success) {
        setShowNewDocModal(false);
        setImportedContent(undefined);

        // Ouvrir le document dans l'éditeur
        navigate('/editor', {
          state: {
            documentId: result.data.id,
            documentSlug: result.data.slug,
            documentTitle: result.data.title,
            documentContent: result.data.content,
            isDocumentation: true,
          },
        });
      } else {
        alert('Erreur lors de la création du document: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Erreur lors de la création du document');
    }
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
        {/* Header: Search + Breadcrumbs + Actions */}
        <div className="border-b border-white/10 bg-background/95 backdrop-blur-xl">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <DocumentationSearch
                  onSearch={handleSearch}
                  results={searchResults}
                  isSearching={isSearching}
                  onSelectResult={handleSelectSearchResult}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleNewDocument}
                  className="px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
                  title="Créer un nouveau document"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouveau</span>
                </button>

                <button
                  onClick={handleImportFile}
                  className="px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors flex items-center gap-2 text-sm whitespace-nowrap"
                  title="Importer un fichier markdown"
                >
                  <Upload className="w-4 h-4" />
                  <span>Importer</span>
                </button>
              </div>
            </div>
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

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* New Document Modal */}
      <NewDocumentModal
        isOpen={showNewDocModal}
        onClose={() => {
          setShowNewDocModal(false);
          setImportedContent(undefined);
        }}
        onConfirm={handleConfirmNewDocument}
        importedContent={importedContent}
      />
    </div>
  );
}
