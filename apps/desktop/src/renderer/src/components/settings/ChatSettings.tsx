import React, { useState } from 'react';
import { Folder, Trash2, Edit2, Palette, Check, AlertCircle, X } from 'lucide-react';
import type { Folder as FolderType } from '../../hooks/useConversations';
import type { Conversation } from '../../hooks/useConversations';

interface ChatSettingsProps {
  // Dossiers
  folders: FolderType[];
  onRenameFolder: (id: string, newName: string) => void;
  onChangeFolderColor: (id: string, color: string) => void;
  onDeleteFolder: (id: string) => void;

  // Conversations (pour les stats)
  conversations: Conversation[];
}

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

export function ChatSettings({
  folders,
  onRenameFolder,
  onChangeFolderColor,
  onDeleteFolder,
  conversations,
}: ChatSettingsProps) {
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Calculer les statistiques par dossier
  const folderStats = folders.map((folder) => ({
    ...folder,
    conversationCount: conversations.filter((conv) => conv.folderId === folder.id).length,
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
    const message =
      convCount > 0
        ? `Supprimer le dossier "${folder.name}" ?\n\n${convCount} conversation(s) seront déplacées hors du dossier.`
        : `Supprimer le dossier "${folder.name}" ?`;

    if (confirm(message)) {
      onDeleteFolder(folder.id);
      showNotification('success', '✅ Dossier supprimé avec succès');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Paramètres du Chat</h2>
        <p className="text-muted-foreground">
          Gérez vos dossiers pour organiser vos conversations
        </p>
      </div>

      {/* Dossiers */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Folder className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold">Dossiers</h3>
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full">{folders.length}</span>
        </div>

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
      </div>

      {/* Info */}
      <div className="p-4 glass-card rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-xs text-blue-400">
          💡 Les dossiers vous permettent d'organiser vos conversations. Les tags sont maintenant gérés dans leur propre section.
        </p>
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
