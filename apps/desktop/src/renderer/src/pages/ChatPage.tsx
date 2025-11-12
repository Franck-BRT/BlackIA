import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ConversationSidebar } from '../components/chat/ConversationSidebarWithFolders';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatMessages } from '../components/chat/ChatMessages';
import { ChatModals } from '../components/chat/ChatModals';
import { ChatInput } from '../components/chat/ChatInput';
import { ChatSearchBar } from '../components/chat/ChatSearchBar';
import { useConversations } from '../hooks/useConversations';
import { useFolders } from '../hooks/useFolders';
import { useTags } from '../hooks/useTags';
import { usePersonas } from '../hooks/usePersonas';
import { useKeyboardShortcuts, KeyboardShortcut } from '../hooks/useKeyboardShortcuts';
import { useCustomKeyboardShortcuts } from '../hooks/useCustomKeyboardShortcuts';
import { useStatistics } from '../hooks/useStatistics';
import { useChatState } from '../hooks/useChatState';
import { useChatStreaming } from '../hooks/useChatStreaming';
import { useChatPersona } from '../hooks/useChatPersona';
import { useChatSearch } from '../hooks/useChatSearch';
import { useChatActions } from '../hooks/useChatActions';
import { useResponsive } from '../hooks/useResponsive';
import { useSettings } from '../contexts/SettingsContext';
import type { BackupData } from '../components/chat/ImportExportMenu';
import type { Folder } from '../hooks/useConversations';

/**
 * ChatPage - Composant principal du chat refactorisé
 *
 * Réduit de 1,393 lignes à ~300 lignes grâce à :
 * - 5 hooks personnalisés (useChatState, useChatStreaming, useChatPersona, useChatSearch, useChatActions)
 * - 3 composants extraits (ChatHeader, ChatMessages, ChatModals)
 *
 * Améliore la maintenabilité, la testabilité et la lisibilité du code.
 */
