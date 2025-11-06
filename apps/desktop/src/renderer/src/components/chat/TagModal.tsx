import React, { useState, useEffect } from 'react';
import { X, Tag, Check } from 'lucide-react';

interface TagModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string, icon?: string) => void;
  initialName?: string;
  initialColor?: string;
  initialIcon?: string;
  title?: string;
}

const PRESET_COLORS = [
  { name: 'Bleu', value: '#3b82f6' },
  { name: 'Vert', value: '#10b981' },
  { name: 'Rouge', value: '#ef4444' },
  { name: 'Jaune', value: '#f59e0b' },
  { name: 'Violet', value: '#8b5cf6' },
  { name: 'Rose', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Emeraude', value: '#059669' },
  { name: 'Fuchsia', value: '#d946ef' },
  { name: 'Lime', value: '#84cc16' },
];

const PRESET_ICONS = [
  '💼', '🎨', '📚', '🔧', '💡', '🚀', '🎯', '⭐',
  '🔥', '💎', '🎓', '🏆', '📊', '🎵', '🌟', '🔬',
];

export function TagModal({
  isOpen,
  onClose,
  onSave,
  initialName = '',
  initialColor = '#3b82f6',
  initialIcon = '🏷️',
  title = 'Nouveau tag',
}: TagModalProps) {
  const [name, setName] = useState(initialName);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [selectedIcon, setSelectedIcon] = useState(initialIcon);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setSelectedColor(initialColor);
      setSelectedIcon(initialIcon);
    }
  }, [isOpen, initialName, initialColor, initialIcon]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), selectedColor, selectedIcon);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="glass-card bg-gray-900/95 rounded-2xl w-full max-w-md m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: selectedColor + '40' }}
            >
              {selectedIcon}
            </div>
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-hover hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Nom du tag */}
          <div>
            <label className="block text-sm font-medium mb-2">Nom du tag</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: Travail, Personnel, Urgent..."
              autoFocus
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500/50 transition-colors placeholder:text-muted-foreground"
            />
          </div>

          {/* Choix d'icône */}
          <div>
            <label className="block text-sm font-medium mb-3">Icône</label>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_ICONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setSelectedIcon(icon)}
                  className={`relative p-2 rounded-lg border-2 transition-all text-xl ${
                    selectedIcon === icon
                      ? 'border-white/50 scale-110 bg-white/10'
                      : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                  }`}
                  title={icon}
                >
                  {icon}
                  {selectedIcon === icon && (
                    <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-0.5">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Choix de couleur */}
          <div>
            <label className="block text-sm font-medium mb-3">Couleur</label>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`relative p-3 rounded-xl border-2 transition-all ${
                    selectedColor === color.value
                      ? 'border-white/50 scale-105'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                  style={{ backgroundColor: color.value + '20' }}
                  title={color.name}
                >
                  <div
                    className="w-full h-6 rounded-lg"
                    style={{ backgroundColor: color.value }}
                  />
                  {selectedColor === color.value && (
                    <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                      <Check className="w-3 h-3 text-black" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl glass-hover hover:bg-white/10 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 transition-colors text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
