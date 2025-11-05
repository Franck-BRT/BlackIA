import React from 'react';
import { User, Bot } from 'lucide-react';
import type { OllamaMessage } from '@blackia/ollama';

interface ChatMessageProps {
  message: OllamaMessage;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

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
      <div className={`flex items-start gap-3 max-w-3xl ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
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
    </div>
  );
}
