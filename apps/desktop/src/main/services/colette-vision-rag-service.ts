/**
 * Colette Vision RAG Service
 * Intégration du système Colette de JoliBrain pour le Vision RAG
 *
 * Colette utilise ColPali ou Qwen2-VL pour générer des embeddings multi-vecteurs
 * optimisés pour la recherche de documents visuels (PDFs, images).
 *
 * Référence: https://github.com/jolibrain/colette
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

interface ColetteEmbeddingsResult {
  success: boolean;
  embeddings?: number[][][]; // [pages, patches, dims]
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

interface ColetteQueryResult {
  success: boolean;
  query_embedding?: number[][];
  embedding_dim?: number;
  error?: string;
}

/**
 * Colette Vision RAG Service
 */
export class ColetteVisionRAGService {
  private pythonPath: string;
  private scriptPath: string;
  private defaultModel: string;

  constructor(defaultModel: string = 'vidore/colpali') {
    this.defaultModel = defaultModel;

    // Chemins vers Python et script Colette
    const isDev = !app.isPackaged;
    const appPath = app.getAppPath();

    // Déclarer scriptsPath en dehors du if/else pour qu'elle soit accessible partout
    let scriptsPath: string;

    if (isDev) {
      // Development: détecter le meilleur Python disponible
      scriptsPath = path.join(appPath, 'apps/desktop/src/python');
      this.scriptPath = path.join(scriptsPath, 'vision_rag/colette_embedder.py');
      this.pythonPath = this.detectPythonPath(scriptsPath);
    } else {
      // Production: essayer plusieurs chemins et détecter Python système
      scriptsPath = path.join(process.resourcesPath, 'python');
      this.scriptPath = path.join(scriptsPath, 'vision_rag/colette_embedder.py');

      // Essayer la détection même en production
      const venvPython = path.join(scriptsPath, 'venv/bin/python3');
      if (existsSync(venvPython)) {
        this.pythonPath = venvPython;
        console.log('[Colette] Using bundled venv Python:', this.pythonPath);
      } else {
        // Fallback: détecter Python système avec dépendances
        this.pythonPath = this.detectSystemPython();
        console.log('[Colette] Bundled venv not found, using system Python:', this.pythonPath);
      }
    }

    console.log('[Colette] Python path:', this.pythonPath);
    console.log('[Colette] Script path:', this.scriptPath);

    // Vérifier que le script existe
    if (!existsSync(this.scriptPath)) {
      const error = `[Colette] ERROR: Python script not found at ${this.scriptPath}`;
      console.error(error);
      console.error('[Colette] This likely means the app was not built correctly.');
      console.error('[Colette] In production, Python files from src/python should be in:', scriptsPath);

      if (!isDev) {
        console.error('[Colette] Please rebuild the application with: npm run build:dmg:arm64');
      }
    } else {
      console.log('[Colette] ✓ Python script found');
    }
  }

  /**
   * Détecter le meilleur Python disponible avec les dépendances Colette
   */
  private detectPythonPath(scriptsPath: string): string {
    // 1. Essayer le venv local d'abord
    const venvPython = path.join(scriptsPath, 'venv/bin/python3');
    if (existsSync(venvPython)) {
      console.log('[Colette] Using venv Python:', venvPython);
      return venvPython;
    }

    // 2. Essayer Python système avec vérification des dépendances
    return this.detectSystemPython();
  }

  /**
   * Détecter Python système avec les dépendances Colette installées
   */
  private detectSystemPython(): string {
    const systemPythons = ['python3', 'python'];
    for (const pythonCmd of systemPythons) {
      try {
        // Vérifier si Python a les dépendances requises
        execSync(
          `${pythonCmd} -c "import colpali_engine; import torch; import torchvision; import pdf2image; import PIL"`,
          { stdio: 'ignore' }
        );
        console.log('[Colette] Using system Python with required dependencies:', pythonCmd);
        return pythonCmd;
      } catch {
        // Continue au suivant
      }
    }

    // Si aucun Python valide trouvé, retourner 'python3' comme fallback
    // L'erreur sera gérée lors de l'exécution avec un message clair
    console.warn('[Colette] No valid Python found with Colette dependencies.');
    console.warn('[Colette] Please install dependencies: pip install colpali-engine torch torchvision pdf2image pillow');
    return 'python3';
  }

