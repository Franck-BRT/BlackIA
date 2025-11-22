import { useEffect, useCallback, Dispatch, SetStateAction, MutableRefObject } from 'react';
import type { OllamaMessage, OllamaChatStreamChunk, OllamaToolCall } from '@blackia/ollama';
import type { MessageMetadata } from './useConversations';

/**
 * Parse le format texte <function=...> utilisé par certains modèles (qwen3-coder, etc.)
 * et le convertit en OllamaToolCall[]
 */
function parseTextToolCalls(content: string): OllamaToolCall[] {
  const toolCalls: OllamaToolCall[] = [];

  // Pattern pour matcher <function=nom_fonction>...</function>
  const functionRegex = /<function=([^>]+)>([\s\S]*?)<\/function>/g;
  let match;

  while ((match = functionRegex.exec(content)) !== null) {
    const functionName = match[1].trim();
    const functionBody = match[2];

    // Parser les paramètres
    const args: Record<string, unknown> = {};
    const paramRegex = /<parameter=([^>]+)>([\s\S]*?)<\/parameter>/g;
    let paramMatch;

    while ((paramMatch = paramRegex.exec(functionBody)) !== null) {
      const paramName = paramMatch[1].trim();
      const paramValue = paramMatch[2].trim();
      args[paramName] = paramValue;
    }

    toolCalls.push({
      function: {
        name: functionName,
        arguments: args,
      },
    });

    console.log('[parseTextToolCalls] Parsed tool call:', functionName, args);
  }

  return toolCalls;
}

interface UseChatStreamingParams {
  setStreamingMessage: Dispatch<SetStateAction<string>>;
  setIsGenerating: Dispatch<SetStateAction<boolean>>;
  setMessages: Dispatch<SetStateAction<OllamaMessage[]>>;
  setMessageMetadata: Dispatch<SetStateAction<Record<number, MessageMetadata>>>;
  currentStreamIdRef: MutableRefObject<string | null>;
  currentMentionedPersonaIdRef: MutableRefObject<string | undefined>;
  currentMentionedPersonaIdsRef: MutableRefObject<string[] | undefined>;
  // MCP Tools
  mcpEnabled?: boolean;
  setMcpToolCalls?: Dispatch<SetStateAction<OllamaToolCall[]>>;
  setIsMcpExecuting?: Dispatch<SetStateAction<boolean>>;
  onToolCallsReceived?: (toolCalls: OllamaToolCall[]) => Promise<void>;
}

/**
 * Hook pour gérer tous les listeners de streaming Ollama
 * Centralise la logique complexe de streaming en temps réel
 */
