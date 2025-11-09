import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { WorkflowNodeRegistry } from './types';

interface NodePaletteProps {
  onAddNode: (type: string) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const nodeTypes = WorkflowNodeRegistry.getAll();

  // Filtrer les nodes selon la recherche
  const filteredNodeTypes = useMemo(() => {
    if (!searchQuery.trim()) return nodeTypes;

    const query = searchQuery.toLowerCase();
    return nodeTypes.filter(
      (node) =>
        node.label.toLowerCase().includes(query) ||
        node.description.toLowerCase().includes(query) ||
        node.type.toLowerCase().includes(query)
    );
  }, [nodeTypes, searchQuery]);

  // Grouper par catégorie
  const categories = useMemo(() => ({
    input: filteredNodeTypes.filter((n) => n.category === 'input'),
    output: filteredNodeTypes.filter((n) => n.category === 'output'),
    ai: filteredNodeTypes.filter((n) => n.category === 'ai'),
    logic: filteredNodeTypes.filter((n) => n.category === 'logic'),
    transform: filteredNodeTypes.filter((n) => n.category === 'transform'),
    custom: filteredNodeTypes.filter((n) => n.category === 'custom'),
  }), [filteredNodeTypes]);

  const categoryLabels = {
    input: 'Entrée',
    output: 'Sortie',
    ai: 'Intelligence Artificielle',
    logic: 'Logique',
    transform: 'Transformation',
    custom: 'Personnalisés',
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="w-64 bg-gray-900/50 border-r border-white/10 overflow-y-auto flex flex-col">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
          Palette de nœuds
        </h3>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un nœud..."
            className="w-full pl-10 pr-8 py-2 rounded-lg bg-white/5 border border-white/10
                     text-white text-sm placeholder-gray-500 focus:outline-none
                     focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20
                     transition-colors"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/10
                       text-gray-500 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {searchQuery && (
          <div className="mt-2 text-xs text-gray-500">
            {filteredNodeTypes.length} résultat{filteredNodeTypes.length > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {Object.entries(categories).map(([category, nodes]) => {
            if (nodes.length === 0) return null;

            return (
              <div key={category}>
                <h4 className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h4>
                <div className="space-y-2">
                  {nodes.map((nodeType) => (
                    <button
                      key={nodeType.type}
                      onClick={() => onAddNode(nodeType.type)}
                      className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10
                               hover:border-purple-500/30 transition-all text-left group"
                      style={{
                        borderLeftColor: nodeType.color,
                        borderLeftWidth: '3px',
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{nodeType.icon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">
                            {nodeType.label}
                          </div>
                          <div className="text-xs text-gray-500">{nodeType.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {filteredNodeTypes.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-8">
            {searchQuery ? (
              <>
                Aucun nœud trouvé pour "{searchQuery}"
                <button
                  onClick={handleClearSearch}
                  className="block mx-auto mt-2 text-purple-400 hover:text-purple-300 text-xs"
                >
                  Effacer la recherche
                </button>
              </>
            ) : (
              'Aucun type de nœud disponible'
            )}
          </div>
        )}
      </div>
    </div>
  );
}
