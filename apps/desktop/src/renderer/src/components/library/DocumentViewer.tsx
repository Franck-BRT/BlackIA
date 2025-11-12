/**
 * Document Viewer with Split View
 * Shows document source and RAG chunks side-by-side
 * Design aligned with EditorPage for consistency
 */

import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, FileText, Grid3X3, RefreshCw, Check, AlertCircle, List } from 'lucide-react';
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
      <div className="flex-none p-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-neutral-100">{document.originalName}</h1>
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
              <span>{formatBytes(document.size)}</span>
              <span>•</span>
              <span>{document.mimeType}</span>
              {document.isIndexedText && (
                <>
                  <span>•</span>
                  <span className="text-green-400">{document.textChunkCount} chunks</span>
                </>
              )}
              {document.isIndexedVision && (
                <>
                  <span>•</span>
                  <span className="text-purple-400">{document.visionPatchCount} patches</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="glass-card p-4 border-b border-white/10 flex items-center gap-2 flex-wrap">
        {/* View Mode Toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setViewMode('source')}
            className={cn(
              'p-2 rounded transition-colors',
              viewMode === 'source' ? 'bg-white/20' : 'hover:bg-white/10'
            )}
            title="Vue source uniquement"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={cn(
              'p-2 rounded transition-colors',
              viewMode === 'split' ? 'bg-white/20' : 'hover:bg-white/10'
            )}
            title="Vue partagée"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('chunks')}
            className={cn(
              'p-2 rounded transition-colors',
              viewMode === 'chunks' ? 'bg-white/20' : 'hover:bg-white/10'
            )}
            title="Chunks uniquement"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom Controls */}
        {(viewMode === 'source' || viewMode === 'split') && (
          <>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <div className="flex items-center gap-1">
              <button
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="p-2 rounded hover:bg-white/10 transition-colors"
                title="Zoom arrière"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 text-sm text-muted-foreground min-w-[3rem] text-center">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="p-2 rounded hover:bg-white/10 transition-colors"
                title="Zoom avant"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </>
        )}

        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {onReindex && (
            <button
              onClick={handleReindex}
              className="px-3 py-2 rounded hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
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
                'px-3 py-2 rounded transition-colors flex items-center gap-2 text-sm',
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

      {/* Content - Takes remaining space */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Source Panel */}
        {(viewMode === 'source' || viewMode === 'split') && (
          <div
            className={cn(
              'flex flex-col overflow-auto',
              viewMode === 'split' ? 'w-1/2 border-r border-white/10' : 'w-full'
            )}
          >
            <div className="p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Document source</h3>
              {document.extractedText ? (
                <div className="prose prose-invert max-w-none" style={{ fontSize: `${zoom}%` }}>
                  <pre className="whitespace-pre-wrap text-gray-300 font-mono text-sm leading-relaxed bg-transparent border-0 p-0">
                    {document.extractedText}
                  </pre>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-12">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-base">Pas de texte extrait</p>
                  <p className="text-sm mt-2 opacity-75">
                    Le texte n'a pas pu être extrait de ce document
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chunks Panel */}
        {(viewMode === 'chunks' || viewMode === 'split') && (
          <div
            className={cn(
              'flex flex-col overflow-auto',
              viewMode === 'split' ? 'w-1/2' : 'w-full'
            )}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Chunks générés ({chunks.length})
                </h3>
                {loading && (
                  <span className="text-xs text-muted-foreground">Chargement...</span>
                )}
              </div>

              {chunks.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-base">Aucun chunk généré</p>
                  <p className="text-sm mt-2 opacity-75">
                    Indexez ce document pour générer des chunks
                  </p>
                </div>
              ) : (
                <ChunkList
                  chunks={chunks}
                  selectedChunkId={selectedChunkId}
                  onSelectChunk={setSelectedChunkId}
                  documentId={document.id}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Validation Panel */}
      {showValidationPanel && (
        <div className="flex-none glass-card border-t border-white/10 p-6">
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
