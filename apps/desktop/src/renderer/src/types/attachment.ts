/**
 * Types TypeScript pour le système d'attachments et RAG
 * Utilisés dans le renderer (frontend React)
 */

/**
 * Entity types pour relations polymorphiques
 */
export type EntityType = 'message' | 'workflow' | 'document' | 'persona' | 'prompt' | 'conversation';

/**
 * RAG modes disponibles
 */
export type RAGMode = 'text' | 'vision' | 'hybrid' | 'none';

/**
 * Modèles d'embeddings TEXT disponibles (via Ollama)
 */
export type TextEmbeddingModel = 'nomic-embed-text' | 'mxbai-embed-large' | 'all-minilm';

/**
 * Modèles d'embeddings VISION disponibles (via MLX-VLM)
 */
export type VisionEmbeddingModel =
  | 'qwen2-vl-2b'          // Qwen2-VL-2B-Instruct (léger, 16GB OK)
  | 'qwen2-vl-7b'          // Qwen2-VL-7B-Instruct (meilleure qualité, 32GB+)
  | 'colpali-adapter';     // ColPali adapter (futur)

/**
 * Attachment complet (correspond au schéma DB)
 */
export interface Attachment {
  id: string;

  // File metadata
  filename: string;
  originalName: string;
  mimeType: string;
  size: number; // bytes

  // Paths (relative to userData)
  filePath: string;
  thumbnailPath?: string;

  // Extracted content
  extractedText?: string;
  extractedMetadata?: Record<string, unknown>;

  // Polymorphic relation
  entityType: EntityType;
  entityId: string;

  // Tags (manual organization)
  tags: string[]; // Array of tag IDs

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

  // Indexing metadata
  lastIndexedAt?: Date;
  indexingDuration?: number; // milliseconds
  indexingError?: string;

  // General metadata
  uploadedBy?: string;
  isAnalyzed: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Métadonnées pour créer un attachment
 */
export interface AttachmentMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  entityType: EntityType;
  entityId: string;
  tags?: string[];
  ragMode?: RAGMode;
}

/**
 * Progression d'upload d'un attachment
 */
export interface AttachmentUploadProgress {
  id: string;
  filename: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'processing' | 'indexing' | 'completed' | 'error';
  error?: string;
  phase?: 'upload' | 'extract' | 'thumbnail' | 'index-text' | 'index-vision';
}

/**
 * Résultat d'une recherche TEXT RAG
 */
export interface TextRAGSearchResult {
  chunkId: string;
  attachmentId: string;
  text: string;
  score: number; // similarité 0-1
  metadata: {
    originalName: string;
    entityType: EntityType;
    chunkIndex: number;
    page?: number;
    lineStart?: number;
    lineEnd?: number;
  };
}

/**
 * Résultat d'une recherche VISION RAG
 */
export interface VisionRAGSearchResult {
  patchId: string;
  attachmentId: string;
  pageIndex: number;
  patchIndex: number;
  score: number; // similarité 0-1
  pageThumbnail?: string; // base64 ou URL
  metadata: {
    originalName: string;
    entityType: EntityType;
    pageNumber: number;
    patchCoordinates?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };
}

/**
 * Résultat de recherche RAG unifié
 */
export type RAGSearchResult = TextRAGSearchResult | VisionRAGSearchResult;

/**
 * Métadonnées RAG stockées dans un message
 */
export interface RAGMetadata {
  mode: 'text' | 'vision' | 'hybrid';
  enabled: boolean;
  chunksUsed: number;
  sources: RAGSource[];
  queryEmbeddingTime?: number; // ms
  searchTime?: number; // ms
  totalTime?: number; // ms
}

/**
 * Source RAG utilisée dans une réponse
 */
export interface RAGSource {
  attachmentId: string;
  fileName: string;
  score: number;
  type: 'text' | 'vision';

  // Pour TEXT
  chunkText?: string;
  chunkIndex?: number;

  // Pour VISION
  page?: number;
  pageThumbnail?: string;
  patchIndex?: number;
}

/**
 * Paramètres de recherche RAG
 */
export interface RAGSearchParams {
  query: string;
  mode: 'text' | 'vision' | 'hybrid' | 'auto';
  topK?: number; // nombre de résultats (default: 5)
  minScore?: number; // score minimum 0-1 (default: 0.7)
  filters?: RAGSearchFilters;
}

/**
 * Filtres pour la recherche RAG
 */
export interface RAGSearchFilters {
  entityType?: EntityType;
  entityId?: string;
  conversationId?: string;
  attachmentIds?: string[];
  tags?: string[];
  mimeTypes?: string[];
}

