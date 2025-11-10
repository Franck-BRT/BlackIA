import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Settings, Search, Wand2 } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ModelSelector } from './ModelSelector';
import { ChatSettings, ChatSettingsData, DEFAULT_CHAT_SETTINGS } from './ChatSettings';
import { ExportMenu } from './ExportMenu';
import { ChatSearchBar } from './ChatSearchBar';
import { PersonaSelectionModal } from './PersonaSelectionModal';
import type { OllamaMessage, OllamaChatStreamChunk } from '@blackia/ollama';
import type { MessageMetadata } from '../../hooks/useConversations';
import type { Persona } from '../../types/persona';
import { PERSONA_COLOR_CLASSES } from '../../types/persona';
import { User } from 'lucide-react';
import { usePrompts } from '../../hooks/usePrompts';
import { replaceVariables } from '../../types/prompt';

interface ChatInterfaceProps {
  // Props de configuration
  title?: string;
  hideHeader?: boolean;
  hideStats?: boolean;
  hideImportExport?: boolean;
  documentContext?: string; // Contexte du document pour l'éditeur
  selectedText?: string; // Texte sélectionné dans l'éditeur
  onInsertText?: (text: string) => void; // Callback pour insérer du texte dans l'éditeur

  // Props pour les personas
  personas?: Persona[];
  currentPersona?: Persona | null;
  onPersonaChange?: (persona: Persona | null) => void;
}

