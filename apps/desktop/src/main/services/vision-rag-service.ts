/**
 * MLX Vision RAG Service
 * Gère l'indexation et la recherche de documents via Vision RAG avec MLX sur Apple Silicon
 *
 * Flow:
 * 1. PDF/Images → Patch Embeddings (via mlx_vision_embedder.py)
 * 2. Stockage dans LanceDB avec images cachées
 * 3. Recherche avec Late Interaction (MaxSim)
 *
 * Modèles supportés:
 * - mlx-community/Qwen2-VL-2B-Instruct-4bit (8GB RAM, rapide)
 * - mlx-community/Qwen2-VL-2B-Instruct (16GB RAM)
 * - mlx-community/Qwen2-VL-7B-Instruct-4bit (16GB RAM)
 * - mlx-community/Qwen2-VL-7B-Instruct (32GB RAM)
 * - mlx-community/paligemma-3b-mix-448-8bit (8GB)
 * - mlx-community/pixtral-12b-4bit (16GB)
 */

import path from 'path';
import { app } from 'electron';
import { spawn, execSync } from 'child_process';
import { existsSync } from 'fs';
import type {
  VisionRAGIndexParams,
  RAGSearchParams,
  VisionRAGResult,
  VisionRAGPatchSchema,
} from '../types/rag';
import { vectorStore } from './vector-store';

interface MLXEmbeddingsResult {
  success: boolean;
  embeddings?: number[][][]; // [pages, patches, dims]
  cached_image_paths?: string[];
  metadata?: {
    model: string;
    device: string;
    num_images: number;
    num_patches_per_image: number;
    embedding_dim: number;
    total_patches: number;
  };
  error?: string;
}

interface MLXQueryResult {
  success: boolean;
  query_embedding?: number[][];
  embedding_dim?: number;
  num_tokens?: number;
  error?: string;
}

// Supported MLX models
export const MLX_VISION_MODELS = {
  'mlx-community/Qwen2-VL-2B-Instruct-4bit': {
    name: 'Qwen2-VL 2B 4-bit',
    ram: '8GB',
    description: 'Fast, low memory',
  },
  'mlx-community/Qwen2-VL-2B-Instruct': {
    name: 'Qwen2-VL 2B',
    ram: '16GB',
    description: 'Good balance',
  },
  'mlx-community/Qwen2-VL-7B-Instruct-4bit': {
    name: 'Qwen2-VL 7B 4-bit',
    ram: '16GB',
    description: 'High quality, quantized',
  },
  'mlx-community/Qwen2-VL-7B-Instruct': {
    name: 'Qwen2-VL 7B',
    ram: '32GB',
    description: 'Best quality',
  },
  'mlx-community/paligemma-3b-mix-448-8bit': {
    name: 'PaliGemma 3B',
    ram: '8GB',
    description: 'Document specialist',
  },
  'mlx-community/pixtral-12b-4bit': {
    name: 'Pixtral 12B',
    ram: '16GB',
    description: 'Complex documents',
  },
};

/**
 * MLX Vision RAG Service
 */
export class VisionRAGService {
  private pythonPath: string;
  private scriptPath: string;
  private defaultModel: string;

