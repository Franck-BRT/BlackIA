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
                  ? 'bg-primary/10 border-primary'
                  : 'bg-card hover:bg-accent border-border'
              }
            `}
            onClick={() => onSelectPatch(patch.id)}
          >
            <div className="flex items-start gap-3">
              {/* Page Thumbnail */}
              {patch.pageThumbnail ? (
                <div className="flex-shrink-0 w-24 h-24 rounded overflow-hidden bg-muted border border-border">
                  <img
                    src={patch.pageThumbnail}
                    alt={`Page ${patch.pageNumber}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-24 h-24 rounded bg-muted border border-border flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}

              {/* Patch Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">
                    Page {patch.pageNumber}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <div>
                    <span className="font-medium">{patch.patchCount}</span> patches
                  </div>
                  {patch.metadata?.model && (
                    <div>
                      Modèle: <span className="font-mono">{patch.metadata.model}</span>
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
          </div>
        );
      })}
    </div>
  );
}
