import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Trash2, Settings, Menu, Search, BarChart3, User } from 'lucide-react';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { ModelSelector } from '../components/chat/ModelSelector';
import { ChatSettings, ChatSettingsData, DEFAULT_CHAT_SETTINGS } from '../components/chat/ChatSettings';
import { ConversationSidebar } from '../components/chat/ConversationSidebarWithFolders';
import { ExportMenu } from '../components/chat/ExportMenu';
import { ImportExportMenu, BackupData } from '../components/chat/ImportExportMenu';
import { ChatSearchBar } from '../components/chat/ChatSearchBar';
import { TagModal } from '../components/chat/TagModal';
import { FolderModal } from '../components/chat/FolderModal';
import { KeyboardShortcutsModal } from '../components/chat/KeyboardShortcutsModal';
import { StatisticsModal } from '../components/chat/StatisticsModal';
import { PersonaSelectionModal } from '../components/chat/PersonaSelectionModal';
import { useConversations, type MessageMetadata } from '../hooks/useConversations';
import { useFolders } from '../hooks/useFolders';
import { useTags } from '../hooks/useTags';
import { usePersonas } from '../hooks/usePersonas';
import { useKeyboardShortcuts, KeyboardShortcut } from '../hooks/useKeyboardShortcuts';
import { useCustomKeyboardShortcuts } from '../hooks/useCustomKeyboardShortcuts';
import { useStatistics } from '../hooks/useStatistics';
import type { OllamaMessage, OllamaChatStreamChunk } from '@blackia/ollama';
import type { Folder } from '../hooks/useConversations';
import type { Persona } from '../types/persona';
import { PERSONA_COLOR_CLASSES } from '../types/persona';

