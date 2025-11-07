import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';
import { PersonaMentionDropdown } from './PersonaMentionDropdown';
import type { Persona } from '../../types/persona';

interface ChatInputProps {
  onSend: (message: string, personaId?: string, includeFewShots?: boolean) => void;
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
  const [includeMentionFewShots, setIncludeMentionFewShots] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number }>({ top: -420, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isGenerating) {
      console.log('[ChatInput] 📤 Envoi du message avec personaId:', selectedPersonaId, 'includeFewShots:', includeMentionFewShots);

      // Si un persona a été sélectionné via @mention, on l'envoie avec le message
      onSend(message.trim(), selectedPersonaId, selectedPersonaId ? includeMentionFewShots : false);
      setMessage('');
      setSelectedPersonaId(undefined);
      setIncludeMentionFewShots(false);
      setShowMentionDropdown(false);
      setMentionQuery('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Space pour ouvrir le @mention dropdown
    if (e.key === ' ' && e.ctrlKey) {
      e.preventDefault();
      // Insérer @ au début si pas déjà présent
      if (!message.startsWith('@')) {
        setMessage('@' + message);
        // Calculer la position du dropdown
        const position = calculateDropdownPosition();
        setDropdownPosition(position);
        setShowMentionDropdown(true);
        setMentionQuery('');
      }
      return;
    }

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

  const calculateDropdownPosition = () => {
    if (!formRef.current) return { top: -420, left: 0 };

    const formRect = formRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // Hauteur estimée du dropdown (max 400px + padding)
    const dropdownHeight = 420;

    // Espace disponible au-dessus du formulaire
    const spaceAbove = formRect.top;

    // Si pas assez d'espace au-dessus, afficher en dessous
    if (spaceAbove < dropdownHeight) {
      console.log('[ChatInput] 📍 Dropdown positionné en dessous (pas assez d\'espace au-dessus)');
      return { top: 60, left: 0 }; // En dessous du textarea
    } else {
      console.log('[ChatInput] 📍 Dropdown positionné au-dessus');
      return { top: -dropdownHeight, left: 0 };
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newMessage = e.target.value;
    setMessage(newMessage);

    // Détecter @mention au début du message
    if (newMessage.startsWith('@')) {
      // Si un persona était déjà sélectionné et qu'on retape @, on le réinitialise
      if (selectedPersonaId) {
        setSelectedPersonaId(undefined);
      }

      // Calculer la position du dropdown
      const position = calculateDropdownPosition();
      setDropdownPosition(position);

      setShowMentionDropdown(true);
      setMentionQuery(newMessage.slice(1)); // Extraire la requête après @
    } else {
      setShowMentionDropdown(false);
      setMentionQuery('');
      // NE PAS réinitialiser selectedPersonaId ici - il reste actif jusqu'à l'envoi
    }
  };

  const handlePersonaSelect = (persona: Persona) => {
    console.log('[ChatInput] 📧 Persona sélectionné via @mention:', persona.name, persona.id);

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

  // Debug: Logger quand le persona sélectionné change
  useEffect(() => {
    if (selectedPersonaId) {
      console.log('[ChatInput] 🔍 selectedPersonaId changé:', selectedPersonaId);
      console.log('[ChatInput] 📋 Nombre de personas disponibles:', personas.length);
    }
  }, [selectedPersonaId, personas]);

  // Trouver le persona sélectionné pour l'afficher
  const selectedPersona = selectedPersonaId
    ? personas.find(p => p.id === selectedPersonaId)
    : undefined;

  // Debug: Logger si le persona est trouvé
  useEffect(() => {
    if (selectedPersonaId) {
      console.log('[ChatInput] 🎭 Persona trouvé pour affichage:', selectedPersona?.name || 'NON TROUVÉ');
      console.log('[ChatInput] 📚 État includeMentionFewShots:', includeMentionFewShots);
      console.log('[ChatInput] 📋 Few-shot examples du persona:', selectedPersona?.fewShotExamples);
      console.log('[ChatInput] 🔢 Nombre de few-shots:', selectedPersona?.fewShotExamples?.length || 0);
      console.log('[ChatInput] ✅ Checkbox devrait apparaître:', !!(selectedPersona?.fewShotExamples && selectedPersona.fewShotExamples.length > 0));
    }
  }, [selectedPersona, selectedPersonaId, includeMentionFewShots]);

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="glass-card rounded-2xl p-4 relative">
      {/* Dropdown de mention @persona */}
      {showMentionDropdown && (
        <PersonaMentionDropdown
          personas={personas}
          searchQuery={mentionQuery}
          onSelect={handlePersonaSelect}
          onClose={handleCloseMentionDropdown}
          position={dropdownPosition}
        />
      )}

      {/* Badge du persona sélectionné */}
      {selectedPersona && (
        <div className="mb-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-purple-400">Persona sélectionné :</span>
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-purple-500/20">
              <span>{selectedPersona.avatar}</span>
              <span className="font-medium">{selectedPersona.name}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedPersonaId(undefined);
                  setIncludeMentionFewShots(false);
                }}
                className="ml-1 text-white/60 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Checkbox pour les few-shots si le persona en a */}
          {selectedPersona.fewShotExamples && selectedPersona.fewShotExamples.length > 0 && (
            <label className="flex items-center gap-2 text-xs text-white/60 cursor-pointer hover:text-white/80 transition-colors">
              <input
                type="checkbox"
                checked={includeMentionFewShots}
                onChange={(e) => {
                  const checked = e.target.checked;
                  console.log('[ChatInput] 📚 Checkbox few-shots changée:', checked);
                  setIncludeMentionFewShots(checked);
                }}
                className="w-3.5 h-3.5 rounded border-white/20 bg-white/5 checked:bg-purple-500"
              />
              <span>
                Inclure les exemples ({selectedPersona.fewShotExamples.length} exemples)
              </span>
            </label>
          )}
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
        <span>@ ou Ctrl+Space pour mentionner un persona</span>
      </div>
    </form>
  );
}
