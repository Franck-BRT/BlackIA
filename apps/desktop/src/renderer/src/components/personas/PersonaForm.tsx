import React, { useState } from 'react';
import { PersonaAvatarPicker } from './PersonaAvatarPicker';
import { FewShotManager } from './FewShotManager';
import { useModels } from '../../hooks/useModels';
import type { PersonaFormData, PersonaColor } from '../../types/persona';
import { PERSONA_CATEGORIES, PERSONA_COLORS, PERSONA_COLOR_CLASSES } from '../../types/persona';

interface PersonaFormProps {
  initialData?: Partial<PersonaFormData>;
  onSubmit: (data: PersonaFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function PersonaForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = 'Créer',
}: PersonaFormProps) {
  const { models, loading: modelsLoading } = useModels();

  const [formData, setFormData] = useState<PersonaFormData>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    systemPrompt: initialData?.systemPrompt || '',
    model: initialData?.model || '',
    temperature: initialData?.temperature,
    maxTokens: initialData?.maxTokens,
    fewShots: initialData?.fewShots || [],
    avatar: initialData?.avatar || '🤖',
    color: initialData?.color || 'purple',
    category: initialData?.category || '',
    tags: initialData?.tags || [],
  });

  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }

    if (!formData.systemPrompt.trim()) {
      newErrors.systemPrompt = 'Le prompt système est requis';
    }

    if (formData.temperature !== undefined && (formData.temperature < 0 || formData.temperature > 2)) {
      newErrors.temperature = 'La température doit être entre 0 et 2';
    }

    if (formData.maxTokens !== undefined && formData.maxTokens < 1) {
      newErrors.maxTokens = 'Le nombre de tokens doit être positif';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
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

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div>
        <label className="block text-sm font-medium mb-3">Avatar</label>
        <PersonaAvatarPicker
          value={formData.avatar}
          onChange={(avatar) => setFormData({ ...formData, avatar })}
        />
      </div>

      {/* Nom */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Nom <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Expert React"
          className={`w-full px-4 py-2 glass-card rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
            errors.name ? 'ring-2 ring-red-500' : ''
          }`}
        />
        {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Description <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Ex: Spécialiste React et TypeScript"
          className={`w-full px-4 py-2 glass-card rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
            errors.description ? 'ring-2 ring-red-500' : ''
          }`}
        />
        {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* System Prompt */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Prompt Système <span className="text-red-400">*</span>
        </label>
        <textarea
          value={formData.systemPrompt}
          onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
          placeholder="Ex: Tu es un expert React avec 10+ ans d'expérience..."
          rows={6}
          className={`w-full px-4 py-2 glass-card rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y ${
            errors.systemPrompt ? 'ring-2 ring-red-500' : ''
          }`}
        />
        {errors.systemPrompt && <p className="text-red-400 text-sm mt-1">{errors.systemPrompt}</p>}
        <p className="text-sm text-muted-foreground mt-1">
          Ce texte définit le comportement et le style de la persona
        </p>
      </div>

      {/* Couleur */}
      <div>
        <label className="block text-sm font-medium mb-3">Couleur</label>
        <div className="flex gap-3">
          {PERSONA_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, color })}
              className={`w-12 h-12 rounded-lg bg-gradient-to-br ${PERSONA_COLOR_CLASSES[color]} transition-all ${
                formData.color === color
                  ? 'ring-2 ring-white scale-110'
                  : 'opacity-60 hover:opacity-100 hover:scale-105'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Catégorie */}
      <div>
        <label className="block text-sm font-medium mb-2">Catégorie</label>
        <select
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          className="w-full px-4 py-2 glass-card rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        >
          <option value="">Sans catégorie</option>
          {PERSONA_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Modèle préféré */}
      <div>
        <label className="block text-sm font-medium mb-2">Modèle préféré (optionnel)</label>
        <select
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          className="w-full px-4 py-2 glass-card rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          disabled={modelsLoading}
        >
          <option value="">Aucun (utiliser le modèle par défaut)</option>
          {modelsLoading ? (
            <option disabled>Chargement des modèles...</option>
          ) : models.length === 0 ? (
            <option disabled>Aucun modèle disponible</option>
          ) : (
            models.map((model) => (
              <option key={model.name} value={model.name}>
                {model.name}
              </option>
            ))
          )}
        </select>
        <p className="text-sm text-muted-foreground mt-1">
          {modelsLoading
            ? 'Chargement des modèles Ollama...'
            : models.length === 0
              ? 'Aucun modèle Ollama détecté. Installez des modèles avec Ollama.'
              : 'Sélectionnez un modèle spécifique ou laissez vide pour utiliser le modèle par défaut'}
        </p>
      </div>

      {/* Paramètres IA avancés */}
      <div className="grid grid-cols-2 gap-4">
        {/* Temperature */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Température (optionnel)
          </label>
          <input
            type="number"
            value={formData.temperature ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                temperature: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            placeholder="0.7"
            step="0.1"
            min="0"
            max="2"
            className={`w-full px-4 py-2 glass-card rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
              errors.temperature ? 'ring-2 ring-red-500' : ''
            }`}
          />
          {errors.temperature && (
            <p className="text-red-400 text-sm mt-1">{errors.temperature}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">0-2 (défaut: 0.7)</p>
        </div>

        {/* Max Tokens */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Max Tokens (optionnel)
          </label>
          <input
            type="number"
            value={formData.maxTokens ?? ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                maxTokens: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            placeholder="2048"
            min="1"
            className={`w-full px-4 py-2 glass-card rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${
              errors.maxTokens ? 'ring-2 ring-red-500' : ''
            }`}
          />
          {errors.maxTokens && (
            <p className="text-red-400 text-sm mt-1">{errors.maxTokens}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Limite de génération</p>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium mb-2">Tags</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Ajouter un tag..."
            className="flex-1 px-4 py-2 glass-card rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-4 py-2 glass-card rounded-lg hover:glass-lg transition-all"
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
                {tag}
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

      {/* Few-Shot Examples */}
      <FewShotManager
        examples={formData.fewShots}
        onChange={(fewShots) => setFormData({ ...formData, fewShots })}
      />

      {/* Boutons d'action */}
      <div className="flex gap-3 pt-4 border-t border-border/20">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 glass-card rounded-xl hover:glass-lg transition-all"
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
