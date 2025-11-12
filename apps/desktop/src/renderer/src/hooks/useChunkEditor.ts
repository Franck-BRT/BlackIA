/**
 * Hook for Chunk Editor
 * Provides chunk editing operations (split, merge, edit, delete)
 */

import { useState, useCallback } from 'react';

export interface FullChunk {
  id: string;
  text: string;
  tokenCount: number;
  isManual: boolean;
  manualChunkId?: string;
  originalText?: string;
  modifiedText?: string;
  modifiedBy?: string;
  modifiedAt?: Date;
  reason?: string;
}

export interface EditChunkResult {
  success: boolean;
  chunk?: FullChunk;
  error?: string;
}

export interface SplitChunkResult {
  success: boolean;
  chunk1?: FullChunk;
  chunk2?: FullChunk;
  error?: string;
}

export interface MergeChunksResult {
  success: boolean;
  mergedChunk?: FullChunk;
  error?: string;
}

interface UseChunkEditorReturn {
  chunks: FullChunk[];
  loading: boolean;
  error: string | null;
  getDocumentChunks: (documentId: string) => Promise<FullChunk[]>;
  getChunkById: (chunkId: string, documentId: string) => Promise<FullChunk | null>;
  editChunk: (params: {
    chunkId: string;
    documentId: string;
    modifiedText: string;
    reason: string;
    modifiedBy?: string;
  }) => Promise<EditChunkResult | null>;
  splitChunk: (params: {
    chunkId: string;
    documentId: string;
    splitPosition: number;
  }) => Promise<SplitChunkResult | null>;
  mergeChunks: (params: {
    chunk1Id: string;
    chunk2Id: string;
    documentId: string;
  }) => Promise<MergeChunksResult | null>;
  deleteChunk: (params: {
    chunkId: string;
    documentId: string;
    reason?: string;
  }) => Promise<EditChunkResult | null>;
  insertChunk: (params: {
    documentId: string;
    afterChunkId: string;
    text: string;
    reason?: string;
  }) => Promise<EditChunkResult | null>;
  getChunksForTextSelection: (params: {
    documentId: string;
    startOffset: number;
    endOffset: number;
  }) => Promise<FullChunk[]>;
  getTextPositionForChunk: (
    chunkId: string,
    documentId: string
  ) => Promise<{ startOffset: number; endOffset: number } | null>;
}

