/**
 * Library Page
 * Main page for document library management
 */

import React, { useState, useEffect } from 'react';
import { useLibraries } from '../hooks/useLibraries';
import { useLibraryDocuments } from '../hooks/useLibraryDocuments';
import type { Library } from '../types/library';

export function LibraryPage() {
  const { libraries, loading, error, createLibrary, updateLibrary, deleteLibrary, refreshLibraries } =
    useLibraries();
  const { documents, getDocuments } = useLibraryDocuments();
  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load documents when library is selected
  useEffect(() => {
    if (selectedLibrary) {
      getDocuments(selectedLibrary.id);
    }
  }, [selectedLibrary, getDocuments]);

  // Filter libraries by search
  const filteredLibraries = libraries.filter((lib) =>
    lib.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
            <button
              key={library.id}
              onClick={() => setSelectedLibrary(library)}
              className={`w-full p-3 rounded-lg text-left transition-colors ${
                selectedLibrary?.id === library.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-100'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{library.icon}</span>
                <span className="font-medium text-sm truncate">{library.name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-neutral-400 mt-2">
                <span>{library.documentCount} docs</span>
                <span>•</span>
                <span>{library.totalChunks} chunks</span>
              </div>
            </button>
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
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors">
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
                    <div
                      key={doc.id}
                      className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-neutral-100 truncate mb-1">
                            {doc.originalName}
                          </h3>
                          <p className="text-xs text-neutral-400">
                            {formatBytes(doc.size)} • {doc.mimeType}
                          </p>
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
