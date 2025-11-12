import { Dispatch, SetStateAction, MutableRefObject } from 'react';
import type { OllamaMessage } from '@blackia/ollama';
import type { Persona } from '../types/persona';
import type { ChatSettingsData } from '../components/chat/ChatSettings';
import type { MessageMetadata } from './useConversations';
import type { WebSearchResponse, WebSearchSettings, WebSearchProviderConfig } from '@blackia/shared';
import type { RAGMetadata } from '../types/attachment';

interface UseChatActionsParams {
  // États
  messages: OllamaMessage[];
  setMessages: Dispatch<SetStateAction<OllamaMessage[]>>;
  messageMetadata: Record<number, MessageMetadata>;
  setMessageMetadata: Dispatch<SetStateAction<Record<number, MessageMetadata>>>;
  streamingMessage: string;
  setStreamingMessage: Dispatch<SetStateAction<string>>;
  isGenerating: boolean;
  setIsGenerating: Dispatch<SetStateAction<boolean>>;
  selectedModel: string;
  setRegenerationCounts: Dispatch<SetStateAction<Map<number, number>>>;

  // Refs
  currentStreamIdRef: MutableRefObject<string | null>;
  currentMentionedPersonaIdRef: MutableRefObject<string | undefined>;
  currentMentionedPersonaIdsRef: MutableRefObject<string[] | undefined>;

  // Conversations
  currentConversationId: string | null;
  createConversation: (model: string, title?: string) => any;

  // Personas & Settings
  personas: Persona[];
  currentPersona: Persona | null;
  chatSettings: ChatSettingsData;
  incrementPersonaUsage: (personaId: string) => void;

  // Web Search
  webSearchEnabled: boolean;
  webSearchSettings: WebSearchSettings;
  setWebSearchResults: Dispatch<SetStateAction<Record<number, WebSearchResponse>>>;
  setIsWebSearching: Dispatch<SetStateAction<boolean>>;
}

/**
 * Hook pour gérer toutes les actions principales du chat
 * Send, Stop, Clear, Regenerate, Edit
 */
