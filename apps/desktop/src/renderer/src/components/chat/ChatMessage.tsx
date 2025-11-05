import React, { useState } from 'react';
import { User, Bot, RefreshCw, Copy, Check } from 'lucide-react';
import type { OllamaMessage } from '@blackia/ollama';

interface ChatMessageProps {
  message: OllamaMessage;
  isStreaming?: boolean;
  regenerationCount?: number;
  onRegenerate?: () => void;
  isLastAssistantMessage?: boolean;
}

export function ChatMessage({
  message,
  isStreaming,
  regenerationCount = 0,
  onRegenerate,
  isLastAssistantMessage = false,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isAssistant = message.role === 'assistant';
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
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
            }`}
          >
            <div className="prose prose-invert max-w-none">
              <div className="whitespace-pre-wrap break-words">
                {message.content}
                {isStreaming && (
                  <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse" />
                )}
              </div>
            </div>
          </div>
        </div>

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
