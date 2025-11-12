import React, { useRef, useState } from 'react';
import { Paperclip, Upload, X } from 'lucide-react';
import type { EntityType } from '../../types/attachment';

interface AttachmentButtonProps {
  entityType: EntityType;
  entityId: string;
  onUpload: (files: File[]) => void;
  onError?: (error: string) => void;
  maxFiles?: number;
  maxSizeBytes?: number;
  accept?: string; // MIME types acceptés (ex: "image/*,application/pdf")
  className?: string;
  disabled?: boolean;
}

/**
 * AttachmentButton - Bouton pour uploader des fichiers avec drag-drop
 *
 * Features:
 * - Click to upload
 * - Drag & drop support
 * - File validation (type, size, count)
 * - Visual feedback during drag
 * - Multiple file upload
 */
export function AttachmentButton({
  entityType,
  entityId,
  onUpload,
  onError,
  maxFiles = 10,
  maxSizeBytes = 50 * 1024 * 1024, // 50MB default
  accept = 'image/*,application/pdf,text/*',
  className = '',
  disabled = false,
}: AttachmentButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  /**
   * Validation des fichiers
   */
  const validateFiles = (files: File[]): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    // Vérifier le nombre de fichiers
    if (files.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} fichiers autorisés. Vous avez sélectionné ${files.length} fichiers.`);
      return { valid, errors };
    }

    // Vérifier chaque fichier
    for (const file of files) {
      // Vérifier la taille
      if (file.size > maxSizeBytes) {
        const maxMB = Math.round(maxSizeBytes / (1024 * 1024));
        const fileMB = (file.size / (1024 * 1024)).toFixed(2);
        errors.push(`${file.name}: taille ${fileMB}MB dépasse la limite de ${maxMB}MB`);
        continue;
      }

      // Vérifier le type MIME
      if (accept && accept !== '*') {
        const acceptedTypes = accept.split(',').map(t => t.trim());
        const isAccepted = acceptedTypes.some(acceptedType => {
          if (acceptedType.endsWith('/*')) {
            // Wildcard type (ex: image/*)
            const category = acceptedType.split('/')[0];
            return file.type.startsWith(category + '/');
          } else {
            // Type exact
            return file.type === acceptedType;
          }
        });

        if (!isAccepted) {
          errors.push(`${file.name}: type de fichier non accepté (${file.type})`);
          continue;
        }
      }

      valid.push(file);
    }

    return { valid, errors };
  };

  /**
   * Handler pour la sélection de fichiers (click)
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const { valid, errors } = validateFiles(files);

    if (errors.length > 0 && onError) {
      onError(errors.join('\n'));
    }

    if (valid.length > 0) {
      onUpload(valid);
    }

    // Reset input pour permettre de re-sélectionner le même fichier
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handler pour le click sur le bouton
   */
  const handleClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  /**
   * Handlers pour le drag & drop
   */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev - 1);
    if (dragCounter - 1 === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setDragCounter(0);

    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const { valid, errors } = validateFiles(files);

    if (errors.length > 0 && onError) {
      onError(errors.join('\n'));
    }

    if (valid.length > 0) {
      onUpload(valid);
    }
  };

  return (
    <div
      className={`relative ${className}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Bouton d'upload */}
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`
          flex items-center gap-2 px-3 py-2 rounded-lg
          transition-all duration-200
          ${isDragging
            ? 'bg-purple-600 text-white scale-105 shadow-lg'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }
          ${disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'cursor-pointer'
          }
        `}
        title="Ajouter des fichiers (drag & drop ou click)"
      >
        {isDragging ? (
          <>
            <Upload className="w-4 h-4" />
            <span className="text-sm font-medium">Déposer les fichiers</span>
          </>
        ) : (
          <>
            <Paperclip className="w-4 h-4" />
            <span className="text-sm">Fichiers</span>
          </>
        )}
      </button>

      {/* Overlay de drag */}
      {isDragging && (
        <div className="fixed inset-0 bg-purple-600/10 backdrop-blur-sm z-40 pointer-events-none flex items-center justify-center">
          <div className="bg-purple-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
            <Upload className="w-6 h-6" />
            <span className="text-lg font-medium">Déposer les fichiers ici</span>
          </div>
        </div>
      )}
    </div>
  );
}
