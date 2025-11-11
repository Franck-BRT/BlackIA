import { useState, useEffect } from 'react';
import { Plus, Search, Star, Layers, Filter, X, ArrowLeft, AlertCircle, FileDown, ChevronDown, ChevronUp } from 'lucide-react';
import { useWorkflows, type ParsedWorkflow } from '../hooks/useWorkflows';
import { WorkflowList } from '../components/workflows/WorkflowList';
import { WorkflowModal } from '../components/workflows/WorkflowModal';
import { WorkflowExecutionPanel } from '../components/workflows/WorkflowExecutionPanel';
import { WorkflowEditor } from '../components/workflows/WorkflowEditor';

// SimpleWorkflowEditor (custom, sans dépendances) est maintenant disponible
const EDITOR_AVAILABLE = true;

export function WorkflowsPage() {
  const {
    workflows,
    loading,
    error,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleFavorite,
    duplicateWorkflow,
    getTemplates,
    getFavorites,
  } = useWorkflows();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<ParsedWorkflow | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'favorites' | 'templates'>('all');
  const [filteredWorkflows, setFilteredWorkflows] = useState<ParsedWorkflow[]>([]);
  const [executingWorkflow, setExecutingWorkflow] = useState<ParsedWorkflow | null>(null);
  const [editingWorkflow, setEditingWorkflow] = useState<ParsedWorkflow | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showImportExport, setShowImportExport] = useState(false);

  // Gestion du filtre et de la recherche
  useEffect(() => {
    const applyFilters = async () => {
      let result: ParsedWorkflow[] = workflows;

      // Filtre actif
      if (activeFilter === 'favorites') {
        result = await getFavorites();
      } else if (activeFilter === 'templates') {
        result = await getTemplates();
      }

      // Recherche
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        result = result.filter(
          (w) =>
            w.name.toLowerCase().includes(query) ||
            w.description.toLowerCase().includes(query) ||
            w.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      }

      setFilteredWorkflows(result);
    };

    applyFilters();
  }, [workflows, searchQuery, activeFilter, getFavorites, getTemplates]);

  const handleCreateWorkflow = async () => {
    // Ouvrir le modal pour saisir les infos de base
    setSelectedWorkflow(null);
    setIsModalOpen(true);
  };

  const handleWorkflowCreated = async (workflowData: any) => {
    // Créer le workflow avec des nodes/edges vides
    const newWorkflow = await createWorkflow({
      ...workflowData,
      nodes: JSON.stringify([]),
      edges: JSON.stringify([]),
    });

    // Fermer le modal
    setIsModalOpen(false);

    // Ouvrir l'éditeur avec ce nouveau workflow
    if (newWorkflow) {
      setEditingWorkflow(newWorkflow);
      setIsCreatingNew(false);
    }
  };

  const handleSelectWorkflow = (workflow: ParsedWorkflow) => {
    setEditingWorkflow(workflow);
    setIsCreatingNew(false);
  };

  const handleCloseEditor = () => {
    setEditingWorkflow(null);
    setIsCreatingNew(false);
  };

  const handleDuplicateWorkflow = async (id: string) => {
    await duplicateWorkflow(id);
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce workflow ?')) {
      await deleteWorkflow(id);
    }
  };

  const handleExecuteWorkflow = async (id: string) => {
    const workflow = workflows.find((w) => w.id === id);
    if (workflow) {
      setExecutingWorkflow(workflow);
    }
  };

  const displayedWorkflows = searchQuery || activeFilter !== 'all' ? filteredWorkflows : workflows;

  // Si on est en mode édition, afficher l'éditeur
  if (editingWorkflow || isCreatingNew) {
    return (
      <div className="h-full flex flex-col bg-gray-900">
        {/* Editor Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gray-900/95 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCloseEditor}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">
                {isCreatingNew ? 'Nouveau Workflow' : editingWorkflow?.name}
              </h1>
              <p className="text-sm text-gray-400">
                {isCreatingNew ? 'Créez votre workflow personnalisé' : 'Éditeur de workflow'}
              </p>
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          {EDITOR_AVAILABLE ? (
            <WorkflowEditor
              workflow={editingWorkflow || undefined}
              onSave={async (workflowData) => {
                const dataToSave = {
                  ...workflowData,
                  nodes: JSON.stringify(workflowData.nodes),
                  edges: JSON.stringify(workflowData.edges),
                };

                if (editingWorkflow) {
                  await updateWorkflow(editingWorkflow.id, dataToSave);
                } else {
                  await createWorkflow(dataToSave);
                }
                handleCloseEditor();
              }}
              onCancel={handleCloseEditor}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="max-w-2xl text-center space-y-6">
                <AlertCircle className="mx-auto text-yellow-400" size={64} />
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Éditeur visuel non disponible
                  </h2>
                  <p className="text-gray-400 mb-4">
                    L'éditeur visuel de workflows nécessite ReactFlow qui n'a pas pu être installé.
                  </p>
                </div>
                <div className="p-6 rounded-lg bg-white/5 border border-white/10 text-left">
                  <h3 className="text-lg font-semibold text-white mb-3">Pour activer l'éditeur :</h3>
                  <ol className="space-y-2 text-gray-300">
                    <li className="flex gap-3">
                      <span className="text-purple-400 font-bold">1.</span>
                      <span>Installez ReactFlow : <code className="px-2 py-1 rounded bg-black/30 text-purple-400">pnpm add reactflow</code></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-purple-400 font-bold">2.</span>
                      <span>Décommentez l'import dans <code className="px-2 py-1 rounded bg-black/30">WorkflowsPage.tsx</code></span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-purple-400 font-bold">3.</span>
                      <span>Changez <code className="px-2 py-1 rounded bg-black/30">EDITOR_AVAILABLE = true</code></span>
                    </li>
                  </ol>
                </div>
                <div className="pt-4">
                  <p className="text-sm text-gray-500">
                    En attendant, vous pouvez exécuter les workflows templates existants.
                  </p>
                </div>
              </div>
            </div>
          )}
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
                ⚡ Workflows
              </h1>
              <p className="text-muted-foreground mt-2">
                Créez et exécutez des flux d'automatisation pour vos tâches IA
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
                onClick={handleCreateWorkflow}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl font-semibold flex items-center gap-2 hover:scale-105 transition-transform"
              >
                <Plus className="w-5 h-5" />
                Nouveau Workflow
              </button>
            </div>
          </div>

          {/* Section Import/Export */}
          {showImportExport && (
            <div className="mt-6 p-6 glass-card rounded-xl">
              <h3 className="text-lg font-semibold mb-4">Import / Export de Workflows</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Fonctionnalité d'import/export de workflows à venir
              </p>
            </div>
          )}
        </div>

        {/* Barre de recherche et filtres */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher un workflow..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          {/* Toggle favoris */}
          <button
            onClick={() => setActiveFilter(activeFilter === 'favorites' ? 'all' : 'favorites')}
            className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-all ${
              activeFilter === 'favorites'
                ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 ring-2 ring-yellow-500/50'
                : 'glass-card hover:glass-lg'
            }`}
          >
            <Star
              className="w-5 h-5"
              fill={activeFilter === 'favorites' ? 'currentColor' : 'none'}
            />
            Favoris
          </button>

          {/* Toggle templates */}
          <button
            onClick={() => setActiveFilter(activeFilter === 'templates' ? 'all' : 'templates')}
            className={`px-4 py-3 rounded-xl flex items-center gap-2 transition-all ${
              activeFilter === 'templates'
                ? 'bg-gradient-to-r from-blue-500/20 to-blue-600/20 ring-2 ring-blue-500/50'
                : 'glass-card hover:glass-lg'
            }`}
          >
            <Filter className="w-5 h-5" />
            Templates
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-8 text-sm text-muted-foreground">
          <span>{workflows.length} workflows au total</span>
          <span>•</span>
          <span>{workflows.filter((w) => w.isFavorite).length} favoris</span>
          <span>•</span>
          <span>{workflows.filter((w) => w.isTemplate).length} templates</span>
          <span>•</span>
          <span>{displayedWorkflows.length} affichés</span>
        </div>

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-gray-400">Chargement des workflows...</div>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400">
            Erreur: {error}
          </div>
        )}

        {!loading && !error && (
          <WorkflowList
            workflows={displayedWorkflows}
            onSelect={handleSelectWorkflow}
            onToggleFavorite={toggleFavorite}
            onDuplicate={handleDuplicateWorkflow}
            onDelete={handleDeleteWorkflow}
            onExecute={handleExecuteWorkflow}
            emptyMessage={
              searchQuery
                ? 'Aucun workflow ne correspond à votre recherche'
                : activeFilter === 'favorites'
                  ? 'Aucun workflow favori'
                  : activeFilter === 'templates'
                    ? 'Aucun template disponible'
                    : 'Aucun workflow'
            }
          />
        )}

        {/* Modal */}
        <WorkflowModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={selectedWorkflow ? async (data) => {
            await updateWorkflow(selectedWorkflow.id, data);
            setIsModalOpen(false);
          } : handleWorkflowCreated}
          workflow={selectedWorkflow}
          title={selectedWorkflow ? 'Modifier le workflow' : 'Nouveau Workflow'}
        />

        {/* Execution Panel */}
        {executingWorkflow && (
          <WorkflowExecutionPanel
            workflowId={executingWorkflow.id}
            workflowName={executingWorkflow.name}
            onClose={() => setExecutingWorkflow(null)}
          />
        )}
      </div>
    </div>
  );
}
