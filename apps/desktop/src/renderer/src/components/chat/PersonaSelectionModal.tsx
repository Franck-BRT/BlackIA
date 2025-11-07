import React, { useState, useMemo } from 'react';
import { X, Search, User, Star, Check } from 'lucide-react';
import type { Persona } from '../../types/persona';
import { PERSONA_COLOR_CLASSES } from '../../types/persona';

interface PersonaSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (persona: Persona, includeFewShots: boolean) => void;
  personas: Persona[];
  currentPersonaId?: string;
}

export function PersonaSelectionModal({
  isOpen,
  onClose,
  onSelect,
  personas,
  currentPersonaId,
}: PersonaSelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [includeFewShots, setIncludeFewShots] = useState(true);

  // Filtrer et trier les personas
  const filteredPersonas = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    let filtered = personas;

    if (query) {
      filtered = personas.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query)
      );
    }

    // Trier: favoris d'abord, puis par nom
    return filtered.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [personas, searchQuery]);

  const handleSelect = () => {
    if (selectedPersona) {
      onSelect(selectedPersona, includeFewShots);
      onClose();
      setSearchQuery('');
      setSelectedPersona(null);
    }
  };

  const handleRemovePersona = () => {
    // Pass null to indicate persona removal
    onSelect(null as any, false);
    onClose();
    setSearchQuery('');
    setSelectedPersona(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onKeyDown={handleKeyDown}
    >
      <div className="glass-card bg-gray-900/95 rounded-2xl w-full max-w-3xl m-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg glass-card flex items-center justify-center">
              <User className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Sélectionner un persona</h2>
              <p className="text-xs text-muted-foreground">
                Le persona sera appliqué à toute la conversation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-hover hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 border-b border-white/10 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un persona par nom, description ou catégorie..."
              autoFocus
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500/50 transition-colors placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Persona List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredPersonas.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <p className="text-muted-foreground">
                {searchQuery ? 'Aucun persona trouvé' : 'Aucun persona disponible'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPersonas.map((persona) => {
                const colorGradient =
                  PERSONA_COLOR_CLASSES[persona.color] || PERSONA_COLOR_CLASSES.purple;
                const isSelected = selectedPersona?.id === persona.id;
                const isCurrent = currentPersonaId === persona.id;

                return (
                  <button
                    key={persona.id}
                    onClick={() => setSelectedPersona(persona)}
                    className={`relative glass-card rounded-xl p-4 text-left transition-all hover:scale-[1.02] ${
                      isSelected ? 'ring-2 ring-blue-500/50 bg-blue-500/10' : ''
                    }`}
                  >
                    {/* Current indicator */}
                    {isCurrent && (
                      <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        <span>Actuel</span>
                      </div>
                    )}

                    {/* Avatar and name */}
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorGradient} flex items-center justify-center text-2xl flex-shrink-0`}
                      >
                        {persona.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{persona.name}</h3>
                          {persona.isFavorite && (
                            <Star className="w-3.5 h-3.5 text-yellow-400" fill="currentColor" />
                          )}
                        </div>
                        {persona.category && (
                          <p className="text-xs text-muted-foreground">{persona.category}</p>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {persona.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {persona.description}
                      </p>
                    )}

                    {/* System prompt preview */}
                    <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                      <p className="text-xs text-muted-foreground line-clamp-2 font-mono">
                        {persona.systemPrompt}
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      {persona.model && <span className="font-mono">{persona.model}</span>}
                      {persona.temperature !== null && persona.temperature !== undefined && (
                        <span>T: {persona.temperature}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview and options */}
        {selectedPersona && (
          <div className="p-6 border-t border-white/10 bg-white/5 flex-shrink-0">
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-2">Options</h3>
              <label className="flex items-center gap-3 p-3 glass-card rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                <input
                  type="checkbox"
                  checked={includeFewShots}
                  onChange={(e) => setIncludeFewShots(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">Inclure les exemples (few-shots)</div>
                  <div className="text-xs text-muted-foreground">
                    Les exemples aident le persona à mieux comprendre son rôle
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t border-white/10 flex-shrink-0">
          <div>
            {currentPersonaId && (
              <button
                onClick={handleRemovePersona}
                className="px-4 py-2 rounded-xl glass-hover hover:bg-red-500/20 transition-colors text-red-400"
              >
                Retirer le persona
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl glass-hover hover:bg-white/10 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedPersona}
              className="px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 transition-colors text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Appliquer le persona
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