/**
 * Statistiques RAG
 */
export interface RAGStats {
  // TEXT RAG
  textIndexedCount: number;
  textTotalChunks: number;
  textStorageSize: number; // bytes

  // VISION RAG
  visionIndexedCount: number;
  visionTotalPatches: number;
  visionStorageSize: number; // bytes

  // Global
  totalAttachments: number;
  averageIndexingTime: number; // ms
  embeddingModels: {
    text: TextEmbeddingModel[];
    vision: VisionEmbeddingModel[];
  };
}

/**
 * Configuration RAG (depuis Settings)
 */
export interface RAGSettings {
  // Mode général
  enabled: boolean;
  defaultMode: 'text' | 'vision' | 'auto';

  // TEXT RAG
  textRag: {
    enabled: boolean;
    embeddingModel: TextEmbeddingModel;
    chunkSize: number; // tokens (default: 500)
    chunkOverlap: number; // tokens (default: 50)
    topK: number; // default: 5
    minSimilarity: number; // 0-1 (default: 0.7)
  };

  // VISION RAG
  visionRag: {
    enabled: boolean;
    embeddingModel: VisionEmbeddingModel;
    backend: 'mlx'; // uniquement MLX pour Apple Silicon
    resolution: 'low' | 'medium' | 'high'; // résolution screenshots
    topK: number; // default: 3
    minSimilarity: number; // 0-1 (default: 0.75)
  };

  // HYBRID
  hybrid: {
    enabled: boolean;
    textWeight: number; // 0-1 (default: 0.5)
    visionWeight: number; // 0-1 (default: 0.5)
    fusionStrategy: 'weighted' | 'rrf'; // RRF = Reciprocal Rank Fusion
  };

  // Auto-décision mode
  autoModeRules: {
    useVisionForPDF: boolean;
    useVisionForImages: boolean;
    useTextForCode: boolean;
    useTextForMarkdown: boolean;
    complexLayoutThreshold: number; // 0-1 pour décider
  };

  // Performance
  autoIndex: boolean; // indexer automatiquement à l'upload
  showSources: boolean; // afficher sources dans messages
  cacheEnabled: boolean; // cache embeddings récents
  maxStorageGB: number; // limite storage (default: 5GB)
}

/**
 * Helper pour vérifier si un attachment est indexé
 */
export function isAttachmentIndexed(attachment: Attachment): boolean {
  if (attachment.ragMode === 'none') return false;
  if (attachment.ragMode === 'text') return attachment.isIndexedText;
  if (attachment.ragMode === 'vision') return attachment.isIndexedVision;
  if (attachment.ragMode === 'hybrid') {
    return attachment.isIndexedText && attachment.isIndexedVision;
  }
  return false;
}

/**
 * Helper pour obtenir l'icône selon le type MIME
 */
export function getAttachmentIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType === 'application/pdf') return '📄';
  if (mimeType.startsWith('text/')) return '📝';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType === 'application/zip' || mimeType === 'application/x-tar') return '📦';
  return '📎';
}

/**
 * Helper pour formater la taille
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Helper pour recommander le mode RAG selon MIME type
 *
 * @param mimeType - Le type MIME du fichier
 * @param extractedText - Le texte extrait du fichier (optionnel)
 * @param textThreshold - Seuil de caractères pour considérer un PDF comme textuel (défaut: 500)
 */
export function recommendRAGMode(
  mimeType: string,
  extractedText?: string,
  textThreshold: number = 500
): RAGMode {
  // Images → vision obligatoire
  if (mimeType.startsWith('image/')) {
    return 'vision';
  }

  // Code source → text
  const codeExtensions = [
    'text/javascript', 'text/typescript', 'text/python',
    'text/java', 'text/c', 'text/cpp', 'text/go', 'text/rust'
  ];
  if (codeExtensions.some(ext => mimeType.includes(ext))) {
    return 'text';
  }

  // Markdown/texte pur → text
  if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
    return 'text';
  }

  // PDF → analyser ratio texte/visuel
  if (mimeType === 'application/pdf') {
    if (!extractedText || extractedText.length === 0) {
      // Pas de texte extrait → PDF scanné/image
      return 'vision';
    } else if (extractedText.length > textThreshold) {
      // Beaucoup de texte → principalement textuel
      return 'text';
    } else {
      // Peu de texte → utiliser hybrid (texte + vision)
      return 'hybrid';
    }
  }

  // Default: text (plus rapide)
  return 'text';
}