export function useChunkEditor(): UseChunkEditorReturn {
  const [chunks, setChunks] = useState<FullChunk[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get document chunks
  const getDocumentChunks = useCallback(async (documentId: string): Promise<FullChunk[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.chunkEditor.getDocumentChunks(documentId);
      if (result.success && result.data) {
        setChunks(result.data);
        return result.data;
      } else {
        setError(result.error || 'Failed to get chunks');
        return [];
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useChunkEditor] GetDocumentChunks error:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Get chunk by ID
  const getChunkById = useCallback(
    async (chunkId: string, documentId: string): Promise<FullChunk | null> => {
      setError(null);
      try {
        const result = await window.electronAPI.chunkEditor.getChunkById(chunkId, documentId);
        if (result.success && result.data) {
          return result.data;
        } else {
          setError(result.error || 'Failed to get chunk');
          return null;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('[useChunkEditor] GetChunkById error:', err);
        return null;
      }
    },
    []
  );

  // Edit chunk
  const editChunk = useCallback(
    async (params: {
      chunkId: string;
      documentId: string;
      modifiedText: string;
      reason: string;
      modifiedBy?: string;
    }): Promise<EditChunkResult | null> => {
      setError(null);
      try {
        const result = await window.electronAPI.chunkEditor.editChunk(params);
        if (result.success && result.data) {
          // Refresh chunks
          await getDocumentChunks(params.documentId);
          return result.data;
        } else {
          setError(result.error || 'Failed to edit chunk');
          return null;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('[useChunkEditor] EditChunk error:', err);
        return null;
      }
    },
    [getDocumentChunks]
  );

  // Split chunk
  const splitChunk = useCallback(
    async (params: {
      chunkId: string;
      documentId: string;
      splitPosition: number;
    }): Promise<SplitChunkResult | null> => {
      setError(null);
      try {
        const result = await window.electronAPI.chunkEditor.splitChunk(params);
        if (result.success && result.data) {
          // Refresh chunks
          await getDocumentChunks(params.documentId);
          return result.data;
        } else {
          setError(result.error || 'Failed to split chunk');
          return null;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('[useChunkEditor] SplitChunk error:', err);
        return null;
      }
    },
    [getDocumentChunks]
  );

  // Merge chunks
  const mergeChunks = useCallback(
    async (params: {
      chunk1Id: string;
      chunk2Id: string;
      documentId: string;
    }): Promise<MergeChunksResult | null> => {
      setError(null);
      try {
        const result = await window.electronAPI.chunkEditor.mergeChunks(params);
        if (result.success && result.data) {
          // Refresh chunks
          await getDocumentChunks(params.documentId);
          return result.data;
        } else {
          setError(result.error || 'Failed to merge chunks');
          return null;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('[useChunkEditor] MergeChunks error:', err);
        return null;
      }
    },
    [getDocumentChunks]
  );

  // Delete chunk
  const deleteChunk = useCallback(
    async (params: {
      chunkId: string;
      documentId: string;
      reason?: string;
    }): Promise<EditChunkResult | null> => {
      setError(null);
      try {
        const result = await window.electronAPI.chunkEditor.deleteChunk(params);
        if (result.success && result.data) {
          // Refresh chunks
          await getDocumentChunks(params.documentId);
          return result.data;
        } else {
          setError(result.error || 'Failed to delete chunk');
          return null;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('[useChunkEditor] DeleteChunk error:', err);
        return null;
      }
    },
    [getDocumentChunks]
  );

  // Insert chunk
  const insertChunk = useCallback(
    async (params: {
      documentId: string;
      afterChunkId: string;
      text: string;
      reason?: string;
    }): Promise<EditChunkResult | null> => {
      setError(null);
      try {
        const result = await window.electronAPI.chunkEditor.insertChunk(params);
        if (result.success && result.data) {
          // Refresh chunks
          await getDocumentChunks(params.documentId);
          return result.data;
        } else {
          setError(result.error || 'Failed to insert chunk');
          return null;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('[useChunkEditor] InsertChunk error:', err);
        return null;
      }
    },
    [getDocumentChunks]
  );

  // Get chunks for text selection
  const getChunksForTextSelection = useCallback(
    async (params: {
      documentId: string;
      startOffset: number;
      endOffset: number;
    }): Promise<FullChunk[]> => {
      setError(null);
      try {
        const result = await window.electronAPI.chunkEditor.getChunksForTextSelection(params);
        if (result.success && result.data) {
          return result.data;
        } else {
          setError(result.error || 'Failed to get chunks for selection');
          return [];
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('[useChunkEditor] GetChunksForTextSelection error:', err);
        return [];
      }
    },
    []
  );

  // Get text position for chunk
  const getTextPositionForChunk = useCallback(
    async (
      chunkId: string,
      documentId: string
    ): Promise<{ startOffset: number; endOffset: number } | null> => {
      setError(null);
      try {
        const result = await window.electronAPI.chunkEditor.getTextPositionForChunk(chunkId, documentId);
        if (result.success && result.data) {
          return result.data;
        } else {
          setError(result.error || 'Failed to get text position');
          return null;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('[useChunkEditor] GetTextPositionForChunk error:', err);
        return null;
      }
    },
    []
  );

  return {
    chunks,
    loading,
    error,
    getDocumentChunks,
    getChunkById,
    editChunk,
    splitChunk,
    mergeChunks,
    deleteChunk,
    insertChunk,
    getChunksForTextSelection,
    getTextPositionForChunk,
  };
}