export function useChatStreaming({
  setStreamingMessage,
  setIsGenerating,
  setMessages,
  setMessageMetadata,
  currentStreamIdRef,
  currentMentionedPersonaIdRef,
  currentMentionedPersonaIdsRef,
  // MCP
  mcpEnabled,
  setMcpToolCalls,
  setIsMcpExecuting,
  onToolCallsReceived,
}: UseChatStreamingParams) {
  // Suivre si des tool_calls ont été traités pour ce stream
  const toolCallsProcessedRef = { current: false };

  useEffect(() => {
    console.log('[useChatStreaming] 🎧 Enregistrement des listeners de streaming');

    // Listener pour le début du streaming
    window.electronAPI.ollama.onStreamStart((data: { streamId: string }) => {
      console.log('[useChatStreaming] 🚀 Stream start reçu, streamId:', data.streamId);
      currentStreamIdRef.current = data.streamId;
      toolCallsProcessedRef.current = false; // Reset pour le nouveau stream
      setStreamingMessage('');
      setIsGenerating(true);
    });

    // Listener pour les chunks de streaming
    window.electronAPI.ollama.onStreamChunk(async (data: { streamId: string; chunk: OllamaChatStreamChunk }) => {
      console.log('[useChatStreaming] 📥 Chunk reçu:', {
        receivedStreamId: data.streamId,
        currentStreamId: currentStreamIdRef.current,
        content: data.chunk.message.content,
        done: data.chunk.done,
        hasToolCalls: !!data.chunk.message.tool_calls,
      });

      // Vérifier que c'est bien notre stream
      if (data.streamId === currentStreamIdRef.current) {
        console.log('[useChatStreaming] ✅ StreamId match! Traitement du chunk');

        // Vérifier si le modèle demande des appels d'outils
        if (data.chunk.message.tool_calls && data.chunk.message.tool_calls.length > 0) {
          console.log('[useChatStreaming] 🔧 Tool calls détectés:', data.chunk.message.tool_calls);
          toolCallsProcessedRef.current = true; // Marquer qu'on a traité des tool_calls

          // Sauvegarder les tool_calls dans l'état
          if (setMcpToolCalls) {
            setMcpToolCalls(data.chunk.message.tool_calls);
          }

          // Si on a un callback pour traiter les tool_calls, l'appeler
          if (onToolCallsReceived && mcpEnabled) {
            console.log('[useChatStreaming] 🚀 Exécution des outils MCP...');
            if (setIsMcpExecuting) {
              setIsMcpExecuting(true);
            }

            try {
              await onToolCallsReceived(data.chunk.message.tool_calls);
            } catch (error) {
              console.error('[useChatStreaming] ❌ Erreur exécution outils:', error);
            } finally {
              if (setIsMcpExecuting) {
                setIsMcpExecuting(false);
              }
            }
          }

          // Ne pas terminer le stream normal ici, le callback gère la suite
          return;
        }

        // Si on a déjà traité des tool_calls et qu'on reçoit done: true, ignorer
        if (data.chunk.done && toolCallsProcessedRef.current) {
          console.log('[useChatStreaming] 🔧 Stream terminé après tool_calls, ignoré (callback gère la suite)');
          setIsGenerating(false);
          currentStreamIdRef.current = null;
          toolCallsProcessedRef.current = false;
          return;
        }

        setStreamingMessage((prev) => {
          const newContent = prev + data.chunk.message.content;
          console.log('[useChatStreaming] 📝 Contenu accumulé:', newContent);
          return newContent;
        });

        // Si le stream est terminé
        if (data.chunk.done) {
          console.log('[useChatStreaming] 🏁 Stream terminé, création du message final');
          setStreamingMessage((currentContent) => {
            const finalContent = currentContent + data.chunk.message.content;

            // Ne pas créer de message vide
            if (!finalContent || !finalContent.trim()) {
              console.warn('[useChatStreaming] ⚠️ Contenu final vide, pas de message créé');
              setIsGenerating(false);
              currentStreamIdRef.current = null;
              currentMentionedPersonaIdRef.current = undefined;
              currentMentionedPersonaIdsRef.current = undefined;
              return '';
            }

            // Vérifier si le contenu contient des appels d'outils au format texte
            // (utilisé par certains modèles comme qwen3-coder)
            if (mcpEnabled && finalContent.includes('<function=')) {
              const textToolCalls = parseTextToolCalls(finalContent);
              if (textToolCalls.length > 0) {
                console.log('[useChatStreaming] 🔧 Tool calls détectés dans le texte:', textToolCalls);
                toolCallsProcessedRef.current = true;

                if (setMcpToolCalls) {
                  setMcpToolCalls(textToolCalls);
                }

                // Exécuter les outils via le callback
                if (onToolCallsReceived) {
                  console.log('[useChatStreaming] 🚀 Exécution des outils MCP (format texte)...');
                  if (setIsMcpExecuting) {
                    setIsMcpExecuting(true);
                  }

                  // Exécuter de manière asynchrone
                  (async () => {
                    try {
                      await onToolCallsReceived(textToolCalls);
                    } catch (error) {
                      console.error('[useChatStreaming] ❌ Erreur exécution outils:', error);
                    } finally {
                      if (setIsMcpExecuting) {
                        setIsMcpExecuting(false);
                      }
                    }
                  })();
                }

                // Ne pas créer de message normal, le callback gère la suite
                setIsGenerating(false);
                currentStreamIdRef.current = null;
                return '';
              }
            }

            const finalMessage: OllamaMessage = {
              role: 'assistant',
              content: finalContent,
            };
            setMessages((prev) => {
              const newMessages = [...prev, finalMessage];
              const assistantMessageIndex = prev.length;

              // Si des personas ont été mentionnés, ajouter les métadonnées
              if (currentMentionedPersonaIdsRef.current && currentMentionedPersonaIdsRef.current.length > 0) {
                setMessageMetadata((prevMetadata) => ({
                  ...prevMetadata,
                  [assistantMessageIndex]: {
                    personaId: currentMentionedPersonaIdsRef.current![0],
                    personaIds: currentMentionedPersonaIdsRef.current,
                    timestamp: Date.now(),
                  },
                }));
                console.log('[useChatStreaming] 📝 Métadonnées ajoutées pour message assistant index', assistantMessageIndex);
              }

              return newMessages;
            });
            return '';
          });
          setIsGenerating(false);
          currentStreamIdRef.current = null;
          currentMentionedPersonaIdRef.current = undefined;
          currentMentionedPersonaIdsRef.current = undefined;
        }
      } else {
        console.log('[useChatStreaming] ⚠️ StreamId ne correspond pas, chunk ignoré');
      }
    });

    // Listener pour la fin du stream
    window.electronAPI.ollama.onStreamEnd((data: { streamId: string; stopped?: boolean }) => {
      console.log('[useChatStreaming] 🏁 Stream terminé:', {
        streamId: data.streamId,
        stopped: data.stopped,
        currentStreamId: currentStreamIdRef.current,
      });

      // Vérifier que c'est bien notre stream
      if (data.streamId === currentStreamIdRef.current) {
        console.log('[useChatStreaming] ✅ Cleanup du stream');

        // Si le stream a été stoppé, sauvegarder le contenu partiel
        if (data.stopped) {
          console.log('[useChatStreaming] 🛑 Stream stoppé, vérification du contenu partiel...');
          setStreamingMessage((currentContent) => {
            console.log('[useChatStreaming] 📝 Contenu partiel à sauvegarder:', currentContent?.substring(0, 100));
            if (currentContent && currentContent.trim()) {
              const partialMessage: OllamaMessage = {
                role: 'assistant',
                content: currentContent + ' [interrompu]',
              };
              console.log('[useChatStreaming] 💾 Sauvegarde du message partiel');
              setMessages((prev) => [...prev, partialMessage]);
            } else {
              console.log('[useChatStreaming] ⚠️ Pas de contenu partiel à sauvegarder');
            }
            return '';
          });
        }

        setIsGenerating(false);
        currentStreamIdRef.current = null;
      }
    });

    // Listener pour les erreurs
    window.electronAPI.ollama.onStreamError((data: { error: string }) => {
      console.error('[useChatStreaming] ❌ Erreur de streaming:', data.error);
      setIsGenerating(false);
      currentStreamIdRef.current = null;
      setStreamingMessage('');

      // Ajouter un message d'erreur
      const errorMessage: OllamaMessage = {
        role: 'system',
        content: `❌ Erreur: ${data.error}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    });

    // Cleanup
    return () => {
      console.log('[useChatStreaming] 🧹 Nettoyage des listeners');
      window.electronAPI.ollama.removeAllListeners('ollama:streamStart');
      window.electronAPI.ollama.removeAllListeners('ollama:streamChunk');
      window.electronAPI.ollama.removeAllListeners('ollama:streamEnd');
      window.electronAPI.ollama.removeAllListeners('ollama:streamError');
    };
  }, []); // Pas de dépendances pour n'enregistrer qu'une seule fois
}
