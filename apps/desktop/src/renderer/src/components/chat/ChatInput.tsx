import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';
import { PersonaMentionDropdown } from './PersonaMentionDropdown';
import type { Persona } from '../../types/persona';

interface ChatInputProps {
  onSend: (message: string, personaId?: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  placeholder?: string;
  personas?: Persona[]; // Liste des personas pour l'autocomplete @mention
}

export function ChatInput({
  onSend,
  onStop,
  disabled,
  isGenerating,
  placeholder = 'Tapez votre message...',
  personas = [],
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | undefined>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isGenerating) {
      // Si un persona a été sélectionné via @mention, on l'envoie avec le message
      onSend(message.trim(), selectedPersonaId);
      setMessage('');
      setSelectedPersonaId(undefined);
      setShowMentionDropdown(false);
      setMentionQuery('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Si le dropdown de mention est ouvert, ne pas intercepter Enter (laissé au dropdown)
    if (showMentionDropdown) {
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleStop = () => {
    if (onStop) {
      onStop();
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);

    // Détecter @mention au début du message
    if (newMessage.startsWith('@')) {
      setShowMentionDropdown(true);
      setMentionQuery(newMessage.slice(1)); // Extraire la requête après @
    } else {
      setShowMentionDropdown(false);
      setMentionQuery('');
      // Si on n'a plus de @, on réinitialise la sélection
      if (selectedPersonaId && !newMessage.includes('@')) {
        setSelectedPersonaId(undefined);
      }
    }
  };

  const handlePersonaSelect = (persona: Persona) => {
    // Remplacer @query par le message sans @mention
    const messageWithoutMention = message.replace(/^@[^\s]*/, '').trim();
    setMessage(messageWithoutMention);
    setSelectedPersonaId(persona.id);
    setShowMentionDropdown(false);
    setMentionQuery('');

    // Refocus sur le textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleCloseMentionDropdown = () => {
    setShowMentionDropdown(false);
    setMentionQuery('');
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Trouver le persona sélectionné pour l'afficher
  const selectedPersona = selectedPersonaId
    ? personas.find(p => p.id === selectedPersonaId)
    : undefined;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="glass-card rounded-2xl p-4 relative">
      {/* Dropdown de mention @persona */}
      {showMentionDropdown && (
        <PersonaMentionDropdown
          personas={personas}
          searchQuery={mentionQuery}
          onSelect={handlePersonaSelect}
          onClose={handleCloseMentionDropdown}
          position={{ top: -420, left: 0 }} // Au-dessus du textarea
        />
      )}

      {/* Badge du persona sélectionné */}
      {selectedPersona && (
        <div className="mb-2 flex items-center gap-2 text-xs">
          <span className="text-purple-400">Persona sélectionné :</span>
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-purple-500/20">
            <span>{selectedPersona.avatar}</span>
            <span className="font-medium">{selectedPersona.name}</span>
            <button
              type="button"
              onClick={() => setSelectedPersonaId(undefined)}
              className="ml-1 text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none placeholder:text-muted-foreground max-h-32 overflow-y-auto"
          style={{ minHeight: '24px' }}
        />

        {isGenerating ? (
          <button
            type="button"
            onClick={handleStop}
            className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 transition-colors text-red-400"
            title="Arrêter la génération"
          >
            <Square className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={disabled || !message.trim()}
            className="p-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-blue-400"
            title="Envoyer"
          >
            <Send className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
        <span>↵ Entrée pour envoyer</span>
        <span>⇧ + ↵ pour nouvelle ligne</span>
        <span>@ pour mentionner un persona</span>
      </div>
    </form>
  );
}
