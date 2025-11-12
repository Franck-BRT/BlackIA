/**
 * Types TypeScript pour le système de bibliothèques de documents
 * Module RAG avec validation et édition de chunks
 */

import type { RAGMode, TextEmbeddingModel, VisionEmbeddingModel } from './attachment';

/**
 * Validation status for documents
 */
export type ValidationStatus = 'pending' | 'validated' | 'needs_review' | 'rejected';

/**
 * Configuration RAG d'une bibliothèque
 */
export interface LibraryRAGConfig {
  // Mode par défaut
  defaultMode: 'text' | 'vision' | 'hybrid' | 'auto';

  // TEXT RAG
  text: {
    enabled: boolean;
    model: TextEmbeddingModel;
    chunkSize: number; // 256, 512, 1024, 2048, 4096
    chunkOverlap: number; // 0-50% (0, 10, 20, 30, 40, 50)
    separator: 'paragraph' | 'sentence' | 'line' | 'custom'; // \n\n | . | \n | custom
    customSeparator?: string;
  };

  // VISION RAG
  vision: {
    enabled: boolean;
    model: VisionEmbeddingModel;
    resolution: 'low' | 'medium' | 'high'; // 150 DPI, 200 DPI, 300 DPI
    patchSize: number; // Taille des patchs (default: 14)
  };

  // HYBRID
  hybrid: {
    enabled: boolean;
    fusionStrategy: 'weighted' | 'rrf'; // RRF = Reciprocal Rank Fusion
    textWeight: number; // 0-1
    visionWeight: number; // 0-1
    rrfConstant?: number; // K constant pour RRF (default: 60)
  };

  // Auto-indexation
  autoIndex: boolean; // Indexer automatiquement à l'upload
}

/**
 * Bibliothèque de documents
 */
export interface Library {
  id: string;
  name: string;
  description: string;

  // Apparence
  color: string; // blue, purple, green, orange, red, pink
  icon: string; // Emoji

  // Configuration RAG
  ragConfig: LibraryRAGConfig;

  // Stockage
  storagePath: string; // Chemin personnalisé

  // Statistiques
  documentCount: number;
  totalSize: number; // bytes
  totalChunks: number;
  totalPatches: number;

  // Tags autorisés
  allowedTags: string[]; // Array de tag IDs

  // Métadonnées
  isFavorite: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Document dans une bibliothèque
 */
export interface LibraryDocument {
  id: string;
  libraryId: string;

  // File metadata
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;

  // Paths
  filePath: string;
  thumbnailPath?: string;

  // Extracted content
  extractedText?: string;
  extractedMetadata?: Record<string, unknown>;

  // Tags
  tags: string[]; // Array de tag IDs

  // RAG configuration
  ragMode: RAGMode;

  // TEXT RAG
  isIndexedText: boolean;
  textEmbeddingModel?: TextEmbeddingModel;
  textChunkCount: number;

  // VISION RAG
  isIndexedVision: boolean;
  visionEmbeddingModel?: VisionEmbeddingModel;
  visionPatchCount: number;
  pageCount: number;

  // Validation
  validationStatus: ValidationStatus;
  validatedBy?: string;
  validatedAt?: Date;
  validationNotes?: string;

  // Indexing metadata
  lastIndexedAt?: Date;
  indexingDuration?: number; // ms
  indexingError?: string;

