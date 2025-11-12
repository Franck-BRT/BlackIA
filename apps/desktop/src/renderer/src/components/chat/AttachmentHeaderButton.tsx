import React, { useState, useEffect } from 'react';
import { Paperclip, X } from 'lucide-react';
import { AttachmentButton } from '../attachments/AttachmentButton';
import { AttachmentPreview } from '../attachments/AttachmentPreview';
import { AttachmentViewer } from '../attachments/AttachmentViewer';
import { useAttachments } from '../../hooks/useAttachments';
import { useAttachmentViewer } from '../../hooks/useAttachmentViewer';
import type { Attachment } from '../../types/attachment';

interface AttachmentHeaderButtonProps {
  conversationId?: string;
  entityType?: 'conversation' | 'message';
  entityId?: string;
  onAttachmentsChange?: (attachments: Attachment[]) => void;
  disabled?: boolean;
}

/**
 * Bouton d'attachments dans le header avec dropdown pour gérer les fichiers
 */
export function AttachmentHeaderButton({
  conversationId,
  entityType = 'conversation',
  entityId,
  onAttachmentsChange,
  disabled = false,
}: AttachmentHeaderButtonProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const {
    attachments: uploadedAttachments,
    upload: uploadAttachment,
    remove: removeAttachment,
    isLoading: isUploadingFiles,
    load: loadAttachments,
  } = useAttachments({
    entityType,
    entityId: entityId || conversationId || '',
    autoLoad: true, // Charger automatiquement les attachments existants
  });

  const viewer = useAttachmentViewer();

  // Notifier le parent quand les attachments changent
  useEffect(() => {
    if (onAttachmentsChange) {
      onAttachmentsChange(uploadedAttachments);
    }
  }, [uploadedAttachments, onAttachmentsChange]);

  const handleFilesUpload = async (files: File[]) => {
    try {
      console.log('[AttachmentHeaderButton] 📤 Uploading files:', files.length);
      const uploaded = await uploadAttachment(files);
      console.log('[AttachmentHeaderButton] ✅ Files uploaded:', uploaded.length, uploaded);
    } catch (error) {
      console.error('[AttachmentHeaderButton] ❌ Upload error:', error);
      alert(`Erreur lors de l'upload: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    console.log('[AttachmentHeaderButton] 🗑️ Removing attachment:', attachmentId);
    const success = await removeAttachment(attachmentId);
    if (!success) {
      alert('Erreur lors de la suppression du fichier');
    }
  };

  const handleToggleDropdown = () => {
    if (!conversationId && !disabled) {
      alert('Sélectionnez d\'abord un modèle pour créer une conversation');
      return;
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  const isActive = uploadedAttachments.length > 0 || isDropdownOpen;

  return (
    <div className="relative">
      {/* Bouton principal */}
      <button
        onClick={handleToggleDropdown}
        disabled={disabled || !conversationId}
        className={`
          header-btn gap-2 px-3
          ${isActive ? 'glass-card border border-blue-500/40 text-blue-400' : 'glass-hover'}
          ${disabled || !conversationId ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title="Gérer les fichiers attachés"
      >
        <Paperclip className="w-5 h-5" />
        <span className="text-sm hidden sm:inline">Fichiers</span>
        {uploadedAttachments.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {uploadedAttachments.length}
          </span>
        )}
      </button>

      {/* Dropdown avec la liste des fichiers */}
      {isDropdownOpen && conversationId && (
        <>
          {/* Overlay pour fermer le dropdown */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsDropdownOpen(false)}
          />

          {/* Menu dropdown */}
          <div className="absolute top-full right-0 mt-2 w-96 max-h-[500px] overflow-y-auto glass-card border border-white/10 rounded-lg shadow-xl z-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">
                📎 Fichiers attachés ({uploadedAttachments.length})
              </h3>
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Bouton d'upload */}
            <div className="mb-3">
              <AttachmentButton
                entityType={entityType}
                entityId={entityId || conversationId}
                onUpload={handleFilesUpload}
                onError={(error) => {
                  console.error('[AttachmentHeaderButton] ❌ Upload error:', error);
                  alert(error);
                }}
                disabled={isUploadingFiles}
                maxFiles={10}
                maxSizeBytes={50 * 1024 * 1024}
                accept="image/*,application/pdf,text/*"
                className="w-full"
              />
            </div>

            {isUploadingFiles && (
              <div className="mb-3 text-center text-sm text-blue-400 animate-pulse">
                Téléchargement en cours...
              </div>
            )}

            {/* Liste des fichiers */}
            {uploadedAttachments.length > 0 ? (
              <div className="space-y-2">
                {uploadedAttachments.map((attachment) => (
                  <AttachmentPreview
                    key={attachment.id}
                    attachment={attachment}
                    onRemove={() => handleRemoveAttachment(attachment.id)}
                    onView={() => viewer.openViewer(attachment, uploadedAttachments)}
                    compact
                    showActions
                  />
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-gray-400 py-8">
                Aucun fichier attaché
                <br />
                <span className="text-xs">Glissez des fichiers ou cliquez sur "Ajouter fichiers"</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Viewer modal */}
      {viewer.isOpen && viewer.currentAttachment && (
        <AttachmentViewer
          attachment={viewer.currentAttachment}
          attachments={viewer.allAttachments}
          currentIndex={viewer.currentIndex}
          onClose={viewer.closeViewer}
          onNavigate={viewer.navigateToIndex}
        />
      )}
    </div>
  );
}
