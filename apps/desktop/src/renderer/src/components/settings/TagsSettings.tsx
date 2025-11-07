import React, { useState } from 'react';
import { Tag, Trash2, Edit2, Check, AlertCircle, Plus } from 'lucide-react';
import { TagModal } from '../chat/TagModal';
import type { Tag as TagType } from '../../hooks/useTags';
import type { Conversation } from '../../hooks/useConversations';
import type { Persona } from '../../types/persona';

interface TagsSettingsProps {
  tags: TagType[];
  onCreateTag: (name: string, color: string, icon?: string) => TagType;
  onUpdateTag: (id: string, updates: Partial<Omit<TagType, 'id' | 'createdAt'>>) => void;
  onDeleteTag: (id: string) => void;
  conversations: Conversation[];
  personas: Persona[];
}

export function TagsSettings({
  tags,
  onCreateTag,
  onUpdateTag,
  onDeleteTag,
  conversations,
  personas,
}: TagsSettingsProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Calculer les statistiques par tag
  const tagStats = tags.map((tag) => {
    // Compter les conversations avec ce tag
    const conversationCount = conversations.filter((conv) => conv.tagIds?.includes(tag.id)).length;

    // Compter les personas avec ce tag (par nom OU par ID)
    const personaCount = personas.filter((persona) => {
      try {
        const personaTags: string[] = JSON.parse(persona.tags || '[]');

        // Normaliser le nom du tag global pour la comparaison
        const normalizedTagName = tag.name.toLowerCase().trim();
        const tagId = tag.id;

        const hasTag = personaTags.some((tagValue) => {
          // Vérifier que c'est bien une string
          if (typeof tagValue !== 'string') return false;

          const normalizedValue = tagValue.toLowerCase().trim();

          // Match par ID ou par nom
          const matchesById = normalizedValue === tagId;
          const matchesByName = normalizedValue === normalizedTagName;

          return matchesById || matchesByName;
        });

        return hasTag;
      } catch (error) {
        console.error(`[TagsSettings] Error parsing tags for persona ${persona.name}:`, error);
        return false;
      }
    }).length;

    return {
      ...tag,
      conversationCount,
      personaCount,
    };
  });

  // Notifications
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Gestion des tags
  const handleStartEditTag = (tag: TagType) => {
    setEditingTag(tag);
    setIsEditModalOpen(true);
  };

  const handleEditTag = (name: string, color: string, icon?: string) => {
    if (editingTag) {
      onUpdateTag(editingTag.id, {
        name: name.trim(),
        color,
        icon,
      });
      showNotification('success', '✅ Tag modifié avec succès');
    }
  };

  const handleDeleteTag = (tag: TagType & { conversationCount: number; personaCount: number }) => {
    const { conversationCount, personaCount } = tag;
    const totalCount = conversationCount + personaCount;

    let message = `Supprimer le tag "${tag.name}" ?`;

    if (totalCount > 0) {
      const parts: string[] = [];
      if (conversationCount > 0) {
        parts.push(`${conversationCount} conversation${conversationCount !== 1 ? 's' : ''}`);
      }
      if (personaCount > 0) {
        parts.push(`${personaCount} persona${personaCount !== 1 ? 's' : ''}`);
      }
      message = `Supprimer le tag "${tag.name}" ?\n\nIl sera retiré de ${parts.join(' et ')}.`;
    }

    if (confirm(message)) {
      onDeleteTag(tag.id);
      showNotification('success', '✅ Tag supprimé avec succès');
    }
  };

  // Gestion de la création
  const handleCreateTag = (name: string, color: string, icon?: string) => {
    onCreateTag(name, color, icon);
    showNotification('success', '✅ Tag créé avec succès');
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
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau tag</span>
          </button>
        </div>

        <div className="space-y-3">
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
                    <div>
                      <div className="font-medium text-lg" style={{ color: tag.color }}>
                        {tag.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {tag.conversationCount} conversation{tag.conversationCount !== 1 ? 's' : ''}
                        {' • '}
                        {tag.personaCount} persona{tag.personaCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
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

      {/* Modal de création */}
      <TagModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateTag}
        title="Nouveau tag"
      />

      {/* Modal d'édition */}
      <TagModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditTag}
        initialName={editingTag?.name}
        initialColor={editingTag?.color}
        initialIcon={editingTag?.icon}
        title="Modifier le tag"
      />

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
