import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Power, PowerOff, RefreshCw, Info, Search, Edit2, X, Check } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { usePersonaSuggestions } from '../../hooks/usePersonaSuggestions';
import type { PersonaSuggestionKeywordParsed } from '../../types/persona-suggestion';

export function PersonaSuggestionsSettings() {
  const { settings, updatePersonaSuggestionSettings, getAllCategories } = useSettings();
  const categories = getAllCategories();
  const {
    keywords,
    loading,
    createKeyword,
    updateKeyword,
    deleteKeyword,
    toggleActive,
    searchKeywords,
    resetToDefaults,
    getStats,
  } = usePersonaSuggestions();

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredKeywords, setFilteredKeywords] = useState<PersonaSuggestionKeywordParsed[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // Formulaire d'ajout/édition
  const [formKeyword, setFormKeyword] = useState('');
  const [formCategories, setFormCategories] = useState<string[]>([]);

  // Charger les stats
  useEffect(() => {
    const loadStats = async () => {
      const result = await getStats();
      if (result.success) {
        setStats(result.data);
      }
    };
    loadStats();
  }, [keywords]);

  // Filtrer les keywords selon la recherche
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredKeywords(
        keywords.filter(
          (k) =>
            k.keyword.toLowerCase().includes(query) ||
            k.categories.some((cat) => cat.toLowerCase().includes(query))
        )
      );
    } else {
      setFilteredKeywords(keywords);
    }
  }, [searchQuery, keywords]);

  const handleAddKeyword = async () => {
    if (formKeyword.trim() && formCategories.length > 0) {
      const result = await createKeyword({
        keyword: formKeyword.trim(),
        categories: formCategories,
        isActive: true,
      });

      if (result.success) {
        setFormKeyword('');
        setFormCategories([]);
        setShowAddForm(false);
      }
    }
  };

  const handleUpdateKeyword = async (id: string) => {
    if (formKeyword.trim() && formCategories.length > 0) {
      const result = await updateKeyword(id, {
        keyword: formKeyword.trim(),
        categories: formCategories,
      });

      if (result.success) {
        setFormKeyword('');
        setFormCategories([]);
        setEditingKeyword(null);
      }
    }
  };

  const handleDeleteKeyword = async (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce mot-clé ?')) {
      await deleteKeyword(id);
    }
  };

  const handleToggleActive = async (id: string) => {
    await toggleActive(id);
  };

  const handleResetToDefaults = async () => {
    if (
      confirm(
        'Êtes-vous sûr de vouloir réinitialiser tous les mots-clés aux valeurs par défaut ? Cela supprimera vos mots-clés personnalisés.'
      )
    ) {
      await resetToDefaults();
    }
  };

  const startEdit = (keyword: PersonaSuggestionKeywordParsed) => {
    setEditingKeyword(keyword.id);
    setFormKeyword(keyword.keyword);
    setFormCategories(keyword.categories);
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingKeyword(null);
    setFormKeyword('');
    setFormCategories([]);
  };

  const toggleCategory = (category: string) => {
    if (formCategories.includes(category)) {
      setFormCategories(formCategories.filter((c) => c !== category));
    } else {
      setFormCategories([...formCategories, category]);
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Suggestions Intelligentes de Personas
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Configurez les mots-clés pour suggérer automatiquement des personas pertinents lors de la
          saisie.
        </p>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.total}
            </p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Actifs</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.active}
            </p>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Par défaut</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.defaultKeywords}
            </p>
          </div>
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">Personnalisés</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.customKeywords}
            </p>
          </div>
        </div>
      )}

      {/* Paramètres généraux */}
      <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white">Paramètres généraux</h4>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Activer les suggestions
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Suggérer automatiquement des personas pendant la saisie
            </p>
          </div>
          <button
            onClick={() =>
              updatePersonaSuggestionSettings({ enabled: !settings.personaSuggestions.enabled })
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.personaSuggestions.enabled ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.personaSuggestions.enabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Nombre maximum de suggestions
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={settings.personaSuggestions.maxSuggestions}
            onChange={(e) =>
              updatePersonaSuggestionSettings({ maxSuggestions: parseInt(e.target.value) })
            }
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Caractères minimum avant suggestion
          </label>
          <input
            type="number"
            min="5"
            max="50"
            value={settings.personaSuggestions.minCharacters}
            onChange={(e) =>
              updatePersonaSuggestionSettings({ minCharacters: parseInt(e.target.value) })
            }
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Afficher uniquement les mots-clés actifs
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Ignorer les mots-clés désactivés
            </p>
          </div>
          <button
            onClick={() =>
              updatePersonaSuggestionSettings({
                showOnlyActive: !settings.personaSuggestions.showOnlyActive,
              })
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.personaSuggestions.showOnlyActive ? 'bg-purple-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.personaSuggestions.showOnlyActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingKeyword(null);
            setFormKeyword('');
            setFormCategories([]);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un mot-clé
        </button>
        <button
          onClick={handleResetToDefaults}
          className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Réinitialiser
        </button>
      </div>

      {/* Formulaire d'ajout/édition */}
      {(showAddForm || editingKeyword) && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            {editingKeyword ? 'Modifier le mot-clé' : 'Nouveau mot-clé'}
          </h4>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Mot-clé
            </label>
            <input
              type="text"
              value={formKeyword}
              onChange={(e) => setFormKeyword(e.target.value)}
              placeholder="Ex: code, design, analyse..."
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Catégories associées
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.name)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    formCategories.includes(category.name)
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {category.icon} {category.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {editingKeyword ? (
              <>
                <button
                  onClick={() => handleUpdateKeyword(editingKeyword)}
                  disabled={!formKeyword.trim() || formCategories.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-4 h-4" />
                  Enregistrer
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleAddKeyword}
                  disabled={!formKeyword.trim() || formCategories.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setFormKeyword('');
                    setFormCategories([]);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Annuler
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un mot-clé ou une catégorie..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Liste des mots-clés */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-8 text-gray-500">Chargement...</div>
        ) : filteredKeywords.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery
              ? 'Aucun mot-clé trouvé'
              : "Aucun mot-clé configuré. Cliquez sur 'Ajouter un mot-clé' pour commencer."}
          </div>
        ) : (
          filteredKeywords.map((keyword) => (
            <div
              key={keyword.id}
              className={`p-4 rounded-lg border transition-all ${
                keyword.isActive
                  ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60'
              } ${editingKeyword === keyword.id ? 'ring-2 ring-purple-500' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-gray-900 dark:text-white">
                      {keyword.keyword}
                    </span>
                    {keyword.isDefault && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                        Défaut
                      </span>
                    )}
                    {!keyword.isActive && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                        Inactif
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {keyword.categories.map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(keyword.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title={keyword.isActive ? 'Désactiver' : 'Activer'}
                  >
                    {keyword.isActive ? (
                      <Power className="w-4 h-4 text-green-600" />
                    ) : (
                      <PowerOff className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                  {!keyword.isDefault && (
                    <>
                      <button
                        onClick={() => startEdit(keyword)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteKeyword(keyword.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="flex gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <p className="font-medium mb-1">Comment ça marche ?</p>
          <p>
            Lorsque vous tapez un message, le système analyse le texte et détecte les mots-clés
            configurés. Si un mot-clé est trouvé, les personas correspondant aux catégories
            associées seront suggérés automatiquement.
          </p>
        </div>
      </div>
    </div>
  );
}
