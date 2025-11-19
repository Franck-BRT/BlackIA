/**
 * Document Viewer with Split View
 * Uses MarkdownEditor directly for consistency with Editor module
 * Adds chunk panel on the right side
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, List, RefreshCw, Check, Settings } from 'lucide-react';
import { MarkdownEditor } from '../editor/MarkdownEditor';
import { useChunkEditor } from '../../hooks/useChunkEditor';
import { useResizable } from '../../hooks/useResizable';
import { ChunkList } from './ChunkList';
import { IndexConfigModal } from './IndexConfigModal';
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
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingMessage, setIndexingMessage] = useState('');
  const [availableModels, setAvailableModels] = useState<Array<{ name: string; downloaded: boolean }>>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [showIndexConfig, setShowIndexConfig] = useState(false);

  // Resizable panel pour les chunks
  const { width: chunksPanelWidth, isResizing, handleMouseDown } = useResizable({
    initialWidth: 400,
    minWidth: 250,
    maxWidth: 1400,
    storageKey: 'documentViewer-chunksPanelWidth',
  });

  // Charger les modèles disponibles
  useEffect(() => {
    const loadModels = async () => {
      try {
        console.log('[DocumentViewer] Loading embedding models...');
        const result = await window.electronAPI.mlx.embeddings.list();
        console.log('[DocumentViewer] Models result:', result);

        // L'API retourne soit { success, data } soit directement un tableau
        let models = [];
        if (result.success && result.data) {
          models = result.data;
        } else if (Array.isArray(result)) {
          models = result;
        }

        console.log('[DocumentViewer] Available models:', models);
        const downloadedModels = models.filter((m: any) => m.downloaded);
        console.log('[DocumentViewer] Downloaded models:', downloadedModels);

        setAvailableModels(models);

        // Initialiser avec le modèle actuel du document ou le premier modèle téléchargé
        if (doc.textEmbeddingModel) {
          console.log('[DocumentViewer] Using document model:', doc.textEmbeddingModel);
          setSelectedModel(doc.textEmbeddingModel);
        } else {
          const firstDownloaded = models.find((m: any) => m.downloaded);
          if (firstDownloaded) {
            console.log('[DocumentViewer] Using first downloaded model:', firstDownloaded.name);
            setSelectedModel(firstDownloaded.name);
          } else {
            console.log('[DocumentViewer] No downloaded models found');
          }
        }
      } catch (error) {
        console.error('[DocumentViewer] Failed to load models:', error);
      }
    };
    loadModels();
  }, [doc.textEmbeddingModel]);

  useEffect(() => {
    if (doc.id) {
      console.log('[DocumentViewer] Mounted with document:', JSON.stringify({
        id: doc.id,
        name: doc.originalName,
        hasExtractedText: !!doc.extractedText,
        textLength: doc.extractedText?.length || 0,
        isIndexedText: doc.isIndexedText,
        textChunkCount: doc.textChunkCount,
        ragMode: doc.ragMode
      }, null, 2));

      // Load chunks
      getDocumentChunks(doc.id).then((loadedChunks) => {
        console.log('[DocumentViewer] Chunks loaded:', loadedChunks.length);
        if (loadedChunks.length > 0) {
          console.log('[DocumentViewer] First chunk:', JSON.stringify(loadedChunks[0], null, 2));
        }
      });
    }
  }, [doc.id, doc.isIndexedText, doc.textChunkCount, getDocumentChunks]);

  const handleReindex = async (config?: {
    chunkSize?: number;
    chunkOverlap?: number;
    separator?: 'paragraph' | 'sentence' | 'line' | 'custom';
    customSeparator?: string;
    mode?: 'text' | 'vision' | 'hybrid' | 'auto';
    textModel?: string;
    visionModel?: string;
    forceReindex?: boolean;
  }) => {
    console.log('[DocumentViewer] Reindex button clicked for document:', doc.id, 'with config:', config);
    setIsIndexing(true);
    setIndexingMessage('Indexation en cours...');

    try {
      // Déterminer quel modèle utiliser (priorité: config.textModel > selectedModel > défaut)
      const modelToUse = config?.textModel || selectedModel || undefined;

      console.log('[DocumentViewer] Indexing with config:', {
        mode: config?.mode,
        textModel: modelToUse,
        visionModel: config?.visionModel,
        chunkSize: config?.chunkSize,
        chunkOverlap: config?.chunkOverlap,
      });

      // Appeler directement l'API avec le modèle sélectionné et la configuration
      const result = await window.electronAPI.libraryDocument.index({
        documentId: doc.id,
        model: modelToUse,
        visionModel: config?.visionModel,
        mode: config?.mode,
        chunkSize: config?.chunkSize,
        chunkOverlap: config?.chunkOverlap,
        forceReindex: config?.forceReindex,
      });

      if (result.success) {
        setIndexingMessage('Rechargement des chunks...');
        console.log('[DocumentViewer] Reindex complete, reloading chunks...');
        const reloadedChunks = await getDocumentChunks(doc.id);
        console.log('[DocumentViewer] Chunks after reindex:', reloadedChunks.length, reloadedChunks);

        setIndexingMessage(`✓ Indexation terminée - ${reloadedChunks.length} chunks générés`);

        // Appeler onReindex si fourni pour rafraîchir la liste des documents
        if (onReindex) {
          await onReindex(doc.id);
        }

        setTimeout(() => {
          setIsIndexing(false);
          setIndexingMessage('');
        }, 3000);
      } else {
        throw new Error(result.error || 'Indexation échouée');
      }
    } catch (error) {
      console.error('[DocumentViewer] Reindex error:', error);
      setIndexingMessage('❌ Erreur lors de l\'indexation');
      setTimeout(() => {
        setIsIndexing(false);
        setIndexingMessage('');
      }, 3000);
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
      <div className="flex-none h-16 bg-neutral-900/95 backdrop-blur-sm border-b border-neutral-800 flex items-center justify-between pl-20 pr-6">
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
            {(doc.textEmbeddingModel || doc.visionEmbeddingModel) && (
              <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                <span>📊 Modèles:</span>
                {doc.textEmbeddingModel && (
                  <span className="text-green-400" title={doc.textEmbeddingModel}>
                    Text: {doc.textEmbeddingModel}
                  </span>
                )}
                {doc.textEmbeddingModel && doc.visionEmbeddingModel && <span>•</span>}
                {doc.visionEmbeddingModel && (
                  <span className="text-purple-400" title={doc.visionEmbeddingModel}>
                    Vision: {doc.visionEmbeddingModel}
                  </span>
                )}
              </div>
            )}
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
            <>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isIndexing}
                className={cn(
                  "px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 text-sm text-neutral-100",
                  "hover:border-neutral-600 focus:outline-none focus:border-blue-500 transition-colors",
                  isIndexing && "opacity-50 cursor-not-allowed"
                )}
                title="Sélectionner le modèle d'embedding"
              >
                <option value="" disabled>Choisir un modèle...</option>
                {availableModels
                  .filter((m) => m.downloaded)
                  .map((model) => (
                    <option key={model.name} value={model.name}>
                      {model.name.split('/').pop()}
                    </option>
                  ))}
              </select>

              <button
                onClick={() => setShowIndexConfig(true)}
                disabled={isIndexing || !selectedModel}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  isIndexing || !selectedModel ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10"
                )}
                title="Configurer l'indexation"
              >
                <Settings className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleReindex()}
                disabled={isIndexing || !selectedModel}
                className={cn(
                  "px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm",
                  isIndexing || !selectedModel ? "opacity-50 cursor-not-allowed" : "hover:bg-white/10"
                )}
                title={selectedModel ? "Réindexer le document avec le modèle sélectionné" : "Sélectionnez un modèle d'abord"}
              >
                <RefreshCw className={cn("w-4 h-4", isIndexing && "animate-spin")} />
                <span>Réindexer</span>
              </button>
            </>
          )}

          {indexingMessage && (
            <div className={cn(
              "px-3 py-2 rounded-lg text-sm flex items-center gap-2",
              indexingMessage.includes('✓') ? "bg-green-500/20 text-green-300" :
              indexingMessage.includes('❌') ? "bg-red-500/20 text-red-300" :
              "bg-blue-500/20 text-blue-300"
            )}>
              {indexingMessage}
            </div>
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
        <div className="flex-1 overflow-hidden">
          <MarkdownEditor
            initialContent={doc.extractedText || '# Aucun contenu\n\nLe texte n\'a pas pu être extrait de ce document.'}
            onSave={(content) => {
              console.log('[DocumentViewer] Content saved (read-only mode):', content.length);
            }}
          />
        </div>

        {/* Resizable Divider */}
        {showChunksPanel && (
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              "w-1 cursor-col-resize hover:bg-blue-500/50 transition-colors relative group",
              isResizing && "bg-blue-500"
            )}
            title="Glisser pour redimensionner"
          >
            {/* Visual indicator */}
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 bg-neutral-700 group-hover:bg-blue-500/50 transition-colors" />
          </div>
        )}

        {/* Chunks Panel */}
        {showChunksPanel && (
          <div
            className="flex flex-col bg-neutral-900/50"
            style={{ width: `${chunksPanelWidth}px` }}
          >
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

      {/* Index Configuration Modal */}
      <IndexConfigModal
        isOpen={showIndexConfig}
        onClose={() => setShowIndexConfig(false)}
        onConfirm={(config) => {
          setShowIndexConfig(false);
          handleReindex(config);
        }}
        currentConfig={{
          chunkSize: 512,
          chunkOverlap: 10,
          separator: 'paragraph',
          mode: 'auto',
          textModel: selectedModel || doc.textEmbeddingModel,
          visionModel: doc.visionEmbeddingModel,
          forceReindex: true,
        }}
      />
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