export function ChatPage() {
  const location = useLocation();

  // === HOOKS PERSONNALISÉS ===

  // 0. Responsive
  const { chatSidebarWidth, isMobile, isTablet } = useResponsive();

  // État pour gérer les attachments depuis le header
  const [currentAttachments, setCurrentAttachments] = useState<any[]>([]);

  // 1. États centralisés
  const {
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
  } = useChatState();

  // 2. Conversations, dossiers, tags, personas
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

  const {
    folders,
    createFolder,
    renameFolder,
    changeFolderColor,
    deleteFolder,
    importFolders,
  } = useFolders();

  const {
    tags,
    createTag,
    updateTag,
    deleteTag,
    importTags,
  } = useTags();

  const { personas, incrementUsage: incrementPersonaUsage } = usePersonas();

  // Settings globaux
  const { settings } = useSettings();

  // Récupérer le nom du provider actif
  const activeProvider = settings.webSearch.providers.find(
    (p) => p.id === settings.webSearch.defaultProvider
  );

  // 3. Streaming Ollama
  useChatStreaming({
    setStreamingMessage,
    setIsGenerating,
    setMessages,
    setMessageMetadata,
    currentStreamIdRef,
    currentMentionedPersonaIdRef,
    currentMentionedPersonaIdsRef,
  });

  // 4. Gestion des personas
  const { currentPersona, handleSelectPersona } = useChatPersona({
    personas,
    getCurrentConversation,
    currentConversationId,
    updateConversation,
    createConversation,
    selectedModel,
    setSelectedModel,
    setMessages,
    chatSettings,
    setChatSettings: updateChatSettings,
    messages,
  });

  // 5. Recherche dans le chat
  const {
    searchResults,
    handleChatSearchChange,
    handleSearchNext,
    handleSearchPrevious,
    handleCloseChatSearch,
  } = useChatSearch({
    messages,
    chatSearchQuery,
    setChatSearchQuery,
    currentSearchIndex,
    setCurrentSearchIndex,
    isChatSearchOpen,
    setIsChatSearchOpen,
  });

  // 6. Actions du chat (send, stop, clear, regenerate, edit)
  const {
    handleSendMessage,
    handleStop,
    handleClearChat,
    handleRegenerate,
    handleEditUserMessage,
  } = useChatActions({
    messages,
    setMessages,
    messageMetadata,
    setMessageMetadata,
    streamingMessage,
    setStreamingMessage,
    isGenerating,
    setIsGenerating,
    selectedModel,
    setRegenerationCounts,
    currentStreamIdRef,
    currentMentionedPersonaIdRef,
    currentMentionedPersonaIdsRef,
    currentConversationId,
    createConversation,
    personas,
    currentPersona,
    chatSettings,
    incrementPersonaUsage,
    webSearchEnabled,
    webSearchSettings: settings.webSearch,
    setWebSearchResults,
    setIsWebSearching,
  });

  // 7. Statistiques
  const statistics = useStatistics(conversations, personas);

  // 8. Raccourcis clavier personnalisés
  const { shortcuts: customShortcuts } = useCustomKeyboardShortcuts();

  // === EFFETS ===

  // Gérer le pré-remplissage depuis un prompt
  useEffect(() => {
    const state = location.state as {
      prefillMessage?: string;
      promptName?: string;
      personaId?: string;
      includeFewShots?: boolean;
    } | null;
    if (state?.prefillMessage) {
      setPrefillMessage(state.prefillMessage);
      setPrefillPersonaId(state.personaId);
      setPrefillIncludeFewShots(state.includeFewShots || false);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Créer automatiquement une conversation vide au démarrage pour permettre les attachments
  useEffect(() => {
    // Si pas de conversation active, pas de messages, et un modèle est sélectionné
    if (!currentConversationId && messages.length === 0 && selectedModel) {
      const newConv = createConversation(selectedModel, 'Nouvelle conversation');
      setCurrentConversationId(newConv.id);
      console.log('[ChatPage] ✨ Conversation vide créée automatiquement au démarrage:', newConv.id);
    }
  }, [selectedModel]); // Se déclenche quand un modèle est sélectionné

  // Auto-sauvegarder la conversation quand les messages changent
  useEffect(() => {
    if (currentConversationId && messages.length > 0) {
      const title = generateTitle(messages);
      const isNewMessage = messages.length > previousMessagesLengthRef.current;
      previousMessagesLengthRef.current = messages.length;

      updateConversation(
        currentConversationId,
        {
          messages,
          messageMetadata,
          model: selectedModel,
          title,
        },
        !isNewMessage
      );

      console.log('[ChatPage] 💾 Conversation auto-sauvegardée:', currentConversationId);
    }
  }, [messages, messageMetadata, currentConversationId, selectedModel]);

  // === HANDLERS ===

  // Nouvelle conversation
  const handleNewConversation = () => {
    if (messages.length > 0 && !confirm('Voulez-vous créer une nouvelle conversation ?')) {
      return;
    }

    resetChatState();

    // Créer immédiatement une conversation vide pour permettre les attachments
    if (selectedModel) {
      const newConv = createConversation(selectedModel, 'Nouvelle conversation');
      setCurrentConversationId(newConv.id);
      console.log('[ChatPage] ✨ Nouvelle conversation créée:', newConv.id);
    } else {
      setCurrentConversationId(null);
      console.log('[ChatPage] ✨ Prêt pour une nouvelle conversation (sélectionnez un modèle)');
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
      previousMessagesLengthRef.current = conv.messages.length;

      console.log('[ChatPage] 📂 Conversation chargée:', id);
    }
  };

  // Import d'une conversation unique
  const handleImportConversation = (conversation: any) => {
    importConversation(conversation);
  };

  // Import d'un backup complet
  const handleImportBackup = (data: BackupData, mode: 'merge' | 'replace') => {
    importBackup(data.conversations, mode);
    if (data.folders) {
      importFolders(data.folders, mode);
    }
    if (data.tags) {
      importTags(data.tags, mode);
    }
    console.log('[ChatPage] ✅ Backup importé:', mode);
  };

  // Suppression de tag avec nettoyage
  const handleDeleteTag = (tagId: string) => {
    removeTagFromAllConversations(tagId);
    deleteTag(tagId);
  };

  // Supprimer un dossier et remettre ses conversations dans "sans dossier"
  const handleDeleteFolder = (folderId: string) => {
    const conversationsInFolder = conversations.filter((conv) => conv.folderId === folderId);
    conversationsInFolder.forEach((conv) => {
      moveToFolder(conv.id, null);
    });
    deleteFolder(folderId);
    console.log('[ChatPage] 🗑️ Dossier supprimé:', folderId);
  };

  // === RACCOURCIS CLAVIER ===

  const keyboardShortcuts: KeyboardShortcut[] = useMemo(() => {
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
  }, [customShortcuts, isSidebarOpen, isGenerating]);

  // Activer les raccourcis clavier
  useKeyboardShortcuts({
    shortcuts: keyboardShortcuts,
    enabled: !isSettingsOpen && !isTagModalOpen && !isFolderModalOpen && !isShortcutsModalOpen && !isStatisticsModalOpen && !isPersonaModalOpen,
  });

  // === RENDU ===

  return (
    <div className="h-full flex relative">
      {/* Sidebar avec largeur adaptive */}
      {isSidebarOpen && !isMobile && (
        <div style={{ width: chatSidebarWidth }} className="flex-shrink-0">
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

      {/* Mobile Drawer pour conversation sidebar */}
      {isMobile && isSidebarOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed top-0 left-0 bottom-0 w-80 z-50 glass-sidebar">
            <ConversationSidebar
              conversations={conversations}
              folders={folders}
              tags={tags}
              personas={personas}
              currentConversationId={currentConversationId}
              onSelectConversation={(id) => {
                handleSelectConversation(id);
                setIsSidebarOpen(false); // Fermer après sélection sur mobile
              }}
              onNewConversation={() => {
                handleNewConversation();
                setIsSidebarOpen(false);
              }}
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
        </>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <ChatHeader
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          setIsChatSearchOpen={setIsChatSearchOpen}
          setIsSettingsOpen={setIsSettingsOpen}
          setIsStatisticsModalOpen={setIsStatisticsModalOpen}
          setIsPersonaModalOpen={setIsPersonaModalOpen}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          currentPersona={currentPersona}
          webSearchEnabled={webSearchEnabled}
          setWebSearchEnabled={setWebSearchEnabled}
          isWebSearching={isWebSearching}
          webSearchProviderName={activeProvider?.name}
          messages={messages}
          conversations={conversations}
          folders={folders}
          tags={tags}
          currentConversationId={currentConversationId}
          handleClearChat={handleClearChat}
          handleImportConversation={handleImportConversation}
          handleImportBackup={handleImportBackup}
          onAttachmentsChange={setCurrentAttachments}
        />

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
        <ChatMessages
          messages={messages}
          messageMetadata={messageMetadata}
          streamingMessage={streamingMessage}
          isGenerating={isGenerating}
          regenerationCounts={regenerationCounts}
          selectedModel={selectedModel}
          personas={personas}
          currentMentionedPersonaIdsRef={currentMentionedPersonaIdsRef}
          chatSearchQuery={chatSearchQuery}
          searchResults={searchResults}
          currentSearchIndex={currentSearchIndex}
          chatSettings={chatSettings}
          webSearchResults={webSearchResults}
          webSearchSettings={{
            showSources: settings.webSearch.showSources,
            sourcesCollapsed: settings.webSearch.sourcesCollapsed,
          }}
          handleRegenerate={handleRegenerate}
          handleEditUserMessage={handleEditUserMessage}
          messagesEndRef={messagesEndRef}
        />

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
              initialMessage={prefillMessage}
              onMessageChange={() => {
                setPrefillMessage('');
                setPrefillPersonaId(undefined);
                setPrefillIncludeFewShots(false);
              }}
              prefillPersonaId={prefillPersonaId}
              prefillIncludeFewShots={prefillIncludeFewShots}
              conversationId={currentConversationId || undefined}
              ragEnabled={true}
              headerAttachments={currentAttachments}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      <ChatModals
        isSettingsOpen={isSettingsOpen}
        setIsSettingsOpen={setIsSettingsOpen}
        chatSettings={chatSettings}
        updateChatSettings={updateChatSettings}
        isTagModalOpen={isTagModalOpen}
        setIsTagModalOpen={setIsTagModalOpen}
        createTag={createTag}
        isFolderModalOpen={isFolderModalOpen}
        setIsFolderModalOpen={setIsFolderModalOpen}
        editingFolder={editingFolder}
        setEditingFolder={setEditingFolder}
        createFolder={createFolder}
        renameFolder={renameFolder}
        isShortcutsModalOpen={isShortcutsModalOpen}
        setIsShortcutsModalOpen={setIsShortcutsModalOpen}
        keyboardShortcuts={keyboardShortcuts}
        isStatisticsModalOpen={isStatisticsModalOpen}
        setIsStatisticsModalOpen={setIsStatisticsModalOpen}
        statistics={statistics}
        isPersonaModalOpen={isPersonaModalOpen}
        setIsPersonaModalOpen={setIsPersonaModalOpen}
        personas={personas}
        currentPersona={currentPersona}
        handleSelectPersona={handleSelectPersona}
      />
    </div>
  );
}
