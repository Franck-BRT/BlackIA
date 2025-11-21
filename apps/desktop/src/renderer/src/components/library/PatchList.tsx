/**
 * Patch List Component
 * Displays Vision RAG patches for a document with grid visualization
 */

import React, { useState, useMemo } from 'react';
import { Eye, Image as ImageIcon, Grid3X3, EyeOff } from 'lucide-react';

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

/**
 * Calculate grid dimensions from patch count
 * ColPali typically uses square grids (32x32 = 1024 patches)
 */
function calculateGridDimensions(patchCount: number): { rows: number; cols: number } {
  // Common grid sizes for vision transformers
  const sqrt = Math.sqrt(patchCount);
  if (Number.isInteger(sqrt)) {
    return { rows: sqrt, cols: sqrt };
  }

  // Try to find factors close to square
  for (let cols = Math.ceil(sqrt); cols <= patchCount; cols++) {
    if (patchCount % cols === 0) {
      return { rows: patchCount / cols, cols };
    }
  }

  // Fallback: approximate
  const cols = Math.ceil(sqrt);
  const rows = Math.ceil(patchCount / cols);
  return { rows, cols };
}

/**
 * Patch Grid Overlay Component
 */
function PatchGridOverlay({
  patchCount,
  showNumbers,
  highlightedPatch
}: {
  patchCount: number;
  showNumbers: boolean;
  highlightedPatch: number | null;
}) {
  const { rows, cols } = useMemo(() => calculateGridDimensions(patchCount), [patchCount]);
  const [hoveredPatch, setHoveredPatch] = useState<number | null>(null);

  const patches = useMemo(() => {
    const result = [];
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        if (index < patchCount) {
          result.push({
            index,
            row,
            col,
            top: (row / rows) * 100,
            left: (col / cols) * 100,
            width: 100 / cols,
            height: 100 / rows,
          });
        }
      }
    }
    return result;
  }, [rows, cols, patchCount]);

  return (
    <div className="absolute inset-0 pointer-events-auto">
      {patches.map((patch) => {
        const isHovered = hoveredPatch === patch.index;
        const isHighlighted = highlightedPatch === patch.index;

        return (
          <div
            key={patch.index}
            className={`
              absolute border transition-all duration-150 cursor-pointer
              ${isHovered || isHighlighted
                ? 'border-purple-400 bg-purple-500/30 z-10'
                : 'border-blue-500/40 hover:border-purple-400 hover:bg-purple-500/20'
              }
            `}
            style={{
              top: `${patch.top}%`,
              left: `${patch.left}%`,
              width: `${patch.width}%`,
              height: `${patch.height}%`,
            }}
            onMouseEnter={() => setHoveredPatch(patch.index)}
            onMouseLeave={() => setHoveredPatch(null)}
          >
            {(showNumbers || isHovered) && (
              <div className={`
                absolute inset-0 flex items-center justify-center
                text-[8px] font-mono font-bold
                ${isHovered ? 'text-white' : 'text-blue-300/70'}
              `}>
                {patch.index}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function PatchList({ patches, selectedPatchId, onSelectPatch }: PatchListProps) {
  const [showPatchGrid, setShowPatchGrid] = useState(true);
  const [showPatchNumbers, setShowPatchNumbers] = useState(false);

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
        const { rows, cols } = calculateGridDimensions(patch.patchCount);

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
                    <span className="text-neutral-500 ml-1">({rows}x{cols} grille)</span>
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

            {/* Expanded View - Show full page image with patch grid when selected */}
            {isSelected && patch.pageThumbnail && (
              <div className="mt-4 pt-4 border-t border-neutral-700">
                {/* Controls */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPatchGrid(!showPatchGrid);
                    }}
                    className={`
                      flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors
                      ${showPatchGrid
                        ? 'bg-purple-600 text-white'
                        : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                      }
                    `}
                  >
                    <Grid3X3 className="w-3.5 h-3.5" />
                    Grille
                  </button>

                  {showPatchGrid && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPatchNumbers(!showPatchNumbers);
                      }}
                      className={`
                        flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors
                        ${showPatchNumbers
                          ? 'bg-blue-600 text-white'
                          : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
                        }
                      `}
                    >
                      {showPatchNumbers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      Numéros
                    </button>
                  )}
                </div>

                {/* Image with Patch Grid Overlay */}
                <div className="bg-neutral-900 rounded-lg p-4">
                  <div className="relative">
                    <img
                      src={patch.pageThumbnail}
                      alt={`Page ${patch.pageNumber} - Vue complète`}
                      className="w-full h-auto rounded border border-neutral-700"
                    />
                    {showPatchGrid && (
                      <div className="absolute inset-0 rounded overflow-hidden">
                        <PatchGridOverlay
                          patchCount={patch.patchCount}
                          showNumbers={showPatchNumbers}
                          highlightedPatch={null}
                        />
                      </div>
                    )}
                  </div>

                  {/* Patch Info */}
                  <div className="mt-3 text-xs text-neutral-400">
                    <div className="flex items-center justify-between">
                      <span>Page {patch.pageNumber} (Index: {patch.pageIndex})</span>
                      <span className="font-mono text-purple-300">{rows}x{cols} = {patch.patchCount} patches</span>
                    </div>
                    {patch.metadata?.model && (
                      <div className="mt-2">
                        <span className="font-medium">Modèle d&apos;embedding:</span>{' '}
                        <span className="font-mono text-purple-300">{patch.metadata.model}</span>
                      </div>
                    )}
                    {patch.metadata?.embeddingDim && (
                      <div className="mt-1">
                        <span className="font-medium">Dimension par patch:</span>{' '}
                        <span className="text-neutral-300">{patch.metadata.embeddingDim}</span>
                      </div>
                    )}
                    <div className="mt-3 p-2 bg-neutral-800 rounded text-neutral-500 text-[10px]">
                      <p className="mb-1"><strong className="text-neutral-400">ColPali Late Interaction:</strong></p>
                      <p>Chaque patch est un vecteur de {patch.metadata?.embeddingDim || 128} dimensions.
                      La recherche utilise MaxSim pour comparer tous les patches de la query avec tous les patches du document.</p>
                    </div>
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
