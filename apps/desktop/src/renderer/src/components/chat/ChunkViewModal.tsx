import React from 'react';
import { X, FileText, Eye } from 'lucide-react';
import type { RAGSource } from '../../types/attachment';

interface ChunkViewModalProps {
  source: RAGSource;
  onClose: () => void;
}

/**
 * Modal pour afficher le contenu complet d'un chunk RAG
 */
export function ChunkViewModal({ source, onClose }: ChunkViewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="glass-card rounded-2xl border border-white/20 max-w-3xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            {source.type === 'text' ? (
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            ) : (
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold">{source.fileName}</h3>
              <p className="text-sm text-muted-foreground">
                {source.type === 'text'
                  ? `Chunk #${source.chunkIndex ?? 0}`
                  : `Page ${source.page} • Patch #${source.patchIndex ?? 0}`}
                {' • '}
                <span className="text-green-400">{(source.score * 100).toFixed(0)}% pertinence</span>
              </p>
            </div>
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
        <div className="flex-1 overflow-y-auto p-6">
          {source.type === 'text' && source.chunkText ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Contenu du chunk</h4>
                <div className="p-4 rounded-lg bg-black/20 border border-white/10">
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{source.chunkText}</p>
                </div>
              </div>
            </div>
          ) : source.type === 'vision' && source.pageThumbnail ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Aperçu de la page</h4>
                <div className="flex justify-center">
                  <img
                    src={source.pageThumbnail}
                    alt={`Page ${source.page}`}
                    className="max-w-full rounded-lg border border-white/10"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Aucun contenu disponible
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg glass-hover border border-white/10 hover:border-white/20 transition-all"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
