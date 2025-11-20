/**
 * Library File Picker Modal
 * Permet de sélectionner des fichiers depuis les bibliothèques
 */

import React, { useState, useEffect } from 'react';
import { X, BookOpen, FileText, Search, Check } from 'lucide-react';
import { useLibraries } from '../../hooks/useLibraries';
import { useLibraryDocuments, type LibraryDocument } from '../../hooks/useLibraryDocuments';

interface LibraryFilePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (documents: LibraryDocument[]) => void;
}

export function LibraryFilePicker({ isOpen, onClose, onSelect }: LibraryFilePickerProps) {
  const { libraries, loading: loadingLibraries } = useLibraries();
  const [selectedLibraryId, setSelectedLibraryId] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const {
    documents,
    loading: loadingDocuments,
    getDocuments,
  } = useLibraryDocuments();

  // Charger les documents quand une bibliothèque est sélectionnée
  useEffect(() => {
    if (selectedLibraryId) {
      getDocuments(selectedLibraryId);
    }
  }, [selectedLibraryId]);

  // Reset sélection quand on change de bibliothèque
  useEffect(() => {
    setSelectedDocuments(new Set());
    setSearchQuery('');
  }, [selectedLibraryId]);

  const handleToggleDocument = (documentId: string) => {
    const newSelection = new Set(selectedDocuments);
    if (newSelection.has(documentId)) {
      newSelection.delete(documentId);
    } else {
      newSelection.add(documentId);
    }
    setSelectedDocuments(newSelection);
  };

  const handleConfirm = () => {
    const selectedDocs = documents.filter(doc => selectedDocuments.has(doc.id));
    onSelect(selectedDocs);
    onClose();
  };

  // Filtrer les documents par recherche
  const filteredDocuments = documents.filter(doc =>
    doc.originalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-semibold text-neutral-100">
              Sélectionner des fichiers depuis une bibliothèque
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar - Liste des bibliothèques */}
          <div className="w-64 border-r border-neutral-800 overflow-y-auto p-4">
            <h3 className="text-sm font-medium text-neutral-300 mb-3">Bibliothèques</h3>
            {loadingLibraries ? (
              <div className="text-center text-sm text-neutral-400 py-4">
                Chargement...
              </div>
            ) : libraries.length === 0 ? (
              <div className="text-center text-sm text-neutral-400 py-4">
                Aucune bibliothèque
              </div>
            ) : (
              <div className="space-y-1">
                {libraries.map((library) => (
                  <button
                    key={library.id}
                    onClick={() => setSelectedLibraryId(library.id)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg transition-colors
                      ${selectedLibraryId === library.id
                        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                        : 'hover:bg-neutral-800 text-neutral-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{library.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{library.name}</div>
                        <div className="text-xs text-neutral-500">
                          {library.totalDocuments || 0} documents
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main - Liste des documents */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {!selectedLibraryId ? (
              <div className="flex-1 flex items-center justify-center text-neutral-400">
                <div className="text-center">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">Sélectionnez une bibliothèque</p>
                </div>
              </div>
            ) : (
              <>
                {/* Barre de recherche */}
                <div className="p-4 border-b border-neutral-800">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher un document..."
                      className="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Liste des documents */}
                <div className="flex-1 overflow-y-auto p-4">
                  {loadingDocuments ? (
                    <div className="text-center text-sm text-neutral-400 py-8">
                      Chargement des documents...
                    </div>
                  ) : filteredDocuments.length === 0 ? (
                    <div className="text-center text-sm text-neutral-400 py-8">
                      {searchQuery ? 'Aucun document trouvé' : 'Aucun document dans cette bibliothèque'}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredDocuments.map((doc) => {
                        const isSelected = selectedDocuments.has(doc.id);
                        return (
                          <button
                            key={doc.id}
                            onClick={() => handleToggleDocument(doc.id)}
                            className={`
                              w-full text-left p-3 rounded-lg border transition-colors
                              ${isSelected
                                ? 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                                : 'border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800 text-neutral-300'
                              }
                            `}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`
                                w-5 h-5 rounded border flex items-center justify-center flex-shrink-0
                                ${isSelected
                                  ? 'bg-blue-500 border-blue-500'
                                  : 'border-neutral-600'
                                }
                              `}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <FileText className="w-5 h-5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                  {doc.originalName}
                                </div>
                                <div className="text-xs text-neutral-500 flex items-center gap-2">
                                  <span>{(doc.size / 1024).toFixed(1)} KB</span>
                                  {doc.ragMode && (
                                    <span className="px-1.5 py-0.5 bg-neutral-700 rounded text-xs">
                                      {doc.ragMode === 'text' && '📝 Text'}
                                      {doc.ragMode === 'vision' && '👁️ Vision'}
                                      {doc.ragMode === 'hybrid' && '🔄 Hybrid'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-neutral-800">
          <div className="text-sm text-neutral-400">
            {selectedDocuments.size > 0 ? (
              <span className="text-blue-400 font-medium">
                {selectedDocuments.size} document{selectedDocuments.size > 1 ? 's' : ''} sélectionné{selectedDocuments.size > 1 ? 's' : ''}
              </span>
            ) : (
              <span>Aucun document sélectionné</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedDocuments.size === 0}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmer ({selectedDocuments.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
