import React, { useState, useMemo } from 'react';
import { Tag, Trash2, Edit2, Check, AlertCircle, Plus, Search, ArrowUpDown, X } from 'lucide-react';
import { TagModal } from '../chat/TagModal';
import type { Tag as TagType } from '../../hooks/useTags';
import type { Conversation } from '../../hooks/useConversations';
import type { Persona } from '../../types/persona';

type SortOption = 'name-asc' | 'name-desc' | 'usage-desc' | 'usage-asc' | 'date-desc' | 'date-asc';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');

  // Calculer, filtrer et trier les tags avec useMemo pour optimiser
  const filteredAndSortedTags = useMemo(() => {
    // 1. Filtrer les tags orphelins (dont le nom est l'ID)
    const validTags = tags.filter((tag) => !tag.name.startsWith('tag-'));

    // 2. Calculer les statistiques par tag
    const tagStats = validTags.map((tag) => {
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
        totalUsage: conversationCount + personaCount,
      };
    });

    // 3. Filtrer par recherche
    const filtered = searchQuery.trim()
      ? tagStats.filter((tag) =>
          tag.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
        )
      : tagStats;

    // 4. Trier
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'usage-desc':
          return b.totalUsage - a.totalUsage;
        case 'usage-asc':
          return a.totalUsage - b.totalUsage;
        case 'date-desc':
          return b.createdAt - a.createdAt;
        case 'date-asc':
          return a.createdAt - b.createdAt;
        default:
          return 0;
      }
    });

    return sorted;
  }, [tags, conversations, personas, searchQuery, sortBy]);

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
            <div className="text-3xl font-bold">{tags.filter(t => !t.name.startsWith('tag-')).length}</div>
            <div className="text-sm text-muted-foreground">Tags créés</div>
          </div>
        </div>
      </div>

      {/* Recherche et tri */}
      <div className="glass-card rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Barre de recherche */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un tag..."
              className="w-full pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-purple-500/50 transition-colors placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-white/10 rounded-md transition-colors"
                title="Réinitialiser la recherche"
              >
                <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
              </button>
            )}
          </div>

          {/* Menu de tri */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg outline-none focus:border-purple-500/50 transition-colors cursor-pointer"
            >
              <option value="name-asc">Nom (A → Z)</option>
              <option value="name-desc">Nom (Z → A)</option>
              <option value="usage-desc">Plus utilisés</option>
              <option value="usage-asc">Moins utilisés</option>
              <option value="date-desc">Plus récents</option>
              <option value="date-asc">Plus anciens</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tags List */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {searchQuery ? `${filteredAndSortedTags.length} résultat${filteredAndSortedTags.length !== 1 ? 's' : ''}` : 'Tous les tags'}
          </h3>
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
          {filteredAndSortedTags.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
              {searchQuery ? (
                <>
                  <p>Aucun résultat pour "{searchQuery}"</p>
                  <p className="text-sm mt-1">Essayez avec un autre terme de recherche</p>
                </>
              ) : (
                <>
                  <p>Aucun tag créé</p>
                  <p className="text-sm mt-1">Les tags permettent de catégoriser vos contenus</p>
                </>
              )}
            </div>
          ) : (
            filteredAndSortedTags.map((tag) => (
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
