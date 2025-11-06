import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import type { FewShotExample } from '../../types/persona';

interface FewShotManagerProps {
  examples: FewShotExample[];
  onChange: (examples: FewShotExample[]) => void;
}

export function FewShotManager({ examples, onChange }: FewShotManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');

  const handleAdd = () => {
    if (!userMessage.trim() || !assistantResponse.trim()) {
      return;
    }

    const newExample: FewShotExample = {
      id: `fs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userMessage: userMessage.trim(),
      assistantResponse: assistantResponse.trim(),
    };

    onChange([...examples, newExample]);
    setUserMessage('');
    setAssistantResponse('');
    setIsAdding(false);
  };

  const handleUpdate = (id: string) => {
    if (!userMessage.trim() || !assistantResponse.trim()) {
      return;
    }

    onChange(
      examples.map((ex) =>
        ex.id === id
          ? { ...ex, userMessage: userMessage.trim(), assistantResponse: assistantResponse.trim() }
          : ex
      )
    );

    setUserMessage('');
    setAssistantResponse('');
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    onChange(examples.filter((ex) => ex.id !== id));
  };

  const startEdit = (example: FewShotExample) => {
    setEditingId(example.id);
    setUserMessage(example.userMessage);
    setAssistantResponse(example.assistantResponse);
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setUserMessage('');
    setAssistantResponse('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium">Few-Shot Examples</label>
          <p className="text-xs text-muted-foreground mt-1">
            Exemples de conversations pour guider le comportement de la persona
          </p>
        </div>
        {!isAdding && !editingId && (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="px-3 py-1.5 glass-card rounded-lg hover:glass-lg transition-all flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        )}
      </div>

      {/* Liste des exemples existants */}
      <div className="space-y-3">
        {examples.map((example, index) => (
          <div key={example.id} className="glass-card rounded-lg p-4">
            {editingId === example.id ? (
              // Mode édition
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">
                    Message utilisateur
                  </label>
                  <textarea
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder="Ex: Comment créer un composant React ?"
                    rows={2}
                    className="w-full px-3 py-2 bg-background/50 border border-border/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 text-muted-foreground">
                    Réponse de l'assistant
                  </label>
                  <textarea
                    value={assistantResponse}
                    onChange={(e) => setAssistantResponse(e.target.value)}
                    placeholder="Ex: Pour créer un composant React, utilisez..."
                    rows={3}
                    className="w-full px-3 py-2 bg-background/50 border border-border/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleUpdate(example.id)}
                    disabled={!userMessage.trim() || !assistantResponse.trim()}
                    className="flex-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    Sauvegarder
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex-1 px-3 py-1.5 glass-card rounded-lg hover:glass-lg transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <X className="w-4 h-4" />
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              // Mode affichage
              <div>
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-medium text-purple-400">Exemple {index + 1}</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(example)}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-all text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(example.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-all text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      👤 Utilisateur:
                    </div>
                    <div className="text-sm bg-background/30 rounded-lg p-2 border border-border/10">
                      {example.userMessage}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">
                      🤖 Assistant:
                    </div>
                    <div className="text-sm bg-background/30 rounded-lg p-2 border border-border/10">
                      {example.assistantResponse}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Formulaire d'ajout */}
      {isAdding && (
        <div className="glass-card rounded-lg p-4 border-2 border-purple-500/30">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">
                Message utilisateur <span className="text-red-400">*</span>
              </label>
              <textarea
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Ex: Comment créer un composant React ?"
                rows={2}
                className="w-full px-3 py-2 bg-background/50 border border-border/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y text-sm"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-muted-foreground">
                Réponse de l'assistant <span className="text-red-400">*</span>
              </label>
              <textarea
                value={assistantResponse}
                onChange={(e) => setAssistantResponse(e.target.value)}
                placeholder="Ex: Pour créer un composant React, utilisez..."
                rows={3}
                className="w-full px-3 py-2 bg-background/50 border border-border/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-y text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAdd}
                disabled={!userMessage.trim() || !assistantResponse.trim()}
                className="flex-1 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="flex-1 px-3 py-1.5 glass-card rounded-lg hover:glass-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {examples.length === 0 && !isAdding && (
        <div className="text-center py-6 glass-card rounded-lg border border-dashed border-border/30">
          <p className="text-sm text-muted-foreground">
            Aucun exemple pour le moment. Cliquez sur "Ajouter" pour créer votre premier exemple.
          </p>
        </div>
      )}
    </div>
  );
}
