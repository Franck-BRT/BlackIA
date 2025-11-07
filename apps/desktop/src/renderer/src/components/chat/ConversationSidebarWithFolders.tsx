import React, { useMemo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquare, Trash2, Plus, Folder as FolderIcon, MoreVertical, Edit2, FolderOpen, Search, Tag, X as XIcon, Star } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { RenameConversationModal } from './RenameConversationModal';
import { TagSelector } from './TagSelector';
import { SearchBar } from './SearchBar';
import { groupConversationsByDate } from '../../hooks/useConversations';
import type { Conversation, Folder } from '../../hooks/useConversations';
import type { Tag as TagType } from '../../hooks/useTags';
import type { Persona } from '../../types/persona';
import { PERSONA_COLOR_CLASSES } from '../../types/persona';

interface ConversationSidebarProps {
  conversations: Conversation[];
  folders: Folder[];
  tags: TagType[];
  personas?: Persona[]; // Optionnel pour compatibilité
  currentConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onCreateFolder: (name: string, color: string) => void;
  onRenameFolder: (id: string, newName: string) => void;
  onDeleteFolder: (id: string) => void;
  onMoveToFolder: (conversationId: string, folderId: string | null) => void;
  onRenameConversation: (conversationId: string, newTitle: string) => void;
  onOpenChatSearch?: (initialQuery?: string) => void;
  onOpenFolderModal: (folder?: Folder) => void;
  onCreateTag: (name: string, color: string, icon?: string) => void;
  onOpenTagModal: () => void;
  onToggleConversationTag: (conversationId: string, tagId: string) => void;
  onToggleFavorite: (conversationId: string) => void;
}

