import { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { Server, RefreshCw, CheckCircle, XCircle, Clock, Settings2 } from 'lucide-react';

export function OllamaSettings() {
  const { settings, updateOllamaSettings } = useSettings();
  const { ollama } = settings;
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFetchingModels, setIsFetchingModels] = useState(false);

  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch(`${ollama.baseUrl}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        const modelNames = data.models?.map((model: any) => model.name) || [];
        updateOllamaSettings({ models: modelNames });
        setConnectionStatus('success');
      } else {
        setConnectionStatus('error');
        setErrorMessage(`Erreur HTTP: ${response.status}`);
      }
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const fetchModels = async () => {
    setIsFetchingModels(true);
    try {
      const response = await fetch(`${ollama.baseUrl}/api/tags`);
      if (response.ok) {
        const data = await response.json();
        const modelNames = data.models?.map((model: any) => model.name) || [];
        updateOllamaSettings({ models: modelNames });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des modèles:', error);
    } finally {
      setIsFetchingModels(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">AI Locale</h2>
        <p className="text-muted-foreground">
          Configuration d'Ollama pour l'exécution de modèles IA en local
        </p>
      </div>

      {/* Enable/Disable Ollama */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg glass-lg flex items-center justify-center">
            <Server className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Activation</h3>
            <p className="text-sm text-muted-foreground">
              Activer ou désactiver l'utilisation d'Ollama
            </p>
          </div>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={ollama.enabled}
            onChange={(e) => updateOllamaSettings({ enabled: e.target.checked })}
            className="w-5 h-5 rounded cursor-pointer"
          />
          <span className="text-sm font-medium">
            {ollama.enabled ? 'Ollama activé' : 'Ollama désactivé'}
          </span>
        </label>
      </div>

      {/* Connection Settings */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg glass-lg flex items-center justify-center">
            <Settings2 className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Paramètres de connexion à Ollama
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Base URL */}
          <div>
            <label className="block text-sm font-medium mb-2">
              URL de base
            </label>
            <input
              type="text"
              value={ollama.baseUrl}
              onChange={(e) => updateOllamaSettings({ baseUrl: e.target.value })}
              placeholder="http://localhost:11434"
              className="w-full px-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <p className="text-xs text-muted-foreground mt-2">
              L'adresse où Ollama est accessible (par défaut: http://localhost:11434)
            </p>
          </div>

          {/* Timeout */}
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Timeout (ms)
            </label>
            <input
              type="number"
              value={ollama.timeout}
              onChange={(e) => updateOllamaSettings({ timeout: parseInt(e.target.value) || 30000 })}
              min="1000"
              max="300000"
              step="1000"
              className="w-full px-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Délai d'attente maximum pour les requêtes (en millisecondes)
            </p>
          </div>

          {/* Test Connection */}
          <div className="pt-2">
            <button
              onClick={testConnection}
              disabled={isTestingConnection || !ollama.enabled}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                ollama.enabled
                  ? 'glass-lg hover:glass text-foreground'
                  : 'glass-card text-muted-foreground cursor-not-allowed'
              }`}
            >
              {isTestingConnection ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Test en cours...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5" />
                  <span>Tester la connexion</span>
                </>
              )}
            </button>

            {/* Connection Status */}
            {connectionStatus === 'success' && (
              <div className="mt-3 p-3 glass-card rounded-lg flex items-center gap-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Connexion réussie !</span>
              </div>
            )}

            {connectionStatus === 'error' && (
              <div className="mt-3 p-3 glass-card rounded-lg flex items-start gap-2 text-red-400">
                <XCircle className="w-5 h-5 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Échec de la connexion</p>
                  {errorMessage && (
                    <p className="text-xs text-muted-foreground mt-1">{errorMessage}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Models */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg glass-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Modèles disponibles</h3>
              <p className="text-sm text-muted-foreground">
                {ollama.models.length > 0
                  ? `${ollama.models.length} modèle(s) détecté(s)`
                  : 'Aucun modèle détecté'}
              </p>
            </div>
          </div>
          <button
            onClick={fetchModels}
            disabled={isFetchingModels || !ollama.enabled}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              ollama.enabled
                ? 'glass-lg hover:glass text-foreground'
                : 'glass-card text-muted-foreground cursor-not-allowed'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isFetchingModels ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>
        </div>

        {ollama.models.length > 0 ? (
          <div className="space-y-3">
            {/* Default Model Selector */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Modèle par défaut
              </label>
              <select
                value={ollama.defaultModel || ''}
                onChange={(e) => updateOllamaSettings({ defaultModel: e.target.value || undefined })}
                className="w-full px-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50"
              >
                <option value="">Aucun (sélection manuelle)</option>
                {ollama.models.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            {/* Models List */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Liste des modèles :
              </p>
              <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                {ollama.models.map((model) => (
                  <div
                    key={model}
                    className={`px-3 py-2 rounded-lg glass-card text-sm ${
                      ollama.defaultModel === model ? 'ring-2 ring-green-500/50' : ''
                    }`}
                  >
                    <span className="font-mono">{model}</span>
                    {ollama.defaultModel === model && (
                      <span className="ml-2 text-xs text-green-400">(par défaut)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Server className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-3" />
            <p className="text-sm text-muted-foreground">
              {ollama.enabled
                ? 'Aucun modèle détecté. Cliquez sur "Tester la connexion" ou "Actualiser" pour charger les modèles.'
                : 'Activez Ollama pour voir les modèles disponibles.'}
            </p>
          </div>
        )}
      </div>

      {/* Help */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-3">Aide</h3>
        <div className="space-y-2 text-sm text-muted-foreground">
          <p>
            <span className="font-semibold text-foreground">Ollama</span> permet d'exécuter des
            modèles d'IA localement sur votre machine.
          </p>
          <p>
            Pour installer Ollama, visitez{' '}
            <a
              href="https://ollama.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              ollama.ai
            </a>
          </p>
          <p>
            Après l'installation, lancez Ollama et téléchargez des modèles avec la commande :<br />
            <code className="px-2 py-1 glass-card rounded text-xs font-mono">
              ollama pull llama2
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
