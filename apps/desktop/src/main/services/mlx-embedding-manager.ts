/**
 * MLX Embedding Model Manager
 * Gère le téléchargement et la suppression des modèles sentence-transformers
 */

import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import { logger } from './log-service';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

interface DownloadProgress {
  repoId: string;
  downloaded: number;
  total: number;
  percentage: number;
}

interface EmbeddingModelInfo {
  name: string;
  size: string;
  downloaded: boolean;
  type: 'embed';
  dimensions?: number;
  description?: string;
  path?: string;
  tags?: string[];
}

/**
 * Service de gestion des modèles d'embedding
 */
export class MLXEmbeddingManager extends EventEmitter {
  private pythonPath: string;
  private scriptPath: string;
  private currentDownloadRepoId?: string;

  // Modèles recommandés par défaut
  private defaultModels: EmbeddingModelInfo[] = [
    {
      name: 'sentence-transformers/all-mpnet-base-v2',
      size: '420MB',
      downloaded: false,
      type: 'embed',
      dimensions: 768,
      description: 'Modèle par défaut - Excellent équilibre performance/taille - Compatible LanceDB',
      tags: ['recommandé', 'qualité', '768d', 'général'],
    },
    {
      name: 'sentence-transformers/all-MiniLM-L6-v2',
      size: '80MB',
      downloaded: false,
      type: 'embed',
      dimensions: 384,
      description: 'Modèle léger et rapide - 384 dimensions',
      tags: ['recommandé', 'léger', 'rapide', '384d', 'général'],
    },
    {
      name: 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
      size: '470MB',
      downloaded: false,
      type: 'embed',
      dimensions: 384,
      description: 'Support multilingue - Français, anglais, allemand, etc.',
      tags: ['multilingue', '384d', 'français'],
    },
    {
      name: 'sentence-transformers/paraphrase-multilingual-mpnet-base-v2',
      size: '970MB',
      downloaded: false,
      type: 'embed',
      dimensions: 768,
      description: 'Multilingue haute qualité - 50+ langues - 768 dimensions',
      tags: ['multilingue', 'qualité', '768d', 'français'],
    },
    {
      name: 'sentence-transformers/all-distilroberta-v1',
      size: '290MB',
      downloaded: false,
      type: 'embed',
      dimensions: 768,
      description: 'RoBERTa distillé - Bon compromis vitesse/qualité',
      tags: ['rapide', '768d', 'général'],
    },
    {
      name: 'sentence-transformers/multi-qa-mpnet-base-dot-v1',
      size: '420MB',
      downloaded: false,
      type: 'embed',
      dimensions: 768,
      description: 'Optimisé pour questions/réponses - Produit scalaire',
      tags: ['Q&A', '768d', 'qualité'],
    },
    {
      name: 'sentence-transformers/multi-qa-MiniLM-L6-cos-v1',
      size: '80MB',
      downloaded: false,
      type: 'embed',
      dimensions: 384,
      description: 'Q&A léger et rapide - Similarité cosinus',
      tags: ['Q&A', 'léger', 'rapide', '384d'],
    },
    {
      name: 'sentence-transformers/msmarco-distilbert-base-v4',
      size: '250MB',
      downloaded: false,
      type: 'embed',
      dimensions: 768,
      description: 'Entraîné sur MS MARCO - Excellent pour recherche sémantique',
      tags: ['search', '768d', 'recommandé'],
    },
    {
      name: 'sentence-transformers/gtr-t5-base',
      size: '440MB',
      downloaded: false,
      type: 'embed',
      dimensions: 768,
      description: 'T5-based - Très bonne performance sur benchmarks',
      tags: ['qualité', '768d', 'général'],
    },
    {
      name: 'sentence-transformers/all-roberta-large-v1',
      size: '1.34GB',
      downloaded: false,
      type: 'embed',
      dimensions: 1024,
      description: 'Modèle large - Meilleure qualité mais plus lent',
      tags: ['large', 'qualité', '1024d', 'général'],
    },
  ];

  // Liste personnalisée des modèles (peut être étendue par l'utilisateur)
  private customModels: string[] = [];

  constructor() {
    super();

    // Auto-detect conda Python with installed packages
    const condaPython = '/opt/miniconda3/bin/python3';
    try {
      execSync(`${condaPython} -c "import huggingface_hub"`, { stdio: 'ignore' });
      this.pythonPath = condaPython;
      logger.info('mlx-models', 'Using conda Python for embeddings', condaPython);
    } catch {
      this.pythonPath = 'python3';
      logger.info('mlx-models', 'Using system Python for embeddings', 'python3');
    }

    this.scriptPath = path.join(__dirname, 'backends/mlx/mlx_embedding_downloader.py');

    // Charger les modèles personnalisés depuis le fichier de config
    this.loadCustomModels();
  }

