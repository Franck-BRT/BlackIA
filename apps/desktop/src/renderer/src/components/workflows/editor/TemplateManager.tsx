import { useState, useCallback, useEffect } from 'react';
import { Save, Folder, Search, X, Download, Upload, Star, Copy } from 'lucide-react';
import type { WorkflowTemplate, WorkflowNode, WorkflowEdge } from './types';
import { defaultTemplates } from '../../../../../shared/default-templates';
import {
  templateCategories,
  getCategoryIcon,
  getCategoryLabel,
} from '../../../../../shared/template-categories';

// Clé localStorage pour les templates par défaut
const DEFAULT_TEMPLATES_KEY = 'blackia_default_templates_initialized';

/**
 * Vérifier si les templates par défaut ont déjà été initialisés
 */
function areDefaultTemplatesInitialized(): boolean {
  return localStorage.getItem(DEFAULT_TEMPLATES_KEY) === 'true';
}

/**
 * Marquer les templates par défaut comme initialisés
 */
function markDefaultTemplatesAsInitialized(): void {
  localStorage.setItem(DEFAULT_TEMPLATES_KEY, 'true');
}

interface TemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: WorkflowTemplate) => void;
  currentNodes: WorkflowNode[];
  currentEdges: WorkflowEdge[];
}

