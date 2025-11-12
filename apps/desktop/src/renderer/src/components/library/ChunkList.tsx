/**
 * Chunk List Component
 * Displays and manages RAG chunks with editing capabilities
 */

import React, { useState } from 'react';
import { Edit2, Trash2, Split, Merge, Plus, AlertCircle } from 'lucide-react';
import { useChunkEditor, type FullChunk } from '../../hooks/useChunkEditor';

interface ChunkListProps {
  chunks: FullChunk[];
  selectedChunkId: string | null;
  onSelectChunk: (chunkId: string | null) => void;
  documentId: string;
}

export function ChunkList({ chunks, selectedChunkId, onSelectChunk, documentId }: ChunkListProps) {
  const {
    editChunk,
    splitChunk,
    mergeChunks,
    deleteChunk,
    insertChunk,
  } = useChunkEditor();
  const [editingChunkId, setEditingChunkId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editReason, setEditReason] = useState('');
  const [splittingChunkId, setSplittingChunkId] = useState<string | null>(null);
  const [splitPosition, setSplitPosition] = useState(0);

  const handleStartEdit = (chunk: FullChunk) => {
    setEditingChunkId(chunk.id);
    setEditText(chunk.text);
    setEditReason('');
  };

  const handleSaveEdit = async (chunkId: string) => {
    if (!editText.trim()) return;

    await editChunk({
      chunkId,
      documentId,
      modifiedText: editText,
      reason: editReason || 'Manual edit',
    });

    setEditingChunkId(null);
    setEditText('');
    setEditReason('');
  };

  const handleCancelEdit = () => {
    setEditingChunkId(null);
    setEditText('');
    setEditReason('');
  };

  const handleDelete = async (chunkId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce chunk ?')) {
      await deleteChunk({
        chunkId,
        documentId,
        reason: 'Deleted by user',
      });
    }
  };

  const handleStartSplit = (chunk: FullChunk) => {
    setSplittingChunkId(chunk.id);
    setSplitPosition(Math.floor(chunk.text.length / 2)); // Default to middle
  };

  const handleSaveSplit = async (chunk: FullChunk) => {
    if (splitPosition <= 0 || splitPosition >= chunk.text.length) {
      alert('Position de division invalide');
      return;
    }

    await splitChunk({
      chunkId: chunk.id,
      documentId,
      position: splitPosition,
    });

    setSplittingChunkId(null);
    setSplitPosition(0);
  };

  const handleCancelSplit = () => {
    setSplittingChunkId(null);
    setSplitPosition(0);
  };

  const handleInsertChunk = async (afterChunkId: string | null) => {
    const text = prompt('Entrez le texte du nouveau chunk:');
    if (!text) return;

    await insertChunk({
      documentId,
      afterChunkId,
      text,
      reason: 'Manually inserted',
    });
  };

  if (chunks.length === 0) {
    return (
      <div className="text-center text-neutral-400 py-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <p>Aucun chunk généré</p>
        <p className="text-sm mt-2">Indexez le document pour générer des chunks</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {chunks.map((chunk, index) => {
        const isEditing = editingChunkId === chunk.id;
        const isSplitting = splittingChunkId === chunk.id;
        const isSelected = selectedChunkId === chunk.id;

        return (
          <div
            key={chunk.id}
            className={`p-4 rounded-lg border transition-colors ${
              isSelected
                ? 'border-blue-500 bg-blue-500/10'
                : chunk.isManual
                ? 'border-yellow-600 bg-yellow-600/10'
                : 'border-neutral-700 bg-neutral-800 hover:border-neutral-600'
            }`}
            onClick={() => onSelectChunk(isSelected ? null : chunk.id)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-neutral-400">
                  #{index + 1}
                </span>
                {chunk.isManual && (
                  <span className="px-2 py-0.5 bg-yellow-600/20 text-yellow-400 text-xs rounded">
                    Modifié
                  </span>
                )}
                <span className="text-xs text-neutral-500">
                  {chunk.tokenCount} tokens
                </span>
              </div>

              {!isEditing && !isSplitting && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(chunk);
                    }}
                    className="p-1.5 hover:bg-neutral-700 rounded transition-colors"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4 text-neutral-400" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartSplit(chunk);
                    }}
                    className="p-1.5 hover:bg-neutral-700 rounded transition-colors"
                    title="Diviser"
                  >
                    <Split className="w-4 h-4 text-neutral-400" />
                  </button>
                  {index < chunks.length - 1 && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        await mergeChunks({
                          chunk1Id: chunk.id,
                          chunk2Id: chunks[index + 1].id,
                          documentId,
                        });
                      }}
                      className="p-1.5 hover:bg-neutral-700 rounded transition-colors"
                      title="Fusionner avec le suivant"
                    >
                      <Merge className="w-4 h-4 text-neutral-400" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(chunk.id);
                    }}
                    className="p-1.5 hover:bg-neutral-700 rounded transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4 text-neutral-400" />
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            {isEditing ? (
              <div className="space-y-3">
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-sm text-neutral-100 focus:outline-none focus:border-blue-500 resize-none font-mono"
                  rows={6}
                  onClick={(e) => e.stopPropagation()}
                />
                <input
                  type="text"
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="Raison de la modification..."
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-700 rounded text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                  onClick={(e) => e.stopPropagation()}
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelEdit();
                    }}
                    className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-neutral-100 rounded text-sm transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveEdit(chunk.id);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            ) : isSplitting ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm text-neutral-300 leading-relaxed font-mono whitespace-pre-wrap border-b border-neutral-700 pb-2">
                    {chunk.text.slice(0, splitPosition)}
                    <span className="bg-blue-500/30 text-blue-300">|</span>
                    {chunk.text.slice(splitPosition)}
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-neutral-400 whitespace-nowrap">
                      Position: {splitPosition} / {chunk.text.length}
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={chunk.text.length - 1}
                      value={splitPosition}
                      onChange={(e) => setSplitPosition(parseInt(e.target.value))}
                      className="flex-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelSplit();
                    }}
                    className="px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 text-neutral-100 rounded text-sm transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSaveSplit(chunk);
                    }}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    Diviser
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-sm text-neutral-300 leading-relaxed font-mono whitespace-pre-wrap">
                  {chunk.text}
                </p>

                {/* Show modification info if manual */}
                {chunk.isManual && chunk.reason && (
                  <div className="mt-3 pt-3 border-t border-neutral-700">
                    <p className="text-xs text-neutral-400">
                      <span className="font-medium">Raison:</span> {chunk.reason}
                    </p>
                    {chunk.modifiedBy && (
                      <p className="text-xs text-neutral-400 mt-1">
                        <span className="font-medium">Par:</span> {chunk.modifiedBy}
                      </p>
                    )}
                    {chunk.modifiedAt && (
                      <p className="text-xs text-neutral-400 mt-1">
                        <span className="font-medium">Le:</span>{' '}
                        {new Date(chunk.modifiedAt).toLocaleString('fr-FR')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add chunk button */}
      <button
        onClick={() => handleInsertChunk(chunks.length > 0 ? chunks[chunks.length - 1].id : null)}
        className="w-full p-4 border-2 border-dashed border-neutral-700 hover:border-neutral-600 rounded-lg text-neutral-400 hover:text-neutral-300 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Ajouter un chunk
      </button>
    </div>
  );
}
