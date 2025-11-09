import { useState, useCallback } from 'react';
import { Variable, Plus, X, Edit2, Lock, Unlock, Save, Search } from 'lucide-react';
import type { GlobalVariable } from './types';

interface VariablesManagerProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId?: string;
}

export function VariablesManager({ isOpen, onClose, workflowId }: VariablesManagerProps) {
  const [variables, setVariables] = useState<GlobalVariable[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<'all' | 'workflow' | 'global' | 'environment'>('all');
  const [editingVar, setEditingVar] = useState<GlobalVariable | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formValue, setFormValue] = useState('');
  const [formType, setFormType] = useState<GlobalVariable['type']>('string');
  const [formScope, setFormScope] = useState<GlobalVariable['scope']>('workflow');
  const [formDesc, setFormDesc] = useState('');
  const [formEncrypted, setFormEncrypted] = useState(false);

  // Charger les variables au montage
  useState(() => {
    const globalVars = localStorage.getItem('global-variables');
    const workflowVars = workflowId
      ? localStorage.getItem(`workflow-variables-${workflowId}`)
      : null;

    const allVars: GlobalVariable[] = [];

    if (globalVars) {
      try {
        allVars.push(...JSON.parse(globalVars));
      } catch (e) {
        console.error('Failed to load global variables', e);
      }
    }

    if (workflowVars) {
      try {
        allVars.push(...JSON.parse(workflowVars));
      } catch (e) {
        console.error('Failed to load workflow variables', e);
      }
    }

    setVariables(allVars);
  });

  // Sauvegarder les variables
  const saveVariables = useCallback((vars: GlobalVariable[]) => {
    const global = vars.filter((v) => v.scope === 'global' || v.scope === 'environment');
    const workflow = vars.filter((v) => v.scope === 'workflow');

    localStorage.setItem('global-variables', JSON.stringify(global));
    if (workflowId) {
      localStorage.setItem(`workflow-variables-${workflowId}`, JSON.stringify(workflow));
    }
  }, [workflowId]);

  // Créer ou mettre à jour une variable
  const handleSave = useCallback(() => {
    if (!formName.trim()) {
      alert('Le nom de la variable est requis');
      return;
    }

    let parsedValue: unknown = formValue;

    // Parser la valeur selon le type
    try {
      switch (formType) {
        case 'number':
          parsedValue = parseFloat(formValue);
          break;
        case 'boolean':
          parsedValue = formValue === 'true' || formValue === '1';
          break;
        case 'object':
        case 'array':
          parsedValue = JSON.parse(formValue);
          break;
        default:
          parsedValue = formValue;
      }
    } catch (e) {
      alert('Valeur invalide pour le type sélectionné');
      return;
    }

    const now = new Date().toISOString();

    if (editingVar) {
      // Mise à jour
      const updated = variables.map((v) =>
        v.id === editingVar.id
          ? {
              ...v,
              name: formName,
              value: parsedValue,
              type: formType,
              description: formDesc,
              scope: formScope,
              encrypted: formEncrypted,
              updatedAt: now,
            }
          : v
      );
      setVariables(updated);
      saveVariables(updated);
    } else {
      // Création
      const newVar: GlobalVariable = {
        id: `var-${Date.now()}`,
        name: formName,
        value: parsedValue,
        type: formType,
        description: formDesc,
        scope: formScope,
        encrypted: formEncrypted,
        createdAt: now,
        updatedAt: now,
      };
      const updated = [...variables, newVar];
      setVariables(updated);
      saveVariables(updated);
    }

    // Reset form
    setFormName('');
    setFormValue('');
    setFormType('string');
    setFormScope('workflow');
    setFormDesc('');
    setFormEncrypted(false);
    setEditingVar(null);
    setIsCreating(false);
  }, [formName, formValue, formType, formScope, formDesc, formEncrypted, editingVar, variables, saveVariables]);

  // Supprimer une variable
  const handleDelete = useCallback(
    (varId: string) => {
      if (window.confirm('Supprimer cette variable ?')) {
        const updated = variables.filter((v) => v.id !== varId);
        setVariables(updated);
        saveVariables(updated);
      }
    },
    [variables, saveVariables]
  );

  // Commencer l'édition
  const startEdit = useCallback((variable: GlobalVariable) => {
    setEditingVar(variable);
    setFormName(variable.name);
    setFormValue(
      typeof variable.value === 'object'
        ? JSON.stringify(variable.value, null, 2)
        : String(variable.value)
    );
    setFormType(variable.type);
    setFormScope(variable.scope);
    setFormDesc(variable.description || '');
    setFormEncrypted(variable.encrypted || false);
    setIsCreating(true);
  }, []);

  // Filtrer les variables
  const filteredVariables = variables.filter((v) => {
    const matchesSearch =
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.description && v.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesScope = scopeFilter === 'all' || v.scope === scopeFilter;
    return matchesSearch && matchesScope;
  });

  // Formater la valeur pour l'affichage
  const formatValue = (value: unknown, type: string): string => {
    if (type === 'object' || type === 'array') {
      return JSON.stringify(value);
    }
    return String(value);
  };

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
            <Variable className="text-purple-400" size={24} />
            <div>
              <h2 className="text-2xl font-bold text-white">Variables Globales</h2>
              <p className="text-gray-400 text-sm mt-1">
                {variables.length} variable{variables.length > 1 ? 's' : ''} définie{variables.length > 1 ? 's' : ''}
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
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une variable..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10
                       text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <select
            value={scopeFilter}
            onChange={(e) => setScopeFilter(e.target.value as typeof scopeFilter)}
            className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white
                     focus:outline-none focus:border-purple-500/50"
          >
            <option value="all">Tous les scopes</option>
            <option value="workflow">Workflow</option>
            <option value="global">Global</option>
            <option value="environment">Environment</option>
          </select>

          <button
            onClick={() => {
              setIsCreating(true);
              setEditingVar(null);
              setFormName('');
              setFormValue('');
              setFormType('string');
              setFormScope('workflow');
              setFormDesc('');
              setFormEncrypted(false);
            }}
            className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white
                     transition-colors flex items-center gap-2"
          >
            <Plus size={16} />
            Nouvelle Variable
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isCreating ? (
            <div className="max-w-2xl mx-auto p-6 rounded-lg bg-white/5 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingVar ? 'Modifier la variable' : 'Nouvelle variable'}
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Nom</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="maVariable"
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white
                               placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as GlobalVariable['type'])}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white
                               focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean</option>
                      <option value="object">Object</option>
                      <option value="array">Array</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Valeur</label>
                  <textarea
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    rows={formType === 'object' || formType === 'array' ? 6 : 3}
                    placeholder={formType === 'object' ? '{"key": "value"}' : 'Valeur...'}
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white
                             placeholder-gray-500 focus:outline-none focus:border-purple-500/50 resize-none font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Description optionnelle"
                    className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white
                             placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Scope</label>
                    <select
                      value={formScope}
                      onChange={(e) => setFormScope(e.target.value as GlobalVariable['scope'])}
                      className="w-full px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white
                               focus:outline-none focus:border-purple-500/50"
                    >
                      <option value="workflow">Workflow (local)</option>
                      <option value="global">Global (tous les workflows)</option>
                      <option value="environment">Environment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Sécurité</label>
                    <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formEncrypted}
                        onChange={(e) => setFormEncrypted(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm text-white">Encrypter</span>
                      {formEncrypted ? <Lock size={14} /> : <Unlock size={14} />}
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSave}
                    className="flex-1 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white
                             flex items-center justify-center gap-2"
                  >
                    <Save size={16} />
                    {editingVar ? 'Mettre à jour' : 'Créer'}
                  </button>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setEditingVar(null);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredVariables.map((variable) => (
                <div
                  key={variable.id}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/30
                           transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="font-mono text-sm text-purple-400">{variable.name}</code>
                        <span className="px-2 py-0.5 rounded bg-white/10 text-xs text-gray-400">
                          {variable.type}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-xs text-blue-400">
                          {variable.scope}
                        </span>
                        {variable.encrypted && (
                          <Lock size={12} className="text-yellow-400" title="Encrypté" />
                        )}
                      </div>
                      {variable.description && (
                        <p className="text-sm text-gray-400 mb-2">{variable.description}</p>
                      )}
                      <div className="text-sm text-gray-500 font-mono truncate">
                        = {formatValue(variable.value, variable.type)}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => startEdit(variable)}
                        className="p-2 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400
                                 hover:text-purple-400 transition-colors"
                        title="Modifier"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(variable.id)}
                        className="p-2 rounded-lg border border-white/10 hover:bg-red-500/20 text-gray-400
                                 hover:text-red-400 transition-colors"
                        title="Supprimer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {filteredVariables.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  {searchQuery || scopeFilter !== 'all' ? (
                    <>
                      Aucune variable trouvée
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setScopeFilter('all');
                        }}
                        className="block mx-auto mt-2 text-purple-400 hover:text-purple-300"
                      >
                        Réinitialiser les filtres
                      </button>
                    </>
                  ) : (
                    <>
                      Aucune variable définie
                      <br />
                      <button
                        onClick={() => setIsCreating(true)}
                        className="mt-2 text-purple-400 hover:text-purple-300"
                      >
                        Créer votre première variable
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <p className="text-xs text-gray-500">
            💡 Les variables workflow sont spécifiques à ce workflow, les variables globales sont partagées partout
          </p>
        </div>
      </div>
    </div>
  );
}
