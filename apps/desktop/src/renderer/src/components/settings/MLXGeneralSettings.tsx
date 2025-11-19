import { useState, useEffect } from 'react';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Zap,
  AlertTriangle,
  Check,
  Download,
  Trash2,
  Plus,
  X,
} from 'lucide-react';

interface MLXModel {
  name: string;
  size: string;
  downloaded: boolean;
  type: 'embed';
  description?: string;
  dimensions?: number;
  path?: string;
}

interface MLXConfig {
  model: string;
  pythonPath: string;
  enabled: boolean;
}

interface MLXStatus {
  type: 'mlx';
  available: boolean;
  initialized: boolean;
  capabilities: string[];
  models: MLXModel[];
  version?: string;
  error?: string;
  config?: MLXConfig;
}

interface DownloadProgress {
  repoId: string;
  downloaded: number;
  total: number;
  percentage: number;
}

export function MLXGeneralSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<MLXStatus | null>(null);
  const [config, setConfig] = useState<MLXConfig | null>(null);
  const [models, setModels] = useState<MLXModel[]>([]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);
  const [downloadingModels, setDownloadingModels] = useState<Record<string, number>>({});
  const [showAddModel, setShowAddModel] = useState(false);
  const [newModelRepoId, setNewModelRepoId] = useState('');

  // Charger le statut et la config au montage
  useEffect(() => {
    loadMLXStatus();

    // S'abonner aux événements de progression de téléchargement
    window.electronAPI.mlx.embeddings.onDownloadProgress((progress: DownloadProgress) => {
      setDownloadingModels((prev) => ({
        ...prev,
        [progress.repoId]: progress.percentage,
      }));
    });

    return () => {
      window.electronAPI.mlx.embeddings.removeDownloadProgressListener();
    };
  }, []);

  const loadMLXStatus = async () => {
    try {
      setIsLoading(true);

      // Vérifier si l'API MLX est disponible
      if (!window.electronAPI?.mlx) {
        console.error('MLX API not available');
        setStatus({
          type: 'mlx',
          available: false,
          initialized: false,
          capabilities: [],
          models: [],
          error: 'MLX API non disponible. Redémarrez l\'application.'
        });
        return;
      }

      // Charger le statut
      const mlxStatus = await window.electronAPI.mlx.getStatus();
      setStatus(mlxStatus);

      // Charger la config
      const mlxConfig = await window.electronAPI.mlx.getConfig();
      setConfig(mlxConfig);

      // Charger la liste des modèles d'embeddings avec la nouvelle API
      const mlxModels = await window.electronAPI.mlx.embeddings.list();
      setModels(mlxModels);

    } catch (error: any) {
      console.error('Erreur lors du chargement du statut MLX:', error);
      setStatus({
        type: 'mlx',
        available: false,
        initialized: false,
        capabilities: [],
        models: [],
        error: error.message || 'Erreur lors du chargement'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testMLXConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);

    try {
      const result = await window.electronAPI.mlx.test();
      setTestResult(result);

      // Recharger le statut après le test
      if (result.success) {
        await loadMLXStatus();
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Erreur lors du test'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const updateMLXModel = async (newModel: string) => {
    try {
      await window.electronAPI.mlx.updateConfig({ model: newModel });

      // Recharger la config
      const mlxConfig = await window.electronAPI.mlx.getConfig();
      setConfig(mlxConfig);

      // Afficher un message de succès
      setTestResult({
        success: true,
        message: `Modèle d'embedding changé vers ${newModel}`
      });

      // Effacer le message après 3 secondes
      setTimeout(() => setTestResult(null), 3000);
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Erreur lors du changement de modèle'
      });
    }
  };

  const restartMLX = async () => {
    try {
      setIsTestingConnection(true);
      await window.electronAPI.mlx.restart();

      setTestResult({
        success: true,
        message: 'MLX redémarré avec succès'
      });

      // Recharger le statut
      await loadMLXStatus();
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Erreur lors du redémarrage'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const downloadModel = async (repoId: string) => {
    try {
      setDownloadingModels((prev) => ({ ...prev, [repoId]: 0 }));

      const result = await window.electronAPI.mlx.embeddings.download(repoId);

      if (result.success) {
        setTestResult({
          success: true,
          message: `Modèle ${repoId} téléchargé avec succès`
        });
        setTimeout(() => setTestResult(null), 3000);

        // Recharger la liste des modèles
        await loadMLXStatus();
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Erreur lors du téléchargement'
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Erreur lors du téléchargement'
      });
    } finally {
      setDownloadingModels((prev) => {
        const updated = { ...prev };
        delete updated[repoId];
        return updated;
      });
    }
  };

  const deleteModel = async (repoId: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le modèle ${repoId} ?`)) {
      return;
    }

    try {
      const result = await window.electronAPI.mlx.embeddings.delete(repoId);

      if (result.success) {
        setTestResult({
          success: true,
          message: `Modèle ${repoId} supprimé avec succès`
        });
        setTimeout(() => setTestResult(null), 3000);

        // Recharger la liste des modèles
        await loadMLXStatus();
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Erreur lors de la suppression'
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Erreur lors de la suppression'
      });
    }
  };

  const addCustomModel = async () => {
    if (!newModelRepoId.trim()) {
      return;
    }

    try {
      const result = await window.electronAPI.mlx.embeddings.addCustom(newModelRepoId.trim());

      if (result.success) {
        setTestResult({
          success: true,
          message: `Modèle ${newModelRepoId} ajouté à la liste`
        });
        setTimeout(() => setTestResult(null), 3000);

        // Recharger la liste des modèles
        await loadMLXStatus();

        // Réinitialiser le formulaire
        setNewModelRepoId('');
        setShowAddModel(false);
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Erreur lors de l\'ajout'
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Erreur lors de l\'ajout'
      });
    }
  };

  const removeCustomModel = async (repoId: string) => {
    try {
      const result = await window.electronAPI.mlx.embeddings.removeCustom(repoId);

      if (result.success) {
        setTestResult({
          success: true,
          message: `Modèle ${repoId} retiré de la liste`
        });
        setTimeout(() => setTestResult(null), 3000);

        // Recharger la liste des modèles
        await loadMLXStatus();
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Erreur lors du retrait'
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || 'Erreur lors du retrait'
      });
    }
  };

  const isDefaultModel = (repoId: string): boolean => {
    const defaultModels = [
      'sentence-transformers/all-mpnet-base-v2',
      'sentence-transformers/all-MiniLM-L6-v2',
      'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
    ];
    return defaultModels.includes(repoId);
  };

  return (
    <div className="space-y-6">
      {/* MLX Status */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Statut MLX</h3>
          <p className="text-sm text-muted-foreground">
            Framework d'embeddings pour le système RAG
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-orange-400" />
            <span className="ml-3 text-sm text-muted-foreground">Chargement...</span>
          </div>
        ) : (
          <>
            {/* Status Indicator */}
            <div className={`p-4 rounded-lg flex items-start gap-3 ${
              status?.available
                ? 'glass-lg border border-green-500/30'
                : 'glass-card border border-red-500/30'
            }`}>
              {status?.available ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-400">MLX disponible et opérationnel</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {status.version || 'sentence-transformers installé'}
                    </p>
                    {config && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Python: {config.pythonPath}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-400 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-400">MLX non disponible</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {status?.error || 'Assurez-vous que Python et sentence-transformers sont installés'}
                    </p>
                    <div className="mt-3 p-3 glass-card rounded-lg">
                      <p className="text-xs text-orange-400 font-medium mb-2">Installation requise :</p>
                      <code className="text-xs text-blue-300 block bg-black/30 p-2 rounded font-mono">
                        pip3 install sentence-transformers torch
                      </code>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Test Connection Button */}
            <div className="pt-2">
              <button
                onClick={testMLXConnection}
                disabled={isTestingConnection}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all glass-lg hover:glass"
              >
                {isTestingConnection ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Test en cours...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    <span>Tester MLX</span>
                  </>
                )}
              </button>

              {/* Test Result */}
              {testResult && (
                <div className={`mt-3 p-3 glass-card rounded-lg flex items-start gap-2 ${
                  testResult.success ? 'text-green-400' : 'text-red-400'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 mt-0.5" />
                  ) : (
                    <XCircle className="w-5 h-5 mt-0.5" />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {testResult.success ? 'Test réussi !' : 'Échec du test'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{testResult.message}</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Embedding Model Selection */}
      {status?.available && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-1">Modèles d'embedding</h3>
              <p className="text-sm text-muted-foreground">
                Modèles sentence-transformers pour générer les embeddings
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => loadMLXStatus()}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg glass-card hover:glass-lg transition-all disabled:opacity-50"
                title="Rafraîchir la liste"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="text-sm">Rafraîchir</span>
              </button>
              <button
                onClick={() => setShowAddModel(!showAddModel)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg glass-card hover:glass-lg transition-all"
              >
                {showAddModel ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span className="text-sm">Ajouter</span>
              </button>
            </div>
          </div>

          {/* Add Custom Model Form */}
          {showAddModel && (
            <div className="p-4 glass-card rounded-lg space-y-3">
              <p className="text-sm text-muted-foreground">
                Ajouter un modèle sentence-transformers depuis Hugging Face
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: sentence-transformers/all-roberta-large-v1"
                  value={newModelRepoId}
                  onChange={(e) => setNewModelRepoId(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomModel()}
                  className="flex-1 px-4 py-2 glass-card rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm"
                />
                <button
                  onClick={addCustomModel}
                  disabled={!newModelRepoId.trim()}
                  className="px-4 py-2 rounded-lg glass-lg hover:glass transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {models.length > 0 ? (
              <>
                {/* Active Model Selector */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Modèle actif
                  </label>
                  <select
                    value={config?.model || ''}
                    onChange={(e) => updateMLXModel(e.target.value)}
                    className="w-full px-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    {models.filter(m => m.downloaded).map((model) => {
                      const modelName = model.name || 'unknown';
                      return (
                        <option key={modelName} value={modelName}>
                          {modelName}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Models List */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Modèles disponibles :
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {models.map((model) => {
                      const isActive = config?.model === model.name;
                      const isDownloaded = model.downloaded;
                      const modelName = model.name || 'unknown';
                      const isDownloading = modelName in downloadingModels;
                      const downloadProgress = downloadingModels[modelName] || 0;

                      return (
                        <div
                          key={modelName}
                          className={`px-4 py-3 rounded-lg glass-card ${
                            isActive ? 'ring-2 ring-purple-500/50' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm truncate">
                                  {modelName.split('/').pop() || modelName}
                                </span>
                                {isActive && (
                                  <Check className="w-4 h-4 text-purple-400" />
                                )}
                                {!isDefaultModel(modelName) && (
                                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                                    Personnalisé
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {modelName}
                              </p>
                              {model.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {model.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {model.size}
                                </span>
                                {model.dimensions && (
                                  <span className="text-xs text-muted-foreground">
                                    {model.dimensions} dims
                                  </span>
                                )}
                              </div>

                              {/* Download Progress Bar */}
                              {isDownloading && (
                                <div className="mt-2">
                                  <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                                      style={{ width: `${downloadProgress}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Téléchargement en cours... {downloadProgress.toFixed(1)}%
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              {!isDownloaded && !isDownloading && (
                                <button
                                  onClick={() => downloadModel(modelName)}
                                  className="p-2 rounded-lg glass-card hover:glass-lg transition-all"
                                  title="Télécharger le modèle"
                                >
                                  <Download className="w-4 h-4 text-green-400" />
                                </button>
                              )}
                              {isDownloaded && !isActive && (
                                <button
                                  onClick={() => deleteModel(modelName)}
                                  className="p-2 rounded-lg glass-card hover:glass-lg transition-all"
                                  title="Supprimer le modèle"
                                >
                                  <Trash2 className="w-4 h-4 text-red-400" />
                                </button>
                              )}
                              {!isDefaultModel(modelName) && (
                                <button
                                  onClick={() => removeCustomModel(modelName)}
                                  className="p-2 rounded-lg glass-card hover:glass-lg transition-all"
                                  title="Retirer de la liste"
                                >
                                  <X className="w-4 h-4 text-orange-400" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Aucun modèle d'embedding disponible
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Advanced Settings */}
      {status?.available && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold mb-3">Actions</h3>
          <div className="space-y-2">
            <button
              onClick={restartMLX}
              disabled={isTestingConnection}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all glass-card hover:glass-lg"
            >
              <RefreshCw className={`w-5 h-5 ${isTestingConnection ? 'animate-spin' : ''}`} />
              <span>Redémarrer le backend MLX</span>
            </button>
          </div>
        </div>
      )}

      {/* Help */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-3">À propos des embeddings MLX</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">MLX</span> est le framework
            d'apprentissage automatique d'Apple optimisé pour les puces Apple Silicon (M1/M2/M3/M4).
          </p>
          <p>
            Il est utilisé pour générer des embeddings pour le système RAG (Retrieval Augmented Generation),
            permettant une recherche sémantique rapide dans vos documents.
          </p>
          <p className="pt-2 border-t border-white/10">
            <span className="font-semibold text-foreground">Gestion des modèles :</span>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Téléchargez n'importe quel modèle sentence-transformers depuis Hugging Face</li>
            <li>Supprimez les modèles téléchargés pour libérer de l'espace</li>
            <li>Ajoutez des modèles personnalisés à votre liste</li>
          </ul>
          <p className="pt-2 border-t border-white/10">
            <span className="font-semibold text-foreground">Modèles recommandés :</span>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><code className="text-xs bg-white/10 px-1 rounded">all-mpnet-base-v2</code> : Meilleure qualité générale (768 dims)</li>
            <li><code className="text-xs bg-white/10 px-1 rounded">all-MiniLM-L6-v2</code> : Plus rapide et léger (384 dims)</li>
            <li><code className="text-xs bg-white/10 px-1 rounded">paraphrase-multilingual-mpnet</code> : Multilingue haute qualité (768 dims)</li>
            <li><code className="text-xs bg-white/10 px-1 rounded">multi-qa-mpnet</code> : Optimisé pour questions/réponses (768 dims)</li>
            <li><code className="text-xs bg-white/10 px-1 rounded">msmarco-distilbert</code> : Excellent pour recherche sémantique (768 dims)</li>
          </ul>
          <p className="pt-2 text-xs text-orange-400">
            ⚠️ Changer de modèle nécessite de réindexer vos documents existants
          </p>
        </div>
      </div>
    </div>
  );
}
