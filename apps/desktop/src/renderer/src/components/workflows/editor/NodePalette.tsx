import { WorkflowNodeRegistry } from './types';

interface NodePaletteProps {
  onAddNode: (type: string) => void;
}

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const nodeTypes = WorkflowNodeRegistry.getAll();

  // Grouper par catégorie
  const categories = {
    input: nodeTypes.filter((n) => n.category === 'input'),
    output: nodeTypes.filter((n) => n.category === 'output'),
    ai: nodeTypes.filter((n) => n.category === 'ai'),
    logic: nodeTypes.filter((n) => n.category === 'logic'),
    transform: nodeTypes.filter((n) => n.category === 'transform'),
    custom: nodeTypes.filter((n) => n.category === 'custom'),
  };

  const categoryLabels = {
    input: 'Entrée',
    output: 'Sortie',
    ai: 'Intelligence Artificielle',
    logic: 'Logique',
    transform: 'Transformation',
    custom: 'Personnalisés',
  };

  return (
    <div className="w-64 bg-gray-900/50 border-r border-white/10 overflow-y-auto">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
          Palette de nœuds
        </h3>

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

        {nodeTypes.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-8">
            Aucun type de nœud disponible
          </div>
        )}
      </div>
    </div>
  );
}
