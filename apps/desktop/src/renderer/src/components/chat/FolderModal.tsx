import React, { useState, useEffect } from 'react';
import { X, Folder, Check } from 'lucide-react';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
  initialName?: string;
  initialColor?: string;
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
];

export function FolderModal({
  isOpen,
  onClose,
  onSave,
  initialName = '',
  initialColor = '#3b82f6',
  title = 'Nouveau dossier',
}: FolderModalProps) {
  const [name, setName] = useState(initialName);
  const [selectedColor, setSelectedColor] = useState(initialColor);

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setSelectedColor(initialColor);
    }
  }, [isOpen, initialName, initialColor]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), selectedColor);
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
            <Folder className="w-6 h-6" style={{ color: selectedColor }} />
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
          {/* Nom du dossier */}
          <div>
            <label className="block text-sm font-medium mb-2">Nom du dossier</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: Projets personnels"
              autoFocus
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500/50 transition-colors placeholder:text-muted-foreground"
            />
          </div>

          {/* Choix de couleur */}
          <div>
            <label className="block text-sm font-medium mb-3">Couleur</label>
            <div className="grid grid-cols-4 gap-3">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => setSelectedColor(color.value)}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    selectedColor === color.value
                      ? 'border-white/50 scale-105'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                  style={{ backgroundColor: color.value + '20' }}
                  title={color.name}
                >
                  <div
                    className="w-full h-8 rounded-lg"
                    style={{ backgroundColor: color.value }}
                  />
                  {selectedColor === color.value && (
                    <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                      <Check className="w-4 h-4 text-black" />
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