export function ChatPage() {
  const [messages, setMessages] = useState<OllamaMessage[]>([]);
  const [messageMetadata, setMessageMetadata] = useState<Record<number, MessageMetadata>>({});
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
  const [isStatisticsModalOpen, setIsStatisticsModalOpen] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
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
  const currentMentionedPersonaIdRef = useRef<string | undefined>(undefined);

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
    importConversation,
    importBackup,
    removeTagFromAllConversations,
  } = useConversations();

  // Hook pour gérer les dossiers
  const {
    folders,
    createFolder,
    renameFolder,
    changeFolderColor,
    deleteFolder,
    importFolders,
  } = useFolders();

  // Hook pour gérer les tags
  const {
    tags,
    createTag,
    updateTag,
    deleteTag,
    importTags,
  } = useTags();

  // Hook pour gérer les personas
  const { personas } = usePersonas();

  // Hook pour les statistiques
  const statistics = useStatistics(conversations);

  // Hook pour les raccourcis clavier personnalisés
  const { shortcuts: customShortcuts } = useCustomKeyboardShortcuts();

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

  // Obtenir le persona actuel de la conversation
  const currentPersona = useMemo(() => {
    const currentConv = getCurrentConversation();
    if (!currentConv?.personaId) return null;
    return personas.find((p) => p.id === currentConv.personaId) || null;
  }, [getCurrentConversation, personas, currentConversationId]);

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
          messageMetadata,
          model: selectedModel,
          title,
        },
        !isNewMessage // skipSort = true si pas de nouveau message
      );

      console.log('[ChatPage] 💾 Conversation auto-sauvegardée:', currentConversationId, 'isNewMessage:', isNewMessage);
    }
  }, [messages, messageMetadata, currentConversationId, selectedModel, updateConversation, generateTitle]);

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
            setMessages((prev) => {
              const newMessages = [...prev, finalMessage];
              // L'index du message assistant sera prev.length
              const assistantMessageIndex = prev.length;

              // Si un persona a été mentionné pour cette requête, ajouter les métadonnées
              if (currentMentionedPersonaIdRef.current) {
                setMessageMetadata((prevMetadata) => ({
                  ...prevMetadata,
                  [assistantMessageIndex]: {
                    personaId: currentMentionedPersonaIdRef.current,
                    timestamp: Date.now(),
                  },
                }));
                console.log('[ChatPage] 📝 Métadonnées ajoutées pour le message assistant à l\'index', assistantMessageIndex);
              }

              return newMessages;
            });
            return '';
          });
          setIsGenerating(false);
          currentStreamIdRef.current = null;
          currentMentionedPersonaIdRef.current = undefined; // Réinitialiser
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
    setMessageMetadata({});
    setStreamingMessage('');
    setIsGenerating(false);
    currentStreamIdRef.current = null;
    currentMentionedPersonaIdRef.current = undefined;
    previousMessagesLengthRef.current = 0;
    setRegenerationCounts(new Map());

    console.log('[ChatPage] ✨ Prêt pour une nouvelle conversation');
  };

  // Import d'une conversation unique
  const handleImportConversation = (conversation: any) => {
    importConversation(conversation);
  };

  // Import d'un backup complet
  const handleImportBackup = (data: BackupData, mode: 'merge' | 'replace') => {
    // Importer les conversations
    importBackup(data.conversations, mode);

    // Importer les dossiers
    if (data.folders) {
      importFolders(data.folders, mode);
    }

    // Importer les tags
    if (data.tags) {
      importTags(data.tags, mode);
    }

    console.log('[ChatPage] ✅ Backup importé:', mode, data.conversations.length, 'conversations');
  };

  // Suppression de tag avec nettoyage
  const handleDeleteTag = (tagId: string) => {
    // Retirer le tag de toutes les conversations
    removeTagFromAllConversations(tagId);
    // Supprimer le tag
    deleteTag(tagId);
  };

  // Sélectionner un persona pour la conversation
  const handleSelectPersona = async (persona: Persona | null, includeFewShots: boolean) => {
    // Si persona est null, on le retire
    if (!persona) {
      if (currentConversationId) {
        updateConversation(currentConversationId, { personaId: undefined });
        console.log('[ChatPage] 👤 Persona retiré de la conversation');
      }
      return;
    }

    // Déterminer le modèle à utiliser
    const modelToUse = persona.model || selectedModel;

    // Si pas de modèle sélectionné du tout, demander à l'utilisateur
    if (!modelToUse) {
      alert('Veuillez d\'abord sélectionner un modèle');
      return;
    }

    // Vérifier si le persona utilise un modèle différent
    if (persona.model && persona.model !== selectedModel) {
      const confirmed = confirm(
        `Le persona "${persona.name}" utilise le modèle "${persona.model}".\n\n` +
        `Voulez-vous changer le modèle actuel "${selectedModel || 'aucun'}" vers "${persona.model}" ?`
      );

      if (confirmed) {
        setSelectedModel(persona.model);
        console.log('[ChatPage] 🔄 Modèle changé:', selectedModel, '→', persona.model);
      }
    } else if (!selectedModel) {
      // Si aucun modèle n'était sélectionné, utiliser celui du persona ou demander
      setSelectedModel(modelToUse);
    }

    // Créer une nouvelle conversation si nécessaire
    let conversationId = currentConversationId;
    const isNewConversation = !conversationId || messages.length === 0;

    if (!conversationId) {
      const newConv = createConversation(modelToUse, `Conversation avec ${persona.name}`);
      conversationId = newConv.id;
      console.log('[ChatPage] ✨ Nouvelle conversation créée pour le persona:', conversationId);
    }

    // Stocker le persona dans la conversation
    updateConversation(conversationId, { personaId: persona.id });

    // Stocker les préférences few-shots dans chatSettings (temporaire pour cette session)
    setChatSettings(prev => ({
      ...prev,
      includeFewShots,
    }));

    console.log('[ChatPage] 👤 Persona appliqué:', persona.name, 'Few-shots:', includeFewShots);

    // Si c'est une nouvelle conversation, générer un message de bienvenue
    if (isNewConversation) {
      await generatePersonaWelcomeMessage(persona, includeFewShots, modelToUse);
    }
  };

  // Générer un message de bienvenue du persona
  const generatePersonaWelcomeMessage = async (persona: Persona, includeFewShots: boolean, model: string) => {
    try {
      console.log('[ChatPage] 💬 Génération du message de bienvenue du persona');

      // Construire le prompt système pour le persona
      let systemPrompt = persona.systemPrompt;

      if (includeFewShots && persona.fewShotExamples?.length) {
        const fewShotsText = persona.fewShotExamples
          .map((example) => `Utilisateur: ${example.input}\nAssistant: ${example.output}`)
          .join('\n\n');
        systemPrompt += '\n\nExemples:\n' + fewShotsText;
      }

      // Message demandant à l'IA de se présenter
      const welcomePrompt: OllamaMessage = {
        role: 'user',
        content: 'Bonjour ! Peux-tu te présenter brièvement et m\'expliquer comment tu peux m\'aider ?',
      };

      const messagesToSend: OllamaMessage[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
        welcomePrompt,
      ];

      // Ajouter le message utilisateur à l'historique
      setMessages([welcomePrompt]);

      // Envoyer la requête de chat avec streaming
      await window.electronAPI.ollama.chatStream({
        model,
        messages: messagesToSend,
        stream: true,
        options: {
          temperature: persona.temperature ?? chatSettings.temperature,
          num_ctx: persona.maxTokens ?? chatSettings.maxTokens,
          top_p: chatSettings.topP,
        },
      });

      console.log('[ChatPage] ✅ Message de bienvenue généré');
    } catch (error: any) {
      console.error('[ChatPage] ❌ Erreur génération message de bienvenue:', error);

      const errorMessage: OllamaMessage = {
        role: 'system',
        content: `❌ Erreur lors de la génération du message de bienvenue: ${error.message || 'Erreur inconnue'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // Charger une conversation
  const handleSelectConversation = (id: string) => {
    const conv = loadConversation(id);
    if (conv) {
      setMessages(conv.messages);
      setMessageMetadata(conv.messageMetadata || {});
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

  const handleSendMessage = async (content: string, mentionedPersonaId?: string, includeMentionFewShots?: boolean) => {
    if (!selectedModel) {
      alert('Veuillez sélectionner un modèle');
      return;
    }

    // Stocker le mentionedPersonaId dans le ref pour l'utiliser dans les listeners
    currentMentionedPersonaIdRef.current = mentionedPersonaId;

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

    // Calculer l'index du message utilisateur avant de l'ajouter
    const userMessageIndex = messages.length;

    setMessages((prev) => [...prev, userMessage]);

    // Si un persona a été mentionné, stocker les métadonnées
    if (mentionedPersonaId) {
      setMessageMetadata((prev) => ({
        ...prev,
        [userMessageIndex]: { personaId: mentionedPersonaId, timestamp: Date.now() },
      }));
      console.log('[ChatPage] 📝 Métadonnées ajoutées pour le message utilisateur à l\'index', userMessageIndex);
    }

    try {
      console.log('[ChatPage] 📤 Envoi du message au backend');
      console.log('[ChatPage] 📋 Settings:', chatSettings);
      console.log('[ChatPage] 👤 Persona global:', currentPersona?.name || 'aucun');

      // Déterminer quel persona utiliser
      // Priorité: Persona mentionné (@mention) > Persona global > Aucun
      const mentionedPersona = mentionedPersonaId ? personas.find(p => p.id === mentionedPersonaId) : null;
      const personaToUse = mentionedPersona || currentPersona;

      if (mentionedPersona) {
        console.log('[ChatPage] 📧 Persona mentionné (@mention):', mentionedPersona.name);
      }

      // Construire la liste des messages avec le system prompt
      const messagesToSend: OllamaMessage[] = [];

      // Priorité 1: System prompt du persona (mentionné ou global)
      // Priorité 2: System prompt des settings
      let systemPromptToUse = '';

      if (personaToUse?.systemPrompt) {
        systemPromptToUse = personaToUse.systemPrompt;
        console.log('[ChatPage] 📝 Utilisation du system prompt du persona:', personaToUse.name);

        // Ajouter les few-shots si demandé
        // Pour persona global: utiliser chatSettings.includeFewShots
        // Pour @mention: utiliser includeMentionFewShots
        const shouldIncludeFewShots = mentionedPersona
          ? includeMentionFewShots
          : chatSettings.includeFewShots;

        if (shouldIncludeFewShots && personaToUse.fewShotExamples?.length) {
          const fewShotsText = personaToUse.fewShotExamples
            .map((example) => `Utilisateur: ${example.input}\nAssistant: ${example.output}`)
            .join('\n\n');
          systemPromptToUse += '\n\nExemples:\n' + fewShotsText;
          console.log(
            '[ChatPage] 📚 Few-shots ajoutés:',
            personaToUse.fewShotExamples.length,
            'exemples',
            mentionedPersona ? '(@mention)' : '(global)'
          );
        }
      } else if (chatSettings.systemPrompt.trim()) {
        systemPromptToUse = chatSettings.systemPrompt;
        console.log('[ChatPage] 📝 Utilisation du system prompt des settings');
      }

      if (systemPromptToUse) {
        messagesToSend.push({
          role: 'system',
          content: systemPromptToUse,
        });
      }

      messagesToSend.push(...messages, userMessage);

      // Déterminer les paramètres à utiliser (persona ou settings)
      const temperature = personaToUse?.temperature ?? chatSettings.temperature;
      const maxTokens = personaToUse?.maxTokens ?? chatSettings.maxTokens;

      // Déterminer le modèle à utiliser
      // Priorité: Modèle du persona mentionné > Modèle du persona global > Modèle sélectionné
      let modelToUse = selectedModel;
      if (personaToUse?.model) {
        modelToUse = personaToUse.model;
        if (modelToUse !== selectedModel) {
          console.log(
            '[ChatPage] 🔄 Utilisation du modèle du persona:',
            modelToUse,
            '(au lieu de',
            selectedModel + ')'
          );
          if (mentionedPersona) {
            console.log('[ChatPage] 💡 @mention utilise automatiquement le modèle configuré du persona');
          }
        }
      }

      console.log('[ChatPage] ⚙️ Paramètres:', { model: modelToUse, temperature, maxTokens });

      // Envoyer la requête de chat avec streaming
      // Le streamId sera défini par le listener onStreamStart
      await window.electronAPI.ollama.chatStream({
        model: modelToUse,
        messages: messagesToSend,
        stream: true,
        options: {
          temperature,
          num_ctx: maxTokens,
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
      setMessageMetadata({});
      setStreamingMessage('');
      setIsGenerating(false);
      currentStreamIdRef.current = null;
      currentMentionedPersonaIdRef.current = undefined;
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

      // Construire la liste des messages avec le system prompt
      const messagesToSend: OllamaMessage[] = [];

      // Utiliser le persona si disponible, sinon les settings
      let systemPromptToUse = '';

      if (currentPersona?.systemPrompt) {
        systemPromptToUse = currentPersona.systemPrompt;

        // Ajouter les few-shots si demandé
        if (chatSettings.includeFewShots && currentPersona.fewShotExamples?.length) {
          const fewShotsText = currentPersona.fewShotExamples
            .map((example) => `Utilisateur: ${example.input}\nAssistant: ${example.output}`)
            .join('\n\n');
          systemPromptToUse += '\n\nExemples:\n' + fewShotsText;
        }
      } else if (chatSettings.systemPrompt.trim()) {
        systemPromptToUse = chatSettings.systemPrompt;
      }

      if (systemPromptToUse) {
        messagesToSend.push({
          role: 'system',
          content: systemPromptToUse,
        });
      }

      messagesToSend.push(...updatedMessages);

      // Déterminer les paramètres à utiliser (persona ou settings)
      const temperature = currentPersona?.temperature ?? chatSettings.temperature;
      const maxTokens = currentPersona?.maxTokens ?? chatSettings.maxTokens;

      // Relancer la génération avec le même contexte
      await window.electronAPI.ollama.chatStream({
        model: selectedModel,
        messages: messagesToSend,
        stream: true,
        options: {
          temperature,
          num_ctx: maxTokens,
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

  // Mapper les raccourcis personnalisés aux actions
  const keyboardShortcuts: KeyboardShortcut[] = useMemo(() => {
    // Map d'actions par ID de raccourci
    const actionMap: Record<string, () => void> = {
      toggle_sidebar: () => setIsSidebarOpen(!isSidebarOpen),
      search_in_conversation: () => setIsChatSearchOpen(true),
      search_conversations: () => {
        const searchInput = document.querySelector('.sidebar-search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      new_conversation: handleNewConversation,
      save: () => {
        console.log('💾 Conversation sauvegardée automatiquement');
      },
      open_settings: () => setIsSettingsOpen(true),
      clear_chat: handleClearChat,
      regenerate: () => {
        if (!isGenerating) {
          handleRegenerate();
        }
      },
      show_statistics: () => setIsStatisticsModalOpen(true),
      show_shortcuts_1: () => setIsShortcutsModalOpen(true),
      show_shortcuts_2: () => setIsShortcutsModalOpen(true),
    };

    // Convertir les raccourcis personnalisés en KeyboardShortcut avec actions
    return customShortcuts.map((shortcut) => ({
      key: shortcut.key,
      ctrl: shortcut.ctrl,
      shift: shortcut.shift,
      alt: shortcut.alt,
      meta: shortcut.meta,
      description: shortcut.description,
      category: shortcut.category,
      action: actionMap[shortcut.id] || (() => {}),
    }));
  }, [customShortcuts, isSidebarOpen, isGenerating, handleNewConversation, handleClearChat, handleRegenerate]);

  // Activer les raccourcis clavier
  useKeyboardShortcuts({
    shortcuts: keyboardShortcuts,
    enabled: !isSettingsOpen && !isTagModalOpen && !isFolderModalOpen && !isShortcutsModalOpen && !isStatisticsModalOpen && !isPersonaModalOpen,
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

      // Construire la liste des messages avec le system prompt
      const messagesToSend: OllamaMessage[] = [];

      // Utiliser le persona si disponible, sinon les settings
      let systemPromptToUse = '';

      if (currentPersona?.systemPrompt) {
        systemPromptToUse = currentPersona.systemPrompt;

        // Ajouter les few-shots si demandé
        if (chatSettings.includeFewShots && currentPersona.fewShotExamples?.length) {
          const fewShotsText = currentPersona.fewShotExamples
            .map((example) => `Utilisateur: ${example.input}\nAssistant: ${example.output}`)
            .join('\n\n');
          systemPromptToUse += '\n\nExemples:\n' + fewShotsText;
        }
      } else if (chatSettings.systemPrompt.trim()) {
        systemPromptToUse = chatSettings.systemPrompt;
      }

      if (systemPromptToUse) {
        messagesToSend.push({
          role: 'system',
          content: systemPromptToUse,
        });
      }

      messagesToSend.push(...updatedMessages);

      // Déterminer les paramètres à utiliser (persona ou settings)
      const temperature = currentPersona?.temperature ?? chatSettings.temperature;
      const maxTokens = currentPersona?.maxTokens ?? chatSettings.maxTokens;

      // Relancer la génération avec le message édité
      await window.electronAPI.ollama.chatStream({
        model: selectedModel,
        messages: messagesToSend,
        stream: true,
        options: {
          temperature,
          num_ctx: maxTokens,
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
            personas={personas}
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
              className="header-btn glass-hover"
              title={isSidebarOpen ? 'Masquer la sidebar' : 'Afficher la sidebar'}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Chat</h1>
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
          </div>

          <div className="flex items-center gap-2">
            <ExportMenu
              messages={messages}
              conversationTitle={
                currentConversationId
                  ? conversations.find((c) => c.id === currentConversationId)?.title
                  : 'Conversation'
              }
              conversation={
                currentConversationId
                  ? conversations.find((c) => c.id === currentConversationId)
                  : undefined
              }
            />
            <ImportExportMenu
              conversations={conversations}
              folders={folders}
              tags={tags}
              onImportConversation={handleImportConversation}
              onImportBackup={handleImportBackup}
            />
            <button
              onClick={() => setIsStatisticsModalOpen(true)}
              className="header-btn glass-hover"
              title="Statistiques d'utilisation (Ctrl+Shift+S)"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsChatSearchOpen(true)}
              className="header-btn glass-hover"
              title="Rechercher dans la conversation (Ctrl+F)"
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

              // Récupérer le persona mentionné pour ce message
              const metadata = messageMetadata[index];
              const mentionedPersona = metadata?.personaId
                ? personas.find((p) => p.id === metadata.personaId)
                : undefined;

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
                  mentionedPersona={mentionedPersona}
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
                mentionedPersona={
                  currentMentionedPersonaIdRef.current
                    ? personas.find((p) => p.id === currentMentionedPersonaIdRef.current)
                    : undefined
                }
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
                  ? 'Tapez votre message... (@ pour mentionner un persona)'
                  : 'Sélectionnez d\'abord un modèle...'
              }
              personas={personas}
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

      {/* Statistics Modal */}
      <StatisticsModal
        isOpen={isStatisticsModalOpen}
        onClose={() => setIsStatisticsModalOpen(false)}
        statistics={statistics}
      />

      {/* Persona Selection Modal */}
      <PersonaSelectionModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        onSelect={handleSelectPersona}
        personas={personas}
        currentPersonaId={currentPersona?.id}
      />
    </div>
  );
}