  constructor(defaultModel: string = 'mlx-community/Qwen2-VL-2B-Instruct-4bit') {
    this.defaultModel = defaultModel;

    // Chemins vers Python et script MLX
    const isDev = !app.isPackaged;
    const appPath = app.getAppPath();

    let scriptsPath: string;

    if (isDev) {
      scriptsPath = path.join(appPath, 'apps/desktop/src/python');
      this.scriptPath = path.join(scriptsPath, 'vision_rag/mlx_vision_embedder.py');
      this.pythonPath = this.detectPythonPath(scriptsPath);
    } else {
      scriptsPath = path.join(process.resourcesPath, 'python');
      this.scriptPath = path.join(scriptsPath, 'vision_rag/mlx_vision_embedder.py');

      const venvPython = path.join(scriptsPath, 'venv/bin/python3');
      if (existsSync(venvPython)) {
        this.pythonPath = venvPython;
        console.log('[MLX Vision] Using bundled venv Python:', this.pythonPath);
      } else {
        this.pythonPath = this.detectSystemPython();
        console.log('[MLX Vision] Using system Python:', this.pythonPath);
      }
    }

    console.log('[MLX Vision] Python path:', this.pythonPath);
    console.log('[MLX Vision] Script path:', this.scriptPath);

    if (!existsSync(this.scriptPath)) {
      console.error(`[MLX Vision] ERROR: Script not found at ${this.scriptPath}`);
    } else {
      console.log('[MLX Vision] ✓ Script found');
    }
  }

  private detectPythonPath(scriptsPath: string): string {
    const venvPython = path.join(scriptsPath, 'venv/bin/python3');
    if (existsSync(venvPython)) {
      console.log('[MLX Vision] Using venv Python:', venvPython);
      return venvPython;
    }
    return this.detectSystemPython();
  }

  private detectSystemPython(): string {
    const systemPythons = ['python3', 'python'];
    for (const pythonCmd of systemPythons) {
      try {
        execSync(`${pythonCmd} -c "import mlx.core; import PIL"`, { stdio: 'ignore' });
        console.log('[MLX Vision] Using system Python with MLX:', pythonCmd);
        return pythonCmd;
      } catch {
        // Continue
      }
    }
    console.warn('[MLX Vision] No valid Python with MLX found');
    return 'python3';
  }