  /**
   * Générer les embeddings avec Colette
   */
  private async generateEmbeddings(
    imagePaths: string[],
    model?: string
  ): Promise<ColetteEmbeddingsResult> {
    return new Promise((resolve) => {
      const inputData = JSON.stringify({ image_paths: imagePaths });
      const modelName = model || this.defaultModel;

      console.log('[Colette] Generating embeddings for', imagePaths.length, 'files');
      console.log('[Colette] Using model:', modelName);

      const args = [
        this.scriptPath,
        '--input', inputData,
        '--mode', 'embed_images',
        '--model', modelName,
        '--device', 'auto',
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
        // Log Python stderr for debugging
        console.log('[Colette Python]', message.trim());
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('[Colette] Python process exited with code', code);
          console.error('[Colette] stderr:', stderrData);
          resolve({
            success: false,
            error: `Python process failed with code ${code}: ${stderrData}`,
          });
          return;
        }

        try {
          const result = JSON.parse(stdoutData) as ColetteEmbeddingsResult;
          resolve(result);
        } catch (error) {
          console.error('[Colette] Failed to parse Python output:', error);
          console.error('[Colette] stdout:', stdoutData);
          resolve({
            success: false,
            error: `Failed to parse Python output: ${error}`,
          });
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('[Colette] Failed to start Python process:', error);
        resolve({
          success: false,
          error: `Failed to start Python: ${error.message}`,
        });
      });
    });
  }

  /**
   * Encoder une query texte avec Colette
   */
  private async encodeQuery(query: string, model?: string): Promise<ColetteQueryResult> {
    return new Promise((resolve) => {
      const inputData = JSON.stringify({ query });
      const modelName = model || this.defaultModel;

      const args = [
        this.scriptPath,
        '--input', inputData,
        '--mode', 'encode_query',
        '--model', modelName,
        '--device', 'auto',
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
        console.log('[Colette Python]', message.trim());
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('[Colette] Python process exited with code', code);
          resolve({
            success: false,
            error: `Python process failed with code ${code}: ${stderrData}`,
          });
          return;
        }

        try {
          const result = JSON.parse(stdoutData) as ColetteQueryResult;
          resolve(result);
        } catch (error) {
          console.error('[Colette] Failed to parse Python output:', error);
          resolve({
            success: false,
            error: `Failed to parse Python output: ${error}`,
          });
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('[Colette] Failed to start Python process:', error);
        resolve({
          success: false,
          error: `Failed to start Python: ${error.message}`,
        });
      });
    });
  }

  /**
   * Indexer un document avec Colette Vision RAG
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
      console.log('[Colette] Indexing document:', {
        imagePaths: params.imagePaths.length,
        model: params.model || this.defaultModel,
      });

      // 1. Générer les embeddings via Colette
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

      console.log('[Colette] Generated embeddings for', pageCount, 'pages');
      console.log('[Colette] Metadata:', embeddingsResult.metadata);

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
            model: embeddingsResult.metadata?.model || model,
            numPatches: patchVectors.length,
            embeddingDim: patchVectors[0]?.length || 0,
          }),
          createdAt: Date.now(),
        };

        patchSchemas.push(schema);
      }

      // 3. Stocker dans LanceDB
      await vectorStore.indexVisionPatches(patchSchemas);

      const duration = Date.now() - startTime;
      const patchCount = patchSchemas.reduce(
        (sum, schema) => sum + JSON.parse(schema.patchVectors).length,
        0
      );

      console.log('[Colette] Indexed successfully:', {
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
      console.error('[Colette] Indexing error:', error);
      return {
        success: false,
        patchCount: 0,
        pageCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Rechercher dans les documents indexés avec Colette Vision RAG
   */
  async search(params: RAGSearchParams): Promise<{
    success: boolean;
    results: VisionRAGResult[];
    error?: string;
  }> {
    try {
      const startTime = Date.now();

      console.log('[Colette] Searching:', {
        query: params.query.substring(0, 100),
        topK: params.topK || 10,
        filters: params.filters,
      });

      // 1. Générer l'embedding de la query via Colette
      const queryResult = await this.encodeQuery(params.query, this.defaultModel);

      if (!queryResult.success || !queryResult.query_embedding) {
        return {
          success: false,
          results: [],
          error: queryResult.error || 'Failed to encode query',
        };
      }

      const queryEmbedding = queryResult.query_embedding;

      console.log('[Colette] Query embedding generated, shape:', [
        queryEmbedding.length,
        queryEmbedding[0]?.length || 0,
      ]);

      // 2. Recherche vectorielle dans LanceDB avec Late Interaction (MaxSim)
      const topK = params.topK || 10;
      const results = await vectorStore.searchVisionPatchesWithMaxSim(
        queryEmbedding,
        topK,
        params.filters
      );

      // 3. Filtrer par score minimum si spécifié
      const minScore = params.minScore || 0;
      const filteredResults = results.filter((r) => r.score >= minScore);

      const duration = Date.now() - startTime;

      console.log('[Colette] Search completed:', {
        found: filteredResults.length,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        results: filteredResults,
      };
    } catch (error) {
      console.error('[Colette] Search error:', error);
      return {
        success: false,
        results: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Supprimer l'index d'un document
   */
  async deleteIndex(attachmentId: string): Promise<boolean> {
    try {
      console.log('[Colette] Deleting index for attachment:', attachmentId);
      await vectorStore.deleteByAttachmentId(attachmentId);
      return true;
    } catch (error) {
      console.error('[Colette] Delete index error:', error);
      return false;
    }
  }
}

// Export singleton instance
export const coletteVisionRAGService = new ColetteVisionRAGService();
