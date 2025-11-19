import { useState, useEffect } from 'react';
import {
  Store,
  Download,
  CheckCircle,
  Search,
  Filter,
  TrendingUp,
  Heart,
  Calendar,
  Cpu,
  Zap,
  AlertCircle,
  Loader2,
  Star,
} from 'lucide-react';

interface HFModel {
  id: string;
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

interface DownloadProgress {
  repoId: string;
  downloaded: number;
  total: number;
  percentage: number;
  currentFile?: string;
}

type TabType = 'recommended' | 'all' | 'search';
type SortType = 'downloads' | 'likes' | 'recent';

export function MLXModelStore() {
  const [activeTab, setActiveTab] = useState<TabType>('recommended');
  const [models, setModels] = useState<HFModel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortType>('downloads');
  const [downloadingModels, setDownloadingModels] = useState<Record<string, DownloadProgress>>({});
  const [downloadedModels, setDownloadedModels] = useState<Set<string>>(new Set());

  // Charger les modèles au montage et au changement d'onglet
  useEffect(() => {
    loadModels();
  }, [activeTab, sortBy]);

  // Écouter les événements de progression
  useEffect(() => {
    window.electronAPI.mlx.models.onDownloadProgress((progress) => {
      setDownloadingModels((prev) => ({
        ...prev,
        [progress.repoId]: progress,
      }));
    });

    return () => {
      window.electronAPI.mlx.models.removeDownloadProgressListener();
    };
  }, []);

  // Charger les modèles téléchargés
  useEffect(() => {
    loadDownloadedModels();
  }, []);

  const loadDownloadedModels = async () => {
    try {
      const result = await window.electronAPI.mlx.models.listLocal();
      if (result.success && result.models) {
        const downloadedSet = new Set(result.models.map((m: any) => m.repoId));
        setDownloadedModels(downloadedSet);
      }
    } catch (error) {
      console.error('Error loading downloaded models:', error);
    }
  };

  const loadModels = async () => {
    setIsLoading(true);
    try {
      let result;

      if (activeTab === 'recommended') {
        result = await window.electronAPI.mlx.store.getRecommended();
      } else if (activeTab === 'search' && searchQuery) {
        result = await window.electronAPI.mlx.store.search(searchQuery, 50);
      } else {
        result = await window.electronAPI.mlx.store.listAvailable({
          sort: sortBy,
          limit: 50,
        });
      }

      if (result.success && result.models) {
        setModels(result.models);
      }
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setActiveTab('search');
    loadModels();
  };

  const handleDownload = async (repoId: string) => {
    try {
      // Marquer comme en téléchargement
      setDownloadingModels((prev) => ({
        ...prev,
        [repoId]: {
          repoId,
          downloaded: 0,
          total: 100,
          percentage: 0,
        },
      }));

      const result = await window.electronAPI.mlx.models.download(repoId);

      if (result.success) {
        // Retirer de la liste de téléchargement
        setDownloadingModels((prev) => {
          const newState = { ...prev };
          delete newState[repoId];
          return newState;
        });

        // Ajouter aux modèles téléchargés
        setDownloadedModels((prev) => new Set(prev).add(repoId));

        // Rafraîchir la liste
        await loadDownloadedModels();
      }
    } catch (error) {
      console.error('Error downloading model:', error);
      // Retirer de la liste de téléchargement en cas d'erreur
      setDownloadingModels((prev) => {
        const newState = { ...prev };
        delete newState[repoId];
        return newState;
      });
    }
  };

  const formatSize = (size: string | undefined): string => {
    if (!size) return 'N/A';
    return size;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const isDownloading = (repoId: string): boolean => {
    return repoId in downloadingModels;
  };

  const isDownloaded = (repoId: string): boolean => {
    return downloadedModels.has(repoId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg glass-lg flex items-center justify-center">
            <Store className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Store de Modèles MLX</h3>
            <p className="text-sm text-muted-foreground">
              Découvrez et téléchargez des modèles depuis Hugging Face
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un modèle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim()}
            className="px-6 py-3 rounded-xl glass-lg hover:glass transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-xl p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('recommended')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'recommended'
                ? 'glass-lg text-purple-400'
                : 'hover:glass-card text-muted-foreground'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Star className="w-4 h-4" />
              <span>Recommandés</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'all'
                ? 'glass-lg text-purple-400'
                : 'hover:glass-card text-muted-foreground'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Store className="w-4 h-4" />
              <span>Tous les modèles</span>
            </div>
          </button>
          {searchQuery && (
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'search'
                  ? 'glass-lg text-purple-400'
                  : 'hover:glass-card text-muted-foreground'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Search className="w-4 h-4" />
                <span>Résultats ({models.length})</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Sort Options (only for 'all' tab) */}
      {activeTab === 'all' && (
        <div className="flex gap-2">
          <button
            onClick={() => setSortBy('downloads')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              sortBy === 'downloads' ? 'glass-lg text-purple-400' : 'glass-card hover:glass-lg'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Plus téléchargés</span>
          </button>
          <button
            onClick={() => setSortBy('likes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              sortBy === 'likes' ? 'glass-lg text-purple-400' : 'glass-card hover:glass-lg'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span className="text-sm">Plus aimés</span>
          </button>
          <button
            onClick={() => setSortBy('recent')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              sortBy === 'recent' ? 'glass-lg text-purple-400' : 'glass-card hover:glass-lg'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-sm">Plus récents</span>
          </button>
        </div>
      )}

      {/* Models Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            <span className="ml-3 text-muted-foreground">Chargement des modèles...</span>
          </div>
        ) : models.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <Store className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Aucun modèle trouvé</p>
            <p className="text-sm text-muted-foreground mt-2">
              Essayez une autre recherche ou consultez les modèles recommandés
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {models.map((model) => {
              const downloading = isDownloading(model.id);
              const downloaded = isDownloaded(model.id);
              const progress = downloadingModels[model.id];

              return (
                <div key={model.id} className="glass-card rounded-xl p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold truncate">{model.modelName || 'Unknown Model'}</h4>
                      <p className="text-sm text-muted-foreground truncate">{model.author || 'Unknown'}</p>
                    </div>
                    {downloaded && (
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    )}
                  </div>

                  {/* Description */}
                  {model.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {model.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Download className="w-3 h-3" />
                      <span>{formatNumber(model.downloads || 0)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      <span>{formatNumber(model.likes || 0)}</span>
                    </div>
                    {model.size && (
                      <div className="flex items-center gap-1">
                        <Cpu className="w-3 h-3" />
                        <span>{formatSize(model.size)}</span>
                      </div>
                    )}
                    {model.contextLength && (
                      <div className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        <span>{model.contextLength.toLocaleString()} ctx</span>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {model.quantization && (
                      <span className="px-2 py-1 text-xs glass-lg rounded">
                        {model.quantization}
                      </span>
                    )}
                    {model.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-1 text-xs glass-card rounded">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Download Button */}
                  {downloading ? (
                    <div className="space-y-2">
                      <div className="w-full h-2 glass-card rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all duration-300"
                          style={{ width: `${progress?.percentage || 0}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Téléchargement...</span>
                        <span>{progress?.percentage?.toFixed(1)}%</span>
                      </div>
                      {progress?.currentFile && (
                        <p className="text-xs text-muted-foreground truncate">
                          {progress.currentFile}
                        </p>
                      )}
                    </div>
                  ) : downloaded ? (
                    <button
                      disabled
                      className="w-full px-4 py-3 rounded-xl glass-lg text-green-400 flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <CheckCircle className="w-5 h-5" />
                      <span>Téléchargé</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDownload(model.id)}
                      className="w-full px-4 py-3 rounded-xl glass-lg hover:glass transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      <span>Télécharger</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
