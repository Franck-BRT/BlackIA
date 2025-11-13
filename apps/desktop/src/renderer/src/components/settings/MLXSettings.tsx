import { useState, useEffect } from 'react';
import {
  Server,
  RefreshCw,
  CheckCircle,
  XCircle,
  Settings2,
  Cpu,
  Zap,
  Download,
  Check,
  AlertTriangle
} from 'lucide-react';

interface MLXModel {
  name: string;
  size: string;
  downloaded: boolean;
  type: 'embed';
  description?: string;
  dimensions?: number;
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

export function MLXSettings() {
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<MLXStatus | null>(null);
  const [config, setConfig] = useState<MLXConfig | null>(null);
  const [models, setModels] = useState<MLXModel[]>([]);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{success: boolean; message: string} | null>(null);

  // Charger le statut et la config au montage
  useEffect(() => {
    loadMLXStatus();
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

      // Charger la liste des modèles
      const mlxModels = await window.electronAPI.mlx.listModels();
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
        message: `Modèle changé vers ${newModel}`
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

  const getModelDescription = (modelName: string): string => {
    const descriptions: Record<string, string> = {
      'sentence-transformers/all-mpnet-base-v2': 'Haute qualité, 768 dimensions (recommandé)',
      'sentence-transformers/all-MiniLM-L6-v2': 'Rapide et léger, 384 dimensions',
      'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2': 'Multilingue, 384 dimensions'
    };
    return descriptions[modelName] || 'Modèle d\'embedding sentence-transformers';
  };

  return (
    <div className="space-y-6">
      {/* MLX Status */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg glass-lg flex items-center justify-center">
            <Cpu className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">MLX (Apple Silicon)</h3>
            <p className="text-sm text-muted-foreground">
              Framework ML optimisé pour puces Apple
            </p>
          </div>
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
                      <p className="text-xs text-orange-400 font-medium mb-2">📦 Installation requise :</p>
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

      {/* Model Selection */}
      {status?.available && (
        <div className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg glass-lg flex items-center justify-center">
              <Settings2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Sélection du modèle</h3>
              <p className="text-sm text-muted-foreground">
                Choisissez le modèle d'embedding pour le RAG
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {models.length > 0 ? (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Modèle actif
                  </label>
                  <select
                    value={config?.model || ''}
                    onChange={(e) => updateMLXModel(e.target.value)}
                    className="w-full px-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    {models.map((model) => (
                      <option key={model.name} value={model.name}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                  {config?.model && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {getModelDescription(config.model)}
                    </p>
                  )}
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

                      return (
                        <div
                          key={model.name}
                          className={`px-4 py-3 rounded-lg glass-card ${
                            isActive ? 'ring-2 ring-purple-500/50' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">
                                  {model.name.split('/').pop()}
                                </span>
                                {isActive && (
                                  <span className="text-xs text-purple-400">(actif)</span>
                                )}
                                {!isDownloaded && (
                                  <AlertTriangle className="w-4 h-4 text-yellow-400" title="Pas encore téléchargé" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                {model.name}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {getModelDescription(model.name)}
                              </p>
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
                            </div>
                            {isActive && (
                              <Check className="w-5 h-5 text-purple-400" />
                            )}
                            {!isDownloaded && (
                              <Download className="w-5 h-5 text-yellow-400 opacity-50" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <Server className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Aucun modèle disponible
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
        <h3 className="text-lg font-semibold mb-3">À propos de MLX</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">MLX</span> est le framework
            d'apprentissage automatique d'Apple optimisé pour les puces Apple Silicon (M1/M2/M3).
          </p>
          <p>
            Il est utilisé pour générer des embeddings pour le système RAG (Retrieval Augmented Generation),
            permettant une recherche sémantique rapide dans vos documents.
          </p>
          <p className="pt-2 border-t border-white/10">
            <span className="font-semibold text-foreground">Performances :</span>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>10-20x plus rapide qu'Ollama pour les embeddings</li>
            <li>Optimisé pour Apple Silicon (GPU unifiée)</li>
            <li>Faible consommation de mémoire</li>
          </ul>
          <p className="pt-2 border-t border-white/10">
            <span className="font-semibold text-foreground">Modèles recommandés :</span>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li><code className="text-xs bg-white/10 px-1 rounded">all-mpnet-base-v2</code> : Meilleure qualité (768 dims)</li>
            <li><code className="text-xs bg-white/10 px-1 rounded">all-MiniLM-L6-v2</code> : Plus rapide (384 dims)</li>
            <li><code className="text-xs bg-white/10 px-1 rounded">paraphrase-multilingual</code> : Support multilingue</li>
          </ul>
          <p className="pt-2 text-xs text-orange-400">
            ⚠️ Changer de modèle nécessite de réindexer vos documents existants
          </p>
        </div>
      </div>
    </div>
  );
}