export function TemplateManager({
  isOpen,
  onClose,
  onApplyTemplate,
  currentNodes,
  currentEdges,
}: TemplateManagerProps) {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDesc, setNewTemplateDesc] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState('general');

  // Créer un template depuis le workflow actuel
  const handleCreateTemplate = useCallback(async () => {
    if (!newTemplateName.trim()) return;

    const templateData = {
      name: newTemplateName,
      description: newTemplateDesc,
      category: newTemplateCategory,
      tags: '[]',
      nodes: JSON.stringify(currentNodes),
      edges: JSON.stringify(currentEdges),
    };

    const result = await window.electronAPI.workflowTemplates.create(templateData);

    if (result.success) {
      setTemplates((prev) => [...prev, result.data]);
      setIsCreating(false);
      setNewTemplateName('');
      setNewTemplateDesc('');
    } else {
      console.error('Failed to create template:', result.error);
      alert('Erreur lors de la création du template');
    }
  }, [newTemplateName, newTemplateDesc, newTemplateCategory, currentNodes, currentEdges]);

  // Charger les templates au montage
  useEffect(() => {
    const initializeDefaultTemplates = async () => {
      // Vérifier si les templates par défaut ont déjà été créés
      if (!areDefaultTemplatesInitialized()) {
        console.log('Initializing default templates...');

        // Créer chaque template par défaut
        for (const template of defaultTemplates) {
          try {
            await window.electronAPI.workflowTemplates.create(template);
          } catch (error) {
            console.error(`Failed to create default template "${template.name}":`, error);
          }
        }

        // Marquer comme initialisés
        markDefaultTemplatesAsInitialized();
        console.log('Default templates initialized successfully');
      }
    };

    const loadTemplates = async () => {
      // Initialiser les templates par défaut si nécessaire
      await initializeDefaultTemplates();

      const result = await window.electronAPI.workflowTemplates.getAll();
      if (result.success) {
        // Parse nodes and edges from JSON strings to objects for display
        const parsedTemplates = result.data.map((t: any) => ({
          ...t,
          nodes: typeof t.nodes === 'string' ? JSON.parse(t.nodes) : t.nodes,
          edges: typeof t.edges === 'string' ? JSON.parse(t.edges) : t.edges,
          tags: typeof t.tags === 'string' ? JSON.parse(t.tags) : t.tags,
        }));
        setTemplates(parsedTemplates);
      } else {
        console.error('Failed to load templates:', result.error);
      }
    };

    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  // Filtrer les templates
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Catégories disponibles
  const categories = ['all', ...new Set(templates.map((t) => t.category))];

  // Supprimer un template
  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    const result = await window.electronAPI.workflowTemplates.delete(templateId);

    if (result.success) {
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    } else {
      console.error('Failed to delete template:', result.error);
      alert('Erreur lors de la suppression du template');
    }
  }, []);

  // Exporter un template
  const handleExportTemplate = useCallback((template: WorkflowTemplate) => {
    const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `template-${template.name}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  // Importer un template
  const handleImportTemplate = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const template = JSON.parse(event.target?.result as string);

          // Create template via IPC
          const templateData = {
            name: template.name,
            description: template.description,
            category: template.category || 'imported',
            tags: JSON.stringify(template.tags || []),
            nodes: JSON.stringify(template.nodes),
            edges: JSON.stringify(template.edges),
          };

          const result = await window.electronAPI.workflowTemplates.create(templateData);

          if (result.success) {
            setTemplates((prev) => [
              ...prev,
              {
                ...result.data,
                nodes: JSON.parse(result.data.nodes),
                edges: JSON.parse(result.data.edges),
                tags: JSON.parse(result.data.tags),
              },
            ]);
          } else {
            console.error('Failed to import template:', result.error);
            alert('Erreur lors de l\'importation du template');
          }
        } catch (error) {
          console.error('Failed to import template:', error);
          alert('Erreur lors de l\'importation du template');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Folder className="text-purple-400" size={24} />
            <div>
              <h2 className="text-2xl font-bold text-white">Bibliothèque de Templates</h2>
              <p className="text-gray-400 text-sm mt-1">
                {templates.length} template{templates.length > 1 ? 's' : ''} disponible{templates.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3 p-4 border-b border-white/10">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un template..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10
                       text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Categories */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white
                     focus:outline-none focus:border-purple-500/50"
          >
            <option value="all">📚 Toutes les catégories</option>
            {templateCategories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.icon} {cat.label}
              </option>
            ))}
          </select>

          {/* Actions */}
          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white
                     transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            Créer Template
          </button>

          <button
            onClick={handleImportTemplate}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400
                     hover:text-white transition-colors"
            title="Importer"
          >
            <Upload size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isCreating ? (
            <div className="max-w-2xl mx-auto p-6 rounded-lg bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Créer un nouveau template</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nom</label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Mon super template"
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white
                             placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={newTemplateDesc}
                    onChange={(e) => setNewTemplateDesc(e.target.value)}
                    rows={3}
                    placeholder="Description du template..."
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white
                             placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Catégorie</label>
                  <select
                    value={newTemplateCategory}
                    onChange={(e) => setNewTemplateCategory(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white
                             focus:outline-none focus:border-purple-500/50"
                  >
                    {templateCategories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {templateCategories.find((c) => c.value === newTemplateCategory)?.description}
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCreateTemplate}
                    className="flex-1 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white"
                  >
                    Créer
                  </button>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="flex-1 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30
                           transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{template.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                        <span>{getCategoryIcon(template.category)}</span>
                        <span>{getCategoryLabel(template.category)}</span>
                      </div>
                    </div>
                    {template.usageCount && template.usageCount > 0 && (
                      <div className="flex items-center gap-1 text-xs text-yellow-400">
                        <Star size={12} />
                        {template.usageCount}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{template.description}</p>
                  <div className="text-xs text-gray-500 mb-4">
                    {template.nodes.length} nœuds • {template.edges.length} connexions
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        // Increment usage count
                        await window.electronAPI.workflowTemplates.incrementUsage(template.id);
                        onApplyTemplate(template);
                        onClose();
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30
                               border border-purple-500/30 text-purple-400 text-sm transition-colors
                               flex items-center justify-center gap-2"
                    >
                      <Copy size={14} />
                      Utiliser
                    </button>
                    <button
                      onClick={() => handleExportTemplate(template)}
                      className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400"
                      title="Exporter"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 rounded-lg border border-white/10 hover:bg-red-500/20 text-gray-400
                               hover:text-red-400"
                      title="Supprimer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isCreating && filteredTemplates.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {searchQuery || selectedCategory !== 'all' ? (
                <>
                  Aucun template trouvé
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="block mx-auto mt-2 text-purple-400 hover:text-purple-300"
                  >
                    Réinitialiser les filtres
                  </button>
                </>
              ) : (
                <>
                  Aucun template disponible
                  <br />
                  <button
                    onClick={() => setIsCreating(true)}
                    className="mt-2 text-purple-400 hover:text-purple-300"
                  >
                    Créer votre premier template
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
