import React, { useState } from 'react';
import { Plus, Trash2, Edit2, X, Check, Info, Folder } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import type { PersonaCategory } from '@blackia/shared/types';

const CATEGORY_COLORS = [
  { value: 'gray', label: 'Gris', class: 'bg-gray-500' },
  { value: 'red', label: 'Rouge', class: 'bg-red-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
  { value: 'yellow', label: 'Jaune', class: 'bg-yellow-500' },
  { value: 'green', label: 'Vert', class: 'bg-green-500' },
  { value: 'blue', label: 'Bleu', class: 'bg-blue-500' },
  { value: 'indigo', label: 'Indigo', class: 'bg-indigo-500' },
  { value: 'purple', label: 'Violet', class: 'bg-purple-500' },
  { value: 'pink', label: 'Rose', class: 'bg-pink-500' },
  { value: 'cyan', label: 'Cyan', class: 'bg-cyan-500' },
];

const CATEGORY_ICONS = [
  '⚙️', '💻', '✍️', '📊', '🎓', '🎨', '💼', '📢', '🔬', '📁',
  '🚀', '💡', '🎯', '🔍', '📚', '🎭', '🎬', '🎵', '🎮', '⚡',
  '🌟', '🔥', '💎', '🏆', '🎪', '🎨', '🖌️', '📝', '📖', '🗂️',
];

export function CategoriesSettings() {
  const { getAllCategories, addCategory, updateCategory, deleteCategory } = useSettings();
  const categories = getAllCategories();

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formColor, setFormColor] = useState('blue');
  const [formIcon, setFormIcon] = useState('📁');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtrer les catégories
  const filteredCategories = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddCategory = () => {
    if (formName.trim()) {
      addCategory({
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        color: formColor,
        icon: formIcon,
        isDefault: false,
      });

      resetForm();
      setShowAddForm(false);
    }
  };

  const handleUpdateCategory = (id: string) => {
    if (formName.trim()) {
      updateCategory(id, {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        color: formColor,
        icon: formIcon,
      });

      resetForm();
      setEditingCategory(null);
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette catégorie ?')) {
      deleteCategory(id);
    }
  };

  const startEdit = (category: PersonaCategory) => {
    setEditingCategory(category.id);
    setFormName(category.name);
    setFormDescription(category.description || '');
    setFormColor(category.color || 'blue');
    setFormIcon(category.icon || '📁');
    setShowAddForm(false);
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormColor('blue');
    setFormIcon('📁');
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    resetForm();
  };

  const cancelAdd = () => {
    setShowAddForm(false);
    resetForm();
  };

  // Statistiques
  const stats = {
    total: categories.length,
    default: categories.filter((c) => c.isDefault).length,
    custom: categories.filter((c) => !c.isDefault).length,
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Gestion des Catégories
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Gérez les catégories pour organiser vos personas et mots-clés de suggestions
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.total}</p>
        </div>
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Par défaut</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.default}</p>
        </div>
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Personnalisées</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.custom}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingCategory(null);
            resetForm();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter une catégorie
        </button>
      </div>

      {/* Formulaire d'ajout/édition */}
      {(showAddForm || editingCategory) && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">
            {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </h4>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nom</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ex: Data Science, DevOps..."
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Description de la catégorie..."
              rows={2}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Couleur
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setFormColor(color.value)}
                  className={`w-10 h-10 rounded-lg ${color.class} ${
                    formColor === color.value
                      ? 'ring-2 ring-offset-2 ring-purple-500'
                      : 'hover:scale-110'
                  } transition-all`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Icône
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setFormIcon(icon)}
                  className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center ${
                    formIcon === icon
                      ? 'bg-purple-100 dark:bg-purple-900/50 ring-2 ring-purple-500'
                      : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  } transition-all`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            {editingCategory ? (
              <>
                <button
                  onClick={() => handleUpdateCategory(editingCategory)}
                  disabled={!formName.trim()}
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
                  onClick={handleAddCategory}
                  disabled={!formName.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
                <button
                  onClick={cancelAdd}
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
        <Folder className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher une catégorie..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
      </div>

      {/* Liste des catégories */}
      <div className="space-y-2">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'Aucune catégorie trouvée' : 'Aucune catégorie configurée'}
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div
              key={category.id}
              className={`p-4 rounded-lg border transition-all ${
                editingCategory === category.id
                  ? 'ring-2 ring-purple-500 border-purple-300 dark:border-purple-700'
                  : 'border-gray-200 dark:border-gray-700'
              } bg-white dark:bg-gray-800`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Icône et couleur */}
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-${category.color}-500 bg-opacity-20`}
                  >
                    {category.icon || '📁'}
                  </div>

                  {/* Infos */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </span>
                      {category.isDefault && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                          Défaut
                        </span>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {category.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span
                        className={`w-3 h-3 rounded-full bg-${category.color}-500`}
                        title={category.color}
                      />
                      <span>ID: {category.id}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {!category.isDefault && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(category)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info */}
      <div className="flex gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <p className="font-medium mb-1">À propos des catégories</p>
          <p>
            Les catégories permettent d'organiser vos personas et les mots-clés de suggestions.
            Les catégories par défaut ne peuvent pas être modifiées ou supprimées, mais vous
            pouvez créer vos propres catégories personnalisées.
          </p>
        </div>
      </div>
    </div>
  );
}
