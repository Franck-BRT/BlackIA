import React from 'react';
import { Menu, Search, BarChart3, Settings, Trash2, User } from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import { ExportMenu } from './ExportMenu';
import { ImportExportMenu, BackupData } from './ImportExportMenu';
import type { OllamaMessage } from '@blackia/ollama';
import type { Persona } from '../../types/persona';
import { PERSONA_COLOR_CLASSES } from '../../types/persona';
import type { Conversation, Folder } from '../../hooks/useConversations';
import type { Tag } from '../../hooks/useTags';

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
  messages,
  conversations,
  folders,
  tags,
  currentConversationId,
  handleClearChat,
  handleImportConversation,
  handleImportBackup,
}: ChatHeaderProps) {
  return (
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
  );
}
