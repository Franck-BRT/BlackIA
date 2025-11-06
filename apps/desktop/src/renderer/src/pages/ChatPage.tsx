import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Trash2, Settings, Menu, Search } from 'lucide-react';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { ModelSelector } from '../components/chat/ModelSelector';
import { ChatSettings, ChatSettingsData, DEFAULT_CHAT_SETTINGS } from '../components/chat/ChatSettings';
import { ConversationSidebar } from '../components/chat/ConversationSidebarWithFolders';
import { ExportMenu } from '../components/chat/ExportMenu';
import { ChatSearchBar } from '../components/chat/ChatSearchBar';
import { TagModal } from '../components/chat/TagModal';
import { FolderModal } from '../components/chat/FolderModal';
import { KeyboardShortcutsModal } from '../components/chat/KeyboardShortcutsModal';
import { useConversations } from '../hooks/useConversations';
import { useFolders } from '../hooks/useFolders';
import { useTags } from '../hooks/useTags';
import { useKeyboardShortcuts, KeyboardShortcut } from '../hooks/useKeyboardShortcuts';
import type { OllamaMessage, OllamaChatStreamChunk } from '@blackia/ollama';
import type { Folder } from '../hooks/useConversations';

export function ChatPage() {
  const [messages, setMessages] = useState<OllamaMessage[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [regenerationCounts, setRegenerationCounts] = useState<Map<number, number>>(new Map());
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
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
  const previousMessagesLengthRef = useRef<number>(0);

  // Hook pour gérer les conversations
  const {
    conversations,
    currentConversationId,
    setCurrentConversationId,
    createConversation,
    updateConversation,
    deleteConversation,
    loadConversation,
    getCurrentConversation,
    generateTitle,
    moveToFolder,
    renameConversation,
    addTagToConversation,
    removeTagFromConversation,
    toggleFavorite,
  } = useConversations();

  // Hook pour gérer les dossiers
  const {
    folders,
    createFolder,
    renameFolder,
    deleteFolder,
  } = useFolders();

  // Hook pour gérer les tags
  const {
    tags,
    createTag,
  } = useTags();

  // Calculer les résultats de recherche dans le chat
  const searchResults = useMemo(() => {
    if (!chatSearchQuery.trim()) {
      return { totalCount: 0, messageOccurrences: [] };
    }

    const query = chatSearchQuery.toLowerCase();
    const escapedQuery = chatSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, 'gi');

    let totalCount = 0;
    const messageOccurrences: Array<{ messageIndex: number; startIndex: number; count: number }> = [];

    messages.forEach((message, messageIndex) => {
      const matches = message.content.match(regex);
      if (matches && matches.length > 0) {
        messageOccurrences.push({
          messageIndex,
          startIndex: totalCount,
          count: matches.length,
        });
        totalCount += matches.length;
      }
    });

    return { totalCount, messageOccurrences };
  }, [messages, chatSearchQuery]);

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

      // Déterminer si c'est un nouveau message ou juste un chargement
      const isNewMessage = messages.length > previousMessagesLengthRef.current;
      previousMessagesLengthRef.current = messages.length;

      // Ne pas réorganiser la liste si on ne fait que charger
      updateConversation(
        currentConversationId,
        {
          messages,
          model: selectedModel,
          title,
        },
        !isNewMessage // skipSort = true si pas de nouveau message
      );

      console.log('[ChatPage] 💾 Conversation auto-sauvegardée:', currentConversationId, 'isNewMessage:', isNewMessage);
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

    // Reset l'UI et le currentConversationId
    // La conversation sera créée automatiquement au premier message
    setCurrentConversationId(null);
    setMessages([]);
    setStreamingMessage('');
    setIsGenerating(false);
    currentStreamIdRef.current = null;
    previousMessagesLengthRef.current = 0;
    setRegenerationCounts(new Map());

    console.log('[ChatPage] ✨ Prêt pour une nouvelle conversation');
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
      setRegenerationCounts(new Map());

      // Mettre à jour le ref pour que l'auto-save ne considère pas ça comme un nouveau message
      previousMessagesLengthRef.current = conv.messages.length;

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
      setRegenerationCounts(new Map());
    }
  };

  // Régénérer la dernière réponse de l'IA
  const handleRegenerate = async () => {
    if (isGenerating) {
      return;
    }

    // Trouver le dernier message assistant
    const lastAssistantIndex = messages.findLastIndex((m) => m.role === 'assistant');
    if (lastAssistantIndex === -1) {
      return;
    }

    // Supprimer le dernier message assistant
    const updatedMessages = messages.slice(0, lastAssistantIndex);
    setMessages(updatedMessages);

    // Incrémenter le compteur de régénération pour ce message
    setRegenerationCounts((prev) => {
      const newCounts = new Map(prev);
      const currentCount = newCounts.get(lastAssistantIndex) || 0;
      newCounts.set(lastAssistantIndex, currentCount + 1);
      return newCounts;
    });

    try {
      console.log('[ChatPage] 🔄 Régénération de la réponse');

      // Construire la liste des messages avec le system prompt si défini
      const messagesToSend: OllamaMessage[] = [];

      if (chatSettings.systemPrompt.trim()) {
        messagesToSend.push({
          role: 'system',
          content: chatSettings.systemPrompt,
        });
      }

      messagesToSend.push(...updatedMessages);

      // Relancer la génération avec le même contexte
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

      console.log('[ChatPage] ✅ Régénération lancée');
    } catch (error: any) {
      console.error('Erreur lors de la régénération:', error);
      setIsGenerating(false);

      const errorMessage: OllamaMessage = {
        role: 'system',
        content: `❌ Erreur: ${error.message || 'Erreur inconnue'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // Définir les raccourcis clavier (après la définition de toutes les fonctions utilisées)
  const keyboardShortcuts: KeyboardShortcut[] = useMemo(() => [
    // Navigation
    {
      key: 'b',
      ctrl: true,
      description: 'Afficher/Masquer la sidebar',
      action: () => setIsSidebarOpen(!isSidebarOpen),
      category: 'Navigation',
    },
    {
      key: 'f',
      ctrl: true,
      description: 'Rechercher dans la conversation',
      action: () => setIsChatSearchOpen(true),
      category: 'Recherche',
    },
    {
      key: 'k',
      ctrl: true,
      description: 'Rechercher dans les conversations',
      action: () => {
        // Focus sur la barre de recherche de la sidebar si elle existe
        const searchInput = document.querySelector('.sidebar-search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      category: 'Recherche',
    },
    // Actions
    {
      key: 'n',
      ctrl: true,
      description: 'Nouvelle conversation',
      action: handleNewConversation,
      category: 'Actions',
    },
    {
      key: 's',
      ctrl: true,
      description: 'Sauvegarder (déjà automatique)',
      action: () => {
        // La sauvegarde est automatique, on affiche juste une notification visuelle
        console.log('💾 Conversation sauvegardée automatiquement');
      },
      category: 'Actions',
    },
    {
      key: ',',
      ctrl: true,
      description: 'Ouvrir les paramètres',
      action: () => setIsSettingsOpen(true),
      category: 'Actions',
    },
    // Chat
    {
      key: 'l',
      ctrl: true,
      description: 'Effacer la conversation',
      action: handleClearChat,
      category: 'Chat',
    },
    {
      key: 'r',
      ctrl: true,
      shift: true,
      description: 'Régénérer la dernière réponse',
      action: () => {
        if (!isGenerating) {
          handleRegenerate();
        }
      },
      category: 'Chat',
    },
    // Aide
    {
      key: '?',
      ctrl: true,
      description: 'Afficher les raccourcis clavier',
      action: () => setIsShortcutsModalOpen(true),
      category: 'Aide',
    },
    {
      key: '/',
      ctrl: true,
      description: 'Afficher les raccourcis clavier',
      action: () => setIsShortcutsModalOpen(true),
      category: 'Aide',
    },
  ], [isSidebarOpen, isGenerating, handleNewConversation, handleClearChat, handleRegenerate]);

  // Activer les raccourcis clavier
  useKeyboardShortcuts({
    shortcuts: keyboardShortcuts,
    enabled: !isSettingsOpen && !isTagModalOpen && !isFolderModalOpen && !isShortcutsModalOpen,
  });

  // Éditer le dernier message utilisateur et régénérer la réponse
  const handleEditUserMessage = async (newContent: string) => {
    if (isGenerating) {
      return;
    }

    // Trouver le dernier message utilisateur
    const lastUserIndex = messages.findLastIndex((m) => m.role === 'user');
    if (lastUserIndex === -1) {
      return;
    }

    // Mettre à jour le message utilisateur
    const updatedMessages = [...messages];
    updatedMessages[lastUserIndex] = {
      ...updatedMessages[lastUserIndex],
      content: newContent,
    };

    // Trouver et supprimer le dernier message assistant s'il existe
    const lastAssistantIndex = messages.findLastIndex((m) => m.role === 'assistant');
    if (lastAssistantIndex > lastUserIndex) {
      // Il y a une réponse après le message utilisateur, la supprimer
      updatedMessages.splice(lastAssistantIndex, 1);
    }

    setMessages(updatedMessages);

    try {
      console.log('[ChatPage] ✏️ Édition du message et régénération');

      // Construire la liste des messages avec le system prompt si défini
      const messagesToSend: OllamaMessage[] = [];

      if (chatSettings.systemPrompt.trim()) {
        messagesToSend.push({
          role: 'system',
          content: chatSettings.systemPrompt,
        });
      }

      messagesToSend.push(...updatedMessages);

      // Relancer la génération avec le message édité
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

      console.log('[ChatPage] ✅ Régénération lancée après édition');
    } catch (error: any) {
      console.error('Erreur lors de la régénération après édition:', error);
      setIsGenerating(false);

      const errorMessage: OllamaMessage = {
        role: 'system',
        content: `❌ Erreur: ${error.message || 'Erreur inconnue'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // Supprimer un dossier et remettre ses conversations dans "sans dossier"
  const handleDeleteFolder = (folderId: string) => {
    // Trouver toutes les conversations dans ce dossier
    const conversationsInFolder = conversations.filter((conv) => conv.folderId === folderId);

    // Déplacer chaque conversation vers "sans dossier"
    conversationsInFolder.forEach((conv) => {
      moveToFolder(conv.id, null);
    });

    // Supprimer le dossier
    deleteFolder(folderId);

    console.log('[ChatPage] 🗑️ Dossier supprimé:', folderId, 'Conversations déplacées:', conversationsInFolder.length);
  };

  // Gestion de la recherche dans le chat
  const handleChatSearchChange = (query: string) => {
    setChatSearchQuery(query);
    setCurrentSearchIndex(0);
  };

  const handleSearchNext = () => {
    if (searchResults.totalCount > 0) {
      setCurrentSearchIndex((prev) => (prev + 1) % searchResults.totalCount);
    }
  };

  const handleSearchPrevious = () => {
    if (searchResults.totalCount > 0) {
      setCurrentSearchIndex((prev) => (prev - 1 + searchResults.totalCount) % searchResults.totalCount);
    }
  };

  const handleCloseChatSearch = () => {
    setIsChatSearchOpen(false);
    setChatSearchQuery('');
    setCurrentSearchIndex(0);
  };

  // Raccourcis clavier pour la recherche
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+F ou Cmd+F pour ouvrir la recherche
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setIsChatSearchOpen(true);
      }

      // Escape pour fermer la recherche
      if (e.key === 'Escape' && isChatSearchOpen) {
        handleCloseChatSearch();
      }

      // Enter pour aller au suivant, Shift+Enter pour aller au précédent
      if (isChatSearchOpen && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          handleSearchPrevious();
        } else {
          handleSearchNext();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isChatSearchOpen, searchResults.totalCount]);

  // Auto-scroll vers le résultat actif
  useEffect(() => {
    if (isChatSearchOpen && chatSearchQuery && searchResults.totalCount > 0) {
      // Utiliser setTimeout pour laisser le DOM se mettre à jour
      setTimeout(() => {
        const activeElement = document.getElementById('active-search-result');
        if (activeElement) {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [currentSearchIndex, isChatSearchOpen, chatSearchQuery, searchResults.totalCount]);

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="w-80 flex-shrink-0">
          <ConversationSidebar
            conversations={conversations}
            folders={folders}
            tags={tags}
            currentConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            onDeleteConversation={deleteConversation}
            onCreateFolder={createFolder}
            onRenameFolder={renameFolder}
            onDeleteFolder={handleDeleteFolder}
            onMoveToFolder={moveToFolder}
            onRenameConversation={renameConversation}
            onOpenFolderModal={(folder) => {
              setEditingFolder(folder || null);
              setIsFolderModalOpen(true);
            }}
            onCreateTag={(name, color, icon) => {
              createTag(name, color, icon);
            }}
            onOpenTagModal={() => {
              setIsTagModalOpen(true);
            }}
            onToggleConversationTag={(conversationId, tagId) => {
              const conversation = conversations.find(c => c.id === conversationId);
              if (conversation?.tagIds?.includes(tagId)) {
                removeTagFromConversation(conversationId, tagId);
              } else {
                addTagToConversation(conversationId, tagId);
              }
            }}
            onToggleFavorite={toggleFavorite}
            onOpenChatSearch={(initialQuery) => {
              setIsChatSearchOpen(true);
              if (initialQuery) {
                setChatSearchQuery(initialQuery);
                setCurrentSearchIndex(0);
              }
            }}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 glass-card border-b border-white/10 relative z-10">
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
            <ExportMenu
              messages={messages}
              conversationTitle={
                currentConversationId
                  ? conversations.find((c) => c.id === currentConversationId)?.title
                  : 'Conversation'
              }
            />
            <button
              onClick={() => setIsChatSearchOpen(true)}
              className="p-2 rounded-xl glass-hover hover:bg-white/10 transition-colors"
              title="Rechercher dans la conversation (Ctrl+F)"
            >
              <Search className="w-5 h-5" />
            </button>
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

        {/* Search Bar */}
        {isChatSearchOpen && (
          <ChatSearchBar
            searchQuery={chatSearchQuery}
            onSearchChange={handleChatSearchChange}
            currentIndex={currentSearchIndex}
            totalResults={searchResults.totalCount}
            onPrevious={handleSearchPrevious}
            onNext={handleSearchNext}
            onClose={handleCloseChatSearch}
          />
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 relative">
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
            {messages.map((message, index) => {
              // Déterminer si c'est le dernier message assistant
              const lastAssistantIndex = messages.findLastIndex((m) => m.role === 'assistant');
              const isLastAssistantMessage = message.role === 'assistant' && index === lastAssistantIndex && !isGenerating;

              // Déterminer si c'est le dernier message utilisateur
              const lastUserIndex = messages.findLastIndex((m) => m.role === 'user');
              const isLastUserMessage = message.role === 'user' && index === lastUserIndex && !isGenerating;

              // Calculer les props de recherche pour ce message
              const messageOccurrence = searchResults.messageOccurrences.find(
                (occ) => occ.messageIndex === index
              );

              return (
                <ChatMessage
                  key={index}
                  message={message}
                  regenerationCount={regenerationCounts.get(index) || 0}
                  onRegenerate={isLastAssistantMessage ? handleRegenerate : undefined}
                  isLastAssistantMessage={isLastAssistantMessage}
                  isLastUserMessage={isLastUserMessage}
                  onEdit={isLastUserMessage ? handleEditUserMessage : undefined}
                  searchQuery={chatSearchQuery}
                  searchStartIndex={messageOccurrence?.startIndex}
                  activeGlobalIndex={currentSearchIndex}
                  syntaxTheme={chatSettings.syntaxTheme}
                  showLineNumbers={chatSettings.showLineNumbers}
                />
              );
            })}

            {/* Message en cours de streaming */}
            {streamingMessage && (
              <ChatMessage
                message={{
                  role: 'assistant',
                  content: streamingMessage,
                }}
                isStreaming={true}
                syntaxTheme={chatSettings.syntaxTheme}
                showLineNumbers={chatSettings.showLineNumbers}
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

      {/* Tag Modal */}
      <TagModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onSave={(name, color, icon) => {
          createTag(name, color, icon);
          setIsTagModalOpen(false);
        }}
      />

      {/* Folder Modal */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSave={(name, color) => {
          if (editingFolder) {
            renameFolder(editingFolder.id, name);
            // Note: pour changer la couleur, il faudrait ajouter une méthode updateFolderColor
          } else {
            createFolder(name, color);
          }
          setIsFolderModalOpen(false);
          setEditingFolder(null);
        }}
        initialName={editingFolder?.name}
        initialColor={editingFolder?.color}
        title={editingFolder ? 'Modifier le dossier' : 'Nouveau dossier'}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        shortcuts={keyboardShortcuts}
      />
    </div>
  );
}
