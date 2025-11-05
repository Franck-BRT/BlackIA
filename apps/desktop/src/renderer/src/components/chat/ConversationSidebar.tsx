import React, { useMemo } from 'react';
import { MessageSquare, Trash2, Plus } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { groupConversationsByDate } from '../../hooks/useConversations';
import type { Conversation } from '../../hooks/useConversations';

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
}

export function ConversationSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
}: ConversationSidebarProps) {
  // Grouper les conversations par date
  const conversationGroups = useMemo(() => {
    return groupConversationsByDate(conversations);
  }, [conversations]);

  const renderConversation = (conv: Conversation) => (
    <div
      key={conv.id}
      className={`group relative rounded-xl transition-colors cursor-pointer ${
        currentConversationId === conv.id
          ? 'bg-blue-500/20 hover:bg-blue-500/30'
          : 'hover:bg-white/5'
      }`}
    >
      <div onClick={() => onSelectConversation(conv.id)} className="p-3 pr-10">
        <div className="flex items-start gap-3">
          <MessageSquare className="w-4 h-4 mt-1 flex-shrink-0 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium truncate">{conv.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground truncate">{conv.model}</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{conv.messages.length} msg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm(`Supprimer "${conv.title}" ?`)) {
            onDeleteConversation(conv.id);
          }
        }}
        className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all text-red-400"
        title="Supprimer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="h-full flex flex-col glass-card border-r border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 transition-colors text-blue-400"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Nouvelle conversation</span>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Aucune conversation</p>
            <p className="text-xs mt-1">Commencez une nouvelle conversation</p>
          </div>
        ) : (
          <div className="p-2">
            {conversationGroups.map((group) => (
              <CollapsibleSection
                key={group.label}
                label={group.label}
                count={group.conversations.length}
                defaultOpen={true}
                storageKey={`sidebar-group-${group.label}`}
              >
                {group.conversations.map((conv) => renderConversation(conv))}
              </CollapsibleSection>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {conversations.length > 0 && (
        <div className="p-4 border-t border-white/10 text-xs text-muted-foreground text-center">
          {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
