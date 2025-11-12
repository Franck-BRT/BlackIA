/**
 * ChatInput avec Attachments + RAG - Guide d'intégration
 *
 * Ce fichier montre les modifications à apporter au ChatInput.tsx existant
 * pour intégrer les fonctionnalités d'attachments et RAG.
 */

// ============================================
// ÉTAPE 1: Ajouter les imports
// ============================================

// Au début du fichier, ajouter ces imports:
import { AttachmentButton } from '../attachments/AttachmentButton';
import { RAGToggle } from './RAGToggle';
import { useAttachments } from '../../hooks/useAttachments';
import { useRAG } from '../../hooks/useRAG';
import { AttachmentPreview } from '../attachments/AttachmentPreview';
import type { Attachment } from '../../types/attachment';

// ============================================
// ÉTAPE 2: Modifier l'interface Props
// ============================================

interface ChatInputProps {
  onSend: (
    message: string,
    personaIds?: string[],
    includeFewShots?: boolean,
    // Nouveaux paramètres:
    attachmentIds?: string[],
    ragMetadata?: any
  ) => void;
  onStop?: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
  placeholder?: string;
  personas?: Persona[];
  initialMessage?: string;
  onMessageChange?: () => void;
  prefillPersonaId?: string;
  prefillIncludeFewShots?: boolean;
  // Nouveaux props:
  conversationId?: string; // Nécessaire pour RAG et attachments
  entityType?: 'conversation' | 'message';
  entityId?: string;
}

// ============================================
// ÉTAPE 3: Ajouter les hooks et états
// ============================================

export function ChatInput({
  onSend,
  // ... autres props
  conversationId,
  entityType = 'conversation',
  entityId,
}: ChatInputProps) {
  // États existants...
  const [message, setMessage] = useState(initialMessage);
  // ...

  // NOUVEAUX ÉTATS pour attachments
  const [uploadedAttachments, setUploadedAttachments] = useState<Attachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // NOUVEAUX ÉTATS pour RAG
  const [ragEnabled, setRagEnabled] = useState(true);
  const [ragMode, setRagMode] = useState<'text' | 'vision' | 'hybrid' | 'auto'>('auto');

  // NOUVEAUX HOOKS
  const { upload: uploadAttachment, isLoading: isUploadingFiles } = useAttachments({
    entityType: entityType || 'conversation',
    entityId: entityId || conversationId || '',
    autoLoad: false,
  });

  const { contextualizeMessage, isSearching } = useRAG({
    enabled: ragEnabled,
    defaultMode: ragMode,
    topK: 5,
    minScore: 0.7,
  });

  // ============================================
  // ÉTAPE 4: Handler pour upload de fichiers
  // ============================================

  const handleFilesUpload = async (files: File[]) => {
    try {
      setIsUploading(true);
      const uploaded = await uploadAttachment(files);
      setUploadedAttachments([...uploadedAttachments, ...uploaded]);
    } catch (error) {
      console.error('[ChatInput] Upload error:', error);
      // Afficher un toast d'erreur ici
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAttachment = (attachmentId: string) => {
    setUploadedAttachments(uploadedAttachments.filter(a => a.id !== attachmentId));
  };

  // ============================================
  // ÉTAPE 5: Modifier handleSubmit
  // ============================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled && !isGenerating) {
      // Logique existante pour personas...
      const mentionedIds = extractMentionsFromText(message);
      let allPersonaIds = [...new Set([...selectedPersonaIds, ...mentionedIds])];
      if (prefillPersonaId && !allPersonaIds.includes(prefillPersonaId)) {
        allPersonaIds = [prefillPersonaId, ...allPersonaIds];
      }
      const shouldIncludeFewShots = prefillPersonaId ? prefillIncludeFewShots : includeMentionFewShots;

      // NOUVEAU: Contextualisation RAG si activé
      let ragMetadata = null;
      let enrichedMessage = message.trim();

      if (ragEnabled && uploadedAttachments.length > 0) {
        const { context, metadata } = await contextualizeMessage(message.trim(), {
          conversationId,
          entityType,
          entityId,
          mode: ragMode,
        });

        if (context) {
          enrichedMessage = `${context}\n\nUser: ${message.trim()}`;
          ragMetadata = metadata;
        }
      }

      // NOUVEAU: Extraire les IDs des attachments
      const attachmentIds = uploadedAttachments.map(a => a.id);

      // Envoyer avec les nouveaux paramètres
      onSend(
        enrichedMessage,
        allPersonaIds.length > 0 ? allPersonaIds : undefined,
        allPersonaIds.length > 0 ? shouldIncludeFewShots : false,
        attachmentIds.length > 0 ? attachmentIds : undefined,
        ragMetadata
      );

      // Reset
      setMessage('');
      setSelectedPersonaIds([]);
      setIncludeMentionFewShots(false);
      setUploadedAttachments([]); // NOUVEAU: Clear attachments
      // ...
    }
  };

  // ============================================
  // ÉTAPE 6: Ajouter dans le JSX
  // ============================================

  return (
    <form onSubmit={handleSubmit} ref={formRef} className="...">
      {/* ... Contenu existant (mentions, prompts, suggestions) ... */}

      {/* NOUVEAU: Toolbar avec attachments et RAG */}
      <div className="flex items-center gap-2 mb-2">
        <AttachmentButton
          entityType={entityType || 'conversation'}
          entityId={entityId || conversationId || ''}
          onUpload={handleFilesUpload}
          onError={(error) => console.error('Upload error:', error)}
          disabled={disabled || isGenerating || isUploading}
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

        {isUploading && (
          <span className="text-xs text-gray-500">Upload en cours...</span>
        )}
      </div>

      {/* NOUVEAU: Liste des fichiers uploadés */}
      {uploadedAttachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
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

      {/* Textarea et boutons existants... */}
      <div className="flex items-end gap-3">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSearching} // NOUVEAU: disable pendant recherche RAG
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none placeholder:text-muted-foreground max-h-32 overflow-y-auto"
          style={{ minHeight: '24px' }}
        />

        {/* Boutons Send/Stop existants... */}
      </div>

      {/* Hints existants + nouveaux */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs text-muted-foreground">
        <span className="hidden sm:inline">↵ Entrée pour envoyer</span>
        <span className="hidden md:inline">⇧ + ↵ pour nouvelle ligne</span>
        <span className="truncate">@ mention</span>
        <span className="truncate">/ prompt</span>
        {/* NOUVEAU */}
        {uploadedAttachments.length > 0 && (
          <span className="truncate">📎 {uploadedAttachments.length} fichier(s)</span>
        )}
        {ragEnabled && (
          <span className="truncate text-purple-400">✨ RAG activé</span>
        )}
      </div>
    </form>
  );
}
