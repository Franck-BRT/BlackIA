import React, { useState } from 'react';
import { Globe, Plus, Trash2, Key, Check, X, AlertCircle } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import type { WebSearchProviderConfig } from '@blackia/shared';

export function WebSearchSettings() {
  const { settings, updateWebSearchSettings } = useSettings();
  const [editingProvider, setEditingProvider] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customProviderForm, setCustomProviderForm] = useState({
    name: '',
    baseUrl: '',
    apiKey: '',
    description: '',
  });

  const handleToggleWebSearch = (enabled: boolean) => {
    updateWebSearchSettings({ enabled });
  };

  const handleSetDefaultProvider = (providerId: string) => {
    updateWebSearchSettings({ defaultProvider: providerId });
  };

  const handleToggleProvider = (providerId: string) => {
    const updatedProviders = settings.webSearch.providers.map((p) =>
      p.id === providerId ? { ...p, enabled: !p.enabled } : p
    );
    updateWebSearchSettings({ providers: updatedProviders });
  };

  const handleSaveApiKey = (providerId: string) => {
    const updatedProviders = settings.webSearch.providers.map((p) =>
      p.id === providerId ? { ...p, apiKey: apiKeyInput } : p
    );
    updateWebSearchSettings({ providers: updatedProviders });
    setEditingProvider(null);
    setApiKeyInput('');
  };

  const handleRemoveApiKey = (providerId: string) => {
    const updatedProviders = settings.webSearch.providers.map((p) =>
      p.id === providerId ? { ...p, apiKey: undefined } : p
    );
    updateWebSearchSettings({ providers: updatedProviders });
  };

  const handleAddCustomProvider = () => {
    if (!customProviderForm.name || !customProviderForm.baseUrl) {
      alert('Le nom et l\'URL sont requis');
      return;
    }

    const newProvider: WebSearchProviderConfig = {
      id: `custom-${Date.now()}`,
      name: customProviderForm.name,
      type: 'custom',
      enabled: true,
      baseUrl: customProviderForm.baseUrl,
      apiKey: customProviderForm.apiKey || undefined,
      description: customProviderForm.description || undefined,
    };

    const updatedProviders = [...settings.webSearch.providers, newProvider];
    updateWebSearchSettings({ providers: updatedProviders });

    // Reset form
    setCustomProviderForm({ name: '', baseUrl: '', apiKey: '', description: '' });
    setIsAddingCustom(false);
  };

  const handleDeleteCustomProvider = (providerId: string) => {
    if (!confirm('Supprimer ce provider personnalisé ?')) return;

    const updatedProviders = settings.webSearch.providers.filter((p) => p.id !== providerId);
    updateWebSearchSettings({ providers: updatedProviders });

    // Si c'était le provider par défaut, revenir à duckduckgo
    if (settings.webSearch.defaultProvider === providerId) {
      updateWebSearchSettings({ defaultProvider: 'duckduckgo' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Recherche Web</h2>
        <p className="text-muted-foreground">
          Configurez les moteurs de recherche pour enrichir les conversations avec des informations en temps réel
        </p>
      </div>

      {/* Enable/Disable Toggle */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-semibold">Activer la recherche web</h3>
              <p className="text-sm text-muted-foreground">
                Permet au chat d'accéder à des informations en ligne pendant les conversations
              </p>
            </div>
          </div>
          <button
            onClick={() => handleToggleWebSearch(!settings.webSearch.enabled)}
            className={`relative w-14 h-8 rounded-full transition-colors ${
              settings.webSearch.enabled ? 'bg-green-500' : 'bg-white/10'
            }`}
          >
            <div
              className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                settings.webSearch.enabled ? 'translate-x-6' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Providers List */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Moteurs de recherche disponibles
        </h3>

        <div className="space-y-3">
          {settings.webSearch.providers.map((provider) => {
            const isDefault = settings.webSearch.defaultProvider === provider.id;
            const needsApiKey = provider.type === 'brave' || provider.type === 'custom';
            const hasApiKey = !!provider.apiKey;
            const isEditing = editingProvider === provider.id;

            return (
              <div
                key={provider.id}
                className={`glass-card rounded-lg p-4 border ${
                  isDefault ? 'border-green-500/50' : 'border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <button
                        onClick={() => handleToggleProvider(provider.id)}
                        className={`relative w-10 h-6 rounded-full transition-colors ${
                          provider.enabled ? 'bg-green-500' : 'bg-white/10'
                        }`}
                        title={provider.enabled ? 'Désactiver' : 'Activer'}
                      >
                        <div
                          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            provider.enabled ? 'translate-x-4' : ''
                          }`}
                        />
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{provider.name}</h4>
                          {isDefault && (
                            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                              Par défaut
                            </span>
                          )}
                          {needsApiKey && !hasApiKey && (
                            <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-medium flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              API key requise
                            </span>
                          )}
                        </div>
                        {provider.description && (
                          <p className="text-sm text-muted-foreground mt-1">{provider.description}</p>
                        )}
                        {provider.type === 'custom' && provider.baseUrl && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono">{provider.baseUrl}</p>
                        )}
                      </div>
                    </div>

                    {/* API Key Section */}
                    {needsApiKey && (
                      <div className="mt-3 pl-14">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="password"
                              value={apiKeyInput}
                              onChange={(e) => setApiKeyInput(e.target.value)}
                              placeholder="Entrez votre API key..."
                              className="flex-1 px-3 py-2 rounded-lg glass-card border border-white/10 focus:outline-none focus:border-blue-500/50"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveApiKey(provider.id)}
                              className="p-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                              title="Enregistrer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingProvider(null);
                                setApiKeyInput('');
                              }}
                              className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {hasApiKey ? (
                              <>
                                <div className="flex-1 px-3 py-2 rounded-lg glass-card border border-green-500/30 text-sm text-green-400 flex items-center gap-2">
                                  <Key className="w-4 h-4" />
                                  <span>API key configurée</span>
                                </div>
                                <button
                                  onClick={() => {
                                    setEditingProvider(provider.id);
                                    setApiKeyInput(provider.apiKey || '');
                                  }}
                                  className="px-3 py-2 rounded-lg glass-hover text-sm"
                                >
                                  Modifier
                                </button>
                                <button
                                  onClick={() => handleRemoveApiKey(provider.id)}
                                  className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setEditingProvider(provider.id)}
                                className="flex-1 px-3 py-2 rounded-lg glass-hover border border-white/10 text-sm flex items-center justify-center gap-2"
                              >
                                <Key className="w-4 h-4" />
                                Ajouter une API key
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {!isDefault && provider.enabled && (needsApiKey ? hasApiKey : true) && (
                      <button
                        onClick={() => handleSetDefaultProvider(provider.id)}
                        className="px-3 py-1.5 rounded-lg glass-hover text-sm"
                      >
                        Définir par défaut
                      </button>
                    )}
                    {provider.type === 'custom' && (
                      <button
                        onClick={() => handleDeleteCustomProvider(provider.id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Custom Provider */}
        <div className="mt-4">
          {isAddingCustom ? (
            <div className="glass-card rounded-lg p-4 border border-white/10">
              <h4 className="font-medium mb-3">Nouveau provider personnalisé</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Nom *</label>
                  <input
                    type="text"
                    value={customProviderForm.name}
                    onChange={(e) => setCustomProviderForm({ ...customProviderForm, name: e.target.value })}
                    placeholder="Ex: Mon API Custom"
                    className="w-full px-3 py-2 rounded-lg glass-card border border-white/10 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">URL de l'API *</label>
                  <input
                    type="url"
                    value={customProviderForm.baseUrl}
                    onChange={(e) => setCustomProviderForm({ ...customProviderForm, baseUrl: e.target.value })}
                    placeholder="https://api.example.com/search"
                    className="w-full px-3 py-2 rounded-lg glass-card border border-white/10 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">API Key (optionnel)</label>
                  <input
                    type="password"
                    value={customProviderForm.apiKey}
                    onChange={(e) => setCustomProviderForm({ ...customProviderForm, apiKey: e.target.value })}
                    placeholder="Votre clé API"
                    className="w-full px-3 py-2 rounded-lg glass-card border border-white/10 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (optionnel)</label>
                  <textarea
                    value={customProviderForm.description}
                    onChange={(e) => setCustomProviderForm({ ...customProviderForm, description: e.target.value })}
                    placeholder="Description du provider..."
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg glass-card border border-white/10 focus:outline-none focus:border-blue-500/50 resize-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddCustomProvider}
                    className="flex-1 px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors font-medium"
                  >
                    Ajouter
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingCustom(false);
                      setCustomProviderForm({ name: '', baseUrl: '', apiKey: '', description: '' });
                    }}
                    className="flex-1 px-4 py-2 rounded-lg glass-hover font-medium"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingCustom(true)}
              className="w-full px-4 py-3 rounded-lg glass-hover border border-dashed border-white/20 flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Ajouter un provider personnalisé
            </button>
          )}
        </div>
      </div>

      {/* Search Settings */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-semibold mb-4">Paramètres de recherche</h3>

        <div className="space-y-4">
          {/* Max Results */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Nombre maximum de résultats: {settings.webSearch.maxResults}
            </label>
            <input
              type="range"
              min="3"
              max="10"
              step="1"
              value={settings.webSearch.maxResults}
              onChange={(e) => updateWebSearchSettings({ maxResults: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>3</span>
              <span>10</span>
            </div>
          </div>

          {/* Language & Region */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Langue</label>
              <select
                value={settings.webSearch.language}
                onChange={(e) => updateWebSearchSettings({ language: e.target.value })}
                className="w-full px-3 py-2 rounded-lg glass-card border border-white/10 focus:outline-none focus:border-blue-500/50"
              >
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="it">Italiano</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Région</label>
              <select
                value={settings.webSearch.region}
                onChange={(e) => updateWebSearchSettings({ region: e.target.value })}
                className="w-full px-3 py-2 rounded-lg glass-card border border-white/10 focus:outline-none focus:border-blue-500/50"
              >
                <option value="fr-FR">France</option>
                <option value="en-US">United States</option>
                <option value="en-GB">United Kingdom</option>
                <option value="es-ES">España</option>
                <option value="de-DE">Deutschland</option>
              </select>
            </div>
          </div>

          {/* Safe Search */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Recherche sécurisée</h4>
              <p className="text-sm text-muted-foreground">Filtrer les contenus explicites</p>
            </div>
            <button
              onClick={() => updateWebSearchSettings({ safeSearch: !settings.webSearch.safeSearch })}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.webSearch.safeSearch ? 'bg-green-500' : 'bg-white/10'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                  settings.webSearch.safeSearch ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Cache */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Cache des résultats</h4>
              <p className="text-sm text-muted-foreground">
                Évite les recherches répétées (durée: {settings.webSearch.cacheDuration / 60000} min)
              </p>
            </div>
            <button
              onClick={() => updateWebSearchSettings({ cacheEnabled: !settings.webSearch.cacheEnabled })}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.webSearch.cacheEnabled ? 'bg-green-500' : 'bg-white/10'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                  settings.webSearch.cacheEnabled ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="font-semibold mb-4">Affichage des sources</h3>

        <div className="space-y-4">
          {/* Show Sources */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Afficher les sources</h4>
              <p className="text-sm text-muted-foreground">
                Affiche les liens des sources utilisées après les réponses
              </p>
            </div>
            <button
              onClick={() => updateWebSearchSettings({ showSources: !settings.webSearch.showSources })}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.webSearch.showSources ? 'bg-green-500' : 'bg-white/10'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                  settings.webSearch.showSources ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Sources Collapsed */}
          {settings.webSearch.showSources && (
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Sources repliées par défaut</h4>
                <p className="text-sm text-muted-foreground">Les sources sont masquées initialement</p>
              </div>
              <button
                onClick={() => updateWebSearchSettings({ sourcesCollapsed: !settings.webSearch.sourcesCollapsed })}
                className={`relative w-14 h-8 rounded-full transition-colors ${
                  settings.webSearch.sourcesCollapsed ? 'bg-green-500' : 'bg-white/10'
                }`}
              >
                <div
                  className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                    settings.webSearch.sourcesCollapsed ? 'translate-x-6' : ''
                  }`}
                />
              </button>
            </div>
          )}

          {/* Include Snippets */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">Inclure les extraits dans le contexte</h4>
              <p className="text-sm text-muted-foreground">
                Ajoute les extraits des résultats au prompt de l'IA
              </p>
            </div>
            <button
              onClick={() => updateWebSearchSettings({ includeSnippets: !settings.webSearch.includeSnippets })}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                settings.webSearch.includeSnippets ? 'bg-green-500' : 'bg-white/10'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white transition-transform ${
                  settings.webSearch.includeSnippets ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          {/* Snippet Max Length */}
          {settings.webSearch.includeSnippets && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Longueur max des extraits: {settings.webSearch.snippetMaxLength} caractères
              </label>
              <input
                type="range"
                min="200"
                max="1000"
                step="100"
                value={settings.webSearch.snippetMaxLength}
                onChange={(e) => updateWebSearchSettings({ snippetMaxLength: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>200</span>
                <span>1000</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
