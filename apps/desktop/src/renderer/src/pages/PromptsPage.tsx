import React, { useState, useMemo } from 'react';
import { Plus, Search, Star, Filter, FileDown, ChevronDown, ChevronUp } from 'lucide-react';
import { usePrompts } from '../hooks/usePrompts';
import { PromptList } from '../components/prompts/PromptList';
import { PromptModal } from '../components/prompts/PromptModal';
import { PromptImportExport } from '../components/prompts/PromptImportExport';
import type { Prompt, PromptFormData, CreatePromptData } from '../types/prompt';

export function PromptsPage() {
  const {
    prompts,
    loading,
    error,
    createPrompt,
    updatePrompt,
    deletePrompt,
    duplicatePrompt,
    toggleFavorite,
  } = usePrompts();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // État pour le modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  // État pour import/export
  const [showImportExport, setShowImportExport] = useState(false);

  // Extraire les catégories uniques
  const categories = useMemo(() => {
    const cats = new Set<string>();
    prompts.forEach((p) => {
      if (p.category) {
        cats.add(p.category);
      }
    });
    return Array.from(cats).sort();
  }, [prompts]);

  // Filtrer et rechercher les prompts
  const filteredPrompts = useMemo(() => {
    let filtered = prompts;

    // Filtre favoris
    if (showFavoritesOnly) {
      filtered = filtered.filter((p) => p.isFavorite);
    }

    // Filtre catégorie
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.content.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [prompts, searchQuery, selectedCategory, showFavoritesOnly]);

  // Grouper par catégories
  const promptsByCategory = useMemo(() => {
    const groups: Record<string, Prompt[]> = {};

    filteredPrompts.forEach((prompt) => {
      const category = prompt.category || 'Sans catégorie';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(prompt);
    });

    return groups;
  }, [filteredPrompts]);

  // Prompts favoris
  const favoritePrompts = useMemo(() => {
    return prompts.filter((p) => p.isFavorite);
  }, [prompts]);

  // Ouvrir le modal pour créer un nouveau prompt
  const handleCreate = () => {
    setEditingPrompt(null);
    setIsModalOpen(true);
  };

  // Ouvrir le modal pour éditer un prompt
  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt);
    setIsModalOpen(true);
  };

  // Fermer le modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPrompt(null);
  };

  // Soumettre le formulaire (création ou édition)
  const handleSubmit = async (data: PromptFormData) => {
    if (editingPrompt) {
      // Édition
      await updatePrompt(editingPrompt.id, {
        ...data,
        tags: JSON.stringify(data.tags),
        variables: JSON.stringify(data.variables),
      });
    } else {
      // Création
      const createData: CreatePromptData = {
        ...data,
        tags: JSON.stringify(data.tags),
        variables: JSON.stringify(data.variables),
        isFavorite: false,
      };
      await createPrompt(createData);
    }
  };

  const handleDelete = async (prompt: Prompt) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${prompt.name}" ?`)) {
      await deletePrompt(prompt.id);
    }
  };

  const handleDuplicate = async (prompt: Prompt) => {
    await duplicatePrompt(prompt.id);
  };

  const handleToggleFavorite = async (prompt: Prompt) => {
    await toggleFavorite(prompt.id);
  };

  const handleUse = (prompt: Prompt) => {
    // TODO: Implémenter l'utilisation du prompt
    console.log('Use prompt:', prompt);
    alert('Fonctionnalité "Utiliser" à venir prochainement !');
  };

  // Importer des prompts depuis un fichier JSON
  const handleImport = async (importedPrompts: Prompt[]) => {
    for (const prompt of importedPrompts) {
      // Retirer les champs générés automatiquement
      const { id, createdAt, updatedAt, usageCount, ...promptData } = prompt;

      // Créer le nouveau prompt
      await createPrompt({
        ...promptData,
        isFavorite: false,
      } as CreatePromptData);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des prompts...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">Erreur lors du chargement des prompts</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                📚 Bibliothèque de Prompts
              </h1>
              <p className="text-muted-foreground mt-2">
                Créez et gérez vos prompts réutilisables
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowImportExport(!showImportExport)}
                className="px-6 py-3 glass-card rounded-xl font-semibold flex items-center gap-2 hover:glass-lg transition-all"
              >
                <FileDown className="w-5 h-5" />
                Import/Export
                {showImportExport ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              <button
                onClick={handleCreate}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Plus className="w-5 h-5" />
                Nouveau Prompt
              </button>
            </div>
          </div>

          {/* Section Import/Export */}
          {showImportExport && (
            <div className="mt-6 p-6 glass-card rounded-xl">
              <h3 className="text-lg font-semibold mb-4">Import / Export de Prompts</h3>
              <PromptImportExport prompts={prompts} onImport={handleImport} />
            </div>
          )}

          {/* Barre de recherche et filtres */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un prompt..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
            </div>

            {/* Filtre catégorie */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 min-w-[200px]"
            >
              <option value="all">Toutes les catégories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Toggle favoris */}
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-all ${
                showFavoritesOnly
                  ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 ring-2 ring-yellow-500/50'
                  : 'glass-card hover:glass-lg'
              }`}
            >
              <Star
                className="w-5 h-5"
                fill={showFavoritesOnly ? 'currentColor' : 'none'}
              />
              Favoris
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
            <span>{prompts.length} prompts au total</span>
            <span>•</span>
            <span>{favoritePrompts.length} favoris</span>
            <span>•</span>
            <span>{filteredPrompts.length} affichés</span>
          </div>
        </div>

        {/* Section Favorites */}
        {!showFavoritesOnly && favoritePrompts.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
              Favoris
            </h2>
            <PromptList
              prompts={favoritePrompts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onToggleFavorite={handleToggleFavorite}
              onUse={handleUse}
            />
          </div>
        )}

        {/* Liste des prompts par catégorie */}
        {Object.keys(promptsByCategory).length > 0 ? (
          <div className="space-y-12">
            {Object.entries(promptsByCategory).map(([category, categoryPrompts]) => (
              <div key={category}>
                <h2 className="text-xl font-semibold mb-6">
                  {category} ({categoryPrompts.length})
                </h2>
                <PromptList
                  prompts={categoryPrompts}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onToggleFavorite={handleToggleFavorite}
                  onUse={handleUse}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full glass-card flex items-center justify-center mx-auto mb-4">
              <Filter className="w-10 h-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              {searchQuery
                ? `Aucun prompt ne correspond à "${searchQuery}"`
                : 'Aucun prompt à afficher'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      <PromptModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        prompt={editingPrompt}
        title={editingPrompt ? 'Éditer le Prompt' : 'Nouveau Prompt'}
        submitLabel={editingPrompt ? 'Sauvegarder' : 'Créer'}
      />
    </div>
  );
}
