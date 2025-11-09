import { Star, Copy, Trash2, Play, Edit2 } from 'lucide-react';
import type { ParsedWorkflow } from '../../hooks/useWorkflows';

interface WorkflowCardProps {
  workflow: ParsedWorkflow;
  onSelect: (workflow: ParsedWorkflow) => void;
  onToggleFavorite: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onExecute?: (id: string) => void;
}

export function WorkflowCard({
  workflow,
  onSelect,
  onToggleFavorite,
  onDuplicate,
  onDelete,
  onExecute,
}: WorkflowCardProps) {
  const colorClasses = {
    purple: 'bg-purple-500/20 border-purple-500/30 text-purple-400',
    blue: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    pink: 'bg-pink-500/20 border-pink-500/30 text-pink-400',
    green: 'bg-green-500/20 border-green-500/30 text-green-400',
    orange: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
  };

  const colorClass = colorClasses[workflow.color as keyof typeof colorClasses] || colorClasses.purple;

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      onClick={() => onSelect(workflow)}
      className="group relative p-4 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm
                 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          <div className={`text-2xl p-2 rounded-lg border ${colorClass}`}>
            {workflow.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white truncate">
                {workflow.name}
              </h3>
              {workflow.isTemplate && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Template
                </span>
              )}
            </div>
            <p className="text-sm text-gray-400 line-clamp-2 mt-1">
              {workflow.description}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={(e) => handleAction(e, () => onToggleFavorite(workflow.id))}
            className={`p-2 rounded-lg transition-colors ${
              workflow.isFavorite
                ? 'text-yellow-400 hover:text-yellow-300'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            title={workflow.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Star size={16} fill={workflow.isFavorite ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
        <span>{workflow.nodes.length} nœuds</span>
        <span>{workflow.edges.length} connexions</span>
        {workflow.usageCount > 0 && (
          <span>{workflow.usageCount} exécution{workflow.usageCount > 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Tags */}
      {workflow.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {workflow.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs rounded-md bg-white/5 text-gray-400 border border-white/10"
            >
              {tag}
            </span>
          ))}
          {workflow.tags.length > 3 && (
            <span className="px-2 py-1 text-xs rounded-md bg-white/5 text-gray-400 border border-white/10">
              +{workflow.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Category */}
      {workflow.category && (
        <div className="mb-3">
          <span className="text-xs text-gray-500">{workflow.category}</span>
        </div>
      )}

      {/* Actions bar */}
      <div className="flex items-center gap-2 pt-3 border-t border-white/5">
        {onExecute && (
          <button
            onClick={(e) => handleAction(e, () => onExecute(workflow.id))}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg
                     bg-purple-500/20 hover:bg-purple-500/30 text-purple-400
                     border border-purple-500/30 transition-colors text-sm font-medium"
          >
            <Play size={14} />
            Exécuter
          </button>
        )}
        <button
          onClick={(e) => handleAction(e, () => onSelect(workflow))}
          className="p-2 rounded-lg hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-colors border border-transparent hover:border-blue-500/30"
          title="Éditer"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={(e) => handleAction(e, () => onDuplicate(workflow.id))}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-300 transition-colors"
          title="Dupliquer"
        >
          <Copy size={16} />
        </button>
        {!workflow.isTemplate && (
          <button
            onClick={(e) => handleAction(e, () => onDelete(workflow.id))}
            className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
            title="Supprimer"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