export function ChatInterface({
  title = 'Chat',
  hideHeader = false,
  hideStats = true,
  hideImportExport = false,
  documentContext,
  selectedText,
  onInsertText,
  personas = [],
  currentPersona: externalPersona,
  onPersonaChange,
}: ChatInterfaceProps) {
  const { prompts } = usePrompts();
  const [messages, setMessages] = useState<OllamaMessage[]>([]);
  const [messageMetadata, setMessageMetadata] = useState<Record<number, MessageMetadata>>({});
  const [selectedModel, setSelectedModel] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<Persona | null>(externalPersona || null);
  const [prefilledMessage, setPrefilledMessage] = useState<string>('');
  const [chatSettings, setChatSettings] = useState<ChatSettingsData>(() => {
    try {
      const saved = localStorage.getItem('chatSettings');
      return saved ? JSON.parse(saved) : DEFAULT_CHAT_SETTINGS;
    } catch {
      return DEFAULT_CHAT_SETTINGS;
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentStreamIdRef = useRef<string | null>(null);
  const currentMentionedPersonaIdsRef = useRef<string[] | undefined>(undefined);
  const chatInputRef = useRef<{ setMessage: (msg: string) => void } | null>(null);

  // Filtrer les prompts disponibles pour l'éditeur
  const editorPrompts = documentContext
    ? prompts.filter(p => p.availableInEditor)
    : [];

  // Synchroniser le persona externe avec le persona interne
  useEffect(() => {
    if (externalPersona !== undefined) {
      setCurrentPersona(externalPersona);
    }
  }, [externalPersona]);

  // Setup des listeners pour le streaming
  useEffect(() => {
    console.log('[ChatInterface] 🎧 Enregistrement des listeners de streaming');

    window.electronAPI.ollama.onStreamStart((data: { streamId: string }) => {
      console.log('[ChatInterface] 🚀 Stream start reçu, streamId:', data.streamId);
      currentStreamIdRef.current = data.streamId;
      setStreamingMessage('');
      setIsGenerating(true);
    });

    window.electronAPI.ollama.onStreamChunk((data: { streamId: string; chunk: OllamaChatStreamChunk }) => {
      if (data.streamId === currentStreamIdRef.current) {
        setStreamingMessage((prev) => prev + (data.chunk.message?.content || ''));

        if (data.chunk.done) {
          console.log('[ChatInterface] 🏁 Stream terminé');
          setStreamingMessage((currentContent) => {
            const finalContent = currentContent + (data.chunk.message?.content || '');
            const finalMessage: OllamaMessage = {
              role: 'assistant',
              content: finalContent,
            };
            setMessages((prev) => {
              const newMessages = [...prev, finalMessage];
              const assistantMessageIndex = prev.length;

              if (currentMentionedPersonaIdsRef.current && currentMentionedPersonaIdsRef.current.length > 0) {
                setMessageMetadata((prevMetadata) => ({
                  ...prevMetadata,
                  [assistantMessageIndex]: {
                    personaId: currentMentionedPersonaIdsRef.current![0],
                    personaIds: currentMentionedPersonaIdsRef.current,
                    timestamp: Date.now(),
                  },
                }));
              }

              return newMessages;
            });
            return '';
          });
          setIsGenerating(false);
          currentStreamIdRef.current = null;
          currentMentionedPersonaIdsRef.current = undefined;
        }
      }
    });

    window.electronAPI.ollama.onStreamEnd((data: { streamId: string; stopped?: boolean }) => {
      if (data.streamId === currentStreamIdRef.current) {
        if (data.stopped) {
          setStreamingMessage((currentContent) => {
            if (currentContent && currentContent.trim()) {
              const partialMessage: OllamaMessage = {
                role: 'assistant',
                content: currentContent + ' [interrompu]',
              };
              setMessages((prev) => [...prev, partialMessage]);
            }
            return '';
          });
        }

        setIsGenerating(false);
        setStreamingMessage('');
        currentStreamIdRef.current = null;
      }
    });

    return () => {
      console.log('[ChatInterface] 🧹 Nettoyage des listeners');
    };
  }, []);

  // Auto-scroll vers le bas
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const handleSendMessage = async (content: string, mentionedPersonaIds?: string[], includeFewShots?: boolean) => {
    if (!content.trim() || !selectedModel) return;

    // Construire les messages avec le contexte du document si disponible
    const userContent = documentContext
      ? `Contexte du document:\n\`\`\`markdown\n${documentContext}\n\`\`\`\n\nQuestion: ${content}`
      : content;

    const userMessage: OllamaMessage = {
      role: 'user',
      content: userContent,
    };

    const messagesToSend: OllamaMessage[] = [];

    // Ajouter le system prompt si un persona est sélectionné
    const mentionedPersonas = mentionedPersonaIds
      ? mentionedPersonaIds.map(id => personas.find(p => p.id === id)).filter((p): p is Persona => p !== undefined)
      : [];

    const personasToUse = mentionedPersonas.length > 0 ? mentionedPersonas : (currentPersona ? [currentPersona] : []);

    if (personasToUse.length > 0) {
      const systemPrompts = personasToUse.map(p => p.systemPrompt || '').filter(p => p);
      if (systemPrompts.length > 0) {
        messagesToSend.push({
          role: 'system',
          content: systemPrompts.join('\n\n---\n\n'),
        });
      }

      // Ajouter les few-shots si demandé
      if (includeFewShots) {
        personasToUse.forEach(persona => {
          if (persona.fewShotExamples && persona.fewShotExamples.length > 0) {
            persona.fewShotExamples.forEach(example => {
              messagesToSend.push({ role: 'user', content: example.user });
              messagesToSend.push({ role: 'assistant', content: example.assistant });
            });
          }
        });
      }
    }

    messagesToSend.push(...messages, userMessage);
    currentMentionedPersonaIdsRef.current = mentionedPersonaIds;

    setMessages([...messages, userMessage]);

    try {
      await window.electronAPI.ollama.chatStream({
        model: selectedModel,
        messages: messagesToSend,
        stream: true,
      });
    } catch (error) {
      console.error('[ChatInterface] Erreur:', error);
      setIsGenerating(false);
    }
  };

  const handleStop = async () => {
    const streamId = currentStreamIdRef.current;
    if (streamId) {
      await window.electronAPI.ollama.stopStream(streamId);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setMessageMetadata({});
    setStreamingMessage('');
  };

  const handleRegenerate = (messageIndex: number) => {
    // Trouver le dernier message user avant ce message
    const userMessageIndex = messages.slice(0, messageIndex).findLastIndex((m) => m.role === 'user');
    if (userMessageIndex >= 0) {
      const newMessages = messages.slice(0, messageIndex);
      setMessages(newMessages);
      const userMessage = messages[userMessageIndex];
      handleSendMessage(userMessage.content);
    }
  };

  const handlePersonaSelect = (persona: Persona | null) => {
    setCurrentPersona(persona);
    if (onPersonaChange) {
      onPersonaChange(persona);
    }
    setIsPersonaModalOpen(false);
  };

  const handleApplyPrompt = (promptId: string) => {
    const prompt = prompts.find(p => p.id === promptId);
    if (!prompt) return;

    // Déterminer le texte à utiliser (sélection ou document complet)
    const textToUse = selectedText || documentContext || '';

    // Remplacer les variables dans le prompt
    const filledContent = replaceVariables(prompt.content, {
      texte: textToUse,
      text: textToUse,
      contenu: textToUse,
      content: textToUse,
      selection: textToUse,
      document: documentContext || '',
    });

    // Pré-remplir l'input avec le prompt
    setPrefilledMessage(filledContent);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between p-4 glass-card border-b border-white/10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">{title}</h1>
            <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />

            {/* Persona Selection Button */}
            <button
              onClick={() => setIsPersonaModalOpen(true)}
              className={`header-btn gap-2 px-3 ${
                currentPersona
                  ? 'glass-card border border-white/20'
                  : 'glass-hover'
              }`}
              title={currentPersona ? `Persona: ${currentPersona.name}` : 'Sélectionner un persona'}
            >
              {currentPersona ? (
                <>
                  <div
                    className={`w-6 h-6 rounded-lg bg-gradient-to-br ${
                      PERSONA_COLOR_CLASSES[currentPersona.color] || PERSONA_COLOR_CLASSES.purple
                    } flex items-center justify-center text-sm flex-shrink-0`}
                  >
                    {currentPersona.avatar}
                  </div>
                  <span className="text-sm font-medium">{currentPersona.name}</span>
                </>
              ) : (
                <>
                  <User className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">Persona</span>
                </>
              )}
            </button>

            {/* Prompt Selector for Editor */}
            {editorPrompts.length > 0 && (
              <div className="relative">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleApplyPrompt(e.target.value);
                      e.target.value = ''; // Reset after selection
                    }
                  }}
                  className="header-btn gap-2 px-3 pr-8 glass-hover appearance-none cursor-pointer"
                  title="Appliquer une fonction sur le texte"
                >
                  <option value="">🪄 Actions rapides</option>
                  {editorPrompts.map(prompt => (
                    <option key={prompt.id} value={prompt.id}>
                      {prompt.icon} {prompt.editorTitle || prompt.name}
                    </option>
                  ))}
                </select>
                <Wand2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!hideImportExport && (
              <ExportMenu
                messages={messages}
                conversationTitle={title}
              />
            )}
            <button
              onClick={() => setIsChatSearchOpen(true)}
              className="header-btn glass-hover"
              title="Rechercher dans la conversation"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={handleClearChat}
              className="header-btn glass-hover hover:bg-red-500/20"
              title="Effacer la conversation"
            >
              <Trash2 className="w-5 h-5 text-red-400" />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="header-btn glass-hover"
              title="Paramètres du Chat"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {isChatSearchOpen && (
        <ChatSearchBar
          searchQuery={chatSearchQuery}
          onSearchChange={setChatSearchQuery}
          currentIndex={currentSearchIndex}
          totalResults={0}
          onPrevious={() => {}}
          onNext={() => {}}
          onClose={() => setIsChatSearchOpen(false)}
        />
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 && !streamingMessage ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-bold mb-2">
                {documentContext ? 'Assistant de rédaction' : 'Commencez une conversation'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {documentContext
                  ? 'Posez des questions sur votre document ou demandez de l\'aide pour la rédaction'
                  : 'Posez une question ou démarrez une discussion avec l\'IA'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.map((message, index) => {
              const metadata = messageMetadata[index];
              const mentionedPersonas = metadata?.personaIds
                ? metadata.personaIds.map(id => personas.find(p => p.id === id)).filter((p): p is Persona => p !== undefined)
                : undefined;

              return (
                <ChatMessage
                  key={index}
                  message={message}
                  mentionedPersonas={mentionedPersonas}
                  syntaxTheme={chatSettings.syntaxTheme}
                  showLineNumbers={chatSettings.showLineNumbers}
                  onRegenerate={message.role === 'assistant' ? () => handleRegenerate(index) : undefined}
                  onInsert={message.role === 'assistant' && onInsertText ? () => onInsertText(message.content) : undefined}
                  isLastAssistantMessage={message.role === 'assistant' && index === messages.length - 1 && !isGenerating}
                />
              );
            })}

            {streamingMessage && (
              <ChatMessage
                message={{ role: 'assistant', content: streamingMessage }}
                isStreaming={true}
                syntaxTheme={chatSettings.syntaxTheme}
                showLineNumbers={chatSettings.showLineNumbers}
                onInsert={onInsertText ? () => onInsertText(streamingMessage) : undefined}
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 glass-card border-t border-white/10">
        <ChatInput
          onSend={handleSendMessage}
          onStop={handleStop}
          disabled={!selectedModel}
          isGenerating={isGenerating}
          placeholder={selectedModel ? 'Tapez votre message...' : 'Sélectionnez d\'abord un modèle...'}
          personas={personas}
          initialMessage={prefilledMessage}
          onMessageChange={() => setPrefilledMessage('')}
        />
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <ChatSettings
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          settings={chatSettings}
          onSave={(settings) => {
            setChatSettings(settings);
            localStorage.setItem('chatSettings', JSON.stringify(settings));
          }}
        />
      )}

      {/* Persona Selection Modal */}
      {isPersonaModalOpen && (
        <PersonaSelectionModal
          isOpen={isPersonaModalOpen}
          onClose={() => setIsPersonaModalOpen(false)}
          onSelect={handlePersonaSelect}
          personas={personas}
          currentPersona={currentPersona}
        />
      )}
    </div>
  );
}
