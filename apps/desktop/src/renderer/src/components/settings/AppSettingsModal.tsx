import React, { useState } from 'react';
import { X, Folder, Tag, Trash2, Edit2, Palette, Check, AlertCircle, Merge } from 'lucide-react';
import type { Folder as FolderType } from '../../hooks/useConversations';
import type { Tag as TagType } from '../../hooks/useTags';
import type { Conversation } from '../../hooks/useConversations';

interface AppSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;

  // Dossiers
  folders: FolderType[];
  onRenameFolder: (id: string, newName: string) => void;
  onChangeFolderColor: (id: string, color: string) => void;
  onDeleteFolder: (id: string) => void;

  // Tags
  tags: TagType[];
  onUpdateTag: (id: string, updates: Partial<Omit<TagType, 'id' | 'createdAt'>>) => void;
  onDeleteTag: (id: string) => void;

  // Conversations (pour les stats)
  conversations: Conversation[];
}

type TabType = 'folders' | 'tags';

const FOLDER_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

const TAG_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
];

export function AppSettingsModal({
  isOpen,
  onClose,
  folders,
  onRenameFolder,
  onChangeFolderColor,
  onDeleteFolder,
  tags,
  onUpdateTag,
  onDeleteTag,
  conversations,
}: AppSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('folders');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagData, setEditingTagData] = useState<{ name: string; color: string; icon?: string }>({ name: '', color: '' });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  if (!isOpen) return null;

  // Calculer les statistiques par dossier
  const folderStats = folders.map((folder) => ({
    ...folder,
    conversationCount: conversations.filter((conv) => conv.folderId === folder.id).length,
  }));

  // Calculer les statistiques par tag
  const tagStats = tags.map((tag) => ({
    ...tag,
    conversationCount: conversations.filter((conv) => conv.tagIds?.includes(tag.id)).length,
  }));

  // Notifications
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Gestion des dossiers
  const handleStartEditFolder = (folder: FolderType) => {
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  };

  const handleSaveFolder = () => {
    if (editingFolderId && editingFolderName.trim()) {
      onRenameFolder(editingFolderId, editingFolderName.trim());
      setEditingFolderId(null);
      showNotification('success', '✅ Dossier renommé avec succès');
    }
  };

  const handleDeleteFolder = (folder: FolderType) => {
    const convCount = conversations.filter((c) => c.folderId === folder.id).length;
    const message = convCount > 0
      ? `Supprimer le dossier "${folder.name}" ?\n\n${convCount} conversation(s) seront déplacées hors du dossier.`
      : `Supprimer le dossier "${folder.name}" ?`;

    if (confirm(message)) {
      onDeleteFolder(folder.id);
      showNotification('success', '✅ Dossier supprimé avec succès');
    }
  };

  // Gestion des tags
  const handleStartEditTag = (tag: TagType) => {
    setEditingTagId(tag.id);
    setEditingTagData({ name: tag.name, color: tag.color, icon: tag.icon });
  };

  const handleSaveTag = () => {
    if (editingTagId && editingTagData.name.trim()) {
      onUpdateTag(editingTagId, {
        name: editingTagData.name.trim(),
        color: editingTagData.color,
        icon: editingTagData.icon,
      });
      setEditingTagId(null);
      showNotification('success', '✅ Tag modifié avec succès');
    }
  };

  const handleDeleteTag = (tag: TagType) => {
    const convCount = conversations.filter((c) => c.tagIds?.includes(tag.id)).length;
    const message = convCount > 0
      ? `Supprimer le tag "${tag.name}" ?\n\nIl sera retiré de ${convCount} conversation(s).`
      : `Supprimer le tag "${tag.name}" ?`;

    if (confirm(message)) {
      onDeleteTag(tag.id);
      showNotification('success', '✅ Tag supprimé avec succès');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-card bg-gray-900/95 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden m-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-white/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Paramètres de l'Application</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10 px-6 flex gap-1">
          <button
            onClick={() => setActiveTab('folders')}
            className={`px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'folders'
                ? 'text-blue-400'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4" />
              <span>Dossiers</span>
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                {folders.length}
              </span>
            </div>
            {activeTab === 'folders' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('tags')}
            className={`px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'tags'
                ? 'text-blue-400'
                : 'text-muted-foreground hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <span>Tags</span>
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">
                {tags.length}
              </span>
            </div>
            {activeTab === 'tags' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400" />
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'folders' && (
            <div className="space-y-3">
              {folderStats.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Folder className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun dossier créé</p>
                  <p className="text-sm mt-1">Les dossiers permettent d'organiser vos conversations</p>
                </div>
              ) : (
                folderStats.map((folder) => (
                  <div
                    key={folder.id}
                    className="glass-card bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Color indicator */}
                      <div
                        className="w-8 h-8 rounded-lg flex-shrink-0"
                        style={{ backgroundColor: folder.color }}
                      />

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        {editingFolderId === folder.id ? (
                          <input
                            type="text"
                            value={editingFolderName}
                            onChange={(e) => setEditingFolderName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveFolder();
                              if (e.key === 'Escape') setEditingFolderId(null);
                            }}
                            className="w-full px-3 py-1 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-blue-500/50"
                            autoFocus
                          />
                        ) : (
                          <div>
                            <div className="font-medium">{folder.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {folder.conversationCount} conversation{folder.conversationCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {editingFolderId === folder.id ? (
                          <>
                            <button
                              onClick={handleSaveFolder}
                              className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
                              title="Sauvegarder"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingFolderId(null)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEditFolder(folder)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="Renommer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Color picker */}
                            <div className="relative group">
                              <button
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Changer la couleur"
                              >
                                <Palette className="w-4 h-4" />
                              </button>
                              <div className="absolute right-0 top-full mt-2 p-2 glass-card bg-gray-900/95 rounded-xl hidden group-hover:block z-10">
                                <div className="grid grid-cols-4 gap-2">
                                  {FOLDER_COLORS.map((color) => (
                                    <button
                                      key={color}
                                      onClick={() => {
                                        onChangeFolderColor(folder.id, color);
                                        showNotification('success', '✅ Couleur modifiée');
                                      }}
                                      className="w-8 h-8 rounded-lg hover:scale-110 transition-transform"
                                      style={{ backgroundColor: color }}
                                      title={color}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => handleDeleteFolder(folder)}
                              className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'tags' && (
            <div className="space-y-3">
              {tagStats.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucun tag créé</p>
                  <p className="text-sm mt-1">Les tags permettent de catégoriser vos conversations</p>
                </div>
              ) : (
                tagStats.map((tag) => (
                  <div
                    key={tag.id}
                    className="glass-card bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon & Color */}
                      <div
                        className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-lg"
                        style={{ backgroundColor: tag.color + '33', color: tag.color }}
                      >
                        {tag.icon || '🏷️'}
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        {editingTagId === tag.id ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editingTagData.name}
                              onChange={(e) => setEditingTagData({ ...editingTagData, name: e.target.value })}
                              placeholder="Nom du tag"
                              className="w-full px-3 py-1 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-blue-500/50"
                            />
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editingTagData.icon || ''}
                                onChange={(e) => setEditingTagData({ ...editingTagData, icon: e.target.value })}
                                placeholder="Icône (emoji)"
                                className="w-20 px-3 py-1 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 text-center"
                                maxLength={2}
                              />
                              <div className="flex gap-1">
                                {TAG_COLORS.map((color) => (
                                  <button
                                    key={color}
                                    onClick={() => setEditingTagData({ ...editingTagData, color })}
                                    className={`w-6 h-6 rounded ${editingTagData.color === color ? 'ring-2 ring-white' : ''}`}
                                    style={{ backgroundColor: color }}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-medium" style={{ color: tag.color }}>
                              {tag.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {tag.conversationCount} conversation{tag.conversationCount !== 1 ? 's' : ''}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {editingTagId === tag.id ? (
                          <>
                            <button
                              onClick={handleSaveTag}
                              className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
                              title="Sauvegarder"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingTagId(null)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleStartEditTag(tag)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteTag(tag)}
                              className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-[99999] animate-in fade-in slide-in-from-bottom-2">
          <div
            className={`glass-card rounded-xl p-4 flex items-center gap-3 min-w-[300px] ${
              notification.type === 'success'
                ? 'bg-green-500/20 border-green-500/50'
                : 'bg-red-500/20 border-red-500/50'
            }`}
          >
            {notification.type === 'success' ? (
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <div className="text-sm">{notification.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}
