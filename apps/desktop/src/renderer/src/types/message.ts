import type { OllamaMessage } from '@blackia/ollama';

/**
 * Extension du type OllamaMessage avec métadonnées pour BlackIA
 * Conserve la compatibilité avec l'API Ollama
 */
export interface MessageWithMetadata extends OllamaMessage {
  /**
   * ID du persona utilisé pour générer ce message (mention @persona)
   * Uniquement pour les messages individuels, différent du persona global de la conversation
   */
  personaId?: string;

  /**
   * Timestamp de création du message
   */
  timestamp?: number;

  /**
   * Métadonnées supplémentaires
   */
  metadata?: Record<string, unknown>;
}

/**
 * Convertit un MessageWithMetadata en OllamaMessage standard
 * pour l'envoi à l'API Ollama
 */
export function toOllamaMessage(message: MessageWithMetadata): OllamaMessage {
  return {
    role: message.role,
    content: message.content,
    images: message.images,
  };
}

/**
 * Crée un MessageWithMetadata depuis un OllamaMessage
 */
export function fromOllamaMessage(
  message: OllamaMessage,
  metadata?: { personaId?: string; timestamp?: number }
): MessageWithMetadata {
  return {
    ...message,
    personaId: metadata?.personaId,
    timestamp: metadata?.timestamp || Date.now(),
  };
}
