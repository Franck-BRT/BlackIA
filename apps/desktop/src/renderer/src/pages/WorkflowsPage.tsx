import { useState } from 'react';
import { Plus, Search, Star, Layers, Filter, X } from 'lucide-react';
import { useWorkflows, type ParsedWorkflow } from '../hooks/useWorkflows';
import { WorkflowList } from '../components/workflows/WorkflowList';
import { WorkflowModal } from '../components/workflows/WorkflowModal';

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
    setSelectedWorkflow(null);
    setIsModalOpen(true);
  };

  const handleSelectWorkflow = (workflow: ParsedWorkflow) => {
    // TODO: Ouvrir l'éditeur de workflow
    console.log('Open workflow editor for:', workflow.id);
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
    // TODO: Implémenter l'exécution
    console.log('Execute workflow:', id);
  };

  const displayedWorkflows = searchQuery || activeFilter !== 'all' ? filteredWorkflows : workflows;

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
          onSubmit={createWorkflow}
          workflow={selectedWorkflow}
          title={selectedWorkflow ? 'Modifier le workflow' : 'Nouveau Workflow'}
        />
      </div>
    </div>
  );
}
