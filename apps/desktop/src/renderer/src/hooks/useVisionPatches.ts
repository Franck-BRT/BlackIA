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
      console.log('[useVisionPatches] Fetching patches for attachmentId:', attachmentId);
      setLoading(true);
      setError(null);
      setLastAttachmentId(attachmentId);

      const result = await window.api.visionRAG.getDocumentPatches(attachmentId);
      console.log('[useVisionPatches] Result from backend:', result);

      if (result.success) {
        const patchesData = result.data || [];
        console.log('[useVisionPatches] Patches loaded:', patchesData.length, patchesData);
        setPatches(patchesData);
        return patchesData;
      } else {
        console.error('[useVisionPatches] Failed to load patches:', result.error);
        setError(result.error || 'Failed to load patches');
        setPatches([]);
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[useVisionPatches] Exception:', errorMessage, err);
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
