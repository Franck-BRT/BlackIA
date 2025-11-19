import path from 'path';
import { app } from 'electron';
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
 * Note: Nécessite python-shell et environnement Python configuré
 */
export class VisionRAGService {
  private pythonPath: string;
  private scriptsPath: string;
  private defaultModel: string;
  private pythonShellAvailable: boolean = false;

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

    // Vérifier si python-shell est disponible
    this.checkPythonShellAvailability();
  }

  /**
   * Vérifier si python-shell est disponible
   */
  private async checkPythonShellAvailability(): Promise<void> {
    try {
      await import('python-shell');
      this.pythonShellAvailable = true;
    } catch {
      this.pythonShellAvailable = false;
      console.warn('[VisionRAG] ⚠️  python-shell module not installed. Install with: pnpm add python-shell');
    }
  }

  /**
   * Obtenir PythonShell ou throw une erreur claire
   */
  private async getPythonShell(): Promise<any> {
    try {
      const module = await import('python-shell');
      return module.PythonShell;
    } catch (error) {
      throw new Error(
        'python-shell module not installed. Install dependencies: pnpm add python-shell @types/python-shell'
      );
    }
  }

  /**
   * Indexer un document avec Vision RAG
   */
  async indexDocument(params: VisionRAGIndexParams): Promise<{
    success: boolean;
    patchCount: number;
    pageCount: number;
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
        duration: `${duration}ms`,
      });

      return {
        success: true,
        patchCount,
        pageCount,
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
    try {
      console.log('[VisionRAG] Converting PDF to images:', pdfPath);

      // Utiliser python-shell pour exécuter document_processor.py
      const PythonShell = await this.getPythonShell();

      const scriptPath = path.join(this.scriptsPath, 'vision_rag/document_processor.py');

      const options = {
        mode: 'json' as const,
        pythonPath: this.pythonPath,
        pythonOptions: ['-u'], // unbuffered
        scriptPath: path.dirname(scriptPath),
        args: [
          pdfPath,
          outputDir,
          '--dpi', dpi.toString(),
          '--format', 'PNG',
        ],
      };

      const results = await PythonShell.run(path.basename(scriptPath), options);

      // Le dernier résultat contient le JSON de sortie
      const result = results[results.length - 1] as any;

      if (!result.success) {
        throw new Error(result.error || 'PDF conversion failed');
      }

      console.log('[VisionRAG] Converted', result.pageCount, 'pages');

      return result as DocumentProcessorResponse;
    } catch (error) {
      console.error('[VisionRAG] PDF conversion error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Générer des embeddings via MLX-VLM
   */
  private async generateEmbeddings(
    imagePaths: string[],
    model: string
  ): Promise<MLXVisionEmbedderResponse> {
    try {
      console.log('[VisionRAG] Generating embeddings for', imagePaths.length, 'images...');

      // Utiliser python-shell pour exécuter mlx_vision_embedder.py
      const PythonShell = await this.getPythonShell();

      const scriptPath = path.join(this.scriptsPath, 'vision_rag/mlx_vision_embedder.py');

      const options = {
        mode: 'json' as const,
        pythonPath: this.pythonPath,
        pythonOptions: ['-u'],
        scriptPath: path.dirname(scriptPath),
        args: [
          ...imagePaths,
          '--model', model,
          '--verbose',
        ],
      };

      const results = await PythonShell.run(path.basename(scriptPath), options);

      // Le dernier résultat contient le JSON de sortie
      const result = results[results.length - 1] as any;

      if (!result.success) {
        throw new Error(result.error || 'Embedding generation failed');
      }

      console.log('[VisionRAG] Generated embeddings:', {
        pageCount: result.pageCount,
        patchesPerPage: result.patchesPerPage,
        embeddingDim: result.embeddingDim,
      });

      return result as MLXVisionEmbedderResponse;
    } catch (error) {
      console.error('[VisionRAG] Embedding generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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
    try {
      const PythonShell = await this.getPythonShell();

      // Test simple: exécuter Python et vérifier la version
      const options = {
        mode: 'text' as const,
        pythonPath: this.pythonPath,
        args: ['--version'],
      };

      const results = await PythonShell.run('-c', options);
      const pythonVersion = results.join(' ');

      // TODO: Vérifier MLX availability
      // const mlxCheck = await this.checkMLXAvailability();

      return {
        available: true,
        pythonVersion,
        mlxAvailable: true, // TODO: vraie vérification
      };
    } catch (error) {
      console.error('[VisionRAG] Python environment check error:', error);
      return {
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
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
