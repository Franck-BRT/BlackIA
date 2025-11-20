import path from 'path';
import { app } from 'electron';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';
import type {
  VisionRAGIndexParams,
  RAGSearchParams,
  VisionRAGResult,
  VisionRAGPatchSchema,
  DocumentProcessorResponse,
  MLXVisionEmbedderResponse,
} from '../types/rag';
import { vectorStore } from './vector-store';

/**
 * Vision RAG Service
 * Gère l'indexation et la recherche de documents via Vision RAG (MLX-VLM)
 *
 * Flow:
 * 1. PDF → Images (via Python document_processor.py)
 * 2. Images → Patch Embeddings (via Python mlx_vision_embedder.py)
 * 3. Stockage dans LanceDB
 * 4. Recherche avec Late Interaction (MaxSim)
 *
 * Note: Utilise spawn pour exécuter les scripts Python (plus robuste que python-shell)
 */
export class VisionRAGService {
  private pythonPath: string;
  private scriptsPath: string;
  private defaultModel: string;

  constructor(defaultModel: string = 'mlx-community/Qwen2-VL-2B-4bit') {
    this.defaultModel = defaultModel;

    // Chemins vers Python
    const isDev = !app.isPackaged;
    const appPath = app.getAppPath();

    if (isDev) {
      // Development: utiliser le venv local
      this.scriptsPath = path.join(appPath, 'apps/desktop/src/python');
      this.pythonPath = path.join(this.scriptsPath, 'venv/bin/python3');
    } else {
      // Production: Python sera dans les resources
      this.scriptsPath = path.join(process.resourcesPath, 'python');
      this.pythonPath = path.join(this.scriptsPath, 'venv/bin/python3');
    }

    console.log('[VisionRAG] Python path:', this.pythonPath);
    console.log('[VisionRAG] Scripts path:', this.scriptsPath);
  }