export function ConversationSidebar({
  conversations,
  folders,
  tags,
  personas = [],
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveToFolder,
  onRenameConversation,
  onOpenChatSearch,
  onOpenFolderModal,
  onCreateTag,
  onOpenTagModal,
  onToggleConversationTag,
  onToggleFavorite,
}: ConversationSidebarProps) {
  const [contextMenu, setContextMenu] = useState<{ conversationId: string; x: number; y: number } | null>(null);
  const [renamingConversation, setRenamingConversation] = useState<Conversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagSelectorMenu, setTagSelectorMenu] = useState<{ conversationId: string; x: number; y: number } | null>(null);
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const tagSelectorRef = useRef<HTMLDivElement>(null);

  // Fermer le menu contextuel si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
      if (tagSelectorRef.current && !tagSelectorRef.current.contains(event.target as Node)) {
        setTagSelectorMenu(null);
      }
    };

    if (contextMenu || tagSelectorMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu, tagSelectorMenu]);

  // Filtrer les conversations selon la recherche et les tags
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Filtrer par recherche
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((conv) => {
        // Rechercher dans le titre
        if (conv.title.toLowerCase().includes(query)) {
          return true;
        }

        // Rechercher dans le contenu des messages
        return conv.messages.some((msg) =>
          msg.content.toLowerCase().includes(query)
        );
      });
    }

    // Filtrer par tag
    if (selectedTagFilter) {
      filtered = filtered.filter((conv) =>
        conv.tagIds?.includes(selectedTagFilter)
      );
    }

    return filtered;
  }, [conversations, searchQuery, selectedTagFilter]);

  // Séparer les conversations favorites
  const { favoriteConversations, nonFavoriteConversations } = useMemo(() => {
    const favorites: Conversation[] = [];
    const nonFavorites: Conversation[] = [];

    filteredConversations.forEach((conv) => {
      if (conv.isFavorite) {
        favorites.push(conv);
      } else {
        nonFavorites.push(conv);
      }
    });

    return {
      favoriteConversations: favorites,
      nonFavoriteConversations: nonFavorites,
    };
  }, [filteredConversations]);

  // Séparer les conversations avec dossier et sans dossier (parmi les non-favorites)
  const { folderConversations, unorganizedConversations } = useMemo(() => {
    const withFolder: Conversation[] = [];
    const without: Conversation[] = [];

    nonFavoriteConversations.forEach((conv) => {
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
  }, [nonFavoriteConversations]);

  // Grouper les conversations sans dossier par date
  const unorganizedGroups = useMemo(() => {
    return groupConversationsByDate(unorganizedConversations);
  }, [unorganizedConversations]);

  // Obtenir les conversations d'un dossier
  const getConversationsInFolder = (folderId: string) => {
    return folderConversations.filter((conv) => conv.folderId === folderId);
  };

  // Fonction pour mettre en surbrillance le texte recherché
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) {
      return text;
    }

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-400/30 text-yellow-200 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const renderConversation = (conv: Conversation) => {
    // Obtenir le persona de la conversation s'il existe
    const persona = conv.personaId ? personas.find(p => p.id === conv.personaId) : null;

    return (
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
            {/* Afficher le persona avatar ou l'icône par défaut */}
            {persona ? (
              <div
                className={`w-7 h-7 rounded-lg bg-gradient-to-br ${
                  PERSONA_COLOR_CLASSES[persona.color] || PERSONA_COLOR_CLASSES.purple
                } flex items-center justify-center flex-shrink-0 border-2 ${
                  currentConversationId === conv.id
                    ? 'border-blue-400'
                    : 'border-white/20'
                }`}
                title={`Persona: ${persona.name}`}
              >
                <span className="text-sm">{persona.avatar}</span>
              </div>
            ) : (
              <MessageSquare className="w-4 h-4 mt-1 flex-shrink-0 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium truncate">
                {searchQuery ? highlightText(conv.title, searchQuery) : conv.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {persona && (
                  <>
                    <span className="text-xs text-purple-400 font-medium">{persona.name}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                  </>
                )}
                <span className="text-xs text-muted-foreground truncate">{conv.model}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{conv.messages.length} msg</span>
              </div>
            {/* Tags */}
            {conv.tagIds && conv.tagIds.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {conv.tagIds.map((tagId) => {
                  const tag = tags.find(t => t.id === tagId);
                  if (!tag) return null;
                  return (
                    <div
                      key={tagId}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs"
                      style={{ backgroundColor: tag.color + '30', color: tag.color }}
                      title={tag.name}
                    >
                      <span>{tag.icon || '🏷️'}</span>
                      <span className="font-medium">{tag.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setRenamingConversation(conv);
          }}
          className="p-1.5 rounded-lg hover:bg-blue-500/20 transition-all text-blue-400"
          title="Renommer"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(conv.id);
          }}
          className={`p-1.5 rounded-lg transition-all ${
            conv.isFavorite
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'hover:bg-yellow-500/20 text-gray-400 hover:text-yellow-400'
          }`}
          title={conv.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Star className={`w-4 h-4 ${conv.isFavorite ? 'fill-yellow-400' : ''}`} />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            const rect = e.currentTarget.getBoundingClientRect();
            setTagSelectorMenu({ conversationId: conv.id, x: rect.left, y: rect.bottom + 5 });
          }}
          className="p-1.5 rounded-lg hover:bg-purple-500/20 transition-all text-purple-400"
          title="Gérer les tags"
        >
          <Tag className="w-4 h-4" />
        </button>
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
  };

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
          onClick={() => onOpenFolderModal()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl glass-hover hover:bg-white/10 transition-colors text-sm"
        >
          <FolderIcon className="w-4 h-4" />
          <span>Nouveau dossier</span>
        </button>
        {onOpenChatSearch && (
          <button
            onClick={() => onOpenChatSearch(searchQuery)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl glass-hover hover:bg-white/10 transition-colors text-sm"
            title="Rechercher dans la conversation (Ctrl+F)"
          >
            <Search className="w-4 h-4" />
            <span>Rechercher dans le chat</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <SearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        resultsCount={searchQuery ? filteredConversations.length : undefined}
      />

      {/* Tag Filter */}
      {selectedTagFilter && (
        <div className="px-4 py-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Filtre:</span>
            {(() => {
              const tag = tags.find(t => t.id === selectedTagFilter);
              if (!tag) return null;
              return (
                <div
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
                  style={{ backgroundColor: tag.color + '30', color: tag.color }}
                >
                  <span>{tag.icon || '🏷️'}</span>
                  <span className="font-medium">{tag.name}</span>
                  <button
                    onClick={() => setSelectedTagFilter(null)}
                    className="ml-1 hover:bg-white/10 rounded p-0.5 transition-colors"
                    title="Retirer le filtre"
                  >
                    <XIcon className="w-3 h-3" />
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Aucune conversation</p>
            <p className="text-xs mt-1">Commencez une nouvelle conversation</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Aucun résultat</p>
            <p className="text-xs mt-1">Aucune conversation ne correspond à votre recherche</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 rounded-lg glass-hover hover:bg-white/10 transition-colors text-sm"
            >
              Effacer la recherche
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {/* Section Favoris */}
            {favoriteConversations.length > 0 && (
              <CollapsibleSection
                label={
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span>Favoris</span>
                  </div>
                }
                count={favoriteConversations.length}
                defaultOpen={true}
                storageKey="sidebar-favorites"
              >
                {favoriteConversations.map((conv) => renderConversation(conv))}
              </CollapsibleSection>
            )}

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
                    onOpenFolderModal(folder);
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

      {/* Context Menu - Rendered via Portal */}
      {contextMenu && createPortal(
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
        </div>,
        document.body
      )}

      {/* Rename Conversation Modal */}
      <RenameConversationModal
        isOpen={!!renamingConversation}
        onClose={() => setRenamingConversation(null)}
        onSave={(newTitle) => {
          if (renamingConversation) {
            onRenameConversation(renamingConversation.id, newTitle);
          }
          setRenamingConversation(null);
        }}
        currentTitle={renamingConversation?.title || ''}
      />

      {/* Tag Selector Menu - Rendered via Portal */}
      {tagSelectorMenu && createPortal(
        <div
          ref={tagSelectorRef}
          className="fixed z-[9999] glass-card bg-gray-900/95 rounded-xl overflow-hidden shadow-xl border border-white/10"
          style={{ left: tagSelectorMenu.x, top: tagSelectorMenu.y }}
        >
          <TagSelector
            availableTags={tags}
            selectedTagIds={
              conversations.find(c => c.id === tagSelectorMenu.conversationId)?.tagIds || []
            }
            onToggleTag={(tagId) => {
              onToggleConversationTag(tagSelectorMenu.conversationId, tagId);
            }}
            onCreateTag={() => {
              setTagSelectorMenu(null);
              onOpenTagModal();
            }}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
