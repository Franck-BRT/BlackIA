import React, { useState } from 'react';
import { Tag, Trash2, Edit2, Check, AlertCircle, X, Plus } from 'lucide-react';
import type { Tag as TagType } from '../../hooks/useTags';
import type { Conversation } from '../../hooks/useConversations';

interface TagsSettingsProps {
  tags: TagType[];
  onCreateTag: (name: string, color: string, icon?: string) => TagType;
  onUpdateTag: (id: string, updates: Partial<Omit<TagType, 'id' | 'createdAt'>>) => void;
  onDeleteTag: (id: string) => void;
  conversations: Conversation[];
}

const TAG_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
];

export function TagsSettings({
  tags,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  conversations,
}: TagsSettingsProps) {
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingTagData, setEditingTagData] = useState<{ name: string; color: string; icon?: string }>({
    name: '',
    color: '',
  });
  const [isCreating, setIsCreating] = useState(false);
  const [newTagData, setNewTagData] = useState<{ name: string; color: string; icon?: string }>({
    name: '',
    color: TAG_COLORS[0],
    icon: '🏷️',
  });
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

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
    const message =
      convCount > 0
        ? `Supprimer le tag "${tag.name}" ?\n\nIl sera retiré de ${convCount} conversation(s).`
        : `Supprimer le tag "${tag.name}" ?`;

    if (confirm(message)) {
      onDeleteTag(tag.id);
      showNotification('success', '✅ Tag supprimé avec succès');
    }
  };

  // Gestion de la création
  const handleStartCreate = () => {
    setIsCreating(true);
    setNewTagData({
      name: '',
      color: TAG_COLORS[0],
      icon: '🏷️',
    });
  };

  const handleCreateTag = () => {
    if (newTagData.name.trim()) {
      onCreateTag(newTagData.name.trim(), newTagData.color, newTagData.icon);
      setIsCreating(false);
      setNewTagData({ name: '', color: TAG_COLORS[0], icon: '🏷️' });
      showNotification('success', '✅ Tag créé avec succès');
    }
  };

  const handleCancelCreate = () => {
    setIsCreating(false);
    setNewTagData({ name: '', color: TAG_COLORS[0], icon: '🏷️' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Gestion des Tags</h2>
        <p className="text-muted-foreground">
          Les tags permettent de catégoriser et organiser vos conversations, personas et autres contenus
        </p>
      </div>

      {/* Stats Card */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl glass-lg flex items-center justify-center">
            <Tag className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <div className="text-3xl font-bold">{tags.length}</div>
            <div className="text-sm text-muted-foreground">Tags créés</div>
          </div>
        </div>
      </div>

      {/* Tags List */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Tous les tags</h3>
          <button
            type="button"
            onClick={handleStartCreate}
            disabled={isCreating}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau tag</span>
          </button>
        </div>

        <div className="space-y-3">
          {/* Formulaire de création */}
          {isCreating && (
            <div className="glass-card bg-purple-500/10 border-purple-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                {/* Icon & Color Preview */}
                <div
                  className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xl"
                  style={{ backgroundColor: newTagData.color + '33', color: newTagData.color }}
                >
                  {newTagData.icon || '🏷️'}
                </div>

                {/* Form */}
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    value={newTagData.name}
                    onChange={(e) => setNewTagData({ ...newTagData, name: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateTag();
                      if (e.key === 'Escape') handleCancelCreate();
                    }}
                    placeholder="Nom du tag"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-purple-500/50"
                    autoFocus
                  />
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={newTagData.icon || ''}
                      onChange={(e) => setNewTagData({ ...newTagData, icon: e.target.value })}
                      placeholder="Icône"
                      className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-purple-500/50 text-center text-lg"
                      maxLength={2}
                    />
                    <div className="flex gap-1">
                      {TAG_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewTagData({ ...newTagData, color })}
                          className={`w-8 h-8 rounded-lg hover:scale-110 transition-transform ${newTagData.color === color ? 'ring-2 ring-white' : ''}`}
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCreateTag}
                    className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
                    title="Créer"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelCreate}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    title="Annuler"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Liste des tags existants */}
          {tagStats.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucun tag créé</p>
              <p className="text-sm mt-1">Les tags permettent de catégoriser vos contenus</p>
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
                    className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-xl"
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
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveTag();
                            if (e.key === 'Escape') setEditingTagId(null);
                          }}
                          placeholder="Nom du tag"
                          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-blue-500/50"
                          autoFocus
                        />
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={editingTagData.icon || ''}
                            onChange={(e) => setEditingTagData({ ...editingTagData, icon: e.target.value })}
                            placeholder="Icône"
                            className="w-24 px-3 py-2 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-blue-500/50 text-center text-lg"
                            maxLength={2}
                          />
                          <div className="flex gap-1">
                            {TAG_COLORS.map((color) => (
                              <button
                                key={color}
                                type="button"
                                onClick={() => setEditingTagData({ ...editingTagData, color })}
                                className={`w-8 h-8 rounded-lg hover:scale-110 transition-transform ${editingTagData.color === color ? 'ring-2 ring-white' : ''}`}
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-medium text-lg" style={{ color: tag.color }}>
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
                          type="button"
                          onClick={handleSaveTag}
                          className="p-2 hover:bg-green-500/20 text-green-400 rounded-lg transition-colors"
                          title="Sauvegarder"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTagId(null)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Annuler"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartEditTag(tag)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-5 h-5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTag(tag)}
                          className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
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
          💡 Les tags sont partagés entre les conversations, personas et autres modules de l'application
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
