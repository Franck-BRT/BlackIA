import React, { useState, useEffect } from 'react';
import { X, MessageSquare } from 'lucide-react';

interface RenameConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newTitle: string) => void;
  currentTitle: string;
}

export function RenameConversationModal({
  isOpen,
  onClose,
  onSave,
  currentTitle,
}: RenameConversationModalProps) {
  const [title, setTitle] = useState(currentTitle);

  useEffect(() => {
    if (isOpen) {
      setTitle(currentTitle);
    }
  }, [isOpen, currentTitle]);

  const handleSave = () => {
    if (title.trim()) {
      onSave(title.trim());
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && title.trim()) {
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
            <MessageSquare className="w-6 h-6 text-blue-400" />
            <h2 className="text-xl font-bold">Renommer la conversation</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-hover hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <label className="block text-sm font-medium mb-2">Titre</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ex: Discussion sur React"
            autoFocus
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none focus:border-blue-500/50 transition-colors placeholder:text-muted-foreground"
          />
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
            disabled={!title.trim()}
            className="px-4 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 transition-colors text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
