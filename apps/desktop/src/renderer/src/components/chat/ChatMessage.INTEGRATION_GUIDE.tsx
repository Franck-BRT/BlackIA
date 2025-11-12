/**
 * ChatMessage avec RAG Sources - Guide d'intégration
 *
 * Ce fichier montre les modifications à apporter au ChatMessage.tsx existant
 * pour afficher les sources RAG utilisées dans les réponses de l'assistant.
 */

// ============================================
// ÉTAPE 1: Ajouter les imports
// ============================================

import { RAGSources } from './RAGSources';
import type { RAGMetadata, RAGSource } from '../../types/attachment';

// ============================================
// ÉTAPE 2: Modifier l'interface Props
// ============================================

interface ChatMessageProps {
  message: OllamaMessage;
  isStreaming?: boolean;
  regenerationCount?: number;
  onRegenerate?: () => void;
  isLastAssistantMessage?: boolean;
  isLastUserMessage?: boolean;
  onEdit?: (newContent: string) => void;
  onInsert?: () => void;
  searchQuery?: string;
  searchStartIndex?: number;
  activeGlobalIndex?: number;
  syntaxTheme?: string;
  showLineNumbers?: boolean;
  mentionedPersona?: Persona;
  mentionedPersonas?: Persona[];

  // NOUVEAUX props pour RAG:
  ragMetadata?: RAGMetadata; // Métadonnées RAG si ce message a utilisé RAG
  onViewSource?: (source: RAGSource) => void; // Callback pour voir une source complète
}

// ============================================
// ÉTAPE 3: Ajouter dans le JSX
// ============================================

export function ChatMessage({
  message,
  // ... autres props
  ragMetadata,
  onViewSource,
}: ChatMessageProps) {
  // ... code existant ...

  return (
    <div className={`flex mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="flex gap-3 max-w-[85%]">
        {/* Avatar et contenu existants... */}

        {/* NOUVEAU: Afficher les sources RAG pour les messages de l'assistant */}
        {isAssistant && ragMetadata && (
          <RAGSources
            metadata={ragMetadata}
            onViewSource={onViewSource}
            className="mt-2"
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// EXEMPLE D'UTILISATION COMPLÈTE
// ============================================

// Dans le composant parent (ChatInterface, ChatMessages, etc.) :

import { useState } from 'react';
import type { OllamaMessage } from '@blackia/ollama';
import type { RAGMetadata, RAGSource } from '../../types/attachment';

interface MessageWithRAG extends OllamaMessage {
  ragMetadata?: RAGMetadata;
}

function ChatMessages() {
  const [messages, setMessages] = useState<MessageWithRAG[]>([]);
  const [viewingSource, setViewingSource] = useState<RAGSource | null>(null);

  const handleViewSource = (source: RAGSource) => {
    console.log('Viewing source:', source);
    setViewingSource(source);
    // Ouvrir un modal ou panneau latéral pour afficher la source complète
    // TODO: Implémenter AttachmentViewer modal
  };

  return (
    <div className="space-y-4">
      {messages.map((msg, index) => (
        <ChatMessage
          key={index}
          message={msg}
          ragMetadata={msg.ragMetadata}
          onViewSource={handleViewSource}
          // ... autres props
        />
      ))}

      {/* Modal pour afficher la source (TODO) */}
      {viewingSource && (
        <AttachmentViewer
          source={viewingSource}
          onClose={() => setViewingSource(null)}
        />
      )}
    </div>
  );
}

// ============================================
// NOTES IMPORTANTES
// ============================================

/**
 * 1. Stockage des métadonnées RAG:
 *    - Les métadonnées RAG doivent être stockées avec chaque message dans l'état
 *    - Quand onSend() est appelé depuis ChatInput, capturer le ragMetadata
 *    - L'ajouter au message avant de l'ajouter à l'état messages[]
 *
 * 2. Exemple de flux complet:
 *
 *    ChatInputWithRAG
 *      ↓ onSend(message, { ragMetadata })
 *    ChatInterface
 *      ↓ Stocker message avec ragMetadata
 *      ↓ Envoyer à Ollama
 *      ↓ Recevoir réponse assistant
 *      ↓ Ajouter au state messages[]
 *    ChatMessage
 *      ↓ Afficher message + RAGSources si ragMetadata existe
 *
 * 3. Type du message enrichi:
 *    interface MessageWithRAG extends OllamaMessage {
 *      ragMetadata?: RAGMetadata;
 *      attachmentIds?: string[];
 *    }
 *
 * 4. Persistance (optionnel):
 *    - Si vous voulez persister les métadonnées RAG en DB
 *    - Ajouter un champ JSON dans la table messages
 *    - Sérialiser/désérialiser ragMetadata lors de save/load
 */
