import React from 'react';
import { SUGGESTED_AVATARS } from '../../types/persona';

interface PersonaAvatarPickerProps {
  value: string;
  onChange: (avatar: string) => void;
}

export function PersonaAvatarPicker({ value, onChange }: PersonaAvatarPickerProps) {
  const [customAvatar, setCustomAvatar] = React.useState('');

  const handleCustomSubmit = () => {
    if (customAvatar.trim()) {
      onChange(customAvatar.trim());
      setCustomAvatar('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomSubmit();
    }
  };

  return (
    <div className="space-y-4">
      {/* Avatar sélectionné */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl glass-card flex items-center justify-center text-4xl">
          {value || '🤖'}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Avatar sélectionné</label>
          <p className="text-sm text-muted-foreground">
            Choisissez un emoji ci-dessous ou entrez le vôtre
          </p>
        </div>
      </div>

      {/* Grille d'emojis suggérés */}
      <div>
        <label className="block text-sm font-medium mb-3">Emojis suggérés</label>
        <div className="grid grid-cols-8 gap-2">
          {SUGGESTED_AVATARS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onChange(emoji)}
              className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl transition-all ${
                value === emoji
                  ? 'ring-2 ring-purple-500 glass-lg scale-110'
                  : 'glass-card hover:glass-lg hover:scale-105'
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Input personnalisé */}
      <div>
        <label className="block text-sm font-medium mb-2">Ou entrez votre propre emoji</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={customAvatar}
            onChange={(e) => setCustomAvatar(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ex: 🚀"
            maxLength={2}
            className="flex-1 px-4 py-2 glass-card rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          <button
            type="button"
            onClick={handleCustomSubmit}
            disabled={!customAvatar.trim()}
            className="px-4 py-2 glass-card rounded-lg hover:glass-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Utiliser
          </button>
        </div>
      </div>
    </div>
  );
}
