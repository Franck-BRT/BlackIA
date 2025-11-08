import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';
import { PersonaMentionDropdown } from './PersonaMentionDropdown';
import { PromptMentionDropdown } from './PromptMentionDropdown';
import { PromptVariablesModal } from '../prompts/PromptVariablesModal';
import type { Persona } from '../../types/persona';
import type { Prompt } from '../../types/prompt';
import { extractVariables, replaceVariables } from '../../types/prompt';
import { useSettings } from '../../contexts/SettingsContext';
import { usePersonaSuggestions } from '../../hooks/usePersonaSuggestions';
import { usePrompts } from '../../hooks/usePrompts';

interface ChatInputProps {
  onSend: (message: string, personaIds?: string[], includeFewShots?: boolean) => void;
  onStop?: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  placeholder?: string;
  personas?: Persona[]; // Liste des personas pour l'autocomplete @mention
  initialMessage?: string; // Message à pré-remplir
  onMessageChange?: () => void; // Callback quand le message change
  prefillPersonaId?: string; // Persona pré-sélectionné depuis un prompt
  prefillIncludeFewShots?: boolean; // Inclure les few-shots du persona pré-sélectionné
}

export function ChatInput({
  onSend,
  onStop,
  disabled,
  isGenerating,
  placeholder = 'Tapez votre message...',
  personas = [],
  initialMessage = '',
  onMessageChange,
  prefillPersonaId,
  prefillIncludeFewShots = false,
}: ChatInputProps) {
  const [message, setMessage] = useState(initialMessage);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedPersonaIds, setSelectedPersonaIds] = useState<string[]>([]);
  const [includeMentionFewShots, setIncludeMentionFewShots] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number }>({ top: -420, left: 0 });
  const [currentMentionPosition, setCurrentMentionPosition] = useState<number>(0); // Position du curseur lors de @mention
  const [suggestedPersonas, setSuggestedPersonas] = useState<Persona[]>([]); // Suggestions intelligentes
  const [showSuggestions, setShowSuggestions] = useState(false);

  // États pour les prompts
  const [showPromptDropdown, setShowPromptDropdown] = useState(false);
  const [promptQuery, setPromptQuery] = useState('');
  const [currentPromptPosition, setCurrentPromptPosition] = useState<number>(0); // Position du curseur lors de /prompt
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [showPromptVariablesModal, setShowPromptVariablesModal] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Charger les paramètres et keywords de suggestions
  const { settings } = useSettings();
  const { keywords: allKeywords } = usePersonaSuggestions();
  const { prompts } = usePrompts();

  // Filtrer uniquement les keywords actifs si nécessaire
  const activeKeywords = settings.personaSuggestions.showOnlyActive
    ? allKeywords.filter(k => k.isActive)
    : allKeywords;

  /**
   * Extrait tous les @mentions du texte et retourne les IDs des personas correspondants
   */
  const extractMentionsFromText = (text: string): string[] => {
    // Pattern pour matcher @PersonaName (alphanumérique + espaces + accents)
    const mentionPattern = /@([a-zA-ZÀ-ÿ0-9\s&]+?)(?=\s|$|@)/g;
    const matches = text.matchAll(mentionPattern);
    const mentionedIds: string[] = [];

    for (const match of matches) {
      const mentionedName = match[1].trim();
      // Chercher le persona par nom (case insensitive)
      const persona = personas.find(p => p.name.toLowerCase() === mentionedName.toLowerCase());
      if (persona && !mentionedIds.includes(persona.id)) {
        mentionedIds.push(persona.id);
      }
    }

    return mentionedIds;
  };

  /**
   * Suggestions intelligentes : détecte des mots-clés et suggère des personas pertinents
   * Utilise désormais la configuration dynamique depuis la base de données
   */
  const suggestPersonasFromText = (text: string): Persona[] => {
    // Vérifier si les suggestions sont activées
    if (!settings.personaSuggestions.enabled) {
      return [];
    }

    const lowerText = text.toLowerCase();
    const suggestions: Persona[] = [];

    // Chercher des mots-clés dans le texte à partir de la configuration
    for (const keywordData of activeKeywords) {
      if (lowerText.includes(keywordData.keyword.toLowerCase())) {
        // Trouver les personas qui correspondent aux catégories
        for (const category of keywordData.categories) {
          const matchingPersonas = personas.filter(p =>
            p.category?.toLowerCase() === category.toLowerCase() &&
            !suggestions.some(s => s.id === p.id) &&
            !selectedPersonaIds.includes(p.id)
          );
          suggestions.push(...matchingPersonas);
        }
      }
    }

    // Limiter au nombre max configuré
    return suggestions.slice(0, settings.personaSuggestions.maxSuggestions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isGenerating) {
      // Extraire tous les @mentions du texte
      const mentionedIds = extractMentionsFromText(message);

      // Combiner avec les personas sélectionnés manuellement (via autocomplete)
      let allPersonaIds = [...new Set([...selectedPersonaIds, ...mentionedIds])];

      // Ajouter le persona pré-sélectionné depuis un prompt s'il existe
      if (prefillPersonaId && !allPersonaIds.includes(prefillPersonaId)) {
        allPersonaIds = [prefillPersonaId, ...allPersonaIds];
      }

      // Utiliser prefillIncludeFewShots si un persona est pré-sélectionné, sinon utiliser includeMentionFewShots
      const shouldIncludeFewShots = prefillPersonaId ? prefillIncludeFewShots : includeMentionFewShots;

      console.log('[ChatInput] 📤 Envoi du message avec personas:', allPersonaIds, 'includeFewShots:', shouldIncludeFewShots);

      // Envoyer le message avec tous les personas mentionnés
      onSend(
        message.trim(),
        allPersonaIds.length > 0 ? allPersonaIds : undefined,
        allPersonaIds.length > 0 ? shouldIncludeFewShots : false
      );
      setMessage('');
      setSelectedPersonaIds([]);
      setIncludeMentionFewShots(false);
      setShowMentionDropdown(false);
      setMentionQuery('');
      setShowSuggestions(false);
      setSuggestedPersonas([]);
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

    // Si le dropdown de mention ou de prompt est ouvert, ne pas intercepter Enter (laissé au dropdown)
    if (showMentionDropdown || showPromptDropdown) {
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

    // Appeler le callback si le message a changé (pour nettoyer le prefillMessage)
    if (onMessageChange && newMessage !== initialMessage) {
      onMessageChange();
    }

    // Détecter @mention et /prompt n'importe où dans le message
    const cursorPosition = e.target.selectionStart || 0;
    const textBeforeCursor = newMessage.substring(0, cursorPosition);

    // Chercher le dernier @ avant le curseur
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    // Chercher le dernier / avant le curseur
    const lastSlashIndex = textBeforeCursor.lastIndexOf('/');

    // Déterminer lequel est le plus récent
    const isAtMention = lastAtIndex > lastSlashIndex;
    const isPromptMention = lastSlashIndex > lastAtIndex;

    if (isAtMention && lastAtIndex !== -1) {
      // Vérifier qu'il n'y a pas d'espace entre @ et le curseur (sinon la mention est terminée)
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

      if (!textAfterAt.includes(' ') && !textAfterAt.includes('/')) {
        // On est en train de taper une mention de persona
        setCurrentMentionPosition(lastAtIndex);

        // Calculer la position du dropdown
        const position = calculateDropdownPosition();
        setDropdownPosition(position);

        setShowMentionDropdown(true);
        setMentionQuery(textAfterAt);
        setShowPromptDropdown(false);
        setPromptQuery('');
        setShowSuggestions(false); // Masquer les suggestions quand on tape @
      } else {
        setShowMentionDropdown(false);
        setMentionQuery('');
      }
    } else if (isPromptMention && lastSlashIndex !== -1) {
      // Vérifier qu'il n'y a pas d'espace entre / et le curseur (sinon le prompt est terminé)
      const textAfterSlash = textBeforeCursor.substring(lastSlashIndex + 1);

      if (!textAfterSlash.includes(' ') && !textAfterSlash.includes('@')) {
        // On est en train de taper une mention de prompt
        setCurrentPromptPosition(lastSlashIndex);

        // Calculer la position du dropdown
        const position = calculateDropdownPosition();
        setDropdownPosition(position);

        setShowPromptDropdown(true);
        setPromptQuery(textAfterSlash);
        setShowMentionDropdown(false);
        setMentionQuery('');
        setShowSuggestions(false); // Masquer les suggestions quand on tape /
      } else {
        setShowPromptDropdown(false);
        setPromptQuery('');
      }
    } else {
      setShowMentionDropdown(false);
      setMentionQuery('');
      setShowPromptDropdown(false);
      setPromptQuery('');

      // Suggestions intelligentes : analyser le texte après un court délai
      // Seulement si le message dépasse le seuil minimum de caractères et pas de @mention active
      const minChars = settings.personaSuggestions.minCharacters;
      if (settings.personaSuggestions.enabled && newMessage.length >= minChars && !newMessage.includes('@') && !newMessage.includes('/')) {
        const suggestions = suggestPersonasFromText(newMessage);
        if (suggestions.length > 0) {
          setSuggestedPersonas(suggestions);
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
      }
    }
  };

  const handlePersonaSelect = (persona: Persona) => {
    console.log('[ChatInput] 📧 Persona sélectionné via @mention:', persona.name, persona.id);

    // Insérer le nom du persona à la position du @ dans le texte
    const beforeMention = message.substring(0, currentMentionPosition);
    const afterCursor = message.substring(textareaRef.current?.selectionStart || message.length);

    // Construire le nouveau message avec @PersonaName
    const newMessage = `${beforeMention}@${persona.name} ${afterCursor}`;
    setMessage(newMessage);

    // Ajouter le persona à la liste des personas sélectionnés
    if (!selectedPersonaIds.includes(persona.id)) {
      setSelectedPersonaIds([...selectedPersonaIds, persona.id]);
    }

    setShowMentionDropdown(false);
    setMentionQuery('');

    // Refocus sur le textarea et positionner le curseur après la mention
    if (textareaRef.current) {
      const newCursorPosition = beforeMention.length + persona.name.length + 2; // +2 pour @ et espace
      textareaRef.current.focus();
      setTimeout(() => {
        textareaRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    }
  };

  const handleCloseMentionDropdown = () => {
    setShowMentionDropdown(false);
    setMentionQuery('');
  };

  const handlePromptSelect = (prompt: Prompt) => {
    console.log('[ChatInput] 📄 Prompt sélectionné:', prompt.name);

    // Vérifier si le prompt a des variables
    const variables = extractVariables(prompt.content);

    if (variables.length > 0) {
      // Afficher le modal pour remplir les variables
      setSelectedPrompt(prompt);
      setShowPromptDropdown(false);
      setPromptQuery('');
      setShowPromptVariablesModal(true);
    } else {
      // Insérer directement le prompt sans variables
      insertPromptIntoMessage(prompt.content, prompt);
    }
  };

  const insertPromptIntoMessage = (filledContent: string, prompt: Prompt, personaId?: string, includeFewShots?: boolean) => {
    // Insérer le contenu du prompt à la position du / dans le texte
    const beforePrompt = message.substring(0, currentPromptPosition);
    const afterCursor = message.substring(textareaRef.current?.selectionStart || message.length);

    // Construire le nouveau message avec le contenu du prompt
    const newMessage = `${beforePrompt}${filledContent}${afterCursor}`;
    setMessage(newMessage);

    // Si le prompt a un persona par défaut ou si un persona a été sélectionné
    if (personaId && !selectedPersonaIds.includes(personaId)) {
      setSelectedPersonaIds([...selectedPersonaIds, personaId]);
      setIncludeMentionFewShots(includeFewShots || false);
    } else if (prompt.defaultPersonaId && !selectedPersonaIds.includes(prompt.defaultPersonaId)) {
      setSelectedPersonaIds([...selectedPersonaIds, prompt.defaultPersonaId]);
      setIncludeMentionFewShots(prompt.defaultIncludeFewShots || false);
    }

    setShowPromptDropdown(false);
    setPromptQuery('');
    setShowPromptVariablesModal(false);
    setSelectedPrompt(null);

    // Refocus sur le textarea
    if (textareaRef.current) {
      const newCursorPosition = beforePrompt.length + filledContent.length;
      textareaRef.current.focus();
      setTimeout(() => {
        textareaRef.current?.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    }
  };

  const handlePromptVariablesSubmit = (filledPrompt: string, personaId?: string, includeFewShots?: boolean) => {
    if (selectedPrompt) {
      insertPromptIntoMessage(filledPrompt, selectedPrompt, personaId, includeFewShots);
    }
  };

  const handleClosePromptDropdown = () => {
    setShowPromptDropdown(false);
    setPromptQuery('');
  };

  const handleClosePromptVariablesModal = () => {
    setShowPromptVariablesModal(false);
    setSelectedPrompt(null);
  };

  const handleAcceptSuggestion = (persona: Persona) => {
    // Ajouter le persona aux personas sélectionnés
    if (!selectedPersonaIds.includes(persona.id)) {
      setSelectedPersonaIds([...selectedPersonaIds, persona.id]);
    }

    // Retirer cette suggestion de la liste
    setSuggestedPersonas(suggestedPersonas.filter(p => p.id !== persona.id));

    // Masquer les suggestions si plus aucune
    if (suggestedPersonas.length <= 1) {
      setShowSuggestions(false);
    }
  };

  const handleDismissSuggestions = () => {
    setShowSuggestions(false);
    setSuggestedPersonas([]);
  };

  // Gérer le message initial pré-rempli
  useEffect(() => {
    if (initialMessage) {
      setMessage(initialMessage);
    }
  }, [initialMessage]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Trouver les personas sélectionnés pour l'affichage
  const selectedPersonas = selectedPersonaIds
    .map(id => personas.find(p => p.id === id))
    .filter((p): p is Persona => p !== undefined);

  // Vérifier si au moins un persona sélectionné a des few-shots
  const hasAnyFewShots = selectedPersonas.some(p => p.fewShotExamples && p.fewShotExamples.length > 0);
  const totalFewShots = selectedPersonas.reduce((sum, p) => sum + (p.fewShotExamples?.length || 0), 0);

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

      {/* Dropdown de mention /prompt */}
      {showPromptDropdown && (
        <PromptMentionDropdown
          prompts={prompts}
          searchQuery={promptQuery}
          onSelect={handlePromptSelect}
          onClose={handleClosePromptDropdown}
          position={dropdownPosition}
        />
      )}

      {/* Modal pour remplir les variables du prompt */}
      {showPromptVariablesModal && selectedPrompt && (
        <PromptVariablesModal
          isOpen={showPromptVariablesModal}
          onClose={handleClosePromptVariablesModal}
          onSubmit={handlePromptVariablesSubmit}
          prompt={selectedPrompt}
          personas={personas}
        />
      )}

      {/* Suggestions intelligentes */}
      {showSuggestions && suggestedPersonas.length > 0 && (
        <div className="mb-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2 text-xs text-blue-400">
              <span>💡</span>
              <span className="font-medium">Suggestions de personas :</span>
            </div>
            <button
              type="button"
              onClick={handleDismissSuggestions}
              className="text-white/40 hover:text-white/60 transition-colors text-xs"
            >
              ✕
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {suggestedPersonas.map((persona) => (
              <button
                key={persona.id}
                type="button"
                onClick={() => handleAcceptSuggestion(persona)}
                className="flex items-center gap-2 px-2 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors text-xs group"
              >
                <span>{persona.avatar}</span>
                <span className="font-medium">{persona.name}</span>
                <span className="text-white/40 group-hover:text-white/60">+</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Badges des personas sélectionnés */}
      {selectedPersonas.length > 0 && (
        <div className="mb-2 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-purple-400">
              {selectedPersonas.length === 1 ? 'Persona sélectionné :' : 'Personas sélectionnés :'}
            </span>
            {selectedPersonas.map((persona) => (
              <div
                key={persona.id}
                className="flex items-center gap-2 px-2 py-1 rounded-lg bg-purple-500/20"
              >
                <span>{persona.avatar}</span>
                <span className="font-medium">{persona.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPersonaIds(selectedPersonaIds.filter(id => id !== persona.id));
                    if (selectedPersonaIds.length === 1) {
                      setIncludeMentionFewShots(false);
                    }
                  }}
                  className="ml-1 text-white/60 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Checkbox pour les few-shots si au moins un persona en a */}
          {hasAnyFewShots && (
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
                Inclure les exemples ({totalFewShots} exemples au total)
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
        <span>@ pour mentionner un persona</span>
        <span>/ pour insérer un prompt</span>
      </div>
    </form>
  );
}
