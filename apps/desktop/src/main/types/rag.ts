/**
 * Types TypeScript pour les services RAG (main process)
 * Utilisés par les services backend Node.js
 */

/**
 * Entity types
 */
export type EntityType = 'message' | 'workflow' | 'document' | 'persona' | 'prompt' | 'conversation';

/**
 * RAG modes stockés en base de données
 */
export type StoredRAGMode = 'text' | 'vision' | 'hybrid' | 'none';

/**
 * RAG modes pour les paramètres de recherche
 * 'auto' permet au système de choisir automatiquement le meilleur mode
 */
export type RAGMode = StoredRAGMode | 'auto';

/**
 * Text chunking options
 */
export interface ChunkingOptions {
  chunkSize?: number; // tokens (default: 500)
  chunkOverlap?: number; // tokens (default: 50)
  separator?: string; // default: "\n\n"
}

/**
 * Text chunk résultant du chunking
 */
export interface TextChunk {
  id: string;
  text: string;
  index: number;
  metadata?: {
    page?: number;
    lineStart?: number;
    lineEnd?: number;
    section?: string;
  };
}

/**
 * TEXT RAG indexation params
 */
export interface TextRAGIndexParams {
  text: string;
  attachmentId: string;
  entityType: EntityType;
  entityId: string;
  model?: string; // default: nomic-embed-text
  chunkingOptions?: ChunkingOptions;
}

/**
 * VISION RAG indexation params
 */
export interface VisionRAGIndexParams {
  imagePaths: string[]; // Paths to page images
  attachmentId: string;
  entityType: EntityType;
  entityId: string;
  model?: string; // default: qwen2-vl-2b
  backend?: 'mlx'; // uniquement MLX
}

/**
 * Search params génériques
 */
export interface RAGSearchParams {
  query: string;
  topK?: number;
  minScore?: number;
  filters?: RAGSearchFilters;
  mode?: RAGMode; // Pour hybrid search: 'text', 'vision', 'hybrid', ou 'auto'
}

/**
 * Search filters
 */
export interface RAGSearchFilters {
  entityType?: EntityType;
  entityId?: string;
  conversationId?: string;
  attachmentIds?: string[];
}

/**
 * Text RAG search result (LanceDB)
 */
export interface TextRAGResult {
  chunkId: string;
  attachmentId: string;
  text: string;
  score: number; // cosine similarity 0-1
  vector: number[]; // embedding vector
  createdAt?: number; // timestamp pour déduplication
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
 * Vision RAG search result (LanceDB)
 */
export interface VisionRAGResult {
  patchId: string;
  attachmentId: string;
  pageIndex: number;
  patchIndex: number;
  score: number; // late interaction score
  patchVectors: number[][]; // multi-vector embeddings [1024, 128]
  pageThumbnail?: string; // page screenshot at top level for frontend
  metadata: {
    originalName: string;
    entityType: EntityType;
    pageNumber: number;
    imageBase64?: string; // page screenshot
  };
}

/**
 * Hybrid RAG result (fusion de text + vision)
 */
export interface HybridRAGResult {
  id: string;
  attachmentId: string;
  score: number; // RRF score ou weighted score
  source: 'text' | 'vision'; // Source du résultat
  textResult?: TextRAGResult; // Si source='text'
  visionResult?: VisionRAGResult; // Si source='vision'
  metadata: {
    originalName: string;
    entityType: EntityType;
    [key: string]: any; // Autres métadonnées
  };
}

/**
 * RAG stats
 */
export interface RAGStats {
  textIndexedCount: number;
  textTotalChunks: number;
  textStorageSize: number;

  visionIndexedCount: number;
  visionTotalPatches: number;
  visionStorageSize: number;

