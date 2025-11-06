import { useMemo } from 'react';
import type { Conversation } from './useConversations';

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
export function useStatistics(conversations: Conversation[]): Statistics {
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

      // Analyser les messages
      for (const msg of conv.messages) {
        totalMessages++;

        if (msg.role === 'user') {
          userMessages++;
        } else if (msg.role === 'assistant') {
          assistantMessages++;
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
    };
  }, [conversations]);
}