export function useChatActions({
  messages,
  setMessages,
  messageMetadata,
  setMessageMetadata,
  streamingMessage,
  setStreamingMessage,
  isGenerating,
  setIsGenerating,
  selectedModel,
  setRegenerationCounts,
  currentStreamIdRef,
  currentMentionedPersonaIdRef,
  currentMentionedPersonaIdsRef,
  currentConversationId,
  createConversation,
  personas,
  currentPersona,
  chatSettings,
  incrementPersonaUsage,
  webSearchEnabled,
  webSearchSettings,
  setWebSearchResults,
  setIsWebSearching,
}: UseChatActionsParams) {

  // Envoyer un message
  const handleSendMessage = async (
    content: string,
    mentionedPersonaIds?: string[],
    includeMentionFewShots: boolean = false,
    attachmentIds?: string[],
    ragMetadata?: RAGMetadata
  ) => {
    console.log('[useChatActions] 📥 handleSendMessage reçu:', {
      mentionedPersonaIds,
      includeMentionFewShots,
      attachmentIds,
      hasRagMetadata: !!ragMetadata,
    });

    if (!selectedModel) {
      alert('Veuillez sélectionner un modèle');
      return;
    }

    // Stocker les mentionedPersonaIds dans le ref
    currentMentionedPersonaIdsRef.current = mentionedPersonaIds;
    currentMentionedPersonaIdRef.current = mentionedPersonaIds?.[0];

    // Créer une nouvelle conversation si nécessaire
    if (!currentConversationId && messages.length === 0) {
      const newConv = createConversation(selectedModel);
      console.log('[useChatActions] ✨ Nouvelle conversation créée automatiquement:', newConv.id);
    }

    // Ajouter le message de l'utilisateur
    const userMessage: OllamaMessage = {
      role: 'user',
      content,
    };

    const userMessageIndex = messages.length;
    setMessages((prev) => [...prev, userMessage]);

    // Stocker les métadonnées (personas, attachments, RAG)
    if (mentionedPersonaIds || attachmentIds || ragMetadata) {
      const metadata: MessageMetadata = {
        timestamp: Date.now(),
      };

      if (mentionedPersonaIds && mentionedPersonaIds.length > 0) {
        metadata.personaId = mentionedPersonaIds[0];
        metadata.personaIds = mentionedPersonaIds;
      }

      if (attachmentIds && attachmentIds.length > 0) {
        metadata.attachmentIds = attachmentIds;
      }

      setMessageMetadata((prev) => ({
        ...prev,
        [userMessageIndex]: metadata,
      }));
      console.log('[useChatActions] 📝 Métadonnées ajoutées pour message utilisateur index', userMessageIndex);
    }

    try {
      console.log('[useChatActions] 📤 Envoi du message au backend');

      // Déterminer quels personas utiliser
      const mentionedPersonas = mentionedPersonaIds
        ? mentionedPersonaIds.map(id => personas.find(p => p.id === id)).filter((p): p is Persona => p !== undefined)
        : [];

      const personasToUse = mentionedPersonas.length > 0 ? mentionedPersonas : (currentPersona ? [currentPersona] : []);

      if (mentionedPersonas.length > 0) {
        console.log('[useChatActions] 📧 Personas mentionnés (@mention):', mentionedPersonas.map(p => p.name).join(', '));
        mentionedPersonas.forEach(p => incrementPersonaUsage(p.id));
      } else if (currentPersona) {
        incrementPersonaUsage(currentPersona.id);
      }

      // Construire la liste des messages avec le system prompt
      const messagesToSend: OllamaMessage[] = [];
      let systemPromptToUse = '';

      if (personasToUse.length > 0) {
        if (personasToUse.length === 1) {
          systemPromptToUse = personasToUse[0].systemPrompt || '';
        } else {
          const combinedPrompts = personasToUse
            .filter(p => p.systemPrompt)
            .map((p, index) => `[Rôle ${index + 1}: ${p.name}]\n${p.systemPrompt}`)
            .join('\n\n---\n\n');

          systemPromptToUse = `Vous devez combiner les perspectives de plusieurs rôles pour répondre. Voici les rôles à adopter :\n\n${combinedPrompts}\n\nRépondez en intégrant les perspectives de tous ces rôles.`;
        }

        // Ajouter les few-shots si demandé
        const shouldIncludeFewShots = mentionedPersonas.length > 0
          ? includeMentionFewShots
          : chatSettings.includeFewShots;

        if (shouldIncludeFewShots) {
          const allFewShots = personasToUse
            .filter(p => p.fewShotExamples && p.fewShotExamples.length > 0)
            .flatMap(p => p.fewShotExamples || []);

          if (allFewShots.length > 0) {
            const fewShotsText = allFewShots
              .map((example) => `Utilisateur: ${example.input}\nAssistant: ${example.output}`)
              .join('\n\n');
            systemPromptToUse += '\n\nExemples:\n' + fewShotsText;
          }
        }
      } else if (chatSettings.systemPrompt.trim()) {
        systemPromptToUse = chatSettings.systemPrompt;
      }

      // Ajouter le contenu des attachments au contexte
      if (attachmentIds && attachmentIds.length > 0) {
        try {
          console.log('[useChatActions] 📎 Récupération du contenu des attachments:', attachmentIds);

          // Récupérer les attachments depuis la DB
          const responses = await Promise.all(
            attachmentIds.map(id => window.electronAPI.attachments.getById({ attachmentId: id }))
          );

          console.log('[useChatActions] 🔍 Réponses API reçues:', responses.map(r => ({
            success: r.success,
            hasAttachment: !!r.attachment,
            filename: r.attachment?.originalName,
            hasText: !!r.attachment?.extractedText,
            textLength: r.attachment?.extractedText?.length
          })));

          // Extraire les attachments des réponses et filtrer les valides avec extractedText
          const validAttachments = responses
            .filter(res => res.success && res.attachment)
            .map(res => res.attachment)
            .filter(att => att && !!att.extractedText);

          console.log('[useChatActions] ✅ Attachments valides trouvés:', validAttachments.length);

          if (validAttachments.length > 0) {
            // Construire le contexte des fichiers
            const filesContext = validAttachments
              .map((attachment, index) => {
                const textLength = attachment.extractedText!.length;
                const truncatedText = textLength > 10000
                  ? attachment.extractedText!.substring(0, 10000) + '\n\n[...texte tronqué...]'
                  : attachment.extractedText!;

                console.log(`[useChatActions] 📄 Document ${index + 1}: ${attachment.originalName} (${textLength} caractères)`);
                return `[Document ${index + 1}: ${attachment.originalName}]\n${truncatedText}`;
              })
              .join('\n\n---\n\n');

            const filesPrompt = `\n\n---\n\nDOCUMENTS JOINTS (${validAttachments.length} fichier${validAttachments.length > 1 ? 's' : ''}):\n\n${filesContext}\n\n---\n\nUtilise ces documents pour répondre à la question de l'utilisateur.`;
            systemPromptToUse += filesPrompt;

            console.log('[useChatActions] ✅ Contexte des fichiers ajouté au system prompt');
            console.log('[useChatActions] 📊 Longueur totale du system prompt:', systemPromptToUse.length, 'caractères');
          } else {
            console.warn('[useChatActions] ⚠️ Aucun texte extrait des attachments');
            console.warn('[useChatActions] 📊 Détails des réponses:', JSON.stringify(responses, null, 2));
          }
        } catch (error) {
          console.error('[useChatActions] ❌ Erreur lors de la récupération des attachments:', error);
          console.error('[useChatActions] ❌ Stack trace:', error instanceof Error ? error.stack : 'No stack');
        }
      }

      // Recherche web si activée
      let webSearchData: WebSearchResponse | null = null;
      if (webSearchEnabled && webSearchSettings.enabled) {
        try {
          console.log('[useChatActions] 🔍 Recherche web activée, recherche en cours...');
          setIsWebSearching(true);

          // Trouver le provider actif
          const activeProvider = webSearchSettings.providers.find(
            (p) => p.id === webSearchSettings.defaultProvider && p.enabled
          );

          if (activeProvider) {
            const searchResult = await window.electronAPI.webSearch.search(
              content, // Utiliser le message utilisateur comme requête
              activeProvider,
              {
                maxResults: webSearchSettings.maxResults,
                language: webSearchSettings.language,
                region: webSearchSettings.region,
                safeSearch: webSearchSettings.safeSearch,
                timeout: webSearchSettings.timeout,
              }
            );

            if (searchResult.success && searchResult.data) {
              webSearchData = searchResult.data;
              console.log('[useChatActions] ✅ Recherche web réussie:', webSearchData.results.length, 'résultats');

              // Construire le contexte web pour le system prompt
              if (webSearchSettings.includeSnippets && webSearchData.results.length > 0) {
                const webContext = webSearchData.results
                  .map((result, index) => {
                    const snippet = result.snippet.substring(0, webSearchSettings.snippetMaxLength);
                    return `[Source ${index + 1}] ${result.title}\nURL: ${result.url}\n${snippet}`;
                  })
                  .join('\n\n');

                const webPrompt = `\n\n---\n\nCONTEXTE WEB (Recherche: "${webSearchData.query}"):\n\n${webContext}\n\n---\n\nUtilise ces informations pour enrichir ta réponse si pertinent.`;
                systemPromptToUse += webPrompt;
              }
            } else {
              console.error('[useChatActions] ❌ Erreur recherche web:', searchResult.error);
            }
          } else {
            console.warn('[useChatActions] ⚠️ Aucun provider web actif trouvé');
          }
        } catch (error) {
          console.error('[useChatActions] ❌ Exception recherche web:', error);
        } finally {
          setIsWebSearching(false);
        }
      }

      if (systemPromptToUse) {
        messagesToSend.push({
          role: 'system',
          content: systemPromptToUse,
        });
      }

      messagesToSend.push(...messages, userMessage);

      // Déterminer les paramètres à utiliser
      const firstPersona = personasToUse[0];
      const temperature = firstPersona?.temperature ?? chatSettings.temperature;
      const maxTokens = firstPersona?.maxTokens ?? chatSettings.maxTokens;

      // Déterminer le modèle à utiliser
      let modelToUse = selectedModel;
      if (firstPersona?.model) {
        modelToUse = firstPersona.model;
      }

      // Envoyer la requête de chat avec streaming
      await window.electronAPI.ollama.chatStream({
        model: modelToUse,
        messages: messagesToSend,
        stream: true,
        options: {
          temperature,
          num_ctx: maxTokens,
          top_p: chatSettings.topP,
        },
      });

      // Sauvegarder les résultats de recherche web pour l'affichage
      if (webSearchData && webSearchData.results.length > 0) {
        const assistantMessageIndex = messages.length + 1; // Index du prochain message assistant
        setWebSearchResults((prev) => ({
          ...prev,
          [assistantMessageIndex]: webSearchData,
        }));
        console.log('[useChatActions] 💾 Résultats web sauvegardés pour message index', assistantMessageIndex);
      }

      // Sauvegarder les métadonnées RAG pour l'affichage
      if (ragMetadata && ragMetadata.enabled) {
        const assistantMessageIndex = messages.length + 1; // Index du prochain message assistant
        setMessageMetadata((prev) => ({
          ...prev,
          [assistantMessageIndex]: {
            ...prev[assistantMessageIndex],
            ragMetadata,
            timestamp: Date.now(),
          },
        }));
        console.log('[useChatActions] 💾 Métadonnées RAG sauvegardées pour message index', assistantMessageIndex);
      }

      console.log('[useChatActions] ✅ Handler chatStream terminé');
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi du message:', error);
      setIsGenerating(false);

      const errorMessage: OllamaMessage = {
        role: 'system',
        content: `❌ Erreur: ${error.message || 'Erreur inconnue'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // Arrêter la génération
  const handleStop = async () => {
    const streamId = currentStreamIdRef.current;
    if (!streamId) {
      console.log('[useChatActions] ⚠️ Aucun stream actif à stopper');
      return;
    }

    try {
      console.log('[useChatActions] 🛑 Demande d\'arrêt du stream:', streamId);
      const result = await window.electronAPI.ollama.stopStream(streamId);
      console.log('[useChatActions] ✅ Réponse stopStream:', result);
    } catch (error: any) {
      console.error('[useChatActions] ❌ Erreur lors du stop:', error);

      // Cleanup local en cas d'erreur
      setIsGenerating(false);
      currentStreamIdRef.current = null;

      if (streamingMessage) {
        const partialMessage: OllamaMessage = {
          role: 'assistant',
          content: streamingMessage + ' [interrompu]',
        };
        setMessages((prev) => [...prev, partialMessage]);
        setStreamingMessage('');
      }
    }
  };

  // Effacer la conversation
  const handleClearChat = () => {
    if (confirm('Voulez-vous vraiment effacer toute la conversation ?')) {
      setMessages([]);
      setMessageMetadata({});
      setStreamingMessage('');
      setIsGenerating(false);
      currentStreamIdRef.current = null;
      currentMentionedPersonaIdRef.current = undefined;
      currentMentionedPersonaIdsRef.current = undefined;
      setRegenerationCounts(new Map());
    }
  };

  // Régénérer la dernière réponse
  const handleRegenerate = async () => {
    if (isGenerating) {
      return;
    }

    // Trouver le dernier message assistant
    const lastAssistantIndex = messages.findLastIndex((m) => m.role === 'assistant');
    if (lastAssistantIndex === -1) {
      return;
    }

    // Supprimer le dernier message assistant
    const updatedMessages = messages.slice(0, lastAssistantIndex);
    setMessages(updatedMessages);

    // Incrémenter le compteur de régénération
    setRegenerationCounts((prev) => {
      const newCounts = new Map(prev);
      const currentCount = newCounts.get(lastAssistantIndex) || 0;
      newCounts.set(lastAssistantIndex, currentCount + 1);
      return newCounts;
    });

    try {
      console.log('[useChatActions] 🔄 Régénération de la réponse');

      // Construire les messages
      const messagesToSend: OllamaMessage[] = [];
      let systemPromptToUse = '';

      if (currentPersona?.systemPrompt) {
        systemPromptToUse = currentPersona.systemPrompt;

        if (chatSettings.includeFewShots && currentPersona.fewShotExamples?.length) {
          const fewShotsText = currentPersona.fewShotExamples
            .map((example) => `Utilisateur: ${example.input}\nAssistant: ${example.output}`)
            .join('\n\n');
          systemPromptToUse += '\n\nExemples:\n' + fewShotsText;
        }
      } else if (chatSettings.systemPrompt.trim()) {
        systemPromptToUse = chatSettings.systemPrompt;
      }

      if (systemPromptToUse) {
        messagesToSend.push({
          role: 'system',
          content: systemPromptToUse,
        });
      }

      messagesToSend.push(...updatedMessages);

      const temperature = currentPersona?.temperature ?? chatSettings.temperature;
      const maxTokens = currentPersona?.maxTokens ?? chatSettings.maxTokens;

      await window.electronAPI.ollama.chatStream({
        model: selectedModel,
        messages: messagesToSend,
        stream: true,
        options: {
          temperature,
          num_ctx: maxTokens,
          top_p: chatSettings.topP,
        },
      });

      console.log('[useChatActions] ✅ Régénération lancée');
    } catch (error: any) {
      console.error('Erreur lors de la régénération:', error);
      setIsGenerating(false);

      const errorMessage: OllamaMessage = {
        role: 'system',
        content: `❌ Erreur: ${error.message || 'Erreur inconnue'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // Éditer le dernier message utilisateur
  const handleEditUserMessage = async (newContent: string) => {
    if (isGenerating) {
      return;
    }

    // Trouver le dernier message utilisateur
    const lastUserIndex = messages.findLastIndex((m) => m.role === 'user');
    if (lastUserIndex === -1) {
      return;
    }

    // Mettre à jour le message utilisateur
    const updatedMessages = [...messages];
    updatedMessages[lastUserIndex] = {
      ...updatedMessages[lastUserIndex],
      content: newContent,
    };

    // Supprimer la réponse assistant si elle existe
    const lastAssistantIndex = messages.findLastIndex((m) => m.role === 'assistant');
    if (lastAssistantIndex > lastUserIndex) {
      updatedMessages.splice(lastAssistantIndex, 1);
    }

    setMessages(updatedMessages);

    try {
      console.log('[useChatActions] ✏️ Édition du message et régénération');

      // Construire les messages
      const messagesToSend: OllamaMessage[] = [];
      let systemPromptToUse = '';

      if (currentPersona?.systemPrompt) {
        systemPromptToUse = currentPersona.systemPrompt;

        if (chatSettings.includeFewShots && currentPersona.fewShotExamples?.length) {
          const fewShotsText = currentPersona.fewShotExamples
            .map((example) => `Utilisateur: ${example.input}\nAssistant: ${example.output}`)
            .join('\n\n');
          systemPromptToUse += '\n\nExemples:\n' + fewShotsText;
        }
      } else if (chatSettings.systemPrompt.trim()) {
        systemPromptToUse = chatSettings.systemPrompt;
      }

      if (systemPromptToUse) {
        messagesToSend.push({
          role: 'system',
          content: systemPromptToUse,
        });
      }

      messagesToSend.push(...updatedMessages);

      const temperature = currentPersona?.temperature ?? chatSettings.temperature;
      const maxTokens = currentPersona?.maxTokens ?? chatSettings.maxTokens;

      await window.electronAPI.ollama.chatStream({
        model: selectedModel,
        messages: messagesToSend,
        stream: true,
        options: {
          temperature,
          num_ctx: maxTokens,
          top_p: chatSettings.topP,
        },
      });

      console.log('[useChatActions] ✅ Régénération lancée après édition');
    } catch (error: any) {
      console.error('Erreur lors de la régénération après édition:', error);
      setIsGenerating(false);

      const errorMessage: OllamaMessage = {
        role: 'system',
        content: `❌ Erreur: ${error.message || 'Erreur inconnue'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  return {
    handleSendMessage,
    handleStop,
    handleClearChat,
    handleRegenerate,
    handleEditUserMessage,
  };
}