  totalAttachments: number;
  averageIndexingTime: number;
  embeddingModels: {
    text: string[];
    vision: string[];
  };
}

/**
 * Document processor result (PDF → images)
 */
export interface DocumentProcessorResult {
  imagePaths: string[];
  pageCount: number;
  metadata?: {
    title?: string;
    author?: string;
    creationDate?: string;
  };
}

/**
 * Indexation job (pour background queue)
 */
export interface IndexationJob {
  id: string;
  attachmentId: string;
  mode: RAGMode;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Embedding cache entry
 */
export interface EmbeddingCacheEntry {
  hash: string; // hash du texte/image
  embedding: number[];
  model: string;
  createdAt: Date;
}

/**
 * LanceDB collection schemas
 */

/**
 * TEXT RAG collection schema
 */
export interface TextRAGChunkSchema {
  id: string;
  attachmentId: string;
  chunkIndex: number;
  text: string;
  vector: number[]; // 768 dims for nomic-embed-text
  entityType: string;
  entityId: string;
  metadata: string; // JSON stringified
  createdAt: number; // timestamp
}

/**
 * VISION RAG collection schema
 */
export interface VisionRAGPatchSchema {
  id: string;
  attachmentId: string;
  pageIndex: number;
  patchVectors: string; // JSON stringified array of vectors [1024, 128]
  vector: number[]; // Dummy vector for vectordb 0.4.x compatibility (required for automatic indexing)
  imageBase64?: string; // page screenshot (optional)
  entityType: string;
  entityId: string;
  metadata: string; // JSON stringified
  createdAt: number; // timestamp
}

/**
 * Python service response types
 */

/**
 * MLX Vision Embedder response
 */
export interface MLXVisionEmbedderResponse {
  success: boolean;
  embeddings?: number[][][]; // [pages, patches, dims]
  pageCount?: number;
  patchesPerPage?: number;
  embeddingDim?: number;
  error?: string;
  processingTime?: number; // ms
}

/**
 * Late interaction matching response
 */
export interface LateInteractionResponse {
  success: boolean;
  scores?: number[];
  rankedDocuments?: Array<{
    documentId: string;
    score: number;
  }>;
  error?: string;
}

/**
 * Document processor response
 */
export interface DocumentProcessorResponse {
  success: boolean;
  imagePaths?: string[];
  pageCount?: number;
  metadata?: Record<string, unknown>;
  error?: string;
}

/**
 * Ollama embeddings response (via HTTP)
 */
export interface OllamaEmbeddingsResponse {
  embedding: number[];
}

/**
 * Helper functions
 */

/**
 * Hash un texte pour le cache
 */
export function hashText(text: string): string {
  // Simple hash function (peut être amélioré avec crypto)
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(36);
}

/**
 * Tokenize simple (split sur espaces)
 * NOTE: Pour production, utiliser un vrai tokenizer (tiktoken, etc.)
 */
export function simpleTokenize(text: string): string[] {
  return text.split(/\s+/).filter(t => t.length > 0);
}

/**
 * Estime le nombre de tokens
 */
export function estimateTokenCount(text: string): number {
  // Approximation: 1 token ≈ 4 caractères en anglais
  // Plus précis avec tiktoken, mais suffisant pour chunking
  return Math.ceil(text.length / 4);
}

/**
 * Chunk un texte avec overlap
 */
export function chunkText(
  text: string,
  chunkSize: number = 500,
  overlap: number = 50,
  separator: string = '\n\n'
): TextChunk[] {
  const tokens = simpleTokenize(text);
  const chunks: TextChunk[] = [];

  for (let i = 0; i < tokens.length; i += chunkSize - overlap) {
    const chunkTokens = tokens.slice(i, i + chunkSize);
    const chunkText = chunkTokens.join(' ');

    if (chunkText.trim().length > 0) {
      chunks.push({
        id: `chunk-${i}`,
        text: chunkText,
        index: chunks.length,
        metadata: {
          lineStart: i,
          lineEnd: i + chunkTokens.length,
        },
      });
    }
  }

  return chunks;
}

/**
 * Reciprocal Rank Fusion
 * Fusionne deux listes de résultats ranked
 */
export function reciprocalRankFusion<T extends { id: string; score: number }>(
  list1: T[],
  list2: T[],
  k: number = 60
): T[] {
  const rrfScores = new Map<string, number>();
  const itemMap = new Map<string, T>();

  // Process list 1
  list1.forEach((item, index) => {
    const rank = index + 1;
    const rrfScore = 1 / (k + rank);
    rrfScores.set(item.id, (rrfScores.get(item.id) || 0) + rrfScore);
    itemMap.set(item.id, item);
  });

  // Process list 2
  list2.forEach((item, index) => {
    const rank = index + 1;
    const rrfScore = 1 / (k + rank);
    rrfScores.set(item.id, (rrfScores.get(item.id) || 0) + rrfScore);
    if (!itemMap.has(item.id)) {
      itemMap.set(item.id, item);
    }
  });

  // Create fused results
  const fusedResults: T[] = [];
  rrfScores.forEach((score, id) => {
    const item = itemMap.get(id)!;
    fusedResults.push({
      ...item,
      score, // RRF score
    });
  });

  // Sort by RRF score descending
  fusedResults.sort((a, b) => b.score - a.score);

  return fusedResults;
}

/**
 * Cosine similarity entre deux vecteurs
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Helper pour recommander le mode RAG selon MIME type
 * Retourne un mode concret (jamais 'auto')
 *
 * @param mimeType - Le type MIME du fichier
 * @param extractedText - Le texte extrait du fichier (optionnel)
 * @param textThreshold - Seuil de caractères pour considérer un PDF comme textuel (défaut: 500)
 */
export function recommendRAGMode(
  mimeType: string,
  extractedText?: string,
  textThreshold: number = 500
): StoredRAGMode {
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
