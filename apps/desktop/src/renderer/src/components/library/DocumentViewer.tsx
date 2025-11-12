/**
 * Document Viewer with Split View
 * Shows document source and RAG chunks side-by-side
 * Reuses MarkdownEditor's proven preview rendering
 * Uses React Portal to render outside of main layout and avoid z-index issues
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { X, FileText, List, Grid3X3, RefreshCw, Check, AlertCircle } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'split' | 'preview' | 'chunks'>('split');
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

  // Render using portal to avoid z-index stacking context issues
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex flex-col bg-neutral-950">
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
            onClick={() => setViewMode('preview')}
            className={cn(
              'p-2 rounded transition-colors',
              viewMode === 'preview' ? 'bg-white/20' : 'hover:bg-white/10'
            )}
            title="Aperçu uniquement"
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
      <div className="flex-1 flex overflow-hidden">
        {/* Preview Panel - Using MarkdownEditor's proven rendering */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div
            className={cn(
              'flex-1 overflow-auto p-6',
              viewMode === 'split' ? 'w-1/2 border-r border-white/10' : 'w-full'
            )}
          >
            {document.extractedText ? (
              <div className="prose prose-invert max-w-none
                prose-headings:text-white prose-headings:font-bold
                prose-h1:text-3xl prose-h1:mt-8 prose-h1:mb-4
                prose-h2:text-2xl prose-h2:mt-6 prose-h2:mb-3 prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-2
                prose-h3:text-xl prose-h3:mt-4 prose-h3:mb-2
                prose-p:text-gray-300 prose-p:leading-7
                prose-a:text-purple-400 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-white prose-strong:font-semibold
                prose-code:text-pink-400 prose-code:bg-white/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-gray-900 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-lg
                prose-ul:text-gray-300 prose-ol:text-gray-300
                prose-li:marker:text-purple-400
                prose-blockquote:border-l-purple-500 prose-blockquote:text-gray-400 prose-blockquote:italic
                prose-table:border prose-table:border-white/10
                prose-th:bg-white/5 prose-th:text-white prose-th:font-semibold prose-th:border prose-th:border-white/10
                prose-td:border prose-td:border-white/10 prose-td:text-gray-300
                prose-img:rounded-lg prose-img:border prose-img:border-white/10
                prose-hr:border-white/10
              ">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ inline, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const language = match ? match[1] : '';

                      return !inline && language ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={language}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            borderRadius: '0.5rem',
                            fontSize: '0.875rem',
                          }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {document.extractedText}
                </ReactMarkdown>
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
    </div>,
    document.body
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}
