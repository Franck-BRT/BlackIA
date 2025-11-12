/**
 * Document Viewer with Split View
 * Uses MarkdownEditor directly for consistency with Editor module
 * Adds chunk panel on the right side
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, List, RefreshCw, Check } from 'lucide-react';
import { MarkdownEditor } from '../editor/MarkdownEditor';
import { useChunkEditor } from '../../hooks/useChunkEditor';
import { ChunkList } from './ChunkList';
import { cn } from '@blackia/ui';
import type { LibraryDocument } from '../../hooks/useLibraryDocuments';

interface DocumentViewerProps {
  document: LibraryDocument;
  onClose: () => void;
  onReindex?: (documentId: string) => Promise<void>;
  onValidate?: (documentId: string, status: 'validated' | 'needs_review' | 'rejected', notes?: string) => Promise<void>;
}

export function DocumentViewer({ document: doc, onClose, onReindex, onValidate }: DocumentViewerProps) {
  const { chunks, loading, getDocumentChunks } = useChunkEditor();
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [showChunksPanel, setShowChunksPanel] = useState(true);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [validationNotes, setValidationNotes] = useState('');

  useEffect(() => {
    if (doc.id) {
      console.log('[DocumentViewer] Mounted with document:', {
        id: doc.id,
        name: doc.originalName,
        hasExtractedText: !!doc.extractedText,
        textLength: doc.extractedText?.length || 0,
        isIndexedText: doc.isIndexedText,
        textChunkCount: doc.textChunkCount
      });

      // Load chunks
      getDocumentChunks(doc.id).then((loadedChunks) => {
        console.log('[DocumentViewer] Chunks loaded:', loadedChunks.length, loadedChunks);
      });
    }
  }, [doc.id, getDocumentChunks]);

  const handleReindex = async () => {
    console.log('[DocumentViewer] Reindex button clicked for document:', doc.id);
    if (onReindex) {
      console.log('[DocumentViewer] Calling onReindex...');
      await onReindex(doc.id);
      console.log('[DocumentViewer] Reindex complete, reloading chunks...');
      const reloadedChunks = await getDocumentChunks(doc.id);
      console.log('[DocumentViewer] Chunks after reindex:', reloadedChunks.length, reloadedChunks);
    } else {
      console.warn('[DocumentViewer] onReindex callback not provided');
    }
  };

  const handleValidate = async (status: 'validated' | 'needs_review' | 'rejected') => {
    if (onValidate) {
      await onValidate(doc.id, status, validationNotes);
      setShowValidationPanel(false);
      setValidationNotes('');
    }
  };

  // Use window.document to avoid conflict with 'doc' prop
  const portalRoot = window.document.getElementById('root');
  if (!portalRoot) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col bg-neutral-950">
      {/* Header Bar */}
      <div className="flex-none h-16 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-lg font-semibold text-neutral-100">{doc.originalName}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{formatBytes(doc.size)}</span>
              <span>•</span>
              <span>{doc.mimeType}</span>
              {doc.isIndexedText && (
                <>
                  <span>•</span>
                  <span className="text-green-400">{doc.textChunkCount} chunks</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowChunksPanel(!showChunksPanel)}
            className={cn(
              'px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm',
              showChunksPanel ? 'bg-white/20' : 'hover:bg-white/10'
            )}
            title="Afficher/masquer les chunks"
          >
            <List className="w-4 h-4" />
            <span>Chunks ({chunks.length})</span>
          </button>

          {onReindex && (
            <button
              onClick={handleReindex}
              className="px-3 py-2 rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
              title="Réindexer le document"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Réindexer</span>
            </button>
          )}

          {onValidate && (
            <button
              onClick={() => setShowValidationPanel(!showValidationPanel)}
              className={cn(
                'px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm',
                showValidationPanel
                  ? 'bg-purple-500/30 hover:bg-purple-500/40'
                  : 'bg-purple-500/20 hover:bg-purple-500/30'
              )}
              title="Valider le document"
            >
              <Check className="w-4 h-4" />
              <span>Valider</span>
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Editor - Uses MarkdownEditor component */}
        <div className={cn(
          'flex-1 overflow-hidden',
          showChunksPanel && 'border-r border-neutral-800'
        )}>
          <MarkdownEditor
            initialContent={doc.extractedText || '# Aucun contenu\n\nLe texte n\'a pas pu être extrait de ce document.'}
            onSave={(content) => {
              console.log('[DocumentViewer] Content saved (read-only mode):', content.length);
            }}
          />
        </div>

        {/* Chunks Panel */}
        {showChunksPanel && (
          <div className="w-96 flex flex-col bg-neutral-900/50">
            <div className="p-4 border-b border-neutral-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-neutral-200">
                  Chunks RAG
                </h3>
                {loading && (
                  <span className="text-xs text-muted-foreground">Chargement...</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {chunks.length} chunks générés
              </p>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {chunks.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <p className="text-sm">Aucun chunk généré</p>
                  <p className="text-xs mt-2 opacity-75">
                    Indexez ce document pour générer des chunks
                  </p>
                </div>
              ) : (
                <ChunkList
                  chunks={chunks}
                  selectedChunkId={selectedChunkId}
                  onSelectChunk={setSelectedChunkId}
                  documentId={doc.id}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Validation Panel */}
      {showValidationPanel && (
        <div className="flex-none bg-neutral-900/95 backdrop-blur-sm border-t border-neutral-800 p-6">
          <h3 className="text-sm font-medium text-neutral-200 mb-4">Validation du document</h3>
          <textarea
            value={validationNotes}
            onChange={(e) => setValidationNotes(e.target.value)}
            placeholder="Notes de validation (optionnel)..."
            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-neutral-100 placeholder-muted-foreground focus:outline-none focus:border-purple-500 resize-none mb-4"
            rows={3}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowValidationPanel(false)}
              className="px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
            >
              Annuler
            </button>
            <button
              onClick={() => handleValidate('rejected')}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors text-sm"
            >
              Rejeter
            </button>
            <button
              onClick={() => handleValidate('needs_review')}
              className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg transition-colors text-sm"
            >
              À revoir
            </button>
            <button
              onClick={() => handleValidate('validated')}
              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors text-sm"
            >
              Valider
            </button>
          </div>
        </div>
      )}
    </div>,
    portalRoot
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}
