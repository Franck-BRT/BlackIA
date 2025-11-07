import React, { useState } from 'react';
import { User, Bot, RefreshCw, Copy, Check, Edit2, X } from 'lucide-react';
import type { OllamaMessage } from '@blackia/ollama';
import type { Persona } from '../../types/persona';
import { PERSONA_COLOR_CLASSES } from '../../types/persona';
import { MarkdownRenderer } from './MarkdownRenderer';
import './markdown-styles.css';

interface ChatMessageProps {
  message: OllamaMessage;
  isStreaming?: boolean;
  regenerationCount?: number;
  onRegenerate?: () => void;
  isLastAssistantMessage?: boolean;
  isLastUserMessage?: boolean;
  onEdit?: (newContent: string) => void;
  searchQuery?: string;
  searchStartIndex?: number;
  activeGlobalIndex?: number;
  syntaxTheme?: string;
  showLineNumbers?: boolean;
  mentionedPersona?: Persona; // Persona utilisé via @mention pour ce message (legacy)
  mentionedPersonas?: Persona[]; // Personas utilisés via @mention multiples
}

export function ChatMessage({
  message,
  isStreaming,
  regenerationCount = 0,
  onRegenerate,
  isLastAssistantMessage = false,
  isLastUserMessage = false,
  onEdit,
  searchQuery,
  searchStartIndex,
  activeGlobalIndex,
  syntaxTheme,
  showLineNumbers,
  mentionedPersona,
  mentionedPersonas,
}: ChatMessageProps) {
  // Utiliser mentionedPersonas si disponible, sinon fallback sur mentionedPersona
  const personasToDisplay = mentionedPersonas || (mentionedPersona ? [mentionedPersona] : []);
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isAssistant = message.role === 'assistant';
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditContent(message.content);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(editContent.trim());
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  if (isSystem) {
    return (
      <div className="flex justify-center mb-4">
        <div className="glass-card px-4 py-2 rounded-xl text-sm text-muted-foreground max-w-2xl">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex flex-col gap-2 max-w-3xl w-full ${isUser ? 'items-end' : 'items-start'}`}>
        <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* Avatar */}
          <div
            className={`w-10 h-10 rounded-xl glass-card flex items-center justify-center flex-shrink-0 ${
              isUser ? 'bg-blue-500/20' : 'bg-purple-500/20'
            }`}
          >
            {isUser ? (
              <User className="w-5 h-5 text-blue-400" />
            ) : (
              <Bot className="w-5 h-5 text-purple-400" />
            )}
          </div>

          {/* Message content */}
          <div
            className={`glass-card rounded-2xl px-4 py-3 ${
              isUser ? 'bg-blue-500/10' : 'bg-white/5'
            } ${isEditing ? 'flex-1' : ''}`}
          >
            {/* Badges des personas @mention */}
            {personasToDisplay.length > 0 && (
              <div className="mb-2 flex flex-wrap items-center gap-2 pb-2 border-b border-white/10">
                {personasToDisplay.map((persona, index) => (
                  <React.Fragment key={persona.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-5 h-5 rounded-lg bg-gradient-to-br ${
                          PERSONA_COLOR_CLASSES[persona.color]?.gradient || 'from-purple-500 to-pink-500'
                        } flex items-center justify-center text-xs`}
                      >
                        {persona.avatar}
                      </div>
                      <span className="text-xs text-purple-400 font-medium">
                        {persona.name}
                      </span>
                    </div>
                    {index < personasToDisplay.length - 1 && (
                      <span className="text-xs text-white/20">+</span>
                    )}
                  </React.Fragment>
                ))}
                <span className="text-xs text-white/40">(@mention)</span>
              </div>
            )}

            {isEditing && isUser ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full min-h-[100px] bg-white/5 border border-white/10 rounded-lg px-3 py-2 outline-none focus:border-blue-500/50 transition-colors resize-y"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-hover hover:bg-white/10 transition-colors text-sm text-muted-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Annuler</span>
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editContent.trim()}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 transition-colors text-sm text-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Valider</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="break-words">
                <MarkdownRenderer
                  content={message.content}
                  searchQuery={searchQuery}
                  searchStartIndex={searchStartIndex}
                  activeGlobalIndex={activeGlobalIndex}
                  syntaxTheme={syntaxTheme}
                  showLineNumbers={showLineNumbers}
                />
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Edit button for last user message */}
        {isUser && isLastUserMessage && onEdit && !isEditing && !isStreaming && (
          <div className="flex items-center gap-2 px-2">
            <button
              onClick={handleStartEdit}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-hover hover:bg-white/10 transition-colors text-sm text-muted-foreground"
              title="Éditer le message"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Éditer</span>
            </button>
          </div>
        )}

        {/* Action buttons for assistant messages */}
        {isAssistant && !isStreaming && (
          <div className="flex items-center gap-2 px-2">
            {/* Copy button - always visible for assistant messages */}
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-hover hover:bg-white/10 transition-colors text-sm text-muted-foreground"
              title={isCopied ? 'Copié !' : 'Copier'}
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-green-400">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier</span>
                </>
              )}
            </button>

            {/* Regenerate button - only for last assistant message */}
            {isLastAssistantMessage && onRegenerate && (
              <>
                <button
                  onClick={onRegenerate}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-hover hover:bg-white/10 transition-colors text-sm text-muted-foreground"
                  title="Régénérer la réponse"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Régénérer</span>
                </button>
                {regenerationCount > 0 && (
                  <span className="text-xs text-muted-foreground opacity-60">
                    {regenerationCount} régénération{regenerationCount > 1 ? 's' : ''}
                  </span>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