  /**
   * Charger la liste des modèles personnalisés
   */
  private loadCustomModels(): void {
    try {
      const configDir = path.join(os.homedir(), '.blackia');
      const configFile = path.join(configDir, 'embedding-models.json');

      if (fs.existsSync(configFile)) {
        const data = fs.readFileSync(configFile, 'utf-8');
        this.customModels = JSON.parse(data);
        logger.info('mlx-models', 'Loaded custom embedding models', '', {
          count: this.customModels.length,
        });
      }
    } catch (error: any) {
      logger.warning('mlx-models', 'Failed to load custom embedding models', '', {
        error: error.message,
      });
    }
  }

  /**
   * Sauvegarder la liste des modèles personnalisés
   */
  private saveCustomModels(): void {
    try {
      const configDir = path.join(os.homedir(), '.blackia');
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      const configFile = path.join(configDir, 'embedding-models.json');
      fs.writeFileSync(configFile, JSON.stringify(this.customModels, null, 2));
      logger.info('mlx-models', 'Saved custom embedding models', '', {
        count: this.customModels.length,
      });
    } catch (error: any) {
      logger.error('mlx-models', 'Failed to save custom embedding models', '', {
        error: error.message,
      });
    }
  }

  /**
   * Obtenir le cache directory de Hugging Face
   */
  private getHuggingFaceCacheDir(): string {
    return process.env.HF_HOME || path.join(os.homedir(), '.cache', 'huggingface', 'hub');
  }