  // General metadata
  uploadedBy?: string;
  isAnalyzed: boolean;
  isFavorite: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Chunk manuel (modifié par l'utilisateur)
 */
export interface ManualChunk {
  id: string;
  documentId: string;

  // Référence au chunk original
  originalChunkId: string; // ID dans LanceDB

  // Contenu modifié
  modifiedText: string;
  reason: string; // Raison de la modification

  // Métadonnées
  modifiedBy: string;
  modifiedAt: Date;
}

/**
 * Chunk RAG (texte ou vision)
 */
export interface RAGChunk {
  id: string; // ID unique du chunk
  documentId: string;
  libraryId: string;

  // Type
  type: 'text' | 'vision';

  // Pour TEXT chunks
  text?: string;
  chunkIndex?: number;
  tokenCount?: number;

  // Pour VISION chunks
  pageIndex?: number;
  patchIndex?: number;
  patchVectors?: number[][]; // Multi-vector embeddings

  // Position dans le document source
  position?: {
    startOffset: number; // Position de début dans le texte
    endOffset: number; // Position de fin
    page?: number; // Numéro de page (PDF)
    line?: number; // Numéro de ligne
  };

  // Score de similarité (si résultat de recherche)
  score?: number;

  // Métadonnées
  metadata?: Record<string, unknown>;

  // Modification manuelle
  manualChunk?: ManualChunk;
  isModified: boolean;

  // Timestamps
  createdAt: Date;
}

/**
 * Résultat de recherche dans une bibliothèque
 */
export interface LibrarySearchResult {
  chunk: RAGChunk;
  document: LibraryDocument;
  library: Library;

  // Highlight info
  highlightText?: string; // Texte avec highlights
  context?: string; // Contexte autour du chunk
}

/**
 * Paramètres de recherche dans une bibliothèque
 */
export interface LibrarySearchParams {
  query: string;
  libraryIds?: string[]; // Limiter à certaines bibliothèques
  mode?: 'text' | 'vision' | 'hybrid' | 'auto';
  topK?: number; // Default: 5
  minScore?: number; // Default: 0.7
  filters?: LibrarySearchFilters;
}

/**
 * Filtres de recherche
 */
export interface LibrarySearchFilters {
  documentIds?: string[];
  tags?: string[];
  mimeTypes?: string[];
  validationStatus?: ValidationStatus[];
  ragMode?: RAGMode[];
  dateRange?: {
    from: Date;
    to: Date;
  };
}

/**
 * Statistiques d'une bibliothèque
 */
export interface LibraryStats {
  // Documents
  totalDocuments: number;
  documentsByType: Record<string, number>; // mime type → count
  documentsByStatus: Record<ValidationStatus, number>;

  // Indexation
  indexedTextCount: number;
  indexedVisionCount: number;
  indexedHybridCount: number;
  notIndexedCount: number;

  // Chunks
  totalChunks: number;
  averageChunksPerDocument: number;
  totalPatches: number;
  averagePatchesPerDocument: number;

  // Modifications manuelles
  manualChunksCount: number;

  // Stockage
  totalSize: number; // bytes
  averageDocumentSize: number; // bytes

  // Performance
  averageIndexingTime: number; // ms per document
}

/**
 * Progression d'indexation
 */
export interface IndexingProgress {
  documentId: string;
  documentName: string;

  // État
  status: 'pending' | 'extracting' | 'chunking' | 'embedding' | 'storing' | 'completed' | 'error';
  progress: number; // 0-100

  // Phases
  phase?: 'text' | 'vision';
  currentChunk?: number;
  totalChunks?: number;

  // Résultats
  chunkCount?: number;
  patchCount?: number;
  duration?: number; // ms

  // Erreur
  error?: string;
}

/**
 * Paramètres pour créer une bibliothèque
 */
export interface CreateLibraryInput {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  ragConfig?: Partial<LibraryRAGConfig>;
  storagePath?: string; // Si non fourni, utilise default
  allowedTags?: string[];
}

/**
 * Paramètres pour mettre à jour une bibliothèque
 */
export interface UpdateLibraryInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  ragConfig?: Partial<LibraryRAGConfig>;
  storagePath?: string;
  allowedTags?: string[];
  isFavorite?: boolean;
}

/**
 * Paramètres pour ajouter un document
 */
export interface AddDocumentInput {
  libraryId: string;
  file: File;
  tags?: string[];
  ragMode?: RAGMode;
  autoIndex?: boolean; // Override library config
}

/**
 * Paramètres pour mettre à jour un document
 */
export interface UpdateDocumentInput {
  originalName?: string;
  tags?: string[];
  ragMode?: RAGMode;
  validationStatus?: ValidationStatus;
  validationNotes?: string;
  isFavorite?: boolean;
}

/**
 * Paramètres pour éditer un chunk
 */
export interface EditChunkInput {
  chunkId: string;
  documentId: string;
  modifiedText: string;
  reason: string;
}

/**
 * Paramètres pour diviser un chunk
 */
export interface SplitChunkInput {
  chunkId: string;
  documentId: string;
  splitPosition: number; // Position du split dans le texte
}

/**
 * Paramètres pour fusionner des chunks
 */
export interface MergeChunksInput {
  chunk1Id: string;
  chunk2Id: string;
  documentId: string;
}

/**
 * Configuration par défaut d'une bibliothèque
 */
export const DEFAULT_LIBRARY_RAG_CONFIG: LibraryRAGConfig = {
  defaultMode: 'auto',
  text: {
    enabled: true,
    model: 'nomic-embed-text',
    chunkSize: 512,
    chunkOverlap: 10,
    separator: 'paragraph',
  },
  vision: {
    enabled: true,
    model: 'qwen2-vl-2b',
    resolution: 'medium',
    patchSize: 14,
  },
  hybrid: {
    enabled: true,
    fusionStrategy: 'rrf',
    textWeight: 0.5,
    visionWeight: 0.5,
    rrfConstant: 60,
  },
  autoIndex: true,
};

/**
 * Helper pour vérifier si un document est complètement indexé
 */
export function isDocumentIndexed(document: LibraryDocument): boolean {
  if (document.ragMode === 'none') return true;
  if (document.ragMode === 'text') return document.isIndexedText;
  if (document.ragMode === 'vision') return document.isIndexedVision;
  if (document.ragMode === 'hybrid') {
    return document.isIndexedText && document.isIndexedVision;
  }
  return false;
}

/**
 * Helper pour obtenir le statut d'indexation en texte
 */
export function getIndexingStatusText(document: LibraryDocument): string {
  if (document.ragMode === 'none') return 'Non indexé';
  if (document.indexingError) return `Erreur: ${document.indexingError}`;
  if (!document.lastIndexedAt) return 'En attente';
  if (!isDocumentIndexed(document)) return 'Indexation partielle';
  return 'Indexé';
}

/**
 * Helper pour obtenir la couleur du badge de validation
 */
export function getValidationBadgeColor(status: ValidationStatus): string {
  switch (status) {
    case 'validated':
      return 'green';
    case 'needs_review':
      return 'orange';
    case 'rejected':
      return 'red';
    case 'pending':
    default:
      return 'gray';
  }
}

/**
 * Helper pour obtenir le label du statut de validation
 */
export function getValidationStatusLabel(status: ValidationStatus): string {
  switch (status) {
    case 'validated':
      return '✅ Validé';
    case 'needs_review':
      return '⚠️ À revoir';
    case 'rejected':
      return '❌ Rejeté';
    case 'pending':
    default:
      return '⏳ En attente';
  }
}
