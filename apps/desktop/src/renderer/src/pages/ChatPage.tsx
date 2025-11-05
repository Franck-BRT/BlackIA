import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Settings, Menu } from 'lucide-react';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { ModelSelector } from '../components/chat/ModelSelector';
import { ChatSettings, ChatSettingsData, DEFAULT_CHAT_SETTINGS } from '../components/chat/ChatSettings';
import { ConversationSidebar } from '../components/chat/ConversationSidebar';
import { useConversations } from '../hooks/useConversations';
import type { OllamaMessage, OllamaChatStreamChunk } from '@blackia/ollama';

export function ChatPage() {
  const [messages, setMessages] = useState<OllamaMessage[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatSettings, setChatSettings] = useState<ChatSettingsData>(() => {
    // Charger les settings depuis localStorage au démarrage
    try {
      const saved = localStorage.getItem('chatSettings');
      return saved ? JSON.parse(saved) : DEFAULT_CHAT_SETTINGS;
    } catch {
      return DEFAULT_CHAT_SETTINGS;
    }
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentStreamIdRef = useRef<string | null>(null);

  // Hook pour gérer les conversations
  const {
    conversations,
    currentConversationId,
    createConversation,
    updateConversation,
    deleteConversation,
    loadConversation,
    getCurrentConversation,
    generateTitle,
  } = useConversations();

  // Auto-scroll vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  // Auto-sauvegarder la conversation quand les messages changent
  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      const title = generateTitle(messages);
      updateConversation(currentConversationId, {
        messages,
        model: selectedModel,
        title,
      });
      console.log('[ChatPage] 💾 Conversation auto-sauvegardée:', currentConversationId);
    }
  }, [messages, currentConversationId, selectedModel, updateConversation, generateTitle]);

  // Setup des listeners pour le streaming
  useEffect(() => {
    console.log('[ChatPage] 🎧 Enregistrement des listeners de streaming');

    // Listener pour le début du streaming - SET LE STREAMID IMMÉDIATEMENT
    window.electronAPI.ollama.onStreamStart((data: { streamId: string }) => {
      console.log('[ChatPage] 🚀 Stream start reçu, streamId:', data.streamId);
      currentStreamIdRef.current = data.streamId;
      setStreamingMessage('');
      setIsGenerating(true);
    });

    // Listener pour les chunks de streaming
    window.electronAPI.ollama.onStreamChunk((data: { streamId: string; chunk: OllamaChatStreamChunk }) => {
      console.log('[ChatPage] 📥 Chunk reçu:', {
        receivedStreamId: data.streamId,
        currentStreamId: currentStreamIdRef.current,
        content: data.chunk.message.content,
        done: data.chunk.done,
      });

      // Utiliser le ref au lieu du state pour éviter les problèmes de timing
      if (data.streamId === currentStreamIdRef.current) {
        console.log('[ChatPage] ✅ StreamId match! Traitement du chunk');
        setStreamingMessage((prev) => {
          const newContent = prev + data.chunk.message.content;
          console.log('[ChatPage] 📝 Contenu accumulé:', newContent);
          return newContent;
        });

        // Si le stream est terminé
        if (data.chunk.done) {
          console.log('[ChatPage] 🏁 Stream terminé, création du message final');
          setStreamingMessage((currentContent) => {
            const finalContent = currentContent + data.chunk.message.content;
            const finalMessage: OllamaMessage = {
              role: 'assistant',
              content: finalContent,
            };
            setMessages((prev) => [...prev, finalMessage]);
            return '';
          });
          setIsGenerating(false);
          currentStreamIdRef.current = null;
        }
      } else {
        console.log('[ChatPage] ⚠️ StreamId ne correspond pas, chunk ignoré');
      }
    });

    // Listener pour la fin du stream
    window.electronAPI.ollama.onStreamEnd((data: { streamId: string; stopped?: boolean }) => {
      console.log('[ChatPage] 🏁 Stream terminé:', {
        streamId: data.streamId,
        stopped: data.stopped,
        currentStreamId: currentStreamIdRef.current,
      });

      // Vérifier que c'est bien notre stream
      if (data.streamId === currentStreamIdRef.current) {
        console.log('[ChatPage] ✅ Cleanup du stream');

        // Si le stream a été stoppé, sauvegarder le contenu partiel
        if (data.stopped) {
          console.log('[ChatPage] 🛑 Stream stoppé, vérification du contenu partiel...');
          setStreamingMessage((currentContent) => {
            console.log('[ChatPage] 📝 Contenu partiel à sauvegarder:', currentContent?.substring(0, 100));
            if (currentContent && currentContent.trim()) {
              const partialMessage: OllamaMessage = {
                role: 'assistant',
                content: currentContent + ' [interrompu]',
              };
              console.log('[ChatPage] 💾 Sauvegarde du message partiel');
              setMessages((prev) => [...prev, partialMessage]);
            } else {
              console.log('[ChatPage] ⚠️ Pas de contenu partiel à sauvegarder');
            }
            return '';
          });
        }

        setIsGenerating(false);
        currentStreamIdRef.current = null;
      }
    });

    // Listener pour les erreurs
    window.electronAPI.ollama.onStreamError((data: { error: string }) => {
      console.error('[ChatPage] ❌ Erreur de streaming:', data.error);
      setIsGenerating(false);
      currentStreamIdRef.current = null;
      setStreamingMessage('');

      // Ajouter un message d'erreur
      const errorMessage: OllamaMessage = {
        role: 'system',
        content: `❌ Erreur: ${data.error}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    });

    // Cleanup
    return () => {
      console.log('[ChatPage] 🧹 Nettoyage des listeners');
      window.electronAPI.ollama.removeAllListeners('ollama:streamStart');
      window.electronAPI.ollama.removeAllListeners('ollama:streamChunk');
      window.electronAPI.ollama.removeAllListeners('ollama:streamEnd');
      window.electronAPI.ollama.removeAllListeners('ollama:streamError');
    };
  }, []); // Pas de dépendances pour n'enregistrer qu'une seule fois

  // Nouvelle conversation
  const handleNewConversation = () => {
    if (messages.length > 0 && !confirm('Voulez-vous créer une nouvelle conversation ?')) {
      return;
    }

    setMessages([]);
    setStreamingMessage('');
    setIsGenerating(false);
    currentStreamIdRef.current = null;

    console.log('[ChatPage] ✨ Nouvelle conversation');
  };

  // Charger une conversation
  const handleSelectConversation = (id: string) => {
    const conv = loadConversation(id);
    if (conv) {
      setMessages(conv.messages);
      setSelectedModel(conv.model);
      setStreamingMessage('');
      setIsGenerating(false);
      currentStreamIdRef.current = null;
      console.log('[ChatPage] 📂 Conversation chargée:', id, 'Messages:', conv.messages.length);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!selectedModel) {
      alert('Veuillez sélectionner un modèle');
      return;
    }

    // Créer une nouvelle conversation si nécessaire
    if (!currentConversationId && messages.length === 0) {
      const newConv = createConversation(selectedModel);
      console.log('[ChatPage] ✨ Nouvelle conversation créée automatiquement:', newConv.id);
    }

    // Ajouter le message de l'utilisateur
    const userMessage: OllamaMessage = {
      role: 'user',
      content,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      console.log('[ChatPage] 📤 Envoi du message au backend');
      console.log('[ChatPage] 📋 Settings:', chatSettings);

      // Construire la liste des messages avec le system prompt si défini
      const messagesToSend: OllamaMessage[] = [];

      if (chatSettings.systemPrompt.trim()) {
        messagesToSend.push({
          role: 'system',
          content: chatSettings.systemPrompt,
        });
      }

      messagesToSend.push(...messages, userMessage);

      // Envoyer la requête de chat avec streaming
      // Le streamId sera défini par le listener onStreamStart
      await window.electronAPI.ollama.chatStream({
        model: selectedModel,
        messages: messagesToSend,
        stream: true,
        options: {
          temperature: chatSettings.temperature,
          num_ctx: chatSettings.maxTokens,
          top_p: chatSettings.topP,
        },
      });

      console.log('[ChatPage] ✅ Handler chatStream terminé');
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setIsGenerating(false);

      const errorMessage: OllamaMessage = {
        role: 'system',
        content: `❌ Erreur: ${error.message || 'Erreur inconnue'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleStop = async () => {
    const streamId = currentStreamIdRef.current;
    if (!streamId) {
      console.log('[ChatPage] ⚠️ Aucun stream actif à stopper');
      return;
    }

    try {
      console.log('[ChatPage] 🛑 Demande d\'arrêt du stream:', streamId);
      const result = await window.electronAPI.ollama.stopStream(streamId);
      console.log('[ChatPage] ✅ Réponse stopStream:', result);

      // Le cleanup sera fait par le listener onStreamEnd
    } catch (error: any) {
      console.error('[ChatPage] ❌ Erreur lors du stop:', error);

      // Cleanup local en cas d'erreur
      setIsGenerating(false);
      currentStreamIdRef.current = null;

      if (streamingMessage) {
        const partialMessage: OllamaMessage = {
          role: 'assistant',
          content: streamingMessage + ' [interrompu]',
        };
        setMessages((prev) => [...prev, partialMessage]);
        setStreamingMessage('');
      }
    }
  };

  const handleClearChat = () => {
    if (confirm('Voulez-vous vraiment effacer toute la conversation ?')) {
      setMessages([]);
      setStreamingMessage('');
      setIsGenerating(false);
      currentStreamIdRef.current = null;
    }
  };

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="w-80 flex-shrink-0">
          <ConversationSidebar
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={deleteConversation}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 glass-card border-b border-white/10">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 rounded-xl glass-hover hover:bg-white/10 transition-colors"
              title={isSidebarOpen ? 'Masquer la sidebar' : 'Afficher la sidebar'}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Chat</h1>
            <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClearChat}
              className="p-2 rounded-xl glass-hover hover:bg-red-500/20 transition-colors"
              title="Effacer la conversation"
            >
              <Trash2 className="w-5 h-5 text-red-400" />
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl glass-hover hover:bg-white/10 transition-colors"
              title="Paramètres"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 && !streamingMessage ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="text-6xl mb-4">💬</div>
              <h2 className="text-2xl font-bold mb-2">Commencez une conversation</h2>
              <p className="text-muted-foreground mb-6">
                Posez une question ou démarrez une discussion avec l'IA
              </p>
              {!selectedModel && (
                <div className="glass-card px-4 py-2 rounded-xl text-sm text-yellow-400 inline-block">
                  ⚠️ Sélectionnez d'abord un modèle
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {messages.map((message, index) => (
              <ChatMessage key={index} message={message} />
            ))}

            {/* Message en cours de streaming */}
            {streamingMessage && (
              <ChatMessage
                message={{
                  role: 'assistant',
                  content: streamingMessage,
                }}
                isStreaming={true}
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
        </div>

        {/* Input */}
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            <ChatInput
              onSend={handleSendMessage}
              onStop={handleStop}
              disabled={!selectedModel}
              isGenerating={isGenerating}
              placeholder={
                selectedModel
                  ? 'Tapez votre message...'
                  : 'Sélectionnez d\'abord un modèle...'
              }
            />
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <ChatSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={chatSettings}
        onSave={(newSettings) => {
          console.log('[ChatPage] 💾 Nouveaux settings sauvegardés:', newSettings);
          setChatSettings(newSettings);
          // Persister dans localStorage
          localStorage.setItem('chatSettings', JSON.stringify(newSettings));
        }}
      />
    </div>
  );
}
