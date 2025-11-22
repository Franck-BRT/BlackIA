import React, { useMemo, useState } from 'react';
import { MessageSquare, Trash2, Plus, CheckSquare, Square, X } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { groupConversationsByDate } from '../../hooks/useConversations';
import type { Conversation } from '../../hooks/useConversations';

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onDeleteMultipleConversations?: (ids: string[]) => void;
}

export function ConversationSidebar({
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onDeleteMultipleConversations,
}: ConversationSidebarProps) {
  // État pour la sélection multiple
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Grouper les conversations par date
  const conversationGroups = useMemo(() => {
    return groupConversationsByDate(conversations);
  }, [conversations]);

  // Gérer la sélection/désélection d'une conversation
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Sélectionner/désélectionner tout
  const toggleSelectAll = () => {
    if (selectedIds.size === conversations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(conversations.map(c => c.id)));
    }
  };

  // Supprimer les conversations sélectionnées
  const deleteSelected = () => {
    if (selectedIds.size === 0) return;

    const count = selectedIds.size;
    if (confirm(`Supprimer ${count} conversation${count > 1 ? 's' : ''} ?`)) {
      if (onDeleteMultipleConversations) {
        onDeleteMultipleConversations(Array.from(selectedIds));
      } else {
        // Fallback: supprimer une par une
        selectedIds.forEach(id => onDeleteConversation(id));
      }
      setSelectedIds(new Set());
      setSelectionMode(false);
    }
  };

  // Annuler la sélection
  const cancelSelection = () => {
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const renderConversation = (conv: Conversation) => (
    <div
      key={conv.id}
      className={`group relative rounded-xl transition-colors cursor-pointer ${
        currentConversationId === conv.id && !selectionMode
          ? 'bg-blue-500/20 hover:bg-blue-500/30'
          : selectedIds.has(conv.id)
          ? 'bg-purple-500/20 hover:bg-purple-500/30'
          : 'hover:bg-white/5'
      }`}
    >
      <div
        onClick={() => selectionMode ? toggleSelection(conv.id) : onSelectConversation(conv.id)}
        className="p-3 pr-10"
      >
        <div className="flex items-start gap-3">
          {selectionMode ? (
            <div className="mt-0.5">
              {selectedIds.has(conv.id) ? (
                <CheckSquare className="w-4 h-4 text-purple-400" />
              ) : (
                <Square className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          ) : (
            <MessageSquare className="w-4 h-4 mt-1 flex-shrink-0 text-muted-foreground" />
          )}
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

      {/* Delete Button (only in normal mode) */}
      {!selectionMode && (
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
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col glass-card border-r border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        {selectionMode ? (
          // Mode sélection
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-400">
                {selectedIds.size} sélectionnée{selectedIds.size > 1 ? 's' : ''}
              </span>
              <button
                onClick={cancelSelection}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                title="Annuler"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleSelectAll}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-white/5 hover:bg-white/10 transition-colors"
              >
                {selectedIds.size === conversations.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
              <button
                onClick={deleteSelected}
                disabled={selectedIds.size === 0}
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Supprimer ({selectedIds.size})
              </button>
            </div>
          </div>
        ) : (
          // Mode normal
          <div className="flex gap-2">
            <button
              onClick={onNewConversation}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 transition-colors text-blue-400"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Nouvelle</span>
            </button>
            {conversations.length > 0 && (
              <button
                onClick={() => setSelectionMode(true)}
                className="px-3 py-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-muted-foreground"
                title="Sélection multiple"
              >
                <CheckSquare className="w-5 h-5" />
              </button>
            )}
          </div>
        )}
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
