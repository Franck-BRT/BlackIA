import { useState, useEffect } from 'react';
import {
  HardDrive,
  Trash2,
  Star,
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Calendar,
  Cpu,
  Database,
  AlertCircle,
} from 'lucide-react';

interface LocalModel {
  id: string;
  repoId: string;
  name: string;
  path: string;
  size: number;
  type: 'chat' | 'completion' | 'embed';
  quantization?: string;
  contextLength?: number;
  parameters?: string;
  downloaded: boolean;
  downloadedAt?: number;
  lastUsedAt?: number;
  usageCount?: number;
}

export function MLXModelManager() {
  const [models, setModels] = useState<LocalModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingModel, setDeletingModel] = useState<string | null>(null);
  const [testingModel, setTestingModel] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Charger les modèles locaux
  useEffect(() => {
    loadLocalModels();
  }, []);

  const loadLocalModels = async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.mlx.models.listLocal();
      if (result.success && result.models) {
        setModels(result.models);
      }
    } catch (error) {
      console.error('Error loading local models:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (modelPath: string, modelId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?')) {
      return;
    }

    setDeletingModel(modelId);
    try {
      const result = await window.electronAPI.mlx.models.delete(modelPath);
      if (result.success) {
        // Retirer le modèle de la liste
        setModels((prev) => prev.filter((m) => m.id !== modelId));
      }
    } catch (error) {
      console.error('Error deleting model:', error);
      alert('Erreur lors de la suppression du modèle');
    } finally {
      setDeletingModel(null);
    }
  };

  const handleTest = async (modelPath: string, modelId: string) => {
    setTestingModel(modelId);
    setTestResult(null);

    try {
      // Initialiser le backend LLM si pas déjà fait
      await window.electronAPI.mlx.llm.initialize();

      // Charger le modèle
      await window.electronAPI.mlx.llm.loadModel(modelPath);

      // Tester avec une génération simple
      const result = await window.electronAPI.mlx.llm.generate({
        prompt: 'Hello',
        options: {
          max_tokens: 10,
          temperature: 0.7,
        },
      });

      if (result.success) {
        setTestResult({
          success: true,
          message: 'Modèle testé avec succès !',
        });
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Échec du test',
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Erreur lors du test',
      });
    } finally {
      setTestingModel(null);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number | undefined): string => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getTotalSize = (): string => {
    const total = models.reduce((acc, model) => acc + model.size, 0);
    return formatBytes(total);
  };

  const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      chat: 'Chat',
      completion: 'Complétion',
      embed: 'Embeddings',
    };
    return labels[type] || type;
  };

  const getTypeBadgeColor = (type: string): string => {
    const colors: Record<string, string> = {
      chat: 'text-green-400',
      completion: 'text-blue-400',
      embed: 'text-purple-400',
    };
    return colors[type] || 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg glass-lg flex items-center justify-center">
            <HardDrive className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-semibold">Modèles Téléchargés</h3>
            <p className="text-sm text-muted-foreground">
              Gérez vos modèles MLX locaux
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-lg rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Database className="w-4 h-4" />
              <span>Modèles</span>
            </div>
            <p className="text-2xl font-bold">{models.length}</p>
          </div>
          <div className="glass-lg rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <HardDrive className="w-4 h-4" />
              <span>Espace utilisé</span>
            </div>
            <p className="text-2xl font-bold">{getTotalSize()}</p>
          </div>
          <div className="glass-lg rounded-lg p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Cpu className="w-4 h-4" />
              <span>Types</span>
            </div>
            <p className="text-2xl font-bold">
              {new Set(models.map((m) => m.type)).size}
            </p>
          </div>
        </div>
      </div>

      {/* Test Result */}
      {testResult && (
        <div
          className={`glass-card rounded-xl p-4 flex items-start gap-3 ${
            testResult.success
              ? 'border border-green-500/30'
              : 'border border-red-500/30'
          }`}
        >
          {testResult.success ? (
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-medium">{testResult.success ? 'Test réussi' : 'Échec du test'}</p>
            <p className="text-sm text-muted-foreground mt-1">{testResult.message}</p>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Models List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <span className="ml-3 text-muted-foreground">Chargement des modèles...</span>
          </div>
        ) : models.length === 0 ? (
          <div className="glass-card rounded-xl p-12 text-center">
            <HardDrive className="w-16 h-16 mx-auto text-muted-foreground opacity-50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground">Aucun modèle téléchargé</p>
            <p className="text-sm text-muted-foreground mt-2">
              Rendez-vous dans l'onglet "Store" pour télécharger des modèles
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {models.map((model) => (
              <div key={model.id} className="glass-card rounded-xl p-6">
                <div className="flex items-start justify-between gap-4">
                  {/* Model Info */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div>
                      <h4 className="font-semibold truncate">{model.name}</h4>
                      <p className="text-sm text-muted-foreground truncate">{model.repoId}</p>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" />
                        <span>{formatBytes(model.size)}</span>
                      </div>
                      {model.quantization && (
                        <div className="flex items-center gap-1">
                          <Cpu className="w-3 h-3" />
                          <span>{model.quantization}</span>
                        </div>
                      )}
                      {model.contextLength && (
                        <div className="flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          <span>{model.contextLength.toLocaleString()} ctx</span>
                        </div>
                      )}
                      {model.parameters && (
                        <div className="flex items-center gap-1">
                          <Cpu className="w-3 h-3" />
                          <span>{model.parameters}</span>
                        </div>
                      )}
                      {model.downloadedAt && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{formatDate(model.downloadedAt)}</span>
                        </div>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      <span className={`px-2 py-1 text-xs glass-lg rounded ${getTypeBadgeColor(model.type)}`}>
                        {getTypeLabel(model.type)}
                      </span>
                      {model.usageCount !== undefined && model.usageCount > 0 && (
                        <span className="px-2 py-1 text-xs glass-card rounded">
                          {model.usageCount} utilisations
                        </span>
                      )}
                      {model.lastUsedAt && (
                        <span className="px-2 py-1 text-xs glass-card rounded">
                          Dernier: {formatDate(model.lastUsedAt)}
                        </span>
                      )}
                    </div>

                    {/* Path */}
                    <div className="text-xs text-muted-foreground truncate">
                      <span className="opacity-50">Chemin:</span> {model.path}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleTest(model.path, model.id)}
                      disabled={testingModel === model.id}
                      className="px-4 py-2 rounded-lg glass-lg hover:glass transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {testingModel === model.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">Test...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4" />
                          <span className="text-sm">Tester</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(model.path, model.id)}
                      disabled={deletingModel === model.id}
                      className="px-4 py-2 rounded-lg glass-card hover:bg-red-500/20 transition-all flex items-center gap-2 text-red-400 disabled:opacity-50"
                    >
                      {deletingModel === model.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="text-sm">...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          <span className="text-sm">Suppr.</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help */}
      {models.length > 0 && (
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div className="flex-1 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Conseils d'utilisation</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Testez un modèle avant de l'utiliser dans le chat</li>
                <li>Les modèles 4-bit sont optimisés pour les performances</li>
                <li>Supprimez les modèles non utilisés pour libérer de l'espace</li>
                <li>Un modèle 3-7B nécessite ~4-8GB de RAM</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
