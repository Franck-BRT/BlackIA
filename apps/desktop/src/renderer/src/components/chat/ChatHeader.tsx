import React from 'react';
import { Menu, Search, BarChart3, Settings, Trash2, User } from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import { ExportMenu } from './ExportMenu';
import { ImportExportMenu, BackupData } from './ImportExportMenu';
import { WebSearchToggle } from './WebSearchToggle';
import { MCPToggle } from './MCPToggle';
import { AttachmentHeaderButton } from './AttachmentHeaderButton';
import { RAGToggle } from './RAGToggle';
import type { OllamaMessage } from '@blackia/ollama';
import type { Persona } from '../../types/persona';
import { PERSONA_COLOR_CLASSES } from '../../types/persona';
import type { Conversation, Folder } from '../../hooks/useConversations';
import type { Tag } from '../../hooks/useTags';
import type { Attachment } from '../../types/attachment';

interface ChatHeaderProps {
  // UI state
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  setIsChatSearchOpen: (open: boolean) => void;
  setIsSettingsOpen: (open: boolean) => void;
  setIsStatisticsModalOpen: (open: boolean) => void;
  setIsPersonaModalOpen: (open: boolean) => void;

  // Model
  selectedModel: string;
  setSelectedModel: (model: string) => void;

  // Persona
  currentPersona: Persona | null;

  // Web Search
  webSearchEnabled: boolean;
  setWebSearchEnabled: (enabled: boolean) => void;
  isWebSearching: boolean;
  webSearchProviderName?: string;

  // RAG
  ragEnabled: boolean;
  setRagEnabled: (enabled: boolean) => void;
  ragMode: 'text' | 'vision' | 'hybrid' | 'auto';
  setRagMode: (mode: 'text' | 'vision' | 'hybrid' | 'auto') => void;

  // MCP (outils système)
  mcpEnabled: boolean;
  setMcpEnabled: (enabled: boolean) => void;
  isMcpExecuting?: boolean;
  mcpEnabledToolsCount?: number;
  mcpError?: string | null;

  // Messages
  messages: OllamaMessage[];
  conversations: Conversation[];
  folders: Folder[];
  tags: Tag[];
  currentConversationId: string | null;

  // Handlers
  handleClearChat: () => void;
  handleImportConversation: (conversation: any) => void;
  handleImportBackup: (data: BackupData, mode: 'merge' | 'replace') => void;
  onAttachmentsChange?: (attachments: Attachment[]) => void;
}

/**
 * Composant header du chat avec tous les boutons et contrôles
 * Extrait de ChatPage pour améliorer la lisibilité
 */
export function ChatHeader({
  isSidebarOpen,
  setIsSidebarOpen,
  setIsChatSearchOpen,
  setIsSettingsOpen,
  setIsStatisticsModalOpen,
  setIsPersonaModalOpen,
  selectedModel,
  setSelectedModel,
  currentPersona,
  webSearchEnabled,
  setWebSearchEnabled,
  isWebSearching,
  webSearchProviderName,
  ragEnabled,
  setRagEnabled,
  ragMode,
  setRagMode,
  mcpEnabled,
  setMcpEnabled,
  isMcpExecuting,
  mcpEnabledToolsCount,
  mcpError,
  messages,
  conversations,
  folders,
  tags,
  currentConversationId,
  handleClearChat,
  handleImportConversation,
  handleImportBackup,
  onAttachmentsChange,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-2 sm:p-4 glass-card border-b border-white/10 relative z-10">
      {/* Left side - Menu, Title, Model, Persona */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-4 min-w-0 flex-1">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="header-btn glass-hover flex-shrink-0"
          title={isSidebarOpen ? 'Masquer la sidebar' : 'Afficher la sidebar'}
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-lg sm:text-xl font-bold hidden sm:block">Chat</h1>
        <div className="hidden md:block">
          <ModelSelector selectedModel={selectedModel} onModelChange={setSelectedModel} />
        </div>

        {/* Persona Selection Button */}
        <button
          onClick={() => setIsPersonaModalOpen(true)}
          className={`header-btn gap-1 sm:gap-2 px-2 sm:px-3 ${
            currentPersona
              ? 'glass-card border border-white/20'
              : 'glass-hover'
          }`}
          title={currentPersona ? `Persona: ${currentPersona.name}` : 'Sélectionner un persona'}
        >
          {currentPersona ? (
            <>
              <div
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-gradient-to-br ${
                  PERSONA_COLOR_CLASSES[currentPersona.color] || PERSONA_COLOR_CLASSES.purple
                } flex items-center justify-center text-xs sm:text-sm flex-shrink-0`}
              >
                {currentPersona.avatar}
              </div>
              <span className="text-xs sm:text-sm font-medium truncate max-w-[80px] sm:max-w-none">{currentPersona.name}</span>
            </>
          ) : (
            <>
              <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="text-xs sm:text-sm hidden sm:inline">Persona</span>
            </>
          )}
        </button>

        {/* Web Search Toggle */}
        <div className="hidden md:block">
          <WebSearchToggle
            enabled={webSearchEnabled}
            isSearching={isWebSearching}
            onToggle={setWebSearchEnabled}
            providerName={webSearchProviderName}
          />
        </div>

        {/* Attachments Button */}
        <div className="hidden md:block">
          <AttachmentHeaderButton
            conversationId={currentConversationId || undefined}
            entityType="conversation"
            onAttachmentsChange={onAttachmentsChange}
            disabled={!selectedModel || !currentConversationId}
          />
        </div>

        {/* RAG Toggle */}
        {currentConversationId && (
          <div className="hidden md:block">
            <RAGToggle
              enabled={ragEnabled}
              mode={ragMode}
              onToggle={() => setRagEnabled(!ragEnabled)}
              onModeChange={setRagMode}
            />
          </div>
        )}

        {/* MCP Toggle (outils système) */}
        <div className="hidden md:block">
          <MCPToggle
            enabled={mcpEnabled}
            isExecuting={isMcpExecuting}
            onToggle={setMcpEnabled}
            enabledToolsCount={mcpEnabledToolsCount}
            hasError={!!mcpError}
          />
        </div>
      </div>

      {/* Right side - Actions (adaptés pour mobile) */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Boutons masqués sur mobile */}
        <div className="hidden md:flex items-center gap-2">
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
        </div>

        {/* Boutons essentiels visibles sur tous les écrans */}
        <button
          onClick={() => setIsChatSearchOpen(true)}
          className="header-btn glass-hover"
          title="Rechercher dans la conversation (Ctrl+F)"
        >
          <Search className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <button
          onClick={handleClearChat}
          className="header-btn glass-hover hover:bg-red-500/20 hidden sm:flex"
          title="Effacer la conversation"
        >
          <Trash2 className="w-5 h-5 text-red-400" />
        </button>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="header-btn glass-hover"
          title="Paramètres du Chat"
        >
          <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
}
