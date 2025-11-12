import { useState, useEffect, useCallback } from 'react';
import type { Attachment, EntityType } from '../types/attachment';

interface UseAttachmentsOptions {
  entityType: EntityType;
  entityId: string;
  autoLoad?: boolean;
}

interface UploadProgress {
  fileName: string;
  progress: number; // 0-100
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

/**
 * Hook useAttachments - Gestion des fichiers attachés
 *
 * Features:
 * - Upload de fichiers avec progression
 * - Listing des attachments d'une entité
 * - Suppression d'attachments
 * - Téléchargement de fichiers
 * - Communication IPC avec le backend
 *
 * @example
 * const { attachments, upload, remove, isLoading } = useAttachments({
 *   entityType: 'message',
 *   entityId: messageId,
 *   autoLoad: true
 * });
 */
export function useAttachments({
  entityType,
  entityId,
  autoLoad = true,
}: UseAttachmentsOptions) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<Map<string, UploadProgress>>(new Map());

  /**
   * Charger les attachments depuis le backend
   */
  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await window.api.attachments.getByEntity({
        entityType,
        entityId,
      });

      if (result.success && result.attachments) {
        setAttachments(result.attachments);
      } else {
        setError(result.error || 'Erreur lors du chargement des fichiers');
      }
    } catch (err) {
      console.error('[useAttachments] Load error:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId]);

  /**
   * Upload de fichiers
   */
  const upload = useCallback(async (files: File[]): Promise<Attachment[]> => {
    const uploadedAttachments: Attachment[] = [];

    for (const file of files) {
      const fileId = `${file.name}-${Date.now()}`;

      try {
        // Initialiser le suivi de progression
        setUploadProgress(prev => new Map(prev).set(fileId, {
          fileName: file.name,
          progress: 0,
          status: 'uploading',
        }));

        // Lire le fichier en ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Appeler l'API backend
        setUploadProgress(prev => new Map(prev).set(fileId, {
          fileName: file.name,
          progress: 50,
          status: 'processing',
        }));

        const result = await window.api.attachments.upload({
          fileName: file.name,
          buffer,
          mimeType: file.type,
          entityType,
          entityId,
        });

        if (result.success && result.attachment) {
          uploadedAttachments.push(result.attachment);

          // Marquer comme complété
          setUploadProgress(prev => new Map(prev).set(fileId, {
            fileName: file.name,
            progress: 100,
            status: 'completed',
          }));

          // Ajouter à la liste locale
          setAttachments(prev => [...prev, result.attachment!]);
        } else {
          throw new Error(result.error || 'Échec de l\'upload');
        }
      } catch (err) {
        console.error('[useAttachments] Upload error:', file.name, err);

        // Marquer comme erreur
        setUploadProgress(prev => new Map(prev).set(fileId, {
          fileName: file.name,
          progress: 0,
          status: 'error',
          error: err instanceof Error ? err.message : 'Erreur inconnue',
        }));
      }
    }

    // Nettoyer les progressions après 3 secondes
    setTimeout(() => {
      setUploadProgress(new Map());
    }, 3000);

    return uploadedAttachments;
  }, [entityType, entityId]);

  /**
   * Supprimer un attachment
   */
  const remove = useCallback(async (attachmentId: string): Promise<boolean> => {
    try {
      const result = await window.api.attachments.delete({ attachmentId });

      if (result.success) {
        // Retirer de la liste locale
        setAttachments(prev => prev.filter(a => a.id !== attachmentId));
        return true;
      } else {
        setError(result.error || 'Échec de la suppression');
        return false;
      }
    } catch (err) {
      console.error('[useAttachments] Remove error:', err);
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      return false;
    }
  }, []);

  /**
   * Télécharger un attachment
   */
  const download = useCallback(async (attachment: Attachment): Promise<void> => {
    try {
      // Utiliser l'API Electron pour ouvrir le fichier
      await window.api.attachments.open({ attachmentId: attachment.id });
    } catch (err) {
      console.error('[useAttachments] Download error:', err);
      setError(err instanceof Error ? err.message : 'Erreur de téléchargement');
    }
  }, []);

  /**
   * Obtenir les statistiques
   */
  const getStats = useCallback(() => {
    const totalSize = attachments.reduce((sum, a) => sum + a.size, 0);
    const indexedCount = attachments.filter(a => a.isIndexedText || a.isIndexedVision).length;
    const byType = attachments.reduce((acc, a) => {
      const category = a.mimeType.split('/')[0];
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: attachments.length,
      totalSize,
      indexedCount,
      byType,
    };
  }, [attachments]);

  /**
   * Auto-load au montage si activé
   */
  useEffect(() => {
    if (autoLoad && entityId) {
      load();
    }
  }, [autoLoad, entityId, load]);

  return {
    // State
    attachments,
    isLoading,
    error,
    uploadProgress: Array.from(uploadProgress.values()),

    // Actions
    load,
    upload,
    remove,
    download,
    getStats,
  };
}
