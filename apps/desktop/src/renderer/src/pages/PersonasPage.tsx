import React, { useState, useMemo } from 'react';
import { Plus, Search, Star, Filter, FileDown, ChevronDown, ChevronUp } from 'lucide-react';
import { usePersonas } from '../hooks/usePersonas';
import { PersonaList } from '../components/personas/PersonaList';
import { PersonaModal } from '../components/personas/PersonaModal';
import { PersonaImportExport } from '../components/personas/PersonaImportExport';
import type { Persona, PersonaFormData, CreatePersonaData } from '../types/persona';

export function PersonasPage() {
  const {
    personas,
    loading,
    error,
    createPersona,
    updatePersona,
    deletePersona,
    duplicatePersona,
    toggleFavorite,
  } = usePersonas();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // État pour le modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);

  // État pour import/export
  const [showImportExport, setShowImportExport] = useState(false);

  // Extraire les catégories uniques
  const categories = useMemo(() => {
    const cats = new Set<string>();
    personas.forEach((p) => {
      if (p.category) {
        cats.add(p.category);
      }
    });
    return Array.from(cats).sort();
  }, [personas]);

  // Filtrer et rechercher les personas
  const filteredPersonas = useMemo(() => {
    let filtered = personas;

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
          p.category?.toLowerCase().includes(query) ||
          p.systemPrompt.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [personas, searchQuery, selectedCategory, showFavoritesOnly]);

  // Grouper par catégories
  const personasByCategory = useMemo(() => {
    const groups: Record<string, Persona[]> = {};

    filteredPersonas.forEach((persona) => {
      const category = persona.category || 'Sans catégorie';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(persona);
    });

    return groups;
  }, [filteredPersonas]);

  // Personas favorites
  const favoritePersonas = useMemo(() => {
    return personas.filter((p) => p.isFavorite);
  }, [personas]);

  // Ouvrir le modal pour créer une nouvelle persona
  const handleCreate = () => {
    setEditingPersona(null);
    setIsModalOpen(true);
  };

  // Ouvrir le modal pour éditer une persona
  const handleEdit = (persona: Persona) => {
    setEditingPersona(persona);
    setIsModalOpen(true);
  };

  // Fermer le modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPersona(null);
  };

  // Soumettre le formulaire (création ou édition)
  const handleSubmit = async (data: PersonaFormData) => {
    if (editingPersona) {
      // Édition
      await updatePersona(editingPersona.id, {
        ...data,
        tags: JSON.stringify(data.tags),
        fewShots: data.fewShots.length > 0 ? JSON.stringify(data.fewShots) : undefined,
      });
    } else {
      // Création
      const createData: CreatePersonaData = {
        ...data,
        tags: JSON.stringify(data.tags),
        fewShots: data.fewShots.length > 0 ? JSON.stringify(data.fewShots) : undefined,
        isDefault: false,
        isFavorite: false,
      };
      await createPersona(createData);
    }
  };

  const handleDelete = async (persona: Persona) => {
    if (persona.isDefault) {
      alert('Vous ne pouvez pas supprimer une persona par défaut');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer "${persona.name}" ?`)) {
      await deletePersona(persona.id);
    }
  };

  const handleDuplicate = async (persona: Persona) => {
    await duplicatePersona(persona.id);
  };

  const handleToggleFavorite = async (persona: Persona) => {
    await toggleFavorite(persona.id);
  };

  // Importer des personas depuis un fichier JSON
  const handleImport = async (importedPersonas: Persona[]) => {
    for (const persona of importedPersonas) {
      // Retirer les champs générés automatiquement
      const { id, createdAt, updatedAt, usageCount, ...personaData } = persona;

      // Créer la nouvelle persona
      await createPersona({
        ...personaData,
        isDefault: false,
        isFavorite: false,
      } as CreatePersonaData);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des personas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-2">Erreur lors du chargement des personas</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl 2xl:max-w-none 2xl:px-16 mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                🎭 Bibliothèque de Personas
              </h1>
              <p className="text-muted-foreground mt-2">
                Gérez vos assistants IA personnalisés
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
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Plus className="w-5 h-5" />
                Nouvelle Persona
              </button>
            </div>
          </div>

          {/* Section Import/Export */}
          {showImportExport && (
            <div className="mt-6 p-6 glass-card rounded-xl">
              <h3 className="text-lg font-semibold mb-4">Import / Export de Personas</h3>
              <PersonaImportExport personas={personas} onImport={handleImport} />
            </div>
          )}

          {/* Barre de recherche et filtres */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher une persona..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            {/* Filtre catégorie */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-w-[200px]"
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
            <span>{personas.length} personas au total</span>
            <span>•</span>
            <span>{favoritePersonas.length} favoris</span>
            <span>•</span>
            <span>{filteredPersonas.length} affichées</span>
          </div>
        </div>

        {/* Section Favorites */}
        {!showFavoritesOnly && favoritePersonas.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
              Favoris
            </h2>
            <PersonaList
              personas={favoritePersonas}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        )}

        {/* Liste des personas par catégorie */}
        {Object.keys(personasByCategory).length > 0 ? (
          <div className="space-y-12">
            {Object.entries(personasByCategory).map(([category, categoryPersonas]) => (
              <div key={category}>
                <h2 className="text-xl font-semibold mb-6">
                  {category} ({categoryPersonas.length})
                </h2>
                <PersonaList
                  personas={categoryPersonas}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                  onToggleFavorite={handleToggleFavorite}
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
                ? `Aucune persona ne correspond à "${searchQuery}"`
                : 'Aucune persona à afficher'}
            </p>
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      <PersonaModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        persona={editingPersona}
        title={editingPersona ? 'Éditer la Persona' : 'Nouvelle Persona'}
        submitLabel={editingPersona ? 'Sauvegarder' : 'Créer'}
      />
    </div>
  );
}
