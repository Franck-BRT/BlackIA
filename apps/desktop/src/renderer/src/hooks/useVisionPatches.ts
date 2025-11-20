/**
 * Hook for Vision RAG Patches
 * Provides access to vision patches for a document
 */

import { useState, useCallback } from 'react';
import type { VisionPatch } from '../components/library/PatchList';

interface UseVisionPatchesReturn {
  patches: VisionPatch[];
  loading: boolean;
  error: string | null;
  getDocumentPatches: (attachmentId: string) => Promise<VisionPatch[]>;
  refresh: () => Promise<void>;
}

export function useVisionPatches(): UseVisionPatchesReturn {
  const [patches, setPatches] = useState<VisionPatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastAttachmentId, setLastAttachmentId] = useState<string | null>(null);

  const getDocumentPatches = useCallback(async (attachmentId: string): Promise<VisionPatch[]> => {
    try {
      setLoading(true);
      setError(null);
      setLastAttachmentId(attachmentId);

      const result = await window.api.visionRAG.getDocumentPatches(attachmentId);

      if (result.success) {
        const patchesData = result.data || [];
        setPatches(patchesData);
        return patchesData;
      } else {
        setError(result.error || 'Failed to load patches');
        setPatches([]);
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setPatches([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (lastAttachmentId) {
      await getDocumentPatches(lastAttachmentId);
    }
  }, [lastAttachmentId, getDocumentPatches]);

  return {
    patches,
    loading,
    error,
    getDocumentPatches,
    refresh,
  };
}
