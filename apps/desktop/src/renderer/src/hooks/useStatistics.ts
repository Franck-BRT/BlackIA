import { useMemo } from 'react';
import type { Conversation } from './useConversations';
import type { Persona } from '../types/persona';

export interface PersonaStats {
  personaId: string;
  personaName: string;
  avatar: string;
  usageCount: number; // Nombre total d'utilisations (backend)
  globalUsages: number; // Utilisations en tant que persona global
  mentionUsages: number; // Utilisations via @mention
  messageCount: number; // Nombre de messages générés
  conversationCount: number; // Nombre de conversations utilisant ce persona
}

export interface Statistics {
  // Messages
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  messagesToday: number;
  messagesThisWeek: number;
  messagesThisMonth: number;

  // Conversations
  totalConversations: number;
  conversationsToday: number;
  conversationsThisWeek: number;
  conversationsThisMonth: number;

  // Modèles
  modelUsage: { model: string; count: number; percentage: number }[];
  mostUsedModel: string;

  // Personas
  personaStats: PersonaStats[];
  mostUsedPersona: string | null;
  totalPersonaMessages: number; // Total messages avec un persona
  personaConversationsCount: number; // Conversations avec persona global

  // Activité par jour (7 derniers jours)
  dailyActivity: { date: string; messages: number; conversations: number }[];

  // Activité par semaine (4 dernières semaines)
  weeklyActivity: { week: string; messages: number; conversations: number }[];

  // Moyennes
  averageMessagesPerConversation: number;
  averageConversationsPerDay: number;
}

/**
 * Hook pour calculer les statistiques d'utilisation
 */
