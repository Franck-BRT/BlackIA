import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, FileText, Plus, Copy, Check, ChevronDown } from 'lucide-react';
import type { OllamaMessage, OllamaChatStreamChunk } from '@blackia/ollama';
import { MarkdownRenderer } from '../chat/MarkdownRenderer';
import { cn } from '@blackia/ui';

interface EditorAIAssistantProps {
  documentContent: string;
  selectedModel: string;
  availableModels?: string[];
  onModelChange?: (model: string) => void;
  onInsertText?: (text: string) => void;
}

export function EditorAIAssistant({
  documentContent,
  selectedModel,
  availableModels = [],
  onModelChange,
  onInsertText,
}: EditorAIAssistantProps) {
  const [messages, setMessages] = useState<OllamaMessage[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentStreamIdRef = useRef<string | null>(null);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() || isGenerating) return;

    console.log('[EditorAI] Envoi du message avec le modèle:', selectedModel);

    if (!selectedModel) {
      console.error('[EditorAI] Aucun modèle sélectionné!');
      return;
    }

    const userMessage: OllamaMessage = {
      role: 'user',
      content: messageText.trim(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsGenerating(true);
    setStreamingMessage('');

    const streamId = Date.now().toString();
    currentStreamIdRef.current = streamId;

    try {
      console.log('[EditorAI] Appel API ollama.chat avec', newMessages.length, 'messages');
      const stream = await window.electronAPI.ollama.chat({
        model: selectedModel,
        messages: newMessages,
        stream: true,
      });

      console.log('[EditorAI] Stream reçu, début de lecture...');
      let fullResponse = '';
      let chunkCount = 0;

      for await (const chunk of stream as AsyncIterable<OllamaChatStreamChunk>) {
        chunkCount++;

        if (currentStreamIdRef.current !== streamId) {
          console.log('[EditorAI] Stream interrompu par l\'utilisateur');
          break;
        }

        if (chunk.message?.content) {
          fullResponse += chunk.message.content;
          setStreamingMessage(fullResponse);
        }

        if (chunk.done) {
          console.log('[EditorAI] Stream terminé. Total chunks:', chunkCount, 'Longueur réponse:', fullResponse.length);
          const assistantMessage: OllamaMessage = {
            role: 'assistant',
            content: fullResponse,
          };
          setMessages(prevMessages => [...prevMessages, assistantMessage]);
          setStreamingMessage('');
          setIsGenerating(false);
        }
      }

      console.log('[EditorAI] Fin de la boucle de streaming');
    } catch (error) {
      console.error('[EditorAI] Erreur lors de la génération:', error);
      setIsGenerating(false);
      setStreamingMessage('');
    }
  };

  const handleStop = () => {
    currentStreamIdRef.current = null;
    setIsGenerating(false);
    setStreamingMessage('');
  };

  const handleSendWithContext = () => {
    const contextMessage = `Voici le contenu actuel de mon document :\n\n\`\`\`markdown\n${documentContent}\n\`\`\`\n\nPeux-tu m'aider à l'améliorer ?`;
    handleSend(contextMessage);
  };

  const handleInsertResponse = (content: string) => {
    if (onInsertText) {
      onInsertText(content);
    }
  };

  const handleCopyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/50">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-lg font-semibold mb-3">Assistant IA</h3>

        {/* Model selector */}
        {availableModels.length > 0 && (
          <div className="mb-3">
            <label className="text-xs text-gray-400 mb-1 block">Modèle</label>
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => onModelChange?.(e.target.value)}
                disabled={isGenerating}
                className="w-full px-3 py-2 pr-8 rounded-lg bg-white/5 border border-white/10 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
            </div>
          </div>
        )}

        <button
          onClick={handleSendWithContext}
          disabled={isGenerating || !selectedModel}
          className="w-full px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileText className="w-4 h-4" />
          <span>Envoyer le document pour analyse</span>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 py-8">
            <p className="text-sm">
              Posez vos questions ou demandez de l'aide pour rédiger votre document.
            </p>
            <p className="text-xs mt-2">
              Utilisez le bouton ci-dessus pour envoyer le contenu actuel du document.
            </p>
          </div>
        )}

        {messages.map((msg, index) => (
          <MessageBubble
            key={index}
            message={msg}
            onInsert={() => handleInsertResponse(msg.content)}
            onCopy={() => handleCopyMessage(msg.content)}
          />
        ))}

        {streamingMessage && (
          <MessageBubble
            message={{ role: 'assistant', content: streamingMessage }}
            isStreaming={true}
            onInsert={() => handleInsertResponse(streamingMessage)}
            onCopy={() => handleCopyMessage(streamingMessage)}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(input);
              }
            }}
            placeholder="Posez une question à l'IA..."
            disabled={isGenerating}
            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            rows={2}
          />
          <button
            type={isGenerating ? 'button' : 'submit'}
            onClick={isGenerating ? handleStop : undefined}
            disabled={!isGenerating && !input.trim()}
            className={cn(
              'px-4 py-2 rounded-lg transition-colors flex items-center justify-center',
              isGenerating
                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                : 'bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            {isGenerating ? (
              <Square className="w-4 h-4" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: OllamaMessage;
  isStreaming?: boolean;
  onInsert?: () => void;
  onCopy?: () => void;
}

function MessageBubble({ message, isStreaming, onInsert, onCopy }: MessageBubbleProps) {
  const [isCopied, setIsCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    if (onCopy) {
      await onCopy();
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg p-3',
          isUser
            ? 'bg-purple-500/20 border border-purple-500/30'
            : 'bg-white/5 border border-white/10'
        )}
      >
        <div className="prose prose-invert prose-sm max-w-none
          prose-p:my-1
          prose-code:text-pink-400 prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
          prose-pre:bg-gray-900 prose-pre:border prose-pre:border-white/10 prose-pre:my-2
          prose-a:text-purple-400
          prose-strong:text-white
          prose-ul:my-2 prose-ol:my-2
          prose-li:my-0
        ">
          <MarkdownRenderer content={message.content} />
        </div>

        {!isUser && !isStreaming && (
          <div className="flex gap-2 mt-2 pt-2 border-t border-white/10">
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              title="Copier"
            >
              {isCopied ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
            {onInsert && (
              <button
                onClick={onInsert}
                className="p-1 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                title="Insérer dans le document"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {isStreaming && (
          <div className="mt-2">
            <span className="inline-block w-2 h-4 bg-purple-500 animate-pulse" />
          </div>
        )}
      </div>
    </div>
  );
}
