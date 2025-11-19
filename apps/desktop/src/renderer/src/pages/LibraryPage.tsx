/**
 * Library Page
 * Main page for document library management
 */

import React, { useState, useEffect } from 'react';
import { MoreVertical, Edit2, Trash2, Star } from 'lucide-react';
import { useLibraries } from '../hooks/useLibraries';
import { useLibraryDocuments, type LibraryDocument } from '../hooks/useLibraryDocuments';
import { CreateLibraryModal } from '../components/library/CreateLibraryModal';
import { EditLibraryModal } from '../components/library/EditLibraryModal';
import { DocumentUploadModal } from '../components/library/DocumentUploadModal';
import { DocumentViewer } from '../components/library/DocumentViewer';
import type { Library } from '../types/library';

export function LibraryPage() {
  const { libraries, loading, error, createLibrary, updateLibrary, deleteLibrary, refreshLibraries } =
    useLibraries();
  const { documents, getDocuments, addDocument, updateDocument, indexDocument, deleteDocument } = useLibraryDocuments();
  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<LibraryDocument | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [libraryMenuOpen, setLibraryMenuOpen] = useState<string | null>(null);

  // Load documents when library is selected
  useEffect(() => {
    if (selectedLibrary) {
      getDocuments(selectedLibrary.id);
    }
  }, [selectedLibrary, getDocuments]);

  // Close library menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setLibraryMenuOpen(null);
    if (libraryMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [libraryMenuOpen]);

  // Filter libraries by search
  const filteredLibraries = libraries.filter((lib) =>
    lib.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handlers
  const handleCreateLibrary = async (input: any) => {
    const library = await createLibrary(input);
    if (library) {
      setSelectedLibrary(library);
    }
  };

  const handleUploadDocument = async (params: any) => {
    const doc = await addDocument(params);
    if (doc && selectedLibrary) {
      await getDocuments(selectedLibrary.id);
      await refreshLibraries(); // Refresh stats
    }
  };

  const handleReindexDocument = async (documentId: string) => {
    console.log('[LibraryPage] Starting reindex for document:', documentId);
    try {
      const result = await indexDocument({ documentId });
      console.log('[LibraryPage] Index result:', JSON.stringify(result, null, 2));
      if (selectedLibrary) {
        await getDocuments(selectedLibrary.id);
        await refreshLibraries();
      }
      console.log('[LibraryPage] Reindex complete');
    } catch (error) {
      console.error('[LibraryPage] Reindex error:', error);
    }
  };

  const handleValidateDocument = async (
    documentId: string,
    status: 'validated' | 'needs_review' | 'rejected',
    notes?: string
  ) => {
    await updateDocument(documentId, { validationStatus: status, validationNotes: notes });
    if (selectedLibrary) {
      await getDocuments(selectedLibrary.id);
    }
  };

  const handleEditLibrary = () => {
    setShowEditModal(true);
    setLibraryMenuOpen(null);
  };

  const handleUpdateLibrary = async (id: string, input: any) => {
    await updateLibrary(id, input);
    await refreshLibraries();
    // Update selected library if it's the one being edited
    if (selectedLibrary && selectedLibrary.id === id) {
      const updated = libraries.find(lib => lib.id === id);
      if (updated) {
        setSelectedLibrary(updated);
      }
    }
  };

  const handleDeleteLibrary = async (library: Library) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${library.name}" ?\n\nCette action est irréversible.`)) {
      const deleteFiles = confirm('Supprimer également les fichiers physiques ?');
      const success = await deleteLibrary(library.id, deleteFiles);
      if (success) {
        if (selectedLibrary?.id === library.id) {
          setSelectedLibrary(null);
        }
        setLibraryMenuOpen(null);
      }
    }
  };

  const handleToggleFavorite = async (library: Library) => {
    await updateLibrary(library.id, { isFavorite: !library.isFavorite });
    await refreshLibraries();
    setLibraryMenuOpen(null);
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) {
      const success = await deleteDocument(documentId);
      if (success && selectedLibrary) {
        await getDocuments(selectedLibrary.id);
        await refreshLibraries();
      }
    }
  };

  return (
    <div className="flex h-full bg-neutral-950">
      {/* Sidebar - Library List */}
      <div className="w-80 border-r border-neutral-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-neutral-100">Bibliothèques</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
            >
              + Nouvelle
            </button>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Library List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && (
            <div className="text-center text-neutral-400 py-8">Chargement...</div>
          )}

          {error && (
            <div className="text-center text-red-400 py-8 px-4">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {!loading && !error && filteredLibraries.length === 0 && (
            <div className="text-center text-neutral-400 py-8">
              <p className="text-sm">Aucune bibliothèque</p>
            </div>
          )}

          {filteredLibraries.map((library) => (
            <div key={library.id} className="relative">
              <button
                onClick={() => setSelectedLibrary(library)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedLibrary?.id === library.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-lg">{library.icon}</span>
                    <span className="font-medium text-sm truncate">{library.name}</span>
                    {library.isFavorite && (
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLibraryMenuOpen(libraryMenuOpen === library.id ? null : library.id);
                    }}
                    className={`p-1 rounded hover:bg-neutral-800 ${
                      selectedLibrary?.id === library.id ? 'hover:bg-blue-700' : ''
                    }`}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs text-neutral-400 mt-2">
                  <span>{library.documentCount} docs</span>
                  <span>•</span>
                  <span>{library.totalChunks} chunks</span>
                </div>
              </button>

              {/* Context Menu */}
              {libraryMenuOpen === library.id && (
                <div className="absolute right-2 top-12 z-10 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl py-1 min-w-[160px]">
                  <button
                    onClick={() => handleToggleFavorite(library)}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-100 hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <Star className={`w-4 h-4 ${library.isFavorite ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    {library.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  </button>
                  <button
                    onClick={handleEditLibrary}
                    className="w-full px-4 py-2 text-left text-sm text-neutral-100 hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDeleteLibrary(library)}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedLibrary ? (
          <>
            {/* Library Header */}
            <div className="p-6 border-b border-neutral-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{selectedLibrary.icon}</span>
                    <h2 className="text-2xl font-semibold text-neutral-100">
                      {selectedLibrary.name}
                    </h2>
                  </div>
                  {selectedLibrary.description && (
                    <p className="text-sm text-neutral-400">{selectedLibrary.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg text-sm transition-colors">
                    Paramètres
                  </button>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  >
                    + Ajouter document
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-6 mt-4">
                <div className="text-sm">
                  <span className="text-neutral-400">Documents:</span>{' '}
                  <span className="text-neutral-100 font-medium">
                    {selectedLibrary.documentCount}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-neutral-400">Taille:</span>{' '}
                  <span className="text-neutral-100 font-medium">
                    {formatBytes(selectedLibrary.totalSize)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-neutral-400">Chunks:</span>{' '}
                  <span className="text-neutral-100 font-medium">
                    {selectedLibrary.totalChunks}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-neutral-400">Patches vision:</span>{' '}
                  <span className="text-neutral-100 font-medium">
                    {selectedLibrary.totalPatches}
                  </span>
                </div>
              </div>
            </div>

            {/* Documents List */}
            <div className="flex-1 overflow-y-auto p-6">
              {documents.length === 0 ? (
                <div className="text-center text-neutral-400 py-12">
                  <p className="text-lg mb-2">Aucun document</p>
                  <p className="text-sm">
                    Ajoutez des documents à cette bibliothèque pour commencer
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="relative group">
                      <button
                        onClick={() => setSelectedDocument(doc)}
                        className="w-full p-4 bg-neutral-900 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors text-left"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-neutral-100 truncate mb-1">
                              {doc.originalName}
                            </h3>
                            <p className="text-xs text-neutral-400">
                              {formatBytes(doc.size)} • {doc.mimeType}
                            </p>
                            {(doc.textEmbeddingModel || doc.visionEmbeddingModel) && (
                              <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                                <span className="text-neutral-600">📊</span>
                                {doc.textEmbeddingModel && (
                                  <span className="truncate" title={doc.textEmbeddingModel}>
                                    Text: {doc.textEmbeddingModel.split('/').pop()}
                                  </span>
                                )}
                                {doc.textEmbeddingModel && doc.visionEmbeddingModel && (
                                  <span>•</span>
                                )}
                                {doc.visionEmbeddingModel && (
                                  <span className="truncate" title={doc.visionEmbeddingModel}>
                                    Vision: {doc.visionEmbeddingModel.split('/').pop()}
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>

                      <div className="flex items-center gap-2 mt-3">
                        {doc.isIndexedText && (
                          <span className="px-2 py-0.5 bg-green-900/30 text-green-400 text-xs rounded">
                            Text RAG
                          </span>
                        )}
                        {doc.isIndexedVision && (
                          <span className="px-2 py-0.5 bg-purple-900/30 text-purple-400 text-xs rounded">
                            Vision RAG
                          </span>
                        )}
                        <span
                          className={`px-2 py-0.5 text-xs rounded ${getValidationStatusClass(
                            doc.validationStatus
                          )}`}
                        >
                          {getValidationStatusLabel(doc.validationStatus)}
                        </span>
                      </div>
                      </button>

                      {/* Delete button (visible on hover) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDocument(doc.id);
                        }}
                        className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-400">
            <div className="text-center">
              <p className="text-lg mb-2">Sélectionnez une bibliothèque</p>
              <p className="text-sm">
                ou créez-en une nouvelle pour commencer
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateLibraryModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateLibrary}
      />

      <EditLibraryModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        library={selectedLibrary}
        onUpdate={handleUpdateLibrary}
      />

      {selectedLibrary && (
        <DocumentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          libraryId={selectedLibrary.id}
          onUpload={handleUploadDocument}
        />
      )}

      {/* Document Viewer */}
      {selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
          onReindex={handleReindexDocument}
          onValidate={handleValidateDocument}
        />
      )}
    </div>
  );
}

// Helper functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

function getValidationStatusClass(
  status: 'pending' | 'validated' | 'needs_review' | 'rejected'
): string {
  switch (status) {
    case 'validated':
      return 'bg-green-900/30 text-green-400';
    case 'needs_review':
      return 'bg-yellow-900/30 text-yellow-400';
    case 'rejected':
      return 'bg-red-900/30 text-red-400';
    default:
      return 'bg-neutral-800 text-neutral-400';
  }
}

function getValidationStatusLabel(
  status: 'pending' | 'validated' | 'needs_review' | 'rejected'
): string {
  switch (status) {
    case 'validated':
      return 'Validé';
    case 'needs_review':
      return 'À revoir';
    case 'rejected':
      return 'Rejeté';
    default:
      return 'En attente';
  }
}
