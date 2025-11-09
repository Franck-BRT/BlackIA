import { useState } from 'react';
import { X, Save } from 'lucide-react';
import type { WorkflowNode } from './types';
import { getNodeIcon, getNodeColor } from './defaultNodes';

interface NodeConfigModalProps {
  node: WorkflowNode;
  onUpdate: (data: Record<string, unknown>) => void;
  onClose: () => void;
}

export function NodeConfigModal({ node, onUpdate, onClose }: NodeConfigModalProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(node.data);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const nodeIcon = getNodeIcon(node.type);
  const nodeColor = getNodeColor(node.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div
          className="flex items-center justify-between p-6 border-b border-white/10"
          style={{ borderLeftColor: nodeColor, borderLeftWidth: '4px' }}
        >
          <div className="flex items-center gap-3">
            <div className="text-3xl">{nodeIcon}</div>
            <div>
              <h2 className="text-2xl font-bold text-white">Configuration du nœud</h2>
              <p className="text-gray-400 text-sm mt-1">{node.type}</p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6 space-y-6">
          {/* Label (commun à tous les nodes) */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Label du nœud
            </label>
            <input
              type="text"
              value={(formData.label as string) || ''}
              onChange={(e) => handleChange('label', e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10
                       text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50
                       focus:ring-2 focus:ring-purple-500/20 transition-colors"
              placeholder="Ex: Mon nœud"
            />
          </div>

          {/* Configuration spécifique selon le type */}
          {node.type === 'input' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Valeur par défaut
              </label>
              <textarea
                value={(formData.inputValue as string) || ''}
                onChange={(e) => handleChange('inputValue', e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10
                         text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50
                         focus:ring-2 focus:ring-purple-500/20 transition-colors resize-none"
                placeholder="Valeur d'entrée par défaut..."
              />
              <p className="text-xs text-gray-500 mt-2">
                Cette valeur sera utilisée si aucune donnée n'est fournie lors de l'exécution
              </p>
            </div>
          )}

          {node.type === 'aiPrompt' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Template du prompt
                </label>
                <textarea
                  value={(formData.promptTemplate as string) || ''}
                  onChange={(e) => handleChange('promptTemplate', e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10
                           text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50
                           focus:ring-2 focus:ring-purple-500/20 transition-colors resize-none
                           font-mono text-sm"
                  placeholder="Entrez votre prompt ici... Utilisez {{input}} et {{lastValue}} pour interpoler les variables."
                />
                <p className="text-xs text-gray-500 mt-2">
                  Variables disponibles: <code className="px-1 py-0.5 rounded bg-white/10">{'{{input}}'}</code>,{' '}
                  <code className="px-1 py-0.5 rounded bg-white/10">{'{{lastValue}}'}</code>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Modèle
                  </label>
                  <select
                    value={(formData.model as string) || 'llama3.2:latest'}
                    onChange={(e) => handleChange('model', e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10
                             text-white focus:outline-none focus:border-purple-500/50
                             focus:ring-2 focus:ring-purple-500/20 transition-colors"
                  >
                    <option value="llama3.2:latest">llama3.2:latest</option>
                    <option value="llama3.2:3b">llama3.2:3b</option>
                    <option value="llama3.1:8b">llama3.1:8b</option>
                    <option value="mistral:latest">mistral:latest</option>
                    <option value="codellama:latest">codellama:latest</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Temperature ({(formData.temperature as number) || 0.7})
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={(formData.temperature as number) || 0.7}
                    onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Précis</span>
                    <span>Créatif</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Tokens maximum
                </label>
                <input
                  type="number"
                  value={(formData.maxTokens as number) || 2000}
                  onChange={(e) => handleChange('maxTokens', parseInt(e.target.value))}
                  min={100}
                  max={8000}
                  step={100}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10
                           text-white focus:outline-none focus:border-purple-500/50
                           focus:ring-2 focus:ring-purple-500/20 transition-colors"
                />
              </div>
            </>
          )}

          {node.type === 'condition' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Condition
              </label>
              <input
                type="text"
                value={(formData.condition as string) || ''}
                onChange={(e) => handleChange('condition', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10
                         text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50
                         focus:ring-2 focus:ring-purple-500/20 transition-colors font-mono"
                placeholder="Ex: lastValue.length > 10"
              />
              <p className="text-xs text-gray-500 mt-2">
                Expression JavaScript évaluée sur les variables du contexte
              </p>
            </div>
          )}

          {node.type === 'loop' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type de boucle
                </label>
                <select
                  value={(formData.loopType as string) || 'count'}
                  onChange={(e) => handleChange('loopType', e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10
                           text-white focus:outline-none focus:border-purple-500/50
                           focus:ring-2 focus:ring-purple-500/20 transition-colors"
                >
                  <option value="count">Nombre d'itérations</option>
                  <option value="forEach">Pour chaque élément</option>
                  <option value="while">Tant que</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nombre d'itérations
                </label>
                <input
                  type="number"
                  value={(formData.loopCount as number) || 3}
                  onChange={(e) => handleChange('loopCount', parseInt(e.target.value))}
                  min={1}
                  max={100}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10
                           text-white focus:outline-none focus:border-purple-500/50
                           focus:ring-2 focus:ring-purple-500/20 transition-colors"
                />
              </div>
            </div>
          )}

          {node.type === 'transform' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Type de transformation
              </label>
              <select
                value={(formData.transformType as string) || 'format'}
                onChange={(e) => handleChange('transformType', e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10
                         text-white focus:outline-none focus:border-purple-500/50
                         focus:ring-2 focus:ring-purple-500/20 transition-colors"
              >
                <option value="format">Format JSON</option>
                <option value="extract">Extraire des champs</option>
                <option value="merge">Fusionner</option>
              </select>
            </div>
          )}

          {node.type === 'output' && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-sm text-blue-400">
                Le nœud de sortie capture automatiquement la dernière valeur du workflow.
                Aucune configuration supplémentaire n'est nécessaire.
              </p>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-white/10 text-gray-300
                     hover:bg-white/5 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-600
                     text-white transition-colors flex items-center gap-2"
          >
            <Save size={16} />
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