  /**
   * Convert image to base64
   */
  private async imageToBase64(imagePath: string): Promise<string | undefined> {
    try {
      console.log('[MLX Vision] Converting to base64:', imagePath);
      const fs = await import('fs/promises');

      try {
        await fs.access(imagePath);
      } catch {
        console.error('[MLX Vision] Image file not found:', imagePath);
        return undefined;
      }

      const imageBuffer = await fs.readFile(imagePath);
      const base64 = imageBuffer.toString('base64');
      const ext = imagePath.toLowerCase().split('.').pop() || 'png';
      const mimeType = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`;
      const result = `data:${mimeType};base64,${base64}`;
      console.log('[MLX Vision] Base64 conversion success, length:', result.length);
      return result;
    } catch (error) {
      console.error('[MLX Vision] Error converting image to base64:', imagePath, error);
      return undefined;
    }
  }

  /**
   * Generate embeddings via MLX Vision
   */
  private async generateEmbeddings(
    imagePaths: string[],
    model?: string
  ): Promise<MLXEmbeddingsResult> {
    return new Promise((resolve) => {
      const inputData = JSON.stringify({ image_paths: imagePaths });
      const modelName = model || this.defaultModel;

      console.log('[MLX Vision] Generating embeddings for', imagePaths.length, 'files');
      console.log('[MLX Vision] Using model:', modelName);

      const args = [
        this.scriptPath,
        '--input', inputData,
        '--mode', 'embed_images',
        '--model', modelName,
        '--verbose',
      ];

      const pythonProcess = spawn(this.pythonPath, args);

      let stdoutData = '';
      let stderrData = '';

      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        const message = data.toString();
        stderrData += message;
        console.log('[MLX Python]', message.trim());
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('[MLX Vision] Python process exited with code', code);
          console.error('[MLX Vision] stderr:', stderrData);
          resolve({
            success: false,
            error: `Python process failed with code ${code}: ${stderrData}`,
          });
          return;
        }

        try {
          const result = JSON.parse(stdoutData) as MLXEmbeddingsResult;
          resolve(result);
        } catch (error) {
          console.error('[MLX Vision] Failed to parse Python output:', error);
          console.error('[MLX Vision] stdout:', stdoutData);
          resolve({
            success: false,
            error: `Failed to parse Python output: ${error}`,
          });
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('[MLX Vision] Failed to start Python process:', error);
        resolve({
          success: false,
          error: `Failed to start Python: ${error.message}`,
        });
      });
    });
  }

  /**
   * Encode query for search
   */
  private async encodeQuery(query: string, model?: string): Promise<MLXQueryResult> {
    return new Promise((resolve) => {
      const inputData = JSON.stringify({ query });
      const modelName = model || this.defaultModel;

      const args = [
        this.scriptPath,
        '--input', inputData,
        '--mode', 'encode_query',
        '--model', modelName,
        '--verbose',
      ];

      const pythonProcess = spawn(this.pythonPath, args);

      let stdoutData = '';
      let stderrData = '';

      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        const message = data.toString();
        stderrData += message;
        console.log('[MLX Python]', message.trim());
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('[MLX Vision] Python process exited with code', code);
          resolve({
            success: false,
            error: `Python process failed with code ${code}: ${stderrData}`,
          });
          return;
        }

        try {
          const result = JSON.parse(stdoutData) as MLXQueryResult;
          resolve(result);
        } catch (error) {
          console.error('[MLX Vision] Failed to parse Python output:', error);
          resolve({
            success: false,
            error: `Failed to parse Python output: ${error}`,
          });
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('[MLX Vision] Failed to start Python process:', error);
        resolve({
          success: false,
          error: `Failed to start Python: ${error.message}`,
        });
      });
    });
  }

  /**
   * Index a document with MLX Vision RAG
   */
  async indexDocument(params: VisionRAGIndexParams): Promise<{
    success: boolean;
    patchCount: number;
    pageCount: number;
    model?: string;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      console.log('[MLX Vision] Indexing document:', {
        imagePaths: params.imagePaths.length,
        model: params.model || this.defaultModel,
      });

      // Generate embeddings via MLX
      const model = params.model || this.defaultModel;
      const embeddingsResult = await this.generateEmbeddings(params.imagePaths, model);

      if (!embeddingsResult.success || !embeddingsResult.embeddings) {
        return {
          success: false,
          patchCount: 0,
          pageCount: 0,
          error: embeddingsResult.error || 'Failed to generate embeddings',
        };
      }

      const embeddings = embeddingsResult.embeddings;
      const pageCount = embeddings.length;
      const cachedImagePaths = embeddingsResult.cached_image_paths || [];

      console.log('[MLX Vision] Generated embeddings for', pageCount, 'pages');
      console.log('[MLX Vision] Metadata:', embeddingsResult.metadata);
      console.log('[MLX Vision] Cached image paths:', cachedImagePaths.length);

      // Create schemas for LanceDB
      const patchSchemas: VisionRAGPatchSchema[] = [];

      for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
        const patchVectors = embeddings[pageIndex];

        // Convert cached image to base64
        const cachedPath = cachedImagePaths[pageIndex];
        console.log(`[MLX Vision] Page ${pageIndex}: cached path = ${cachedPath || 'undefined'}`);

        let imageBase64: string | undefined = undefined;
        if (cachedPath && typeof cachedPath === 'string' && cachedPath !== 'undefined') {
          imageBase64 = await this.imageToBase64(cachedPath);
        }

        console.log(`[MLX Vision] Page ${pageIndex}: imageBase64 = ${imageBase64 ? `set (length: ${imageBase64.length})` : 'undefined'}`);

        // Build metadata - only include imageBase64 if it's a valid base64 string
        const metadata: Record<string, any> = {
          originalName: params.attachmentId,
          pageNumber: pageIndex + 1,
          model: embeddingsResult.metadata?.model || model,
          numPatches: patchVectors.length,
          embeddingDim: patchVectors[0]?.length || 0,
        };

        // Only add imageBase64 if it's a valid data URL
        if (imageBase64 && imageBase64.startsWith('data:image/')) {
          metadata.imageBase64 = imageBase64;
        }

        const schema: VisionRAGPatchSchema = {
          id: `${params.attachmentId}-page-${pageIndex}`,
          attachmentId: params.attachmentId,
          pageIndex,
          patchVectors: JSON.stringify(patchVectors),
          vector: [0.0], // Dummy vector for vectordb 0.4.x compatibility
          entityType: params.entityType,
          entityId: params.entityId,
          metadata: JSON.stringify(metadata),
          createdAt: Date.now(),
        };

        patchSchemas.push(schema);
      }

      // Store in LanceDB
      await vectorStore.indexVisionPatches(patchSchemas);

      const duration = Date.now() - startTime;
      const patchCount = patchSchemas.reduce(
        (sum, schema) => sum + JSON.parse(schema.patchVectors).length,
        0
      );

      console.log('[MLX Vision] Indexed successfully:', {
        patchCount,
        pageCount,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        patchCount,
        pageCount,
        model: embeddingsResult.metadata?.model || model,
      };
    } catch (error) {
      console.error('[MLX Vision] Indexing error:', error);
      return {
        success: false,
        patchCount: 0,
        pageCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Search indexed documents with MLX Vision RAG
   */
  async search(params: RAGSearchParams): Promise<{
    success: boolean;
    results: VisionRAGResult[];
    error?: string;
  }> {
    try {
      const startTime = Date.now();

      console.log('[MLX Vision] Searching:', {
        query: params.query.substring(0, 100),
        topK: params.topK || 10,
        filters: params.filters,
      });

      // Encode query via MLX
      const queryResult = await this.encodeQuery(params.query, this.defaultModel);

      if (!queryResult.success || !queryResult.query_embedding) {
        return {
          success: false,
          results: [],
          error: queryResult.error || 'Failed to encode query',
        };
      }

      const queryEmbedding = queryResult.query_embedding;

      console.log('[MLX Vision] Query embedding generated, tokens:', queryEmbedding.length);

      // Search with MaxSim
      const topK = params.topK || 10;
      const results = await vectorStore.searchVisionPatchesWithMaxSim(
        queryEmbedding,
        topK,
        params.filters
      );

      // Filter by minimum score
      const minScore = params.minScore || 0;
      const filteredResults = results.filter((r) => r.score >= minScore);

      const duration = Date.now() - startTime;

      console.log('[MLX Vision] Search completed:', {
        found: filteredResults.length,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        results: filteredResults,
      };
    } catch (error) {
      console.error('[MLX Vision] Search error:', error);
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete document index
   */
  async deleteDocument(attachmentId: string): Promise<void> {
    try {
      console.log('[MLX Vision] Deleting document:', attachmentId);
      await vectorStore.deleteByAttachmentId(attachmentId);
      console.log('[MLX Vision] Deleted successfully');
    } catch (error) {
      console.error('[MLX Vision] Delete error:', error);
      throw error;
    }
  }

  /**
   * Get document patches for visualization
   */
  async getDocumentPatches(attachmentId: string): Promise<Array<{
    id: string;
    pageIndex: number;
    pageNumber: number;
    patchCount: number;
    pageThumbnail?: string;
    metadata: any;
  }>> {
    try {
      console.log('[MLX Vision] Getting patches for attachment:', attachmentId);
      const patches = await vectorStore.getVisionPatchesByAttachment(attachmentId);
      console.log('[MLX Vision] Raw patches count:', patches.length);

      // Group patches by page
      const patchesByPage = new Map<number, any[]>();

      for (const patch of patches) {
        const pageIndex = patch.pageIndex;
        if (!patchesByPage.has(pageIndex)) {
          patchesByPage.set(pageIndex, []);
        }
        patchesByPage.get(pageIndex)!.push(patch);
      }

      console.log('[MLX Vision] Pages found:', patchesByPage.size);

      const result = Array.from(patchesByPage.entries()).map(([pageIndex, pagePatches]) => {
        const firstPatch = pagePatches[0];
        const metadata = typeof firstPatch.metadata === 'string'
          ? JSON.parse(firstPatch.metadata)
          : firstPatch.metadata;

        let totalPatchCount = 0;
        for (const patch of pagePatches) {
          const patchVectors = typeof patch.patchVectors === 'string'
            ? JSON.parse(patch.patchVectors)
            : patch.patchVectors;
          totalPatchCount += patchVectors.length;
        }

        return {
          id: `page-${pageIndex}`,
          pageIndex,
          pageNumber: pageIndex + 1,
          patchCount: totalPatchCount,
          pageThumbnail: metadata.imageBase64,
          metadata,
        };
      });

      result.sort((a, b) => a.pageIndex - b.pageIndex);

      console.log('[MLX Vision] Returning', result.length, 'pages with patches');
      return result;
    } catch (error) {
      console.error('[MLX Vision] Error getting document patches:', error);
      return [];
    }
  }

  /**
   * Convert PDF to images (utility method)
   */
  async convertPDFToImages(
    pdfPath: string,
    outputDir: string,
    dpi: number = 200
  ): Promise<{
    success: boolean;
    imagePaths?: string[];
    pageCount?: number;
    error?: string;
  }> {
    return new Promise((resolve) => {
      console.log('[MLX Vision] Converting PDF to images:', pdfPath);

      const scriptPath = path.join(
        path.dirname(this.scriptPath),
        'document_processor.py'
      );

      if (!existsSync(scriptPath)) {
        resolve({
          success: false,
          error: `Document processor script not found at ${scriptPath}`,
        });
        return;
      }

      const args = [
        scriptPath,
        pdfPath,
        outputDir,
        '--dpi', dpi.toString(),
        '--format', 'PNG',
      ];

      const pythonProcess = spawn(this.pythonPath, args);

      let stdoutData = '';
      let stderrData = '';

      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        const message = data.toString();
        stderrData += message;
        console.log('[MLX Python]', message.trim());
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          resolve({
            success: false,
            error: `Python process failed with code ${code}: ${stderrData}`,
          });
          return;
        }

        try {
          const result = JSON.parse(stdoutData);
          console.log('[MLX Vision] Converted', result.pageCount, 'pages');
          resolve({
            success: result.success,
            imagePaths: result.imagePaths || result.image_paths,
            pageCount: result.pageCount || result.page_count,
            error: result.error,
          });
        } catch (error) {
          resolve({
            success: false,
            error: `Failed to parse Python output: ${error}`,
          });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({
          success: false,
          error: `Failed to start Python: ${error.message}`,
        });
      });
    });
  }

  /**
   * Check Python environment
   */
  async checkPythonEnvironment(): Promise<{
    available: boolean;
    pythonVersion?: string;
    mlxAvailable?: boolean;
    error?: string;
  }> {
    return new Promise((resolve) => {
      const pythonProcess = spawn(this.pythonPath, [
        '-c',
        'import sys; import mlx.core as mx; print(f"Python {sys.version}, MLX {mx.__version__}")',
      ]);

      let stdoutData = '';
      let stderrData = '';

      pythonProcess.stdout.on('data', (data) => {
        stdoutData += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderrData += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          resolve({
            available: false,
            error: `Python check failed: ${stderrData}`,
          });
          return;
        }

        resolve({
          available: true,
          pythonVersion: stdoutData.trim(),
          mlxAvailable: true,
        });
      });

      pythonProcess.on('error', (error) => {
        resolve({
          available: false,
          error: `Python not found: ${error.message}`,
        });
      });
    });
  }

  /**
   * Set default model
   */
  setDefaultModel(model: string): void {
    this.defaultModel = model;
    console.log('[MLX Vision] Default model updated:', model);
  }

  /**
   * Get available models
   */
  getAvailableModels(): typeof MLX_VISION_MODELS {
    return MLX_VISION_MODELS;
  }
}

// Export singleton instance
export const visionRAGService = new VisionRAGService();
