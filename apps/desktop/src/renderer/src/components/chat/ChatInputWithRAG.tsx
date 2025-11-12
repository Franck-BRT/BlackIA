import React, { useState, useRef } from 'react';
import { Send, Square } from 'lucide-react';
import { AttachmentButton } from '../attachments/AttachmentButton';
import { RAGToggle } from './RAGToggle';
import { AttachmentPreview } from '../attachments/AttachmentPreview';
import { useAttachments } from '../../hooks/useAttachments';
import { useRAG } from '../../hooks/useRAG';
import type { Attachment } from '../../types/attachment';
import type { RAGMetadata } from '../../types/attachment';

interface ChatInputWithRAGProps {
  onSend: (
    message: string,
    options?: {
      attachmentIds?: string[];
      ragMetadata?: RAGMetadata;
    }
  ) => void;
  onStop?: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  placeholder?: string;
  conversationId: string;
  className?: string;
}

/**
 * ChatInputWithRAG - Version simplifiée du ChatInput avec support d'attachments et RAG
 *
 * Features:
 * - Upload de fichiers avec drag & drop
 * - Toggle RAG (text/vision/hybrid/auto)
 * - Contextualisation automatique avec RAG
 * - Prévisualisation des fichiers uploadés
 * - Interface épurée
 *
 * Note: Ceci est une version simplifiée sans les fonctionnalités de mentions (@persona, /prompt)
 * Pour la version complète, voir ChatInput.INTEGRATION_GUIDE.tsx
 */
export function ChatInputWithRAG({
  onSend,
  onStop,
  disabled = false,
  isGenerating = false,
  placeholder = 'Tapez votre message...',
  conversationId,
  className = '',
}: ChatInputWithRAGProps) {
  const [message, setMessage] = useState('');
  const [uploadedAttachments, setUploadedAttachments] = useState<Attachment[]>([]);
  const [ragEnabled, setRagEnabled] = useState(true);
  const [ragMode, setRagMode] = useState<'text' | 'vision' | 'hybrid' | 'auto'>('auto');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Hooks
  const { upload: uploadAttachment, isLoading: isUploadingFiles } = useAttachments({
    entityType: 'conversation',
    entityId: conversationId,
    autoLoad: false,
  });

  const { contextualizeMessage, isSearching } = useRAG({
    enabled: ragEnabled,
    defaultMode: ragMode,
    topK: 5,
    minScore: 0.7,
  });

  /**
   * Auto-resize textarea
   */
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  /**
   * Handle upload de fichiers
   */
  const handleFilesUpload = async (files: File[]) => {
    try {
      console.log('[ChatInputWithRAG] Uploading files:', files.length);
      const uploaded = await uploadAttachment(files);
      setUploadedAttachments([...uploadedAttachments, ...uploaded]);
      console.log('[ChatInputWithRAG] Files uploaded:', uploaded.length);
    } catch (error) {
      console.error('[ChatInputWithRAG] Upload error:', error);
      // TODO: Afficher un toast d'erreur
    }
  };

  /**
   * Handle suppression d'un attachment
   */
  const handleRemoveAttachment = (attachmentId: string) => {
    setUploadedAttachments(uploadedAttachments.filter(a => a.id !== attachmentId));
  };

  /**
   * Handle message change
   */
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  /**
   * Handle key down
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  /**
   * Handle submit
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || disabled || isGenerating || isSearching) {
      return;
    }

    console.log('[ChatInputWithRAG] Submitting message...');

    // Contextualisation RAG si activé et qu'il y a des attachments
    let ragMetadata: RAGMetadata | undefined;
    let finalMessage = message.trim();

    if (ragEnabled && uploadedAttachments.length > 0) {
      console.log('[ChatInputWithRAG] RAG enabled, contextualizing message...');

      const { context, metadata } = await contextualizeMessage(finalMessage, {
        conversationId,
        entityType: 'conversation',
        entityId: conversationId,
        mode: ragMode,
      });

      if (context) {
        // Enrichir le message avec le contexte
        finalMessage = `${context}\n\nUser: ${finalMessage}`;
        ragMetadata = metadata;

        console.log('[ChatInputWithRAG] Message contextualized:', {
          chunksUsed: metadata.chunksUsed,
          mode: metadata.mode,
        });
      }
    }

    // Extraire les IDs des attachments
    const attachmentIds = uploadedAttachments.map(a => a.id);

    // Envoyer
    onSend(finalMessage, {
      attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined,
      ragMetadata,
    });

    // Reset
    setMessage('');
    setUploadedAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  /**
   * Handle stop
   */
  const handleStop = () => {
    if (onStop) {
      onStop();
    }
  };

  const isProcessing = isUploadingFiles || isSearching;
  const canSend = message.trim() && !disabled && !isGenerating && !isProcessing;

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-3 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg ${className}`}
    >
      {/* Toolbar: Attachments + RAG */}
      <div className="flex items-center gap-2">
        <AttachmentButton
          entityType="conversation"
          entityId={conversationId}
          onUpload={handleFilesUpload}
          onError={(error) => console.error('[ChatInputWithRAG] Upload error:', error)}
          disabled={disabled || isGenerating}
          maxFiles={10}
          maxSizeBytes={50 * 1024 * 1024} // 50MB
          accept="image/*,application/pdf,text/*"
        />

        <RAGToggle
          enabled={ragEnabled}
          mode={ragMode}
          onToggle={() => setRagEnabled(!ragEnabled)}
          onModeChange={setRagMode}
        />

        {isUploadingFiles && (
          <span className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">
            Upload en cours...
          </span>
        )}

        {isSearching && (
          <span className="text-xs text-purple-500 dark:text-purple-400 animate-pulse">
            Recherche RAG...
          </span>
        )}
      </div>

      {/* Liste des fichiers uploadés */}
      {uploadedAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {uploadedAttachments.map((attachment) => (
            <AttachmentPreview
              key={attachment.id}
              attachment={attachment}
              onRemove={() => handleRemoveAttachment(attachment.id)}
              compact
              showActions
            />
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isProcessing}
          rows={1}
          className="
            flex-1 bg-transparent resize-none outline-none
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            max-h-32 overflow-y-auto
          "
          style={{ minHeight: '24px' }}
        />

        {/* Send/Stop button */}
        {isGenerating ? (
          <button
            type="button"
            onClick={handleStop}
            className="
              p-2 rounded-xl
              bg-red-500/20 hover:bg-red-500/30
              text-red-400
              transition-colors
            "
            title="Arrêter la génération"
          >
            <Square className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            className="
              p-2 rounded-xl
              bg-blue-500/20 hover:bg-blue-500/30
              text-blue-400
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
            title="Envoyer"
          >
            <Send className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Hints */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span className="hidden sm:inline">↵ Entrée pour envoyer</span>
        <span className="hidden md:inline">⇧ + ↵ pour nouvelle ligne</span>

        {uploadedAttachments.length > 0 && (
          <span className="text-blue-500 dark:text-blue-400">
            📎 {uploadedAttachments.length} fichier(s)
          </span>
        )}

        {ragEnabled && (
          <span className="text-purple-500 dark:text-purple-400">
            ✨ RAG {ragMode}
          </span>
        )}
      </div>
    </form>
  );
}
