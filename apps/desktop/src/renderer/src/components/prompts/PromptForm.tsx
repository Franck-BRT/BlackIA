import React, { useState, useEffect } from 'react';
import { User, FileText, X, Plus } from 'lucide-react';
import type { Prompt, PromptFormData, PromptColor } from '../../types/prompt';
import { PROMPT_CATEGORIES, PROMPT_COLORS, SUGGESTED_PROMPT_ICONS, extractVariables } from '../../types/prompt';
import { usePersonas } from '../../hooks/usePersonas';
import { useTags } from '../../hooks/useTags';
import { PERSONA_COLOR_CLASSES } from '../../types/persona';
import { TagDropdownSelector } from '../shared/TagDropdownSelector';
import { TagModal } from '../chat/TagModal';

interface PromptFormProps {
  prompt?: Prompt | null;
  onSubmit: (data: PromptFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function PromptForm({
  prompt,
  onSubmit,
  onCancel,
  submitLabel = 'Créer',
}: PromptFormProps) {
  const { personas } = usePersonas();
  const { tags, createTag } = useTags();

  const [formData, setFormData] = useState<PromptFormData>({
    name: '',
    description: '',
    content: '',
    variables: [],
    icon: '📝',
    color: 'purple',
    category: undefined,
    tags: [],
    defaultPersonaId: undefined,
    defaultIncludeFewShots: false,
    availableInEditor: false,
    editorTitle: undefined,
    editorVariable: undefined,
  });

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [manualVariables, setManualVariables] = useState(false);
  const [newVariable, setNewVariable] = useState('');

  // Trouver le persona sélectionné
  const selectedPersona = personas.find((p) => p.id === formData.defaultPersonaId);
  const hasFewShots = selectedPersona?.fewShotExamples && selectedPersona.fewShotExamples.length > 0;

  // Initialiser le formulaire si on édite un prompt
  useEffect(() => {
    if (prompt) {
      let tags: string[] = [];
      let variables: string[] = [];
      try {
        tags = JSON.parse(prompt.tags);
      } catch (e) {
        // ignore
      }
      try {
        variables = JSON.parse(prompt.variables);
      } catch (e) {
        // ignore
      }

      setFormData({
        name: prompt.name,
        description: prompt.description,
        content: prompt.content,
        variables,
        icon: prompt.icon,
        color: prompt.color,
        category: prompt.category || undefined,
        tags,
        defaultPersonaId: prompt.defaultPersonaId || undefined,
        defaultIncludeFewShots: prompt.defaultIncludeFewShots || false,
        availableInEditor: prompt.availableInEditor || false,
        editorTitle: prompt.editorTitle || undefined,
        editorVariable: prompt.editorVariable || undefined,
      });
    }
  }, [prompt]);

  // Auto-détecter les variables depuis le contenu (seulement si mode automatique)
  useEffect(() => {
    if (!manualVariables) {
      const detectedVariables = extractVariables(formData.content);
      setFormData((prev) => ({ ...prev, variables: detectedVariables }));
    }
  }, [formData.content, manualVariables]);

  // Vérifier si une variable d'éditeur est sélectionnée
  const hasEditorVariable = formData.variables.length > 0 && (
    formData.editorVariable ? formData.variables.includes(formData.editorVariable) : false
  );

  // Désactiver automatiquement si la variable n'existe plus
  useEffect(() => {
    if (formData.availableInEditor && !hasEditorVariable) {
      setFormData((prev) => ({
        ...prev,
        availableInEditor: false,
        editorTitle: undefined,
      }));
    }
  }, [hasEditorVariable]);

  // Auto-sélectionner une variable d'éditeur si aucune n'est sélectionnée
  useEffect(() => {
    if (formData.variables.length > 0 && !formData.editorVariable) {
      // Priorité aux variables standard de l'éditeur
      const preferredVars = ['texte', 'text', 'contenu', 'content', 'selection'];
      const foundPreferred = formData.variables.find(v => preferredVars.includes(v));
      if (foundPreferred) {
        setFormData(prev => ({ ...prev, editorVariable: foundPreferred }));
      } else {
        // Sinon prendre la première variable
        setFormData(prev => ({ ...prev, editorVariable: formData.variables[0] }));
      }
    }
  }, [formData.variables]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleToggleTag = (tagId: string) => {
    if (formData.tags.includes(tagId)) {
      setFormData({ ...formData, tags: formData.tags.filter((id) => id !== tagId) });
    } else {
      setFormData({ ...formData, tags: [...formData.tags, tagId] });
    }
  };

  const handleCreateTag = (name: string, color: string, icon?: string) => {
    const newTag = createTag(name, color, icon);
    setFormData({ ...formData, tags: [...formData.tags, newTag.id] });
  };

  const handleAddVariable = () => {
    const trimmedVar = newVariable.trim();
    if (trimmedVar && !formData.variables.includes(trimmedVar)) {
      setFormData({ ...formData, variables: [...formData.variables, trimmedVar] });
      setNewVariable('');
    }
  };

  const handleRemoveVariable = (varToRemove: string) => {
    setFormData({
      ...formData,
      variables: formData.variables.filter((v) => v !== varToRemove),
    });
  };

  const handleToggleManualVariables = () => {
    if (!manualVariables) {
      // Passer en mode manuel : garder les variables actuelles
      setManualVariables(true);
    } else {
      // Revenir en mode auto : re-détecter les variables
      setManualVariables(false);
      const detectedVariables = extractVariables(formData.content);
      setFormData({ ...formData, variables: detectedVariables });
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nom */}
      <div>
        <label className="block text-sm font-medium mb-2">Nom du prompt *</label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          placeholder="Ex: Revue de Code"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">Description *</label>
        <textarea
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
          className="w-full px-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
          placeholder="Brève description du prompt"
        />
      </div>

      {/* Contenu */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Contenu du prompt *
          <span className="text-xs text-muted-foreground ml-2">
            (Utilisez {'{{variable}}'} pour les variables)
          </span>
        </label>
        <textarea
          required
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={8}
          className="w-full px-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none font-mono text-sm"
          placeholder="Votre prompt ici... Utilisez {{variable}} pour définir des variables"
        />
      </div>

      {/* Icône et Couleur */}
      <div className="grid grid-cols-2 gap-4">
        {/* Icône */}
        <div>
          <label className="block text-sm font-medium mb-2">Icône</label>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_PROMPT_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => setFormData({ ...formData, icon })}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                  formData.icon === icon
                    ? 'glass-lg ring-2 ring-purple-500'
                    : 'glass-card hover:glass-lg'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Couleur */}
        <div>
          <label className="block text-sm font-medium mb-2">Couleur</label>
          <div className="flex gap-2">
            {PROMPT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-10 h-10 rounded-lg bg-gradient-to-br from-${color}-500 to-${color}-600 transition-all ${
                  formData.color === color ? 'ring-2 ring-white scale-110' : 'hover:scale-105'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Catégorie */}
      <div>
        <label className="block text-sm font-medium mb-2">Catégorie</label>
        <select
          value={formData.category || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              category: e.target.value || undefined,
            })
          }
          className="w-full px-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        >
          <option value="">Aucune catégorie</option>
          {PROMPT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-3">Tags</label>
        <TagDropdownSelector
          availableTags={tags}
          selectedTagIds={formData.tags}
          onToggleTag={handleToggleTag}
          onCreateTag={() => setIsTagModalOpen(true)}
        />
      </div>

      {/* Persona par défaut */}
      <div className="p-4 glass-card rounded-xl">
        <label className="block text-sm font-medium mb-3 flex items-center gap-2">
          <User className="w-4 h-4" />
          Persona par défaut (optionnel)
        </label>
        <select
          value={formData.defaultPersonaId || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              defaultPersonaId: e.target.value || undefined,
              // Réinitialiser few-shots si aucun persona
              defaultIncludeFewShots: e.target.value ? formData.defaultIncludeFewShots : false,
            })
          }
          className="w-full px-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        >
          <option value="">Aucun persona</option>
          {personas.map((persona) => (
            <option key={persona.id} value={persona.id}>
              {persona.avatar} {persona.name} - {persona.category}
            </option>
          ))}
        </select>

        {/* Checkbox pour inclure les few-shots par défaut */}
        {formData.defaultPersonaId && hasFewShots && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="defaultIncludeFewShots"
              checked={formData.defaultIncludeFewShots}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  defaultIncludeFewShots: e.target.checked,
                })
              }
              className="w-4 h-4 rounded accent-purple-500"
            />
            <label htmlFor="defaultIncludeFewShots" className="text-sm text-muted-foreground cursor-pointer">
              Inclure les {selectedPersona?.fewShotExamples?.length} exemples few-shot par défaut
            </label>
          </div>
        )}

        {/* Affichage du persona sélectionné */}
        {selectedPersona && (
          <div className="mt-3 p-3 glass-card rounded-lg flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${PERSONA_COLOR_CLASSES[selectedPersona.color]} flex items-center justify-center text-xl`}
            >
              {selectedPersona.avatar}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{selectedPersona.name}</div>
              <div className="text-xs text-muted-foreground">{selectedPersona.description}</div>
            </div>
          </div>
        )}
      </div>

      {/* Configuration de l'éditeur */}
      <div className="p-4 glass-card rounded-xl space-y-6">
        <div>
          <label className="block text-sm font-medium mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Configuration de l'éditeur
          </label>
          <p className="text-xs text-muted-foreground">
            Configurez les variables et la disponibilité de ce prompt dans l'éditeur de documentation.
          </p>
        </div>

        {/* Gestion des variables */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium">
              Variables {manualVariables ? '(gestion manuelle)' : '(détection automatique)'}
            </label>
            <button
              type="button"
              onClick={handleToggleManualVariables}
              className="text-xs px-3 py-1.5 glass-hover rounded-lg transition-colors"
            >
              {manualVariables ? '🔄 Mode automatique' : '✏️ Mode manuel'}
            </button>
          </div>

          {/* Liste des variables */}
          {formData.variables.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.variables.map((variable) => {
                const isSelectedForEditor = formData.editorVariable === variable;
                return (
                  <div
                    key={variable}
                    className={`flex items-center gap-2 px-3 py-1.5 glass-card rounded-lg text-sm ${
                      isSelectedForEditor ? 'ring-1 ring-green-500/30 bg-green-500/5' : ''
                    }`}
                    title={isSelectedForEditor ? 'Variable utilisée pour l\'éditeur' : 'Variable standard'}
                  >
                    <span className={`font-mono ${isSelectedForEditor ? 'text-green-400' : 'text-purple-400'}`}>
                      {'{{' + variable + '}}'}
                    </span>
                    {isSelectedForEditor && <span className="text-green-400 text-xs">📝</span>}
                    {manualVariables && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariable(variable)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        title="Supprimer cette variable"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground mb-3">
              {manualVariables
                ? 'Aucune variable définie. Ajoutez-en ci-dessous.'
                : 'Aucune variable détectée dans le contenu.'}
            </p>
          )}

          {/* Ajouter une variable (mode manuel uniquement) */}
          {manualVariables && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newVariable}
                onChange={(e) => setNewVariable(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddVariable();
                  }
                }}
                placeholder="Nom de la variable (sans {{}})"
                className="flex-1 px-3 py-2 glass-card rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              <button
                type="button"
                onClick={handleAddVariable}
                disabled={!newVariable.trim()}
                className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Ajouter</span>
              </button>
            </div>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            {manualVariables
              ? 'En mode manuel, vous gérez les variables vous-même. Elles ne seront pas détectées automatiquement.'
              : 'Les variables sont automatiquement détectées depuis le contenu du prompt (format {{variable}}).'}
          </p>
        </div>

        {/* Séparateur */}
        <div className="border-t border-white/10"></div>

        {/* Disponibilité dans l'éditeur */}
        <div>
          <label className="text-sm font-medium mb-3 block">Disponibilité dans l'éditeur</label>

          {/* Sélecteur de variable pour l'éditeur */}
          {formData.variables.length > 0 ? (
            <div className="mb-3 p-3 glass-card rounded-lg">
              <label className="text-xs font-medium mb-2 block">
                Variable qui recevra le texte sélectionné dans l'éditeur
              </label>
              <select
                value={formData.editorVariable || ''}
                onChange={(e) => setFormData({ ...formData, editorVariable: e.target.value })}
                className="w-full px-3 py-2 glass-card rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="">Sélectionner une variable...</option>
                {formData.variables.map((variable) => (
                  <option key={variable} value={variable}>
                    {`{{${variable}}}`}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-muted-foreground">
                Le texte sélectionné dans l'éditeur remplacera cette variable lors de l'application du prompt.
              </p>
            </div>
          ) : (
            <div className="mb-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <p className="text-xs text-orange-400 mb-2">
                ⚠️ Ajoutez au moins une variable à votre prompt pour l'utiliser dans l'éditeur.
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {['texte', 'text', 'Sujet', 'contenu', 'description'].map((varName) => (
                  <button
                    key={varName}
                    type="button"
                    onClick={() => {
                      if (!formData.variables.includes(varName)) {
                        setFormData({
                          ...formData,
                          variables: [...formData.variables, varName],
                        });
                        setManualVariables(true);
                      }
                    }}
                    className="px-2 py-1 bg-orange-500/20 hover:bg-orange-500/30 rounded text-xs font-mono text-orange-300 transition-colors"
                    title={`Ajouter {{${varName}}}`}
                  >
                    + {'{{' + varName + '}}'}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Vous pouvez utiliser n'importe quel nom de variable selon votre besoin.
              </p>
            </div>
          )}

          {/* Checkbox pour activer dans l'éditeur */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="availableInEditor"
              checked={formData.availableInEditor}
              disabled={!hasEditorVariable}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  availableInEditor: e.target.checked,
                  // Réinitialiser le titre si désactivé
                  editorTitle: e.target.checked ? formData.editorTitle : undefined,
                })
              }
              className={`w-4 h-4 rounded accent-purple-500 mt-1 ${!hasEditorVariable ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <div className="flex-1">
              <label
                htmlFor="availableInEditor"
                className={`text-sm ${hasEditorVariable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
              >
                Rendre disponible dans l'éditeur de documentation
              </label>
              <p className="text-xs text-muted-foreground mt-1">
                Ce prompt apparaîtra dans le menu contextuel (clic droit) et le menu déroulant de l'éditeur
              </p>
            </div>
          </div>

          {/* Champ pour le titre personnalisé */}
          {formData.availableInEditor && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">
                Titre dans l'éditeur
                <span className="text-xs text-muted-foreground ml-2">(optionnel)</span>
              </label>
              <input
                type="text"
                value={formData.editorTitle || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    editorTitle: e.target.value || undefined,
                  })
                }
                className="w-full px-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder={`Par défaut : ${formData.name}`}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Titre court affiché dans le menu contextuel. Si vide, le nom du prompt sera utilisé.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Boutons */}
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 glass-card rounded-xl font-semibold hover:glass-lg transition-all"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl font-semibold hover:scale-105 transition-transform"
        >
          {submitLabel}
        </button>
      </div>
    </form>

    {/* Modal de création de tag */}
    <TagModal
      isOpen={isTagModalOpen}
      onClose={() => setIsTagModalOpen(false)}
      onCreateTag={handleCreateTag}
    />
    </>
  );
}
