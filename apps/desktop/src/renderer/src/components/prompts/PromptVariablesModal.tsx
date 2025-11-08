import React, { useState, useEffect } from 'react';
import { X, Sparkles, User } from 'lucide-react';
import type { Prompt } from '../../types/prompt';
import type { Persona } from '../../types/persona';
import { extractVariables, replaceVariables } from '../../types/prompt';
import { PERSONA_COLOR_CLASSES } from '../../types/persona';

interface PromptVariablesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (filledPrompt: string, personaId?: string, includeFewShots?: boolean) => void;
  prompt: Prompt;
  personas: Persona[];
}

export function PromptVariablesModal({
  isOpen,
  onClose,
  onSubmit,
  prompt,
  personas,
}: PromptVariablesModalProps) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('');
  const [includeFewShots, setIncludeFewShots] = useState(false);
  const variables = extractVariables(prompt.content);

  // Trouver le persona sélectionné
  const selectedPersona = personas.find((p) => p.id === selectedPersonaId);
  const hasFewShots = selectedPersona?.fewShotExamples && selectedPersona.fewShotExamples.length > 0;

  // Initialiser les valeurs vides
  useEffect(() => {
    if (isOpen) {
      const initialValues: Record<string, string> = {};
      variables.forEach((v) => {
        initialValues[v] = '';
      });
      setVariableValues(initialValues);
      setSelectedPersonaId('');
      setIncludeFewShots(false);
    }
  }, [isOpen, prompt.id]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Vérifier que toutes les variables sont remplies
    const allFilled = variables.every((v) => variableValues[v]?.trim());
    if (!allFilled) {
      alert('Veuillez remplir toutes les variables');
      return;
    }

    // Remplacer les variables dans le prompt
    const filledPrompt = replaceVariables(prompt.content, variableValues);
    onSubmit(
      filledPrompt,
      selectedPersonaId || undefined,
      selectedPersonaId && includeFewShots ? true : false
    );
    onClose();
  };

  const handleSkip = () => {
    // Utiliser le prompt sans remplir les variables
    onSubmit(
      prompt.content,
      selectedPersonaId || undefined,
      selectedPersonaId && includeFewShots ? true : false
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${prompt.color}-500 to-${prompt.color}-600 flex items-center justify-center text-2xl`}>
              {prompt.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{prompt.name}</h2>
              <p className="text-sm text-muted-foreground">{variables.length} variable(s) à renseigner</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:glass-lg transition-all text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-muted-foreground mb-6">{prompt.description}</p>

        {/* Formulaire des variables */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Sélection du persona */}
          <div className="mb-6 p-4 glass-card rounded-xl">
            <label className="block text-sm font-medium mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Utiliser avec un persona (optionnel)
            </label>
            <select
              value={selectedPersonaId}
              onChange={(e) => setSelectedPersonaId(e.target.value)}
              className="w-full px-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50"
            >
              <option value="">Aucun persona</option>
              {personas.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.avatar} {persona.name} - {persona.category}
                </option>
              ))}
            </select>

            {/* Checkbox pour inclure les few-shots */}
            {selectedPersonaId && hasFewShots && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="includeFewShots"
                  checked={includeFewShots}
                  onChange={(e) => setIncludeFewShots(e.target.checked)}
                  className="w-4 h-4 rounded accent-green-500"
                />
                <label htmlFor="includeFewShots" className="text-sm text-muted-foreground cursor-pointer">
                  Inclure les {selectedPersona?.fewShotExamples?.length} exemples few-shot
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

          {/* Variables */}
          {variables.map((variable) => (
            <div key={variable}>
              <label className="block text-sm font-medium mb-2">
                {variable}
                <span className="text-red-400 ml-1">*</span>
              </label>
              <textarea
                value={variableValues[variable] || ''}
                onChange={(e) =>
                  setVariableValues({
                    ...variableValues,
                    [variable]: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 resize-none"
                placeholder={`Saisissez ${variable}...`}
              />
            </div>
          ))}

          {/* Preview du prompt */}
          <div className="mt-6 p-4 glass-card rounded-xl">
            <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Aperçu du prompt
            </h3>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-mono">
              {variables.every((v) => variableValues[v]?.trim())
                ? replaceVariables(prompt.content, variableValues)
                : prompt.content}
            </pre>
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleSkip}
              className="flex-1 px-6 py-3 glass-card rounded-xl font-semibold hover:glass-lg transition-all"
            >
              Utiliser sans remplir
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl font-semibold hover:scale-105 transition-transform"
            >
              Utiliser dans le chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
