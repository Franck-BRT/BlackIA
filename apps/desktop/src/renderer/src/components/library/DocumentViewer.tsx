/**
 * Document Viewer with Split View
 * Shows document source and RAG chunks side-by-side
 */

import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, FileText, Grid3X3, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { useChunkEditor } from '../../hooks/useChunkEditor';
import { ChunkList } from './ChunkList';
import type { LibraryDocument } from '../../hooks/useLibraryDocuments';

interface DocumentViewerProps {
  document: LibraryDocument;
  onClose: () => void;
  onReindex?: (documentId: string) => Promise<void>;
  onValidate?: (documentId: string, status: 'validated' | 'needs_review' | 'rejected', notes?: string) => Promise<void>;
}

export function DocumentViewer({ document, onClose, onReindex, onValidate }: DocumentViewerProps) {
  const { chunks, loading, getDocumentChunks } = useChunkEditor();
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'split' | 'source' | 'chunks'>('split');
  const [zoom, setZoom] = useState(100);
  const [showValidationPanel, setShowValidationPanel] = useState(false);
  const [validationNotes, setValidationNotes] = useState('');

  useEffect(() => {
    if (document.id) {
      getDocumentChunks(document.id);
    }
  }, [document.id, getDocumentChunks]);

  const handleReindex = async () => {
    if (onReindex) {
      await onReindex(document.id);
      await getDocumentChunks(document.id);
    }
  };

  const handleValidate = async (status: 'validated' | 'needs_review' | 'rejected') => {
    if (onValidate) {
      await onValidate(document.id, status, validationNotes);
      setShowValidationPanel(false);
      setValidationNotes('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-neutral-950">
      {/* Header */}
      <div className="flex-none h-16 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
          <div>
            <h2 className="text-lg font-semibold text-neutral-100">{document.originalName}</h2>
            <div className="flex items-center gap-3 text-xs text-neutral-400">
              <span>{formatBytes(document.size)}</span>
              <span>•</span>
              <span>{document.mimeType}</span>
              {document.isIndexedText && (
                <>
                  <span>•</span>
                  <span className="text-green-400">{document.textChunkCount} chunks</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('source')}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                viewMode === 'source'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:text-neutral-100'
              }`}
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                viewMode === 'split'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:text-neutral-100'
              }`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('chunks')}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                viewMode === 'chunks'
                  ? 'bg-blue-600 text-white'
                  : 'text-neutral-400 hover:text-neutral-100'
              }`}
            >
              Chunks
            </button>
          </div>

          {/* Zoom Controls */}
          {(viewMode === 'source' || viewMode === 'split') && (
            <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="px-2 py-1.5 hover:bg-neutral-700 rounded text-neutral-400 hover:text-neutral-100"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-sm text-neutral-400">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="px-2 py-1.5 hover:bg-neutral-700 rounded text-neutral-400 hover:text-neutral-100"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Actions */}
          {onReindex && (
            <button
              onClick={handleReindex}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Réindexer
            </button>
          )}

          {onValidate && (
            <button
              onClick={() => setShowValidationPanel(!showValidationPanel)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Valider
            </button>
          )}
        </div>
      </div>

      {/* Content - Takes remaining space */}
      <div className="flex-1 flex min-h-0">
        {/* Source Panel */}
        {(viewMode === 'source' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} border-r border-neutral-800 overflow-auto`}>
            <div className="p-6">
              <h3 className="text-sm font-medium text-neutral-400 mb-4">Document source</h3>
              {document.extractedText ? (
                <div
                  className="prose prose-invert max-w-none"
                  style={{ fontSize: `${zoom}%` }}
                >
                  <pre className="whitespace-pre-wrap text-neutral-300 font-mono text-sm">
                    {document.extractedText}
                  </pre>
                </div>
              ) : (
                <div className="text-center text-neutral-400 py-12">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                  <p>Pas de texte extrait</p>
                  <p className="text-sm mt-2">
                    Le texte n'a pas pu être extrait de ce document
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chunks Panel */}
        {(viewMode === 'chunks' || viewMode === 'split') && (
          <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} overflow-auto`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-neutral-400">
                  Chunks générés ({chunks.length})
                </h3>
                {loading && (
                  <span className="text-xs text-neutral-500">Chargement...</span>
                )}
              </div>

              <ChunkList
                chunks={chunks}
                selectedChunkId={selectedChunkId}
                onSelectChunk={setSelectedChunkId}
                documentId={document.id}
              />
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
            className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500 resize-none mb-4"
            rows={3}
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowValidationPanel(false)}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg text-sm transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => handleValidate('rejected')}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
            >
              Rejeter
            </button>
            <button
              onClick={() => handleValidate('needs_review')}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm transition-colors"
            >
              À revoir
            </button>
            <button
              onClick={() => handleValidate('validated')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
            >
              Valider
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}
