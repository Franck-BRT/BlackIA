import React, { useState, useMemo } from 'react';
import { Search, Grid3x3, List, SlidersHorizontal, X } from 'lucide-react';
import { AttachmentPreview } from './AttachmentPreview';
import type { Attachment, RAGMode } from '../../types/attachment';

interface AttachmentListProps {
  attachments: Attachment[];
  onRemove?: (attachmentId: string) => void;
  onView?: (attachment: Attachment) => void;
  onDownload?: (attachment: Attachment) => void;
  showActions?: boolean;
  className?: string;
}

type ViewMode = 'grid' | 'list';

/**
 * AttachmentList - Liste/grille de fichiers attachés avec filtrage
 *
 * Features:
 * - Vue grille ou liste
 * - Recherche par nom
 * - Filtrage par type MIME, RAG mode, tags
 * - Tri par date, nom, taille
 * - Affichage statistiques
 */
export function AttachmentList({
  attachments,
  onRemove,
  onView,
  onDownload,
  showActions = true,
  className = '',
}: AttachmentListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filtres
  const [selectedRagMode, setSelectedRagMode] = useState<RAGMode | 'all'>('all');
  const [selectedMimeType, setSelectedMimeType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date');

  /**
   * Obtenir les types MIME uniques
   */
  const uniqueMimeTypes = useMemo(() => {
    const types = new Set(attachments.map(a => a.mimeType));
    return Array.from(types).sort();
  }, [attachments]);

  /**
   * Filtrer et trier les attachments
   */
  const filteredAttachments = useMemo(() => {
    let filtered = attachments;

    // Filtre de recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.originalName.toLowerCase().includes(query) ||
        a.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Filtre RAG mode
    if (selectedRagMode !== 'all') {
      filtered = filtered.filter(a => a.ragMode === selectedRagMode);
    }

    // Filtre MIME type
    if (selectedMimeType !== 'all') {
      filtered = filtered.filter(a => a.mimeType === selectedMimeType);
    }

    // Tri
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.originalName.localeCompare(b.originalName);
        case 'size':
          return b.size - a.size;
        case 'date':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime();
      }
    });

    return filtered;
  }, [attachments, searchQuery, selectedRagMode, selectedMimeType, sortBy]);

  /**
   * Statistiques
   */
  const stats = useMemo(() => {
    const totalSize = attachments.reduce((sum, a) => sum + a.size, 0);
    const indexedCount = attachments.filter(a => a.isIndexedText || a.isIndexedVision).length;

    return {
      total: attachments.length,
      filtered: filteredAttachments.length,
      totalSize,
      indexedCount,
    };
  }, [attachments, filteredAttachments]);

  /**
   * Formater la taille totale
   */
  const formatTotalSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  /**
   * Réinitialiser les filtres
   */
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedRagMode('all');
    setSelectedMimeType('all');
    setSortBy('date');
  };

  const hasActiveFilters = searchQuery || selectedRagMode !== 'all' || selectedMimeType !== 'all' || sortBy !== 'date';

  if (attachments.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">
          Aucun fichier attaché
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Header avec recherche et actions */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Barre de recherche */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher des fichiers..."
            className="
              w-full pl-10 pr-4 py-2 rounded-lg
              bg-gray-100 dark:bg-gray-800
              border border-gray-300 dark:border-gray-600
              text-gray-900 dark:text-gray-100
              placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-purple-500
            "
          />
        </div>

        {/* Toggle filtres */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg
            transition-colors
            ${showFilters
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-sm">Filtres</span>
        </button>

        {/* Toggle vue grille/liste */}
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <button
            onClick={() => setViewMode('grid')}
            className={`
              p-2 rounded transition-colors
              ${viewMode === 'grid'
                ? 'bg-white dark:bg-gray-700 text-purple-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
            title="Vue grille"
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`
              p-2 rounded transition-colors
              ${viewMode === 'list'
                ? 'bg-white dark:bg-gray-700 text-purple-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }
            `}
            title="Vue liste"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Panneau de filtres */}
      {showFilters && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Filtres avancés
            </h3>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                Réinitialiser
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Filtre RAG mode */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Mode RAG
              </label>
              <select
                value={selectedRagMode}
                onChange={(e) => setSelectedRagMode(e.target.value as RAGMode | 'all')}
                className="
                  w-full px-3 py-2 rounded-lg text-sm
                  bg-white dark:bg-gray-800
                  border border-gray-300 dark:border-gray-600
                  text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-purple-500
                "
              >
                <option value="all">Tous</option>
                <option value="text">Text RAG</option>
                <option value="vision">Vision RAG</option>
                <option value="hybrid">Hybrid RAG</option>
                <option value="none">Aucun</option>
              </select>
            </div>

            {/* Filtre MIME type */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type de fichier
              </label>
              <select
                value={selectedMimeType}
                onChange={(e) => setSelectedMimeType(e.target.value)}
                className="
                  w-full px-3 py-2 rounded-lg text-sm
                  bg-white dark:bg-gray-800
                  border border-gray-300 dark:border-gray-600
                  text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-purple-500
                "
              >
                <option value="all">Tous</option>
                {uniqueMimeTypes.map(type => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Tri */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trier par
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'size')}
                className="
                  w-full px-3 py-2 rounded-lg text-sm
                  bg-white dark:bg-gray-800
                  border border-gray-300 dark:border-gray-600
                  text-gray-900 dark:text-gray-100
                  focus:outline-none focus:ring-2 focus:ring-purple-500
                "
              >
                <option value="date">Date (récent)</option>
                <option value="name">Nom (A-Z)</option>
                <option value="size">Taille (plus gros)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques */}
      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
        <span>
          {stats.filtered} / {stats.total} fichiers
        </span>
        <span>•</span>
        <span>{formatTotalSize(stats.totalSize)}</span>
        <span>•</span>
        <span>{stats.indexedCount} indexés</span>
      </div>

      {/* Liste des attachments */}
      {filteredAttachments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            Aucun résultat pour ces filtres
          </p>
        </div>
      ) : (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'flex flex-col gap-2'
          }
        >
          {filteredAttachments.map(attachment => (
            <AttachmentPreview
              key={attachment.id}
              attachment={attachment}
              onRemove={onRemove ? () => onRemove(attachment.id) : undefined}
              onView={onView ? () => onView(attachment) : undefined}
              onDownload={onDownload ? () => onDownload(attachment) : undefined}
              showActions={showActions}
              compact={viewMode === 'list'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