  /**
   * Indexer un document avec Vision RAG
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
      console.log('[VisionRAG] Indexing document:', {
        imagePaths: params.imagePaths.length,
        model: params.model || this.defaultModel,
      });

      // 1. Générer les embeddings via MLX-VLM
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

      const embeddings = embeddingsResult.embeddings; // [pages, patches, dims]
      const pageCount = embeddings.length;

      console.log('[VisionRAG] Generated embeddings for', pageCount, 'pages');

      // 2. Créer les schemas pour LanceDB
      const patchSchemas: VisionRAGPatchSchema[] = [];

      for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
        const patchVectors = embeddings[pageIndex]; // [patches, dims]

        const schema: VisionRAGPatchSchema = {
          id: `${params.attachmentId}-page-${pageIndex}`,
          attachmentId: params.attachmentId,
          pageIndex,
          patchVectors: JSON.stringify(patchVectors), // Serialize pour LanceDB
          entityType: params.entityType,
          entityId: params.entityId,
          metadata: JSON.stringify({
            originalName: params.attachmentId,
            pageNumber: pageIndex + 1,
          }),
          createdAt: Date.now(),
        };

        patchSchemas.push(schema);
      }

      // 3. Stocker dans LanceDB
      await vectorStore.indexVisionPatches(patchSchemas);

      const duration = Date.now() - startTime;
      const patchCount = patchSchemas.length;

      console.log('[VisionRAG] Indexed successfully:', {
        patchCount,
        pageCount,
        model,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        patchCount,
        pageCount,
        model,
      };
    } catch (error) {
      console.error('[VisionRAG] Indexing error:', error);
      return {
        success: false,
        patchCount: 0,
        pageCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Rechercher dans les documents indexés avec Vision RAG
   */
  async search(params: RAGSearchParams): Promise<{
    success: boolean;
    results: VisionRAGResult[];
    error?: string;
  }> {
    try {
      const startTime = Date.now();

      console.log('[VisionRAG] Searching:', {
        query: params.query.substring(0, 100),
        topK: params.topK || 10,
        filters: params.filters,
      });

      // 1. Générer l'embedding de la query via MLX-VLM
      // Note: Pour l'instant, on utilise un embedding simple
      // TODO: Implémenter query embedding via MLX-VLM

      // Placeholder: générer un embedding dummy
      const queryEmbedding = new Array(128).fill(0); // 128 dims

      // 2. Recherche vectorielle dans LanceDB
      const topK = params.topK || 10;
      const results = await vectorStore.searchVisionPatches(queryEmbedding, topK, params.filters);

      // 3. Filtrer par score minimum si spécifié
      const minScore = params.minScore || 0;
      const filteredResults = results.filter((r) => r.score >= minScore);

      const duration = Date.now() - startTime;

      console.log('[VisionRAG] Search completed:', {
        resultsCount: filteredResults.length,
        topScore: filteredResults[0]?.score,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        results: filteredResults,
      };
    } catch (error) {
      console.error('[VisionRAG] Search error:', error);
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Supprimer l'indexation d'un document
   */
  async deleteDocument(attachmentId: string): Promise<void> {
    try {
      console.log('[VisionRAG] Deleting document:', attachmentId);
      await vectorStore.deleteByAttachmentId(attachmentId);
      console.log('[VisionRAG] Deleted successfully');
    } catch (error) {
      console.error('[VisionRAG] Delete error:', error);
      throw error;
    }
  }

  /**
   * Convertir un PDF en images via Python
   */
  async convertPDFToImages(
    pdfPath: string,
    outputDir: string,
    dpi: number = 200
  ): Promise<DocumentProcessorResponse> {
    return new Promise((resolve) => {
      console.log('[VisionRAG] Converting PDF to images:', pdfPath);

      const scriptPath = path.join(this.scriptsPath, 'vision_rag/document_processor.py');
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
        console.log('[VisionRAG Python]', message.trim());
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('[VisionRAG] Python process exited with code', code);
          console.error('[VisionRAG] stderr:', stderrData);
          resolve({
            success: false,
            error: `Python process failed with code ${code}: ${stderrData}`,
          });
          return;
        }

        try {
          const result = JSON.parse(stdoutData) as DocumentProcessorResponse;
          console.log('[VisionRAG] Converted', result.pageCount, 'pages');
          resolve(result);
        } catch (error) {
          console.error('[VisionRAG] Failed to parse Python output:', error);
          console.error('[VisionRAG] stdout:', stdoutData);
          resolve({
            success: false,
            error: `Failed to parse Python output: ${error}`,
          });
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('[VisionRAG] Failed to start Python process:', error);
        resolve({
          success: false,
          error: `Failed to start Python: ${error.message}`,
        });
      });
    });
  }

  /**
   * Générer des embeddings via MLX-VLM
   */
  private async generateEmbeddings(
    imagePaths: string[],
    model: string
  ): Promise<MLXVisionEmbedderResponse> {
    return new Promise((resolve) => {
      console.log('[VisionRAG] Generating embeddings for', imagePaths.length, 'images...');

      const scriptPath = path.join(this.scriptsPath, 'vision_rag/mlx_vision_embedder.py');
      const args = [
        scriptPath,
        ...imagePaths,
        '--model', model,
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
        console.log('[VisionRAG Python]', message.trim());
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('[VisionRAG] Python process exited with code', code);
          console.error('[VisionRAG] stderr:', stderrData);
          resolve({
            success: false,
            error: `Python process failed with code ${code}: ${stderrData}`,
          });
          return;
        }

        try {
          const result = JSON.parse(stdoutData) as MLXVisionEmbedderResponse;
          console.log('[VisionRAG] Generated embeddings:', {
            pageCount: result.pageCount,
            patchesPerPage: result.patchesPerPage,
            embeddingDim: result.embeddingDim,
          });
          resolve(result);
        } catch (error) {
          console.error('[VisionRAG] Failed to parse Python output:', error);
          console.error('[VisionRAG] stdout:', stdoutData);
          resolve({
            success: false,
            error: `Failed to parse Python output: ${error}`,
          });
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('[VisionRAG] Failed to start Python process:', error);
        resolve({
          success: false,
          error: `Failed to start Python: ${error.message}`,
        });
      });
    });
  }

  /**
   * Vérifier si l'environnement Python est disponible
   */
  async checkPythonEnvironment(): Promise<{
    available: boolean;
    pythonVersion?: string;
    mlxAvailable?: boolean;
    error?: string;
  }> {
    return new Promise((resolve) => {
      const pythonProcess = spawn(this.pythonPath, ['--version']);

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
            error: `Python check failed with code ${code}`,
          });
          return;
        }

        // Python version is often on stderr
        const pythonVersion = (stdoutData + stderrData).trim();

        resolve({
          available: true,
          pythonVersion,
          mlxAvailable: true, // TODO: vraie vérification
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
   * Mettre à jour le modèle par défaut
   */
  setDefaultModel(model: string): void {
    this.defaultModel = model;
    console.log('[VisionRAG] Default model updated:', model);
  }
}

// Export singleton instance
export const visionRAGService = new VisionRAGService();