export function useStatistics(conversations: Conversation[], personas: Persona[] = []): Statistics {
  return useMemo(() => {
    const now = Date.now();
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
    const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
    const monthStart = todayStart - 30 * 24 * 60 * 60 * 1000;

    // Compter tous les messages
    let totalMessages = 0;
    let userMessages = 0;
    let assistantMessages = 0;
    let messagesToday = 0;
    let messagesThisWeek = 0;
    let messagesThisMonth = 0;

    // Compter les conversations
    let conversationsToday = 0;
    let conversationsThisWeek = 0;
    let conversationsThisMonth = 0;

    // Usage des modèles
    const modelCounts = new Map<string, number>();

    // Usage des personas
    const personaGlobalUsages = new Map<string, number>(); // Conversations avec persona global
    const personaMentionUsages = new Map<string, number>(); // Messages avec @mention
    const personaMessageCounts = new Map<string, number>(); // Nombre de messages générés

    // Activité par jour (7 derniers jours)
    const dailyMessages = new Map<string, number>();
    const dailyConversations = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const date = new Date(todayStart - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyMessages.set(dateStr, 0);
      dailyConversations.set(dateStr, 0);
    }

    // Activité par semaine (4 dernières semaines)
    const weeklyMessages = new Map<string, number>();
    const weeklyConversations = new Map<string, number>();
    for (let i = 0; i < 4; i++) {
      const weekNum = Math.floor((todayStart - i * 7 * 24 * 60 * 60 * 1000 - weekStart) / (7 * 24 * 60 * 60 * 1000));
      const weekStr = `Semaine ${4 - i}`;
      weeklyMessages.set(weekStr, 0);
      weeklyConversations.set(weekStr, 0);
    }

    // Analyser chaque conversation
    for (const conv of conversations) {
      // Compter les conversations par période
      if (conv.createdAt >= todayStart) {
        conversationsToday++;
      }
      if (conv.createdAt >= weekStart) {
        conversationsThisWeek++;
      }
      if (conv.createdAt >= monthStart) {
        conversationsThisMonth++;
      }

      // Activité quotidienne des conversations
      const convDate = new Date(conv.createdAt).toISOString().split('T')[0];
      if (dailyConversations.has(convDate)) {
        dailyConversations.set(convDate, dailyConversations.get(convDate)! + 1);
      }

      // Usage des modèles
      const currentCount = modelCounts.get(conv.model) || 0;
      modelCounts.set(conv.model, currentCount + 1);

      // Stats personas : persona global
      if (conv.personaId) {
        const globalCount = personaGlobalUsages.get(conv.personaId) || 0;
        personaGlobalUsages.set(conv.personaId, globalCount + 1);
      }

      // Analyser les messages
      for (let msgIndex = 0; msgIndex < conv.messages.length; msgIndex++) {
        const msg = conv.messages[msgIndex];
        totalMessages++;

        if (msg.role === 'user') {
          userMessages++;
        } else if (msg.role === 'assistant') {
          assistantMessages++;
        }

        // Stats personas : @mention (depuis les métadonnées)
        const metadata = conv.messageMetadata?.[msgIndex];
        const mentionedPersonaIds = metadata?.personaIds || (metadata?.personaId ? [metadata.personaId] : []);

        if (mentionedPersonaIds.length > 0) {
          // Plusieurs personas mentionnés ou un seul
          mentionedPersonaIds.forEach(personaId => {
            // Incrémenter le compteur de @mention
            const mentionCount = personaMentionUsages.get(personaId) || 0;
            personaMentionUsages.set(personaId, mentionCount + 1);

            // Compter les messages générés avec ce persona
            const msgCount = personaMessageCounts.get(personaId) || 0;
            personaMessageCounts.set(personaId, msgCount + 1);
          });
        } else if (conv.personaId) {
          // Si persona global et pas de @mention, compter comme message du persona global
          const msgCount = personaMessageCounts.get(conv.personaId) || 0;
          personaMessageCounts.set(conv.personaId, msgCount + 1);
        }

        // On utilise updatedAt de la conversation pour estimer la date des messages
        // (plus précis serait de stocker createdAt pour chaque message)
        if (conv.updatedAt >= todayStart) {
          messagesToday++;
        }
        if (conv.updatedAt >= weekStart) {
          messagesThisWeek++;
        }
        if (conv.updatedAt >= monthStart) {
          messagesThisMonth++;
        }

        // Activité quotidienne des messages (estimation)
        const msgDate = new Date(conv.updatedAt).toISOString().split('T')[0];
        if (dailyMessages.has(msgDate)) {
          dailyMessages.set(msgDate, dailyMessages.get(msgDate)! + 1);
        }
      }
    }

    // Calculer les pourcentages d'usage des modèles
    const totalConvs = conversations.length || 1;
    const modelUsage = Array.from(modelCounts.entries())
      .map(([model, count]) => ({
        model,
        count,
        percentage: Math.round((count / totalConvs) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    const mostUsedModel = modelUsage[0]?.model || 'Aucun';

    // Préparer les données d'activité quotidienne (inverser pour afficher du plus ancien au plus récent)
    const dailyActivity = Array.from(dailyMessages.entries())
      .map(([date, messages]) => ({
        date: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }),
        messages,
        conversations: dailyConversations.get(date) || 0,
      }))
      .reverse();

    // Préparer les données d'activité hebdomadaire
    const weeklyActivity = Array.from(weeklyMessages.entries())
      .map(([week, messages]) => ({
        week,
        messages,
        conversations: weeklyConversations.get(week) || 0,
      }));

    // Calculer les moyennes
    const averageMessagesPerConversation = conversations.length > 0
      ? Math.round(totalMessages / conversations.length)
      : 0;

    // Moyenne de conversations par jour (sur les 30 derniers jours)
    const daysWithData = Math.max(1, Math.floor((now - (conversations[conversations.length - 1]?.createdAt || now)) / (24 * 60 * 60 * 1000)));
    const averageConversationsPerDay = conversations.length > 0
      ? Math.round((conversations.length / Math.min(daysWithData, 30)) * 10) / 10
      : 0;

    // Calculer les stats des personas
    const allPersonaIds = new Set([
      ...personaGlobalUsages.keys(),
      ...personaMentionUsages.keys(),
      ...personaMessageCounts.keys(),
    ]);

    const personaStats: PersonaStats[] = Array.from(allPersonaIds).map((personaId) => {
      const persona = personas.find((p) => p.id === personaId);
      return {
        personaId,
        personaName: persona?.name || 'Inconnu',
        avatar: persona?.avatar || '❓',
        usageCount: persona?.usageCount || 0,
        globalUsages: personaGlobalUsages.get(personaId) || 0,
        mentionUsages: personaMentionUsages.get(personaId) || 0,
        messageCount: personaMessageCounts.get(personaId) || 0,
        conversationCount: personaGlobalUsages.get(personaId) || 0,
      };
    }).sort((a, b) => b.usageCount - a.usageCount); // Trier par usage décroissant

    const mostUsedPersona = personaStats[0]?.personaName || null;
    const totalPersonaMessages = Array.from(personaMessageCounts.values()).reduce((sum, count) => sum + count, 0);
    const personaConversationsCount = Array.from(personaGlobalUsages.values()).reduce((sum, count) => sum + count, 0);

    return {
      totalMessages,
      userMessages,
      assistantMessages,
      messagesToday,
      messagesThisWeek,
      messagesThisMonth,
      totalConversations: conversations.length,
      conversationsToday,
      conversationsThisWeek,
      conversationsThisMonth,
      modelUsage,
      mostUsedModel,
      dailyActivity,
      weeklyActivity,
      averageMessagesPerConversation,
      averageConversationsPerDay,
      personaStats,
      mostUsedPersona,
      totalPersonaMessages,
      personaConversationsCount,
    };
  }, [conversations, personas]);
}
