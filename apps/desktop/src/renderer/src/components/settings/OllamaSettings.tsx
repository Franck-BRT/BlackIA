import { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { Server, RefreshCw, CheckCircle, XCircle, Clock, Settings2, Edit2, X, Check, Download, Trash2, Loader2, Eye, Code, MessageSquare, Briefcase, Boxes, Brain, Sparkles, Tag } from 'lucide-react';
import type { ModelCapability } from '@blackia/shared/types';

// Mapping des tags vers icônes et couleurs
const TAG_CONFIG: Record<ModelCapability, { icon: any; color: string; label: string }> = {
  vision: { icon: Eye, color: 'text-purple-400', label: 'Vision' },
  embedding: { icon: Boxes, color: 'text-blue-400', label: 'Embedding' },
  chat: { icon: MessageSquare, color: 'text-green-400', label: 'Chat' },
  code: { icon: Code, color: 'text-orange-400', label: 'Code' },
  instruct: { icon: Briefcase, color: 'text-cyan-400', label: 'Instruct' },
  tools: { icon: Sparkles, color: 'text-pink-400', label: 'Tools' },
  reasoning: { icon: Brain, color: 'text-yellow-400', label: 'Reasoning' },
  multimodal: { icon: Sparkles, color: 'text-indigo-400', label: 'Multimodal' },
};

export function OllamaSettings() {
  const { settings, updateOllamaSettings } = useSettings();
  const { ollama } = settings;
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [editingModel, setEditingModel] = useState<string | null>(null);
  const [editingAlias, setEditingAlias] = useState('');

  // Pull model states
  const [showPullModal, setShowPullModal] = useState(false);
  const [pullModelName, setPullModelName] = useState('');
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState('');
  const [pullError, setPullError] = useState('');

  // Delete model states
  const [deletingModel, setDeletingModel] = useState<string | null>(null);

  // Tags editing states
  const [editingTags, setEditingTags] = useState<string | null>(null);

  // Custom tool models states
  const [newToolModel, setNewToolModel] = useState('');

  // Helper pour obtenir le nom d'affichage (alias ou nom d'origine)
  const getDisplayName = (modelName: string): string => {
    return ollama.modelAliases[modelName] || modelName;
  };

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

  const pullModel = async () => {
    if (!pullModelName.trim()) return;

    setIsPulling(true);
    setPullProgress('Démarrage du téléchargement...');
    setPullError('');

    try {
      const response = await fetch(`${ollama.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: pullModelName.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.status) {
                setPullProgress(data.status);
              }
              if (data.error) {
                setPullError(data.error);
              }
            } catch (e) {
              // Ignorer les lignes mal formées
            }
          }
        }
      }

      // Rafraîchir la liste des modèles
      await fetchModels();

      // Fermer le modal après succès
      setPullProgress('Téléchargement terminé !');
      setTimeout(() => {
        setShowPullModal(false);
        setPullModelName('');
        setPullProgress('');
      }, 2000);

    } catch (error) {
      setPullError(error instanceof Error ? error.message : 'Erreur lors du téléchargement');
    } finally {
      setIsPulling(false);
    }
  };

  const deleteModel = async (modelName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le modèle "${getDisplayName(modelName)}" ?`)) {
      return;
    }

    setDeletingModel(modelName);

    try {
      const response = await fetch(`${ollama.baseUrl}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // Supprimer l'alias et les tags si présents
      const newAliases = { ...ollama.modelAliases };
      const newTags = { ...ollama.modelTags };
      delete newAliases[modelName];
      delete newTags[modelName];
      updateOllamaSettings({ modelAliases: newAliases, modelTags: newTags });

      // Rafraîchir la liste des modèles
      await fetchModels();
    } catch (error) {
      alert(`Erreur lors de la suppression: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setDeletingModel(null);
    }
  };

  const startEditingModel = (modelName: string) => {
    setEditingModel(modelName);
    setEditingAlias(ollama.modelAliases[modelName] || modelName);
  };

  const saveModelAlias = () => {
    if (editingModel) {
      const newAliases = { ...ollama.modelAliases };
      if (editingAlias.trim() && editingAlias !== editingModel) {
        newAliases[editingModel] = editingAlias.trim();
      } else {
        // Si vide ou identique au nom d'origine, supprimer l'alias
        delete newAliases[editingModel];
      }
      updateOllamaSettings({ modelAliases: newAliases });
      setEditingModel(null);
      setEditingAlias('');
    }
  };

  // Tags management functions
  const getModelTags = (modelName: string): ModelCapability[] => {
    return ollama.modelTags[modelName] || [];
  };

  const toggleModelTag = (modelName: string, tag: ModelCapability) => {
    const currentTags = getModelTags(modelName);
    const newTags = { ...ollama.modelTags };

    if (currentTags.includes(tag)) {
      // Retirer le tag
      newTags[modelName] = currentTags.filter(t => t !== tag);
      if (newTags[modelName].length === 0) {
        delete newTags[modelName]; // Nettoyer si aucun tag
      }
    } else {
      // Ajouter le tag
      newTags[modelName] = [...currentTags, tag];
    }

    updateOllamaSettings({ modelTags: newTags });
  };

  const startEditingTags = (modelName: string) => {
    setEditingTags(modelName);
  };

  const cancelEditingTags = () => {
    setEditingTags(null);
  };

  // Custom tool models management
  const addCustomToolModel = () => {
    const model = newToolModel.trim().toLowerCase();
    if (!model) return;

    const currentModels = ollama.customToolModels || [];
    if (currentModels.includes(model)) {
      alert('Ce modèle est déjà dans la liste');
      return;
    }

    updateOllamaSettings({
      customToolModels: [...currentModels, model],
    });
    setNewToolModel('');
  };

  const removeCustomToolModel = (model: string) => {
    const currentModels = ollama.customToolModels || [];
    updateOllamaSettings({
      customToolModels: currentModels.filter(m => m !== model),
    });
  };

  const cancelEditing = () => {
    setEditingModel(null);
    setEditingAlias('');
  };

  const resetModelAlias = (modelName: string) => {
    const newAliases = { ...ollama.modelAliases };
    delete newAliases[modelName];
    updateOllamaSettings({ modelAliases: newAliases });
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

      {/* Models Management */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg glass-lg flex items-center justify-center">
              <Server className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Gestion des modèles</h3>
              <p className="text-sm text-muted-foreground">
                {ollama.models.length > 0
                  ? `${ollama.models.length} modèle(s) installé(s)`
                  : 'Aucun modèle installé'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPullModal(true)}
              disabled={!ollama.enabled}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                ollama.enabled
                  ? 'glass-lg hover:glass text-foreground'
                  : 'glass-card text-muted-foreground cursor-not-allowed'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Télécharger</span>
            </button>
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
                    {getDisplayName(model)}
                    {ollama.modelAliases[model] && ` (${model})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Models List */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Liste des modèles installés :
              </p>
              <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                {ollama.models.map((model) => (
                  <div
                    key={model}
                    className={`px-3 py-2 rounded-lg glass-card ${
                      ollama.defaultModel === model ? 'ring-2 ring-green-500/50' : ''
                    }`}
                  >
                    {editingModel === model ? (
                      // Mode édition
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingAlias}
                          onChange={(e) => setEditingAlias(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveModelAlias();
                            if (e.key === 'Escape') cancelEditing();
                          }}
                          placeholder={model}
                          autoFocus
                          className="flex-1 px-3 py-1.5 glass-lg rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        <button
                          onClick={saveModelAlias}
                          className="p-1.5 rounded-lg hover:bg-green-500/20 text-green-400 transition-colors"
                          title="Sauvegarder"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Annuler"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      // Mode affichage
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {getDisplayName(model)}
                              </span>
                              {ollama.defaultModel === model && (
                                <span className="text-xs text-green-400">(par défaut)</span>
                              )}
                            </div>
                            {ollama.modelAliases[model] && (
                              <p className="text-xs text-muted-foreground font-mono truncate">
                                {model}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEditingModel(model)}
                              className="p-1.5 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors"
                              title="Renommer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => startEditingTags(model)}
                              className="p-1.5 rounded-lg hover:bg-purple-500/20 text-purple-400 transition-colors"
                              title="Gérer les tags"
                            >
                              <Tag className="w-4 h-4" />
                            </button>
                            {ollama.modelAliases[model] && (
                              <button
                                onClick={() => resetModelAlias(model)}
                                className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-yellow-400 transition-colors"
                                title="Réinitialiser le nom"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteModel(model)}
                              disabled={deletingModel === model}
                              className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                              title="Supprimer"
                            >
                              {deletingModel === model ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Tags display */}
                        {getModelTags(model).length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {getModelTags(model).map(tag => {
                              const config = TAG_CONFIG[tag];
                              const Icon = config.icon;
                              return (
                                <div
                                  key={tag}
                                  className="flex items-center gap-1 px-2 py-0.5 rounded-md glass-lg text-xs"
                                >
                                  <Icon className={`w-3 h-3 ${config.color}`} />
                                  <span className={config.color}>{config.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Tags editor */}
                        {editingTags === model && (
                          <div className="mt-2 p-3 glass-lg rounded-lg space-y-2">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-medium text-muted-foreground">
                                Sélectionnez les capacités du modèle :
                              </p>
                              <button
                                onClick={cancelEditingTags}
                                className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {(Object.keys(TAG_CONFIG) as ModelCapability[]).map(tag => {
                                const config = TAG_CONFIG[tag];
                                const Icon = config.icon;
                                const isSelected = getModelTags(model).includes(tag);
                                return (
                                  <button
                                    key={tag}
                                    onClick={() => toggleModelTag(model, tag)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
                                      isSelected
                                        ? 'glass ring-2 ring-purple-500/50'
                                        : 'glass-card hover:glass-lg'
                                    }`}
                                  >
                                    <Icon className={`w-4 h-4 ${config.color}`} />
                                    <span className={isSelected ? config.color : 'text-muted-foreground'}>
                                      {config.label}
                                    </span>
                                    {isSelected && (
                                      <Check className={`w-3 h-3 ml-auto ${config.color}`} />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <Server className="w-12 h-12 mx-auto text-muted-foreground opacity-50 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              {ollama.enabled
                ? 'Aucun modèle installé. Téléchargez votre premier modèle !'
                : 'Activez Ollama pour gérer vos modèles.'}
            </p>
            {ollama.enabled && (
              <button
                onClick={() => setShowPullModal(true)}
                className="glass-lg hover:glass px-4 py-2 rounded-lg text-sm font-medium transition-all"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Télécharger un modèle
              </button>
            )}
          </div>
        )}
      </div>

      {/* Custom Tool Models */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg glass-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Modèles avec support Tools</h3>
            <p className="text-sm text-muted-foreground">
              Ajoutez des modèles personnalisés qui supportent les function calls/tools
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Add new model */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newToolModel}
              onChange={(e) => setNewToolModel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addCustomToolModel();
              }}
              placeholder="Nom du modèle (ex: phi3, dolphin...)"
              className="flex-1 px-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500/50"
            />
            <button
              onClick={addCustomToolModel}
              disabled={!newToolModel.trim()}
              className="px-4 py-3 glass-lg rounded-xl font-medium transition-all hover:glass disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ajouter
            </button>
          </div>

          {/* Default models info */}
          <div className="p-3 glass-card rounded-lg">
            <p className="text-xs text-muted-foreground mb-2">
              <span className="font-medium">Modèles supportés par défaut :</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {['llama3.x', 'mistral', 'mixtral', 'qwen2/3', 'command-r', 'firefunction', 'hermes', 'gpt-oss'].map(model => (
                <span key={model} className="px-2 py-0.5 rounded-md glass-lg text-xs text-muted-foreground">
                  {model}
                </span>
              ))}
            </div>
          </div>

          {/* Custom models list */}
          {(ollama.customToolModels || []).length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Modèles personnalisés ajoutés :
              </p>
              <div className="flex flex-wrap gap-2">
                {(ollama.customToolModels || []).map(model => (
                  <div
                    key={model}
                    className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-lg"
                  >
                    <Sparkles className="w-3 h-3 text-pink-400" />
                    <span className="text-sm">{model}</span>
                    <button
                      onClick={() => removeCustomToolModel(model)}
                      className="p-0.5 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                      title="Supprimer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            💡 Les modèles ajoutés ici pourront utiliser les outils MCP dans le chat.
            Entrez le nom de base du modèle (sans le tag, ex: "phi3" et non "phi3:latest").
          </p>
        </div>
      </div>

      {/* Pull Model Modal */}
      {showPullModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="glass-card bg-gray-900/95 rounded-2xl w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Télécharger un modèle</h3>
              <button
                onClick={() => {
                  setShowPullModal(false);
                  setPullModelName('');
                  setPullProgress('');
                  setPullError('');
                }}
                disabled={isPulling}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nom du modèle
                </label>
                <input
                  type="text"
                  value={pullModelName}
                  onChange={(e) => setPullModelName(e.target.value)}
                  placeholder="llama2, mistral, codellama..."
                  disabled={isPulling}
                  className="w-full px-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isPulling) pullModel();
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Exemples : llama2, mistral, codellama, gemma
                </p>
              </div>

              {pullProgress && (
                <div className="p-3 glass-card rounded-lg">
                  <div className="flex items-center gap-2 text-blue-400 text-sm">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{pullProgress}</span>
                  </div>
                </div>
              )}

              {pullError && (
                <div className="p-3 glass-card rounded-lg">
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <XCircle className="w-4 h-4" />
                    <span>{pullError}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPullModal(false);
                    setPullModelName('');
                    setPullProgress('');
                    setPullError('');
                  }}
                  disabled={isPulling}
                  className="flex-1 px-4 py-3 glass-card rounded-xl font-medium transition-all hover:bg-white/5 disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  onClick={pullModel}
                  disabled={isPulling || !pullModelName.trim()}
                  className="flex-1 px-4 py-3 glass-lg rounded-xl font-medium transition-all hover:glass disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPulling ? (
                    <>
                      <Loader2 className="w-4 h-4 inline mr-2 animate-spin" />
                      Téléchargement...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 inline mr-2" />
                      Télécharger
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          <p className="pt-2 border-t border-white/10">
            <span className="font-semibold text-foreground">Gestion des modèles :</span>
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Cliquez sur <Download className="inline w-3 h-3" /> pour télécharger un nouveau modèle</li>
            <li>Cliquez sur <Edit2 className="inline w-3 h-3" /> pour renommer un modèle</li>
            <li>Cliquez sur <Tag className="inline w-3 h-3" /> pour gérer les capacités/tags (Vision, Code, Chat...)</li>
            <li>Cliquez sur <Trash2 className="inline w-3 h-3" /> pour supprimer un modèle</li>
          </ul>
          <p className="pt-2 text-xs">
            💡 Modèles populaires : llama2, mistral, codellama, gemma, phi
          </p>
        </div>
      </div>
    </div>
  );
}
