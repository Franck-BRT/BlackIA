import { useMemo, Dispatch, SetStateAction } from 'react';
import type { Persona } from '../types/persona';
import type { OllamaMessage } from '@blackia/ollama';
import type { ChatSettingsData } from '../components/chat/ChatSettings';

interface UseChatPersonaParams {
  personas: Persona[];
  getCurrentConversation: () => any;
  currentConversationId: string | null;
  updateConversation: (id: string, updates: any, skipSort?: boolean) => void;
  createConversation: (model: string, title?: string) => any;
  selectedModel: string;
  setSelectedModel: Dispatch<SetStateAction<string>>;
  setMessages: Dispatch<SetStateAction<OllamaMessage[]>>;
  chatSettings: ChatSettingsData;
  setChatSettings: Dispatch<SetStateAction<ChatSettingsData>>;
  messages: OllamaMessage[];
}

/**
 * Hook pour gérer toute la logique liée aux personas
 * Sélection, application, génération de message de bienvenue
 */
export function useChatPersona({
  personas,
  getCurrentConversation,
  currentConversationId,
  updateConversation,
  createConversation,
  selectedModel,
  setSelectedModel,
  setMessages,
  chatSettings,
  setChatSettings,
  messages,
}: UseChatPersonaParams) {
  // Obtenir le persona actuel de la conversation
  const currentPersona = useMemo(() => {
    const currentConv = getCurrentConversation();
    if (!currentConv?.personaId) return null;
    return personas.find((p) => p.id === currentConv.personaId) || null;
  }, [getCurrentConversation, personas, currentConversationId]);

  // Générer un message de bienvenue du persona
  const generatePersonaWelcomeMessage = async (persona: Persona, includeFewShots: boolean, model: string) => {
    try {
      console.log('[useChatPersona] 💬 Génération du message de bienvenue du persona');

      // Construire le prompt système pour le persona
      let systemPrompt = persona.systemPrompt;

      if (includeFewShots && persona.fewShotExamples?.length) {
        const fewShotsText = persona.fewShotExamples
          .map((example) => `Utilisateur: ${example.input}\nAssistant: ${example.output}`)
          .join('\n\n');
        systemPrompt += '\n\nExemples:\n' + fewShotsText;
      }

      // Message demandant à l'IA de se présenter
      const welcomePrompt: OllamaMessage = {
        role: 'user',
        content: 'Bonjour ! Peux-tu te présenter brièvement et m\'expliquer comment tu peux m\'aider ?',
      };

      const messagesToSend: OllamaMessage[] = [
        {
          role: 'system',
          content: systemPrompt,
        },
        welcomePrompt,
      ];

      // Ajouter le message utilisateur à l'historique
      setMessages([welcomePrompt]);

      // Envoyer la requête de chat avec streaming
      await window.electronAPI.ollama.chatStream({
        model,
        messages: messagesToSend,
        stream: true,
        options: {
          temperature: persona.temperature ?? chatSettings.temperature,
          num_ctx: persona.maxTokens ?? chatSettings.maxTokens,
          top_p: chatSettings.topP,
        },
      });

      console.log('[useChatPersona] ✅ Message de bienvenue généré');
    } catch (error: any) {
      console.error('[useChatPersona] ❌ Erreur génération message de bienvenue:', error);

      const errorMessage: OllamaMessage = {
        role: 'system',
        content: `❌ Erreur lors de la génération du message de bienvenue: ${error.message || 'Erreur inconnue'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  // Sélectionner un persona pour la conversation
  const handleSelectPersona = async (persona: Persona | null, includeFewShots: boolean) => {
    // Si persona est null, on le retire
    if (!persona) {
      if (currentConversationId) {
        updateConversation(currentConversationId, { personaId: undefined });
        console.log('[useChatPersona] 👤 Persona retiré de la conversation');
      }
      return;
    }

    // Déterminer le modèle à utiliser
    const modelToUse = persona.model || selectedModel;

    // Si pas de modèle sélectionné du tout, demander à l'utilisateur
    if (!modelToUse) {
      alert('Veuillez d\'abord sélectionner un modèle');
      return;
    }

    // Vérifier si le persona utilise un modèle différent
    if (persona.model && persona.model !== selectedModel) {
      const confirmed = confirm(
        `Le persona "${persona.name}" utilise le modèle "${persona.model}".\n\n` +
        `Voulez-vous changer le modèle actuel "${selectedModel || 'aucun'}" vers "${persona.model}" ?`
      );

      if (confirmed) {
        setSelectedModel(persona.model);
        console.log('[useChatPersona] 🔄 Modèle changé:', selectedModel, '→', persona.model);
      }
    } else if (!selectedModel) {
      // Si aucun modèle n'était sélectionné, utiliser celui du persona ou demander
      setSelectedModel(modelToUse);
    }

    // Créer une nouvelle conversation si nécessaire
    let conversationId = currentConversationId;
    const isNewConversation = !conversationId || messages.length === 0;

    if (!conversationId) {
      const newConv = createConversation(modelToUse, `Conversation avec ${persona.name}`);
      conversationId = newConv.id;
      console.log('[useChatPersona] ✨ Nouvelle conversation créée pour le persona:', conversationId);
    }

    // Stocker le persona dans la conversation
    updateConversation(conversationId, { personaId: persona.id });

    // Stocker les préférences few-shots dans chatSettings (temporaire pour cette session)
    setChatSettings(prev => ({
      ...prev,
      includeFewShots,
    }));

    console.log('[useChatPersona] 👤 Persona appliqué:', persona.name, 'Few-shots:', includeFewShots);

    // Si c'est une nouvelle conversation, générer un message de bienvenue
    if (isNewConversation) {
      await generatePersonaWelcomeMessage(persona, includeFewShots, modelToUse);
    }
  };

  return {
    currentPersona,
    handleSelectPersona,
    generatePersonaWelcomeMessage,
  };
}
