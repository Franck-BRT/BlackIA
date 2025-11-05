import React, { useState, useRef, useEffect } from 'react';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop?: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onStop,
  disabled,
  isGenerating,
  placeholder = 'Tapez votre message...',
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isGenerating) {
      onSend(message.trim());
      setMessage('');
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
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

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  return (
    <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-4">
      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
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
      </div>
    </form>
  );
}
