import { useState, useRef, useEffect } from 'react';
import type { OllamaMessage } from '@blackia/ollama';
import type { MessageMetadata } from './useConversations';
import type { Folder } from './useConversations';
import type { WebSearchResponse } from '@blackia/shared';
import { ChatSettingsData, DEFAULT_CHAT_SETTINGS } from '../components/chat/ChatSettings';

/**
 * Hook pour centraliser tous les états du ChatPage
 * Réduit la complexité et facilite la maintenance
 */
export function useChatState() {
  // États des messages
  const [messages, setMessages] = useState<OllamaMessage[]>([]);
  const [messageMetadata, setMessageMetadata] = useState<Record<number, MessageMetadata>>({});
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [regenerationCounts, setRegenerationCounts] = useState<Map<number, number>>(new Map());

  // États de préfill (depuis prompts/editor)
  const [prefillMessage, setPrefillMessage] = useState<string>('');
  const [prefillPersonaId, setPrefillPersonaId] = useState<string | undefined>(undefined);
  const [prefillIncludeFewShots, setPrefillIncludeFewShots] = useState<boolean>(false);

  // État du modèle sélectionné
  const [selectedModel, setSelectedModel] = useState('');

  // États des modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isStatisticsModalOpen, setIsStatisticsModalOpen] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);

  // États UI
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // États de recherche dans le chat
  const [isChatSearchOpen, setIsChatSearchOpen] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);

  // États de recherche web
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [webSearchResults, setWebSearchResults] = useState<Record<number, WebSearchResponse>>({}); // Par index de message
  const [isWebSearching, setIsWebSearching] = useState(false);

  // Chat settings avec persistence localStorage
  const [chatSettings, setChatSettings] = useState<ChatSettingsData>(() => {
    try {
      const saved = localStorage.getItem('chatSettings');
      return saved ? JSON.parse(saved) : DEFAULT_CHAT_SETTINGS;
    } catch {
      return DEFAULT_CHAT_SETTINGS;
    }
  });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentStreamIdRef = useRef<string | null>(null);
  const previousMessagesLengthRef = useRef<number>(0);
  const currentMentionedPersonaIdRef = useRef<string | undefined>(undefined); // Legacy
  const currentMentionedPersonaIdsRef = useRef<string[] | undefined>(undefined);

  // Sauvegarder les settings dans localStorage quand ils changent
  const updateChatSettings = (newSettings: ChatSettingsData) => {
    setChatSettings(newSettings);
    localStorage.setItem('chatSettings', JSON.stringify(newSettings));
  };

  // Fonction de reset pour nouvelle conversation
  const resetChatState = () => {
    setMessages([]);
    setMessageMetadata({});
    setStreamingMessage('');
    setIsGenerating(false);
    currentStreamIdRef.current = null;
    currentMentionedPersonaIdRef.current = undefined;
    currentMentionedPersonaIdsRef.current = undefined;
    previousMessagesLengthRef.current = 0;
    setRegenerationCounts(new Map());
    setWebSearchResults({});
  };

  // Auto-scroll vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Auto-scroll quand messages ou streaming changent
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingMessage]);

  return {
    // Messages
    messages,
    setMessages,
    messageMetadata,
    setMessageMetadata,
    streamingMessage,
    setStreamingMessage,
    isGenerating,
    setIsGenerating,
    regenerationCounts,
    setRegenerationCounts,

    // Préfill
    prefillMessage,
    setPrefillMessage,
    prefillPersonaId,
    setPrefillPersonaId,
    prefillIncludeFewShots,
    setPrefillIncludeFewShots,

    // Modèle
    selectedModel,
    setSelectedModel,

    // Modals
    isSettingsOpen,
    setIsSettingsOpen,
    isTagModalOpen,
    setIsTagModalOpen,
    isFolderModalOpen,
    setIsFolderModalOpen,
    isShortcutsModalOpen,
    setIsShortcutsModalOpen,
    isStatisticsModalOpen,
    setIsStatisticsModalOpen,
    isPersonaModalOpen,
    setIsPersonaModalOpen,
    editingFolder,
    setEditingFolder,

    // UI
    isSidebarOpen,
    setIsSidebarOpen,

    // Recherche
    isChatSearchOpen,
    setIsChatSearchOpen,
    chatSearchQuery,
    setChatSearchQuery,
    currentSearchIndex,
    setCurrentSearchIndex,

    // Web Search
    webSearchEnabled,
    setWebSearchEnabled,
    webSearchResults,
    setWebSearchResults,
    isWebSearching,
    setIsWebSearching,

    // Settings
    chatSettings,
    updateChatSettings,

    // Refs
    messagesEndRef,
    currentStreamIdRef,
    previousMessagesLengthRef,
    currentMentionedPersonaIdRef,
    currentMentionedPersonaIdsRef,

    // Helpers
    resetChatState,
    scrollToBottom,
  };
}
