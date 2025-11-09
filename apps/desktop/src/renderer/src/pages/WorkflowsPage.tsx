import { useState } from 'react';
import { Plus, Search, Star, Layers, Filter, X, ArrowLeft, AlertCircle } from 'lucide-react';
import { useWorkflows, type ParsedWorkflow } from '../hooks/useWorkflows';
import { WorkflowList } from '../components/workflows/WorkflowList';
import { WorkflowModal } from '../components/workflows/WorkflowModal';
import { WorkflowExecutionPanel } from '../components/workflows/WorkflowExecutionPanel';
// TODO: Installer ReactFlow avec: pnpm add reactflow
// import { WorkflowEditor } from '../components/workflows/WorkflowEditor';

// WorkflowEditor temporairement désactivé car ReactFlow n'est pas installé
const EDITOR_AVAILABLE = false;

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

  // Gestion du filtre et de la recherche
  useState(() => {
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
  }, [workflows, searchQuery, activeFilter]);

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
    const duplicated = await duplicateWorkflow(id);
    if (duplicated) {
      console.log('Workflow dupliqué:', duplicated.name);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce workflow ?')) {
      const success = await deleteWorkflow(id);
      if (success) {
        console.log('Workflow supprimé');
      }
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
        <div className="flex-1 overflow-hidden p-8">
          {EDITOR_AVAILABLE ? (
            <div>
              {/* TODO: Uncomment when ReactFlow is installed */}
              {/* <WorkflowEditor
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
              /> */}
            </div>
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
    <div className="h-full overflow-auto p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Workflows</h1>
          <p className="text-gray-400">
            Créez et exécutez des flux d'automatisation pour vos tâches IA
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          {/* Search */}
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Rechercher un workflow..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-lg bg-white/5 border border-white/10
                         text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50
                         focus:ring-2 focus:ring-purple-500/20 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2.5 rounded-lg border transition-colors flex items-center gap-2 ${
                activeFilter === 'all'
                  ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                  : 'border-white/10 text-gray-400 hover:bg-white/5'
              }`}
            >
              <Layers size={16} />
              Tous
            </button>
            <button
              onClick={() => setActiveFilter('favorites')}
              className={`px-4 py-2.5 rounded-lg border transition-colors flex items-center gap-2 ${
                activeFilter === 'favorites'
                  ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                  : 'border-white/10 text-gray-400 hover:bg-white/5'
              }`}
            >
              <Star size={16} />
              Favoris
            </button>
            <button
              onClick={() => setActiveFilter('templates')}
              className={`px-4 py-2.5 rounded-lg border transition-colors flex items-center gap-2 ${
                activeFilter === 'templates'
                  ? 'bg-purple-500/20 border-purple-500/30 text-purple-400'
                  : 'border-white/10 text-gray-400 hover:bg-white/5'
              }`}
            >
              <Filter size={16} />
              Templates
            </button>
          </div>

          {/* Create button */}
          <button
            onClick={handleCreateWorkflow}
            className="px-6 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-600
                     text-white font-medium transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            Nouveau Workflow
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-2xl font-bold text-white">{workflows.length}</div>
            <div className="text-sm text-gray-400">Total workflows</div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-2xl font-bold text-purple-400">
              {workflows.filter((w) => w.isFavorite).length}
            </div>
            <div className="text-sm text-gray-400">Favoris</div>
          </div>
          <div className="p-4 rounded-lg bg-white/5 border border-white/10">
            <div className="text-2xl font-bold text-blue-400">
              {workflows.filter((w) => w.isTemplate).length}
            </div>
            <div className="text-sm text-gray-400">Templates disponibles</div>
          </div>
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
