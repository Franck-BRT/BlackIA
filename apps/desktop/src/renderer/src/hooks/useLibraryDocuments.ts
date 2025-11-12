/**
 * Hook for Library Document Management
 * Provides document operations and RAG indexation
 */

import { useState, useCallback } from 'react';
import type { StoredRAGMode } from '../../../main/types/rag';

// Correspond au type DocumentWithParsedFields du service
export interface LibraryDocument {
  id: string;
  libraryId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  filePath: string;
  thumbnailPath: string | null;
  extractedText: string | null;
  extractedMetadata?: Record<string, unknown>;
  tags: string[];
  ragMode: StoredRAGMode;
  isIndexedText: boolean;
  textEmbeddingModel: string | null;
  textChunkCount: number;
  isIndexedVision: boolean;
  visionEmbeddingModel: string | null;
  visionPatchCount: number;
  pageCount: number;
  validationStatus: 'pending' | 'validated' | 'needs_review' | 'rejected';
  validatedBy: string | null;
  validatedAt: Date | null;
  validationNotes: string | null;
  lastIndexedAt: Date | null;
  indexingDuration: number | null;
  indexingError: string | null;
  uploadedBy: string | null;
  isAnalyzed: boolean;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentFilters {
  libraryId?: string;
  tags?: string[];
  mimeTypes?: string[];
  ragMode?: StoredRAGMode[];
  validationStatus?: ('pending' | 'validated' | 'needs_review' | 'rejected')[];
  isIndexedText?: boolean;
  isIndexedVision?: boolean;
  search?: string;
}

export interface IndexDocumentParams {
  documentId: string;
  mode?: 'text' | 'vision' | 'hybrid' | 'auto';
  chunkSize?: number;
  chunkOverlap?: number;
  forceReindex?: boolean;
}

export interface IndexResult {
  success: boolean;
  chunkCount: number;
  patchCount: number;
  duration: number;
  error?: string;
}

interface UseLibraryDocumentsReturn {
  documents: LibraryDocument[];
  loading: boolean;
  error: string | null;
  addDocument: (params: {
    libraryId: string;
    filePath: string;
    originalName: string;
    mimeType: string;
    tags?: string[];
  }) => Promise<LibraryDocument | null>;
  getDocuments: (libraryId: string, filters?: DocumentFilters) => Promise<LibraryDocument[]>;
  getDocumentById: (id: string) => Promise<LibraryDocument | null>;
  updateDocument: (
    id: string,
    updates: {
      originalName?: string;
      tags?: string[];
      ragMode?: StoredRAGMode;
      validationStatus?: 'pending' | 'validated' | 'needs_review' | 'rejected';
      validationNotes?: string;
      isFavorite?: boolean;
    }
  ) => Promise<LibraryDocument | null>;
  deleteDocument: (id: string) => Promise<boolean>;
  indexDocument: (params: IndexDocumentParams) => Promise<IndexResult | null>;
  deleteIndex: (documentId: string) => Promise<boolean>;
  getChunks: (documentId: string) => Promise<any[]>;
  searchInLibrary: (params: any) => Promise<any[]>;
}

export function useLibraryDocuments(): UseLibraryDocumentsReturn {
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add document
  const addDocument = useCallback(
    async (params: {
      libraryId: string;
      filePath: string;
      originalName: string;
      mimeType: string;
      tags?: string[];
    }): Promise<LibraryDocument | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await window.electronAPI.libraryDocument.add(params);
        if (result.success && result.data) {
          return result.data;
        } else {
          setError(result.error || 'Failed to add document');
          return null;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('[useLibraryDocuments] Add error:', err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get documents
  const getDocuments = useCallback(
    async (libraryId: string, filters?: DocumentFilters): Promise<LibraryDocument[]> => {
      setLoading(true);
      setError(null);
      try {
        const result = await window.electronAPI.libraryDocument.getDocuments(libraryId, filters);
        if (result.success && result.data) {
          setDocuments(result.data);
          return result.data;
        } else {
          setError(result.error || 'Failed to get documents');
          return [];
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('[useLibraryDocuments] Get error:', err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Get document by ID
  const getDocumentById = useCallback(async (id: string): Promise<LibraryDocument | null> => {
    setError(null);
    try {
      const result = await window.electronAPI.libraryDocument.getById(id);
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to get document');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useLibraryDocuments] GetById error:', err);
      return null;
    }
  }, []);

  // Update document
  const updateDocument = useCallback(
    async (
      id: string,
      updates: {
        originalName?: string;
        tags?: string[];
        ragMode?: StoredRAGMode;
        validationStatus?: 'pending' | 'validated' | 'needs_review' | 'rejected';
        validationNotes?: string;
        isFavorite?: boolean;
      }
    ): Promise<LibraryDocument | null> => {
      setError(null);
      try {
        const result = await window.electronAPI.libraryDocument.update(id, updates);
        if (result.success && result.data) {
          return result.data;
        } else {
          setError(result.error || 'Failed to update document');
          return null;
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('[useLibraryDocuments] Update error:', err);
        return null;
      }
    },
    []
  );

  // Delete document
  const deleteDocument = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    try {
      const result = await window.electronAPI.libraryDocument.delete(id);
      if (result.success) {
        return true;
      } else {
        setError(result.error || 'Failed to delete document');
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useLibraryDocuments] Delete error:', err);
      return false;
    }
  }, []);

  // Index document
  const indexDocument = useCallback(async (params: IndexDocumentParams): Promise<IndexResult | null> => {
    setError(null);
    try {
      const result = await window.electronAPI.libraryDocument.index(params);
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to index document');
        return null;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useLibraryDocuments] Index error:', err);
      return null;
    }
  }, []);

  // Delete index
  const deleteIndex = useCallback(async (documentId: string): Promise<boolean> => {
    setError(null);
    try {
      const result = await window.electronAPI.libraryDocument.deleteIndex(documentId);
      if (result.success) {
        return true;
      } else {
        setError(result.error || 'Failed to delete index');
        return false;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useLibraryDocuments] DeleteIndex error:', err);
      return false;
    }
  }, []);

  // Get chunks
  const getChunks = useCallback(async (documentId: string): Promise<any[]> => {
    setError(null);
    try {
      const result = await window.electronAPI.libraryDocument.getChunks(documentId);
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to get chunks');
        return [];
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useLibraryDocuments] GetChunks error:', err);
      return [];
    }
  }, []);

  // Search in library
  const searchInLibrary = useCallback(async (params: any): Promise<any[]> => {
    setError(null);
    try {
      const result = await window.electronAPI.libraryDocument.search(params);
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to search');
        return [];
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      console.error('[useLibraryDocuments] Search error:', err);
      return [];
    }
  }, []);

  return {
    documents,
    loading,
    error,
    addDocument,
    getDocuments,
    getDocumentById,
    updateDocument,
    deleteDocument,
    indexDocument,
    deleteIndex,
    getChunks,
    searchInLibrary,
  };
}
