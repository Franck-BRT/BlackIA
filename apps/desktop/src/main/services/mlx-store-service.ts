/**
 * MLX Store Service
 * Service pour découvrir et rechercher des modèles MLX sur Hugging Face
 * Permet de parcourir la communauté MLX et les modèles compatibles
 */

import axios from 'axios';
import { logger } from './log-service';

export interface HuggingFaceModel {
  id: string; // repo ID (e.g., "mlx-community/Llama-3.2-3B-Instruct-4bit")
  author: string;
  modelName: string;
  downloads: number;
  likes: number;
  tags: string[];
  lastModified: string;
  description?: string;
  quantization?: string;
  baseModel?: string;
  size?: string;
  contextLength?: number;
  type: 'chat' | 'completion' | 'embed' | 'unknown';
}

export interface StoreFilters {
  search?: string;
  author?: string;
  tags?: string[];
  sort?: 'downloads' | 'likes' | 'recent';
  limit?: number;
}

export class MLXStoreService {
  private readonly HF_API_BASE = 'https://huggingface.co/api';
  private readonly CACHE_DURATION = 3600000; // 1 heure
  private modelsCache: {
    data: HuggingFaceModel[];
    timestamp: number;
  } | null = null;

  /**
   * Liste les modèles MLX disponibles sur Hugging Face
   */
  async listAvailableModels(filters?: StoreFilters): Promise<HuggingFaceModel[]> {
    try {
      // Vérifier le cache
      if (this.modelsCache && Date.now() - this.modelsCache.timestamp < this.CACHE_DURATION) {
        logger.debug('mlx-store', 'Using cached models', '');
        return this.filterAndSortModels(this.modelsCache.data, filters);
      }

      logger.info('mlx-store', 'Fetching models from Hugging Face', '');

      // Rechercher les modèles avec le tag 'mlx'
      const response = await axios.get(`${this.HF_API_BASE}/models`, {
        params: {
          filter: 'mlx',
          sort: 'downloads',
          direction: -1,
          limit: 100,
        },
        timeout: 10000,
      });

      const models: HuggingFaceModel[] = response.data.map((m: any) =>
        this.parseHFModel(m)
      );

      // Mettre en cache
      this.modelsCache = {
        data: models,
        timestamp: Date.now(),
      };

      logger.info('mlx-store', 'Fetched models successfully', `Count: ${models.length}`);

      return this.filterAndSortModels(models, filters);
    } catch (error) {
      logger.error('mlx-store', 'Error fetching models', '', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Retourner les modèles en cache si disponibles, sinon liste par défaut
      if (this.modelsCache) {
        return this.filterAndSortModels(this.modelsCache.data, filters);
      }

      return this.getDefaultModels();
    }
  }

  /**
   * Recherche des modèles MLX par nom ou description
   */
  async searchModels(query: string, limit: number = 20): Promise<HuggingFaceModel[]> {
    try {
      logger.info('mlx-store', 'Searching models', query);

      const response = await axios.get(`${this.HF_API_BASE}/models`, {
        params: {
          search: query,
          filter: 'mlx',
          sort: 'downloads',
          direction: -1,
          limit,
        },
        timeout: 10000,
      });

      const models: HuggingFaceModel[] = response.data.map((m: any) =>
        this.parseHFModel(m)
      );

      logger.info('mlx-store', 'Search completed', `Results: ${models.length}`);

      return models;
    } catch (error) {
      logger.error('mlx-store', 'Error searching models', '', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Obtient les détails d'un modèle spécifique
   */
  async getModelInfo(repoId: string): Promise<HuggingFaceModel | null> {
    try {
      logger.info('mlx-store', 'Fetching model info', repoId);

      const response = await axios.get(`${this.HF_API_BASE}/models/${repoId}`, {
        timeout: 10000,
      });

      const model = this.parseHFModel(response.data);

      // Essayer de récupérer le README pour plus d'infos
      try {
        const readmeResponse = await axios.get(
          `https://huggingface.co/${repoId}/raw/main/README.md`,
          {
            timeout: 5000,
          }
        );

        // Extraire des infos du README si disponibles
        const readme = readmeResponse.data;
        model.description = this.extractDescription(readme);
      } catch {
        // Ignorer si README non disponible
      }

      return model;
    } catch (error) {
      logger.error('mlx-store', 'Error fetching model info', repoId, {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Liste les modèles recommandés pour BlackIA
   */
  getRecommendedModels(): HuggingFaceModel[] {
    return [
      {
        id: 'mlx-community/Llama-3.2-3B-Instruct-4bit',
        author: 'mlx-community',
        modelName: 'Llama-3.2-3B-Instruct-4bit',
        downloads: 50000,
        likes: 100,
        tags: ['mlx', 'llama', 'quantized', '4bit', 'instruct'],
        lastModified: '2024-11-01',
        description: 'Llama 3.2 3B Instruct optimisé pour Apple Silicon (4-bit)',
        quantization: '4-bit',
        baseModel: 'meta-llama/Llama-3.2-3B-Instruct',
        size: '2GB',
        contextLength: 8192,
        type: 'chat',
      },
      {
        id: 'mlx-community/Mistral-7B-Instruct-v0.3-4bit',
        author: 'mlx-community',
        modelName: 'Mistral-7B-Instruct-v0.3-4bit',
        downloads: 75000,
        likes: 150,
        tags: ['mlx', 'mistral', 'quantized', '4bit', 'instruct'],
        lastModified: '2024-10-15',
        description: 'Mistral 7B Instruct v0.3 optimisé pour Apple Silicon (4-bit)',
        quantization: '4-bit',
        baseModel: 'mistralai/Mistral-7B-Instruct-v0.3',
        size: '4GB',
        contextLength: 32768,
        type: 'chat',
      },
      {
        id: 'mlx-community/Qwen2.5-7B-Instruct-4bit',
        author: 'mlx-community',
        modelName: 'Qwen2.5-7B-Instruct-4bit',
        downloads: 60000,
        likes: 120,
        tags: ['mlx', 'qwen', 'quantized', '4bit', 'instruct', 'multilingual'],
        lastModified: '2024-11-10',
        description: 'Qwen 2.5 7B Instruct optimisé pour Apple Silicon (4-bit)',
        quantization: '4-bit',
        baseModel: 'Qwen/Qwen2.5-7B-Instruct',
        size: '4GB',
        contextLength: 32768,
        type: 'chat',
      },
      {
        id: 'mlx-community/Phi-3.5-mini-instruct-4bit',
        author: 'mlx-community',
        modelName: 'Phi-3.5-mini-instruct-4bit',
        downloads: 40000,
        likes: 80,
        tags: ['mlx', 'phi', 'quantized', '4bit', 'instruct', 'small'],
        lastModified: '2024-10-20',
        description: 'Phi-3.5 Mini Instruct optimisé pour Apple Silicon (4-bit)',
        quantization: '4-bit',
        baseModel: 'microsoft/Phi-3.5-mini-instruct',
        size: '2.5GB',
        contextLength: 4096,
        type: 'chat',
      },
      {
        id: 'mlx-community/Meta-Llama-3.1-8B-Instruct-4bit',
        author: 'mlx-community',
        modelName: 'Meta-Llama-3.1-8B-Instruct-4bit',
        downloads: 90000,
        likes: 200,
        tags: ['mlx', 'llama', 'quantized', '4bit', 'instruct'],
        lastModified: '2024-11-05',
        description: 'Llama 3.1 8B Instruct optimisé pour Apple Silicon (4-bit)',
        quantization: '4-bit',
        baseModel: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
        size: '5GB',
        contextLength: 131072,
        type: 'chat',
      },
    ];
  }

  /**
   * Parse un modèle depuis l'API Hugging Face
   */
  private parseHFModel(data: any): HuggingFaceModel {
    const repoId = data.id || data.modelId;
    const [author, ...nameParts] = repoId.split('/');
    const modelName = nameParts.join('/');

    // Déterminer la quantization depuis les tags ou le nom
    let quantization: string | undefined;
    if (data.tags?.includes('4bit') || modelName.includes('4bit')) {
      quantization = '4-bit';
    } else if (data.tags?.includes('8bit') || modelName.includes('8bit')) {
      quantization = '8-bit';
    }

    // Déterminer le type de modèle
    let type: HuggingFaceModel['type'] = 'unknown';
    if (
      data.tags?.includes('text-generation') ||
      modelName.toLowerCase().includes('instruct') ||
      modelName.toLowerCase().includes('chat')
    ) {
      type = 'chat';
    } else if (data.tags?.includes('feature-extraction')) {
      type = 'embed';
    }

    // Estimer la taille (approximatif)
    let size: string | undefined;
    if (quantization === '4-bit') {
      if (modelName.includes('3B')) size = '2GB';
      else if (modelName.includes('7B')) size = '4GB';
      else if (modelName.includes('8B')) size = '5GB';
      else if (modelName.includes('13B')) size = '8GB';
    }

    return {
      id: repoId,
      author,
      modelName,
      downloads: data.downloads || 0,
      likes: data.likes || 0,
      tags: data.tags || [],
      lastModified: data.lastModified || data.updated_at || '',
      description: data.description,
      quantization,
      baseModel: data.cardData?.base_model,
      size,
      type,
    };
  }

  /**
   * Filtre et trie les modèles selon les critères
   */
  private filterAndSortModels(
    models: HuggingFaceModel[],
    filters?: StoreFilters
  ): HuggingFaceModel[] {
    let filtered = [...models];

    // Filtrer par auteur
    if (filters?.author) {
      filtered = filtered.filter((m) => m.author === filters.author);
    }

    // Filtrer par tags
    if (filters?.tags && filters.tags.length > 0) {
      filtered = filtered.filter((m) =>
        filters.tags!.some((tag) => m.tags.includes(tag))
      );
    }

    // Filtrer par recherche
    if (filters?.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.modelName.toLowerCase().includes(query) ||
          m.description?.toLowerCase().includes(query) ||
          m.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Trier
    const sort = filters?.sort || 'downloads';
    filtered.sort((a, b) => {
      if (sort === 'downloads') {
        return b.downloads - a.downloads;
      } else if (sort === 'likes') {
        return b.likes - a.likes;
      } else if (sort === 'recent') {
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      }
      return 0;
    });

    // Limiter les résultats
    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  /**
   * Extrait la description depuis le README
   */
  private extractDescription(readme: string): string {
    // Extraire la première ligne non-vide après le titre
    const lines = readme.split('\n');
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#') && !line.startsWith('---')) {
        return line.substring(0, 200);
      }
    }
    return '';
  }

  /**
   * Retourne une liste de modèles par défaut si l'API échoue
   */
  private getDefaultModels(): HuggingFaceModel[] {
    return this.getRecommendedModels();
  }

  /**
   * Invalide le cache
   */
  clearCache(): void {
    this.modelsCache = null;
    logger.info('mlx-store', 'Cache cleared', '');
  }
}

// Instance singleton
let storeServiceInstance: MLXStoreService | null = null;

export function getMLXStoreService(): MLXStoreService {
  if (!storeServiceInstance) {
    storeServiceInstance = new MLXStoreService();
  }
  return storeServiceInstance;
}
