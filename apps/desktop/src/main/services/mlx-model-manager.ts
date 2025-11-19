/**
 * MLX Model Manager
 * Gère les modèles MLX localement
 * - Liste des modèles téléchargés
 * - Téléchargement de nouveaux modèles
 * - Suppression de modèles
 * - Métadonnées et validation
 */

import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { EventEmitter } from 'events';
import { logger } from './log-service';

export interface MLXModel {
  id: string;
  name: string;
  repoId: string;
  path: string;
  size: number;
  downloadedAt?: number;
  lastUsed?: number;
  quantization?: string;
  contextLength?: number;
  parameters?: string;
  type: 'chat' | 'completion' | 'embed';
  downloaded: boolean;
}

export interface DownloadProgress {
  repoId: string;
  downloaded: number;
  total: number;
  percentage: number;
  currentFile?: string;
}

export class MLXModelManager extends EventEmitter {
  private pythonPath: string = 'python3';
  private scriptPath: string;
  private modelsDir: string;
  private downloaderProcess: ChildProcess | null = null;
  private requestQueue: Map<
    number,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
    }
  > = new Map();
  private requestId = 0;
  private currentDownloadRepoId?: string; // Track current download for progress events

  constructor(pythonPath?: string, modelsDir?: string) {
    super();

    if (pythonPath) {
      this.pythonPath = pythonPath;
    }

    this.scriptPath = join(__dirname, 'backends/mlx/mlx_model_downloader.py');

    // Répertoire des modèles
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    this.modelsDir =
      modelsDir || join(homeDir, 'Library', 'Application Support', 'BlackIA', 'models');
  }

  /**
   * Initialise le gestionnaire
   */
  async initialize(): Promise<void> {
    logger.info('mlx', 'Initializing MLX Model Manager', '');

    // Vérifier que Python et les dépendances sont disponibles
    if (!(await this.checkDependencies())) {
      throw new Error('Python or huggingface_hub not available');
    }

    // Démarrer le processus Python du downloader
    await this.startDownloader();

    logger.info('mlx', 'MLX Model Manager initialized', '');
  }

  /**
   * Arrête le gestionnaire
   */
  async shutdown(): Promise<void> {
    logger.info('mlx', 'Shutting down MLX Model Manager', '');

    if (this.downloaderProcess) {
      this.downloaderProcess.kill('SIGTERM');
      this.downloaderProcess = null;
    }

    this.requestQueue.clear();
  }

  /**
   * Liste les modèles téléchargés localement
   */
  async listLocalModels(): Promise<MLXModel[]> {
    try {
      const response = await this.sendRequest({ command: 'list' });

      if (!response.success) {
        throw new Error(response.error || 'Failed to list models');
      }

      // Convertir les modèles en format MLXModel
      const models: MLXModel[] = response.models.map((m: any) => ({
        id: m.name,
        name: m.name.replace('--', '/'),
        repoId: m.repo_id || m.name.replace('--', '/'),
        path: m.path,
        size: m.size,
        downloaded: true,
        type: 'chat' as const, // Pour l'instant tous en chat
      }));

      return models;
    } catch (error) {
      logger.error('mlx', 'Error listing local models', '', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Télécharge un modèle depuis Hugging Face
   */
  async downloadModel(
    repoId: string,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<MLXModel> {
    logger.info('mlx', 'Downloading model', repoId);

    return new Promise((resolve, reject) => {
      const requestId = this.requestId++;

      // Écouter les événements de progression si callback fourni
      const progressListener = (progress: any) => {
        if (progress.repoId === repoId || progress.repo_id === repoId) {
          logger.debug('mlx', 'Download progress', `${progress.percentage}%`);
          if (onProgress) {
            onProgress({
              repoId,
              downloaded: progress.downloaded || 0,
              total: progress.total || 0,
              percentage: progress.percentage || 0,
              currentFile: progress.current_file,
            });
          }
        }
      };

      // S'abonner aux événements de progression
      this.on('download:progress', progressListener);

      // Fonction de nettoyage
      const cleanup = () => {
        this.off('download:progress', progressListener);
        this.requestQueue.delete(requestId);
        this.currentDownloadRepoId = undefined;
      };

      // Stocker le handler avec cleanup
      this.requestQueue.set(requestId, {
        resolve: (response) => {
          cleanup();

          // Créer l'objet MLXModel à partir de la réponse
          const model: MLXModel = {
            id: repoId.replace('/', '--'),
            name: repoId,
            repoId,
            path: response.local_path || '',
            size: response.size || 0,
            downloadedAt: Date.now(),
            downloaded: true,
            type: 'chat',
          };

          resolve(model);
        },
        reject: (error) => {
          cleanup();
          reject(error);
        },
      });

      // Enregistrer le repoId pour les événements de progression
      this.currentDownloadRepoId = repoId;

      // Envoyer la requête de téléchargement
      const request = {
        command: 'download',
        repo_id: repoId,
      };

      const requestLine = JSON.stringify(request) + '\n';
      this.downloaderProcess?.stdin?.write(requestLine);

      // Timeout de 30 minutes pour le téléchargement
      setTimeout(() => {
        if (this.requestQueue.has(requestId)) {
          cleanup();
          reject(new Error('Download timeout'));
        }
      }, 1800000);
    });
  }

  /**
   * Supprime un modèle local
   */
  async deleteModel(modelPath: string): Promise<void> {
    logger.info('mlx', 'Deleting model', modelPath);

    const response = await this.sendRequest({
      command: 'delete',
      model_path: modelPath,
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to delete model');
    }

    logger.info('mlx', 'Model deleted successfully', modelPath);
  }

  /**
   * Obtient le chemin d'un modèle par son repo ID
   */
  async getModelPath(repoId: string): Promise<string | null> {
    const models = await this.listLocalModels();
    const model = models.find((m) => m.repoId === repoId);
    return model?.path || null;
  }

  /**
   * Vérifie si un modèle est téléchargé
   */
  async isModelDownloaded(repoId: string): Promise<boolean> {
    const models = await this.listLocalModels();
    return models.some((m) => m.repoId === repoId);
  }

  /**
   * Vérifie les dépendances Python
   */
  private async checkDependencies(): Promise<boolean> {
    try {
      const { execSync } = require('child_process');

      // Vérifier Python
      execSync(`${this.pythonPath} --version`, { stdio: 'ignore' });

      // Vérifier huggingface_hub
      execSync(`${this.pythonPath} -c "import huggingface_hub"`, { stdio: 'ignore' });

      return true;
    } catch {
      logger.warning(
        'mlx',
        'Dependencies not available',
        'Install with: pip3 install huggingface_hub'
      );
      return false;
    }
  }

  /**
   * Démarre le processus Python du downloader
   */
  private async startDownloader(): Promise<void> {
    if (this.downloaderProcess) {
      return;
    }

    logger.info('mlx', 'Starting downloader process', '');

    this.downloaderProcess = spawn(this.pythonPath, [this.scriptPath, this.modelsDir], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    // Gérer les erreurs du processus
    this.downloaderProcess.on('error', (error) => {
      logger.error('mlx', 'Downloader process error', '', { error: error.message });
    });

    this.downloaderProcess.on('exit', (code, signal) => {
      logger.warning('mlx', 'Downloader process exited', '', { code, signal });
      this.downloaderProcess = null;
    });

    // Gérer stderr pour les logs
    this.downloaderProcess.stderr?.on('data', (data) => {
      const message = data.toString().trim();
      logger.debug('mlx', 'Downloader stderr', message);
    });

    // Gérer stdout pour les réponses
    let buffer = '';
    this.downloaderProcess.stdout?.on('data', (data) => {
      buffer += data.toString();

      // Traiter les lignes complètes
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim()) {
          this.handleResponse(line.trim());
        }
      }
    });

    // Ping pour vérifier que le downloader est prêt
    await this.sendRequest({ command: 'ping' });

    logger.info('mlx', 'Downloader process ready', '');
  }

  /**
   * Envoie une requête au downloader Python
   */
  private async sendRequest(request: any): Promise<any> {
    if (!this.downloaderProcess) {
      throw new Error('Downloader process not started');
    }

    return new Promise((resolve, reject) => {
      const id = this.requestId++;
      const timeout = setTimeout(() => {
        this.requestQueue.delete(id);
        reject(new Error('Request timeout'));
      }, 30000);

      this.requestQueue.set(id, {
        resolve: (response) => {
          clearTimeout(timeout);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });

      const requestLine = JSON.stringify(request) + '\n';
      this.downloaderProcess!.stdin?.write(requestLine);
    });
  }

  /**
   * Gère les réponses du downloader Python
   */
  private handleResponse(line: string): void {
    try {
      const response = JSON.parse(line);

      logger.debug('mlx', 'Downloader response', JSON.stringify(response).substring(0, 200));

      // Si c'est une progression, émettre un événement avec repoId
      if (response.type === 'progress' || response.type === 'start') {
        // Ajouter le repoId si on peut le retrouver depuis repo_id
        const progressData = {
          ...response,
          repoId: response.repo_id || this.currentDownloadRepoId,
        };
        logger.debug('mlx', 'Emitting download:progress event', `${progressData.percentage || 0}%`);
        this.emit('download:progress', progressData);
        return;
      }

      // Si c'est une complétion ou erreur, nettoyer currentDownloadRepoId
      if (response.type === 'complete' || response.type === 'error') {
        logger.info('mlx', `Download ${response.type}`, response.repo_id || '');
        this.currentDownloadRepoId = undefined;
      }

      // Sinon, résoudre la première requête en attente
      const entries = Array.from(this.requestQueue.entries());
      if (entries.length > 0) {
        const [id, callback] = entries[0];
        this.requestQueue.delete(id);

        if (response.success !== false) {
          callback.resolve(response);
        } else {
          callback.reject(new Error(response.error || 'Request failed'));
        }
      }
    } catch (error) {
      logger.error('mlx', 'Error parsing downloader response', line.substring(0, 100), {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

// Instance singleton
let modelManagerInstance: MLXModelManager | null = null;

export function getMLXModelManager(): MLXModelManager {
  if (!modelManagerInstance) {
    modelManagerInstance = new MLXModelManager();
  }
  return modelManagerInstance;
}
