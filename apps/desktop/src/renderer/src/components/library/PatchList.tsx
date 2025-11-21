/**
 * Patch List Component
 * Displays Vision RAG patches for a document
 */

import React from 'react';
import { Eye, Image as ImageIcon } from 'lucide-react';

export interface VisionPatch {
  id: string;
  pageIndex: number;
  pageNumber: number;
  patchCount: number;
  pageThumbnail?: string;
  metadata: any;
}

interface PatchListProps {
  patches: VisionPatch[];
  selectedPatchId: string | null;
  onSelectPatch: (patchId: string | null) => void;
}

export function PatchList({ patches, selectedPatchId, onSelectPatch }: PatchListProps) {
  if (patches.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground p-8 text-center">
        <div>
          <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucun patch indexé</p>
          <p className="text-sm mt-2">
            Les patches seront visibles après l'indexation Vision RAG
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      {patches.map((patch) => {
        const isSelected = patch.id === selectedPatchId;

        return (
          <div
            key={patch.id}
            className={`
              border rounded-lg p-3 cursor-pointer transition-colors
              ${
                isSelected
                  ? 'bg-blue-500/10 border-blue-500'
                  : 'bg-neutral-800 hover:bg-neutral-700 border-neutral-700'
              }
            `}
            onClick={() => onSelectPatch(isSelected ? null : patch.id)}
          >
            <div className="flex items-start gap-3">
              {/* Page Thumbnail */}
              {patch.pageThumbnail ? (
                <div className="flex-shrink-0 w-24 h-24 rounded overflow-hidden bg-neutral-900 border border-neutral-700">
                  <img
                    src={patch.pageThumbnail}
                    alt={`Page ${patch.pageNumber}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-24 h-24 rounded bg-neutral-900 border border-neutral-700 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-neutral-500" />
                </div>
              )}

              {/* Patch Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4 text-purple-400" />
                  <span className="font-medium text-sm text-neutral-100">
                    Page {patch.pageNumber}
                  </span>
                </div>

                <div className="text-xs text-neutral-400 space-y-1">
                  <div>
                    <span className="font-medium text-neutral-300">{patch.patchCount}</span> patches
                  </div>
                  {patch.metadata?.model && (
                    <div>
                      Modèle: <span className="font-mono text-neutral-300">{patch.metadata.model}</span>
                    </div>
                  )}
                  {patch.metadata?.embeddingDim && (
                    <div>
                      Dim: {patch.metadata.embeddingDim}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded View - Show full page image when selected */}
            {isSelected && patch.pageThumbnail && (
              <div className="mt-4 pt-4 border-t border-neutral-700">
                <div className="bg-neutral-900 rounded-lg p-4">
                  <img
                    src={patch.pageThumbnail}
                    alt={`Page ${patch.pageNumber} - Vue complète`}
                    className="w-full h-auto rounded border border-neutral-700"
                  />
                  <div className="mt-3 text-xs text-neutral-400">
                    <div className="flex items-center justify-between">
                      <span>Page {patch.pageNumber} (Index: {patch.pageIndex})</span>
                      <span>{patch.patchCount} patches générés</span>
                    </div>
                    {patch.metadata?.model && (
                      <div className="mt-2">
                        <span className="font-medium">Modèle d&apos;embedding:</span>{' '}
                        <span className="font-mono text-purple-300">{patch.metadata.model}</span>
                      </div>
                    )}
                    {patch.metadata?.embeddingDim && (
                      <div className="mt-1">
                        <span className="font-medium">Dimension:</span>{' '}
                        <span className="text-neutral-300">{patch.metadata.embeddingDim}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
