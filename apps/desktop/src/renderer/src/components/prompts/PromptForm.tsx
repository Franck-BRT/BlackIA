import React, { useState, useEffect } from 'react';
import type { Prompt, PromptFormData, PromptColor } from '../../types/prompt';
import { PROMPT_CATEGORIES, PROMPT_COLORS, SUGGESTED_PROMPT_ICONS, extractVariables } from '../../types/prompt';

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
  const [formData, setFormData] = useState<PromptFormData>({
    name: '',
    description: '',
    content: '',
    variables: [],
    icon: '📝',
    color: 'purple',
    category: undefined,
    tags: [],
  });

  const [tagInput, setTagInput] = useState('');

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
      });
    }
  }, [prompt]);

  // Auto-détecter les variables depuis le contenu
  useEffect(() => {
    const detectedVariables = extractVariables(formData.content);
    setFormData((prev) => ({ ...prev, variables: detectedVariables }));
  }, [formData.content]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    });
  };

  return (
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
        {formData.variables.length > 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Variables détectées : {formData.variables.join(', ')}
          </p>
        )}
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
        <label className="block text-sm font-medium mb-2">Tags</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            className="flex-1 px-4 py-2 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            placeholder="Ajouter un tag..."
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 glass-card rounded-xl hover:glass-lg transition-all"
          >
            Ajouter
          </button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 glass-card rounded-lg text-sm flex items-center gap-2"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
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
  );
}
