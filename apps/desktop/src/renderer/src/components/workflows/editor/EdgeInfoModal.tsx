import { X, ArrowRight, Variable } from 'lucide-react';
import type { WorkflowEdge, WorkflowNode } from './types';

interface EdgeInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  edge: WorkflowEdge | null;
  sourceNode: WorkflowNode | null;
  targetNode: WorkflowNode | null;
  variables: Record<string, any>;
}

export function EdgeInfoModal({
  isOpen,
  onClose,
  edge,
  sourceNode,
  targetNode,
  variables,
}: EdgeInfoModalProps) {
  if (!isOpen || !edge || !sourceNode || !targetNode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <ArrowRight className="text-purple-400" size={24} />
            <div>
              <h2 className="text-2xl font-bold text-white">Information de Transition</h2>
              <p className="text-gray-400 text-sm mt-1">
                Variables transmises entre les nœuds
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

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Nodes Info */}
          <div className="grid grid-cols-2 gap-4">
            {/* Source Node */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Nœud source</div>
              <div className="font-semibold text-white">{sourceNode.data.label || sourceNode.type}</div>
              <div className="text-xs text-gray-500 mt-1">ID: {sourceNode.id}</div>
              {edge.sourceHandle && (
                <div className="text-xs text-purple-400 mt-2">
                  Handle: {edge.sourceHandle}
                </div>
              )}
            </div>

            {/* Target Node */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Nœud cible</div>
              <div className="font-semibold text-white">{targetNode.data.label || targetNode.type}</div>
              <div className="text-xs text-gray-500 mt-1">ID: {targetNode.id}</div>
              {edge.targetHandle && (
                <div className="text-xs text-purple-400 mt-2">
                  Handle: {edge.targetHandle}
                </div>
              )}
            </div>
          </div>

          {/* Edge Info */}
          {edge.label && (
            <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="text-sm text-purple-400 mb-1">Label</div>
              <div className="text-white">{edge.label}</div>
            </div>
          )}

          {/* Variables */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Variable className="text-purple-400" size={20} />
              <h3 className="text-lg font-semibold text-white">Variables Disponibles</h3>
            </div>

            {Object.keys(variables).length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(variables).map(([key, value]) => {
                  // Format value for display
                  let displayValue: string;
                  try {
                    if (typeof value === 'string') {
                      displayValue = value.length > 100 ? `${value.substring(0, 100)}...` : value;
                    } else if (typeof value === 'object' && value !== null) {
                      if (Array.isArray(value)) {
                        displayValue = `Array(${value.length})`;
                      } else {
                        displayValue = JSON.stringify(value, null, 2);
                        if (displayValue.length > 200) {
                          displayValue = `${displayValue.substring(0, 200)}...`;
                        }
                      }
                    } else {
                      displayValue = String(value);
                    }
                  } catch (e) {
                    displayValue = '[Error displaying value]';
                  }

                  return (
                    <div
                      key={key}
                      className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm text-purple-400 mb-1">
                            {`{{${key}}}`}
                          </div>
                          <div className="text-sm text-gray-300 break-words whitespace-pre-wrap font-mono">
                            {displayValue}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 shrink-0">
                          {typeof value === 'object' && value !== null
                            ? Array.isArray(value)
                              ? 'array'
                              : 'object'
                            : typeof value}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Variable className="mx-auto mb-2 opacity-50" size={32} />
                <p>Aucune variable disponible</p>
                <p className="text-xs mt-1">
                  Les variables seront créées lors de l'exécution du workflow
                </p>
              </div>
            )}
          </div>

          {/* Helper Text */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="text-sm text-blue-400">
              💡 <strong>Info:</strong> Les variables affichées ici sont celles qui seraient disponibles
              lors de l'exécution du workflow, basées sur les nœuds précédents dans le flux.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600
                     text-white transition-colors font-medium"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
