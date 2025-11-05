import React, { useMemo, useState, useRef, useEffect } from 'react';
import { MessageSquare, Trash2, Plus, Folder as FolderIcon, MoreVertical, Edit2, FolderOpen } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { FolderModal } from './FolderModal';
import { groupConversationsByDate } from '../../hooks/useConversations';
import type { Conversation, Folder } from '../../hooks/useConversations';

interface ConversationSidebarProps {
  conversations: Conversation[];
  folders: Folder[];
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onCreateFolder: (name: string, color: string) => void;
  onRenameFolder: (id: string, newName: string) => void;
  onDeleteFolder: (id: string) => void;
  onMoveToFolder: (conversationId: string, folderId: string | null) => void;
}

export function ConversationSidebar({
  conversations,
  folders,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveToFolder,
}: ConversationSidebarProps) {
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [contextMenu, setContextMenu] = useState<{ conversationId: string; x: number; y: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu contextuel si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu]);

  // Séparer les conversations avec dossier et sans dossier
  const { folderConversations, unorganizedConversations } = useMemo(() => {
    const withFolder: Conversation[] = [];
    const without: Conversation[] = [];

    conversations.forEach((conv) => {
      if (conv.folderId) {
        withFolder.push(conv);
      } else {
        without.push(conv);
      }
    });

    return {
      folderConversations: withFolder,
      unorganizedConversations: without,
    };
  }, [conversations]);

  // Grouper les conversations sans dossier par date
  const unorganizedGroups = useMemo(() => {
    return groupConversationsByDate(unorganizedConversations);
  }, [unorganizedConversations]);

  // Obtenir les conversations d'un dossier
  const getConversationsInFolder = (folderId: string) => {
    return folderConversations.filter((conv) => conv.folderId === folderId);
  };

  const renderConversation = (conv: Conversation) => (
    <div
      key={conv.id}
      className={`group relative rounded-xl transition-colors cursor-pointer ${
        currentConversationId === conv.id
          ? 'bg-blue-500/20 hover:bg-blue-500/30'
          : 'hover:bg-white/5'
      }`}
    >
      <div onClick={() => onSelectConversation(conv.id)} className="p-3 pr-16">
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

      {/* Actions */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setContextMenu({ conversationId: conv.id, x: rect.left, y: rect.bottom + 5 });
          }}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-all"
          title="Options"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Supprimer "${conv.title}" ?`)) {
              onDeleteConversation(conv.id);
            }
          }}
          className="p-1.5 rounded-lg hover:bg-red-500/20 transition-all text-red-400"
          title="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col glass-card border-r border-white/10">
      {/* Header */}
      <div className="p-4 border-b border-white/10 space-y-2">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 transition-colors text-blue-400"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Nouvelle conversation</span>
        </button>
        <button
          onClick={() => setIsFolderModalOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl glass-hover hover:bg-white/10 transition-colors text-sm"
        >
          <FolderIcon className="w-4 h-4" />
          <span>Nouveau dossier</span>
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
          <div className="p-2 space-y-1">
            {/* Dossiers personnalisés */}
            {folders.map((folder) => {
              const folderConvs = getConversationsInFolder(folder.id);
              if (folderConvs.length === 0) return null;

              return (
                <CollapsibleSection
                  key={folder.id}
                  label={
                    <div className="flex items-center gap-2">
                      <FolderIcon className="w-4 h-4" style={{ color: folder.color }} />
                      <span>{folder.name}</span>
                    </div>
                  }
                  count={folderConvs.length}
                  defaultOpen={true}
                  storageKey={`sidebar-folder-${folder.id}`}
                  onEdit={() => {
                    setEditingFolder(folder);
                    setIsFolderModalOpen(true);
                  }}
                  onDelete={() => {
                    if (confirm(`Supprimer le dossier "${folder.name}" ?\nLes conversations ne seront pas supprimées.`)) {
                      onDeleteFolder(folder.id);
                    }
                  }}
                >
                  {folderConvs.map((conv) => renderConversation(conv))}
                </CollapsibleSection>
              );
            })}

            {/* Conversations sans dossier (groupées par date) */}
            {unorganizedGroups.map((group) => (
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
          {folders.length > 0 && `${folders.length} dossier${folders.length > 1 ? 's' : ''} • `}
          {conversations.length} conversation{conversations.length > 1 ? 's' : ''}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed z-[9999] w-56 glass-card bg-gray-900/95 rounded-xl overflow-hidden shadow-xl border border-white/10"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="p-2">
            <button
              onClick={() => {
                onMoveToFolder(contextMenu.conversationId, null);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left text-sm"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Retirer du dossier</span>
            </button>
            {folders.length > 0 && <div className="my-1 h-px bg-white/10" />}
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => {
                  onMoveToFolder(contextMenu.conversationId, folder.id);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left text-sm"
              >
                <FolderIcon className="w-4 h-4" style={{ color: folder.color }} />
                <span>{folder.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Folder Modal */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSave={(name, color) => {
          if (editingFolder) {
            onRenameFolder(editingFolder.id, name);
            // Note: pour changer la couleur, il faudrait ajouter une méthode
          } else {
            onCreateFolder(name, color);
          }
          setEditingFolder(null);
        }}
        initialName={editingFolder?.name}
        initialColor={editingFolder?.color}
        title={editingFolder ? 'Modifier le dossier' : 'Nouveau dossier'}
      />
    </div>
  );
}