  /**
   * Vérifier si un modèle est téléchargé
   */
  isModelDownloaded(repoId: string): boolean {
    try {
      const cacheDir = this.getHuggingFaceCacheDir();
      const modelDir = path.join(cacheDir, 'models--' + repoId.replace('/', '--'));

      // Vérifier si le dossier existe et contient des fichiers
      if (fs.existsSync(modelDir)) {
        const contents = fs.readdirSync(modelDir);
        // Le modèle est considéré comme téléchargé s'il y a des fichiers
        return contents.length > 0;
      }

      return false;
    } catch (error: any) {
      logger.debug('mlx-models', 'Error checking if model downloaded', repoId, {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Obtenir le chemin d'un modèle téléchargé
   */
  getModelPath(repoId: string): string | null {
    try {
      const cacheDir = this.getHuggingFaceCacheDir();
      const modelDir = path.join(cacheDir, 'models--' + repoId.replace('/', '--'));

      if (this.isModelDownloaded(repoId)) {
        return modelDir;
      }

      return null;
    } catch (error: any) {
      logger.error('mlx-models', 'Error getting model path', repoId, {
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Lister tous les modèles disponibles
   */
  async listModels(): Promise<EmbeddingModelInfo[]> {
    const allModels = [...this.defaultModels];

    // Ajouter les modèles personnalisés
    for (const repoId of this.customModels) {
      if (!allModels.find(m => m.name === repoId)) {
        allModels.push({
          name: repoId,
          size: 'N/A',
          downloaded: false,
          type: 'embed',
          description: 'Modèle personnalisé',
        });
      }
    }

    // Mettre à jour le statut de téléchargement
    for (const model of allModels) {
      model.downloaded = this.isModelDownloaded(model.name);
      if (model.downloaded) {
        model.path = this.getModelPath(model.name) || undefined;
      }
    }

    return allModels;
  }

  /**
   * Ajouter un modèle personnalisé à la liste
   */
  async addCustomModel(repoId: string): Promise<void> {
    if (!this.customModels.includes(repoId)) {
      this.customModels.push(repoId);
      this.saveCustomModels();
      logger.info('mlx-models', 'Added custom embedding model', repoId);
    }
  }

  /**
   * Supprimer un modèle personnalisé de la liste
   */
  async removeCustomModel(repoId: string): Promise<void> {
    const index = this.customModels.indexOf(repoId);
    if (index !== -1) {
      this.customModels.splice(index, 1);
      this.saveCustomModels();
      logger.info('mlx-models', 'Removed custom embedding model', repoId);
    }
  }

  /**
   * Télécharger un modèle
   */
  async downloadModel(
    repoId: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      logger.info('mlx-models', 'Starting embedding model download', repoId, {
        pythonPath: this.pythonPath,
        scriptPath: this.scriptPath,
      });

      // Vérifier que le script existe
      if (!fs.existsSync(this.scriptPath)) {
        const error = `Python script not found: ${this.scriptPath}`;
        logger.error('mlx-models', 'Script not found', repoId, { scriptPath: this.scriptPath });
        reject(new Error(error));
        return;
      }

      this.currentDownloadRepoId = repoId;

      // Écouter les événements de progression
      const progressListener = (progress: DownloadProgress) => {
        if (progress.repoId === repoId) {
          if (onProgress) {
            onProgress(progress);
          }
        }
      };
      this.on('download:progress', progressListener);

      logger.debug('mlx-models', 'Spawning Python process', repoId, {
        command: this.pythonPath,
        args: [this.scriptPath, 'download', repoId],
      });

      const pythonProcess = spawn(this.pythonPath, [this.scriptPath, 'download', repoId], {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout?.on('data', (data) => {
        const lines = data.toString().split('\n');
        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line);
              this.handleResponse(response);
              output += line + '\n';
            } catch {
              output += line + '\n';
            }
          }
        }
      });

      pythonProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
        logger.warning('mlx-models', 'Python stderr', data.toString().trim());
      });

      pythonProcess.on('close', (code) => {
        this.off('download:progress', progressListener);
        this.currentDownloadRepoId = undefined;

        logger.info('mlx-models', 'Python process closed', repoId, {
          code,
          stdout: output.substring(0, 500),
          stderr: errorOutput.substring(0, 500),
        });

        if (code === 0) {
          logger.info('mlx-models', 'Embedding model downloaded successfully', repoId);
          const modelPath = this.getModelPath(repoId);
          resolve(modelPath || repoId);
        } else {
          const errorMsg = errorOutput || 'Unknown error';
          logger.error('mlx-models', 'Embedding model download failed', repoId, {
            code,
            stderr: errorOutput,
            stdout: output,
          });
          reject(new Error(`Download failed (code ${code}): ${errorMsg}`));
        }
      });

      pythonProcess.on('error', (error) => {
        this.off('download:progress', progressListener);
        this.currentDownloadRepoId = undefined;
        logger.error('mlx-models', 'Python process error', repoId, {
          error: error.message,
          pythonPath: this.pythonPath,
          scriptPath: this.scriptPath,
        });
        reject(new Error(`Failed to start Python: ${error.message}`));
      });
    });
  }

  /**
   * Supprimer un modèle téléchargé
   */
  async deleteModel(repoId: string): Promise<void> {
    try {
      const cacheDir = this.getHuggingFaceCacheDir();
      const modelDir = path.join(cacheDir, 'models--' + repoId.replace('/', '--'));

      if (fs.existsSync(modelDir)) {
        fs.rmSync(modelDir, { recursive: true, force: true });
        logger.info('mlx-models', 'Deleted embedding model', repoId);
      } else {
        logger.warning('mlx-models', 'Model directory not found', repoId);
      }
    } catch (error: any) {
      logger.error('mlx-models', 'Failed to delete embedding model', repoId, {
        error: error.message,
      });
      throw new Error(`Failed to delete model: ${error.message}`);
    }
  }

  /**
   * Gérer les réponses du script Python
   */
  private handleResponse(response: any): void {
    if (response.type === 'progress') {
      const progressData: DownloadProgress = {
        repoId: response.repo_id || this.currentDownloadRepoId || 'unknown',
        downloaded: response.downloaded || 0,
        total: response.total || 0,
        percentage: response.percentage || 0,
      };

      logger.debug('mlx-models', 'Download progress', progressData.repoId, {
        percentage: progressData.percentage,
      });

      this.emit('download:progress', progressData);
    } else if (response.type === 'complete') {
      logger.info('mlx-models', 'Download complete', response.repo_id);
      this.emit('download:complete', { repoId: response.repo_id, path: response.path });
    } else if (response.type === 'error') {
      logger.error('mlx-models', 'Download error', response.repo_id, {
        error: response.error,
      });
      this.emit('download:error', { repoId: response.repo_id, error: response.error });
    }
  }
}

// Instance singleton
let embeddingManagerInstance: MLXEmbeddingManager | null = null;

export function getEmbeddingManager(): MLXEmbeddingManager {
  if (!embeddingManagerInstance) {
    embeddingManagerInstance = new MLXEmbeddingManager();
  }
  return embeddingManagerInstance;
}
