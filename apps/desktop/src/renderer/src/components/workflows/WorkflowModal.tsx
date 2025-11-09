import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { ParsedWorkflow, CreateWorkflowData } from '../../hooks/useWorkflows';

interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWorkflowData) => Promise<void>;
  workflow?: ParsedWorkflow | null;
  title?: string;
}

const COLORS = [
  { value: 'purple', label: 'Violet', class: 'bg-purple-500' },
  { value: 'blue', label: 'Bleu', class: 'bg-blue-500' },
  { value: 'pink', label: 'Rose', class: 'bg-pink-500' },
  { value: 'green', label: 'Vert', class: 'bg-green-500' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-500' },
];

const ICONS = ['🔄', '⚡', '🎯', '🚀', '⚙️', '🔧', '📊', '🎨', '🔮', '✨'];

export function WorkflowModal({
  isOpen,
  onClose,
  onSubmit,
  workflow,
  title = 'Nouveau Workflow',
}: WorkflowModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('🔄');
  const [color, setColor] = useState('purple');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description);
      setIcon(workflow.icon);
      setColor(workflow.color);
      setCategory(workflow.category || '');
      setTags(workflow.tags.join(', '));
    } else {
      setName('');
      setDescription('');
      setIcon('🔄');
      setColor('purple');
      setCategory('');
      setTags('');
    }
  }, [workflow, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const workflowData: CreateWorkflowData = {
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
        category: category.trim() || undefined,
        tags: JSON.stringify(
          tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        ),
        nodes: workflow ? JSON.stringify(workflow.nodes) : '[]',
        edges: workflow ? JSON.stringify(workflow.edges) : '[]',
      };

      await onSubmit(workflowData);
      onClose();
    } catch (error) {
      console.error('Error submitting workflow:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Icon & Color */}
          <div className="grid grid-cols-2 gap-6">
            {/* Icon */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Icône
              </label>
              <div className="grid grid-cols-5 gap-2">
                {ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setIcon(emoji)}
                    className={`text-2xl p-3 rounded-lg border transition-all ${
                      icon === emoji
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Couleur
              </label>
              <div className="grid grid-cols-2 gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                      color === c.value
                        ? 'border-white/30 bg-white/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${c.class}`} />
                    <span className="text-sm text-gray-300">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Nom du workflow *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Génération de contenu optimisé"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10
                       text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50
                       focus:ring-2 focus:ring-purple-500/20 transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez ce que fait ce workflow..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10
                       text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50
                       focus:ring-2 focus:ring-purple-500/20 transition-colors resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Catégorie
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Automation, Data Processing, Content Generation"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10
                       text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50
                       focus:ring-2 focus:ring-purple-500/20 transition-colors"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Séparez les tags par des virgules (ex: automation, IA, productivité)"
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10
                       text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50
                       focus:ring-2 focus:ring-purple-500/20 transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg border border-white/10 text-gray-300
                       hover:bg-white/5 transition-colors"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-purple-500 hover:bg-purple-600
                       text-white font-medium transition-colors disabled:opacity-50
                       disabled:cursor-not-allowed"
              disabled={isSubmitting || !name.trim()}
            >
              {isSubmitting ? 'En cours...' : workflow ? 'Modifier' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
