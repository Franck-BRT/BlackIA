import React from 'react';
import { X, FileText, Image, Film, Music, Archive, File, Download, Eye } from 'lucide-react';
import type { Attachment } from '../../types/attachment';
import { formatFileSize, getAttachmentIcon } from '../../types/attachment';

interface AttachmentPreviewProps {
  attachment: Attachment;
  onRemove?: () => void;
  onView?: () => void;
  onDownload?: () => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

/**
 * AttachmentPreview - Carte de prévisualisation d'un fichier attaché
 *
 * Features:
 * - Icône selon type MIME
 * - Nom + taille du fichier
 * - Tags visuels
 * - Actions (view, download, remove)
 * - Mode compact pour liste dense
 * - Thumbnail pour images (si disponible)
 */
export function AttachmentPreview({
  attachment,
  onRemove,
  onView,
  onDownload,
  showActions = true,
  compact = false,
  className = '',
}: AttachmentPreviewProps) {
  /**
   * Obtenir l'icône Lucide selon le type MIME
   */
  const getIconComponent = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Film;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType === 'application/pdf') return FileText;
    if (mimeType === 'application/zip' || mimeType.includes('compressed')) return Archive;
    return File;
  };

  const IconComponent = getIconComponent(attachment.mimeType);

  /**
   * Obtenir la couleur de bordure selon le RAG mode
   */
  const getRagModeColor = () => {
    switch (attachment.ragMode) {
      case 'text':
        return 'border-blue-500';
      case 'vision':
        return 'border-purple-500';
      case 'hybrid':
        return 'border-gradient-to-r from-blue-500 to-purple-500';
      case 'none':
        return 'border-gray-300 dark:border-gray-600';
      default:
        return 'border-gray-300 dark:border-gray-600';
    }
  };

  /**
   * Obtenir le badge RAG mode
   */
  const getRagModeBadge = () => {
    if (attachment.ragMode === 'none') return null;

    const colors = {
      text: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      vision: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      hybrid: 'bg-gradient-to-r from-blue-100 to-purple-100 text-purple-800 dark:from-blue-900/30 dark:to-purple-900/30 dark:text-purple-300',
    };

    const labels = {
      text: 'Text RAG',
      vision: 'Vision RAG',
      hybrid: 'Hybrid RAG',
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[attachment.ragMode] || ''}`}>
        {labels[attachment.ragMode] || attachment.ragMode}
      </span>
    );
  };

  if (compact) {
    // Mode compact pour liste dense
    return (
      <div
        className={`
          flex items-center gap-2 p-2 rounded-lg
          bg-gray-50 dark:bg-gray-800/50
          border ${getRagModeColor()}
          ${className}
        `}
      >
        {/* Icône */}
        <IconComponent className="w-4 h-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />

        {/* Nom du fichier */}
        <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1">
          {attachment.originalName}
        </span>

        {/* Taille */}
        <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
          {formatFileSize(attachment.size)}
        </span>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {onView && (
              <button
                onClick={onView}
                className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Voir"
              >
                <Eye className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={onRemove}
                className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                title="Supprimer"
              >
                <X className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // Mode normal (carte complète)
  return (
    <div
      className={`
        relative group
        flex flex-col gap-2 p-4 rounded-lg
        bg-white dark:bg-gray-800
        border-2 ${getRagModeColor()}
        shadow-sm hover:shadow-md
        transition-all duration-200
        ${className}
      `}
    >
      {/* Header avec icône et actions */}
      <div className="flex items-start gap-3">
        {/* Thumbnail ou icône */}
        {attachment.thumbnailPath && attachment.mimeType.startsWith('image/') ? (
          <img
            src={`file://${attachment.thumbnailPath}`}
            alt={attachment.originalName}
            className="w-12 h-12 rounded object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
            <IconComponent className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {attachment.originalName}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {formatFileSize(attachment.size)}
          </p>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onView && (
              <button
                onClick={onView}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Voir"
              >
                <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
            {onDownload && (
              <button
                onClick={onDownload}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Télécharger"
              >
                <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}
            {onRemove && (
              <button
                onClick={onRemove}
                className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                title="Supprimer"
              >
                <X className="w-4 h-4 text-red-600 dark:text-red-400" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer avec badges et métadonnées */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Badge RAG mode */}
        {getRagModeBadge()}

        {/* Badge indexation */}
        {attachment.isIndexedText && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
            Indexed
          </span>
        )}

        {/* Tags */}
        {attachment.tags.length > 0 && (
          <div className="flex items-center gap-1">
            {attachment.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              >
                {tag}
              </span>
            ))}
            {attachment.tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{attachment.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
