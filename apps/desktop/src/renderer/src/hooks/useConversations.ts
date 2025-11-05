import { useState, useEffect, useCallback } from 'react';
import type { OllamaMessage } from '@blackia/ollama';

export interface Conversation {
  id: string;
  title: string;
  messages: OllamaMessage[];
  model: string;
  createdAt: number;
  updatedAt: number;
  folderId?: string | null; // Dossier optionnel
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
  createdAt: number;
}

export interface ConversationGroup {
  label: string;
  conversations: Conversation[];
}

const STORAGE_KEY = 'conversations';
const FOLDERS_STORAGE_KEY = 'folders';
const MAX_CONVERSATIONS = 50; // Limiter le nombre de conversations stockées

/**
 * Groupe les conversations par période
 */
export function groupConversationsByDate(conversations: Conversation[]): ConversationGroup[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000;
  const monthStart = todayStart - 30 * 24 * 60 * 60 * 1000;

  const groups: ConversationGroup[] = [
    { label: "Aujourd'hui", conversations: [] },
    { label: 'Hier', conversations: [] },
    { label: 'Cette semaine', conversations: [] },
    { label: 'Ce mois', conversations: [] },
    { label: 'Plus ancien', conversations: [] },
  ];

  for (const conv of conversations) {
    if (conv.updatedAt >= todayStart) {
      groups[0].conversations.push(conv);
    } else if (conv.updatedAt >= yesterdayStart) {
      groups[1].conversations.push(conv);
    } else if (conv.updatedAt >= weekStart) {
      groups[2].conversations.push(conv);
    } else if (conv.updatedAt >= monthStart) {
      groups[3].conversations.push(conv);
    } else {
      groups[4].conversations.push(conv);
    }
  }

  // Filtrer les groupes vides
  return groups.filter((group) => group.conversations.length > 0);
}

/**
 * Hook pour gérer les conversations avec persistance localStorage
 */
export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Charger les conversations depuis localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Conversation[];
        // Trier par date de mise à jour (plus récent en premier)
        parsed.sort((a, b) => b.updatedAt - a.updatedAt);
        setConversations(parsed);
        console.log('[useConversations] Chargé', parsed.length, 'conversations');
      }
    } catch (error) {
      console.error('[useConversations] Erreur lors du chargement:', error);
    }
  }, []);

  // Sauvegarder les conversations dans localStorage
  const saveToStorage = useCallback((convs: Conversation[]) => {
    try {
      // Limiter le nombre de conversations
      const toSave = convs.slice(0, MAX_CONVERSATIONS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      console.log('[useConversations] Sauvegardé', toSave.length, 'conversations');
    } catch (error) {
      console.error('[useConversations] Erreur lors de la sauvegarde:', error);
    }
  }, []);

  // Créer une nouvelle conversation
  const createConversation = useCallback((model: string, title?: string): Conversation => {
    const now = Date.now();
    const newConv: Conversation = {
      id: `conv-${now}-${Math.random().toString(36).substr(2, 9)}`,
      title: title || 'Nouvelle conversation',
      messages: [],
      model,
      createdAt: now,
      updatedAt: now,
    };

    setConversations((prev) => {
      const updated = [newConv, ...prev];
      saveToStorage(updated);
      return updated;
    });

    setCurrentConversationId(newConv.id);
    console.log('[useConversations] Nouvelle conversation créée:', newConv.id);

    return newConv;
  }, [saveToStorage]);

  // Mettre à jour une conversation
  const updateConversation = useCallback((
    id: string,
    updates: Partial<Omit<Conversation, 'id' | 'createdAt'>>,
    skipSort: boolean = false
  ) => {
    setConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id === id) {
          return {
            ...conv,
            ...updates,
            updatedAt: Date.now(),
          };
        }
        return conv;
      });

      // Re-trier par date de mise à jour seulement si demandé
      if (!skipSort) {
        updated.sort((a, b) => b.updatedAt - a.updatedAt);
      }

      saveToStorage(updated);
      return updated;
    });

    console.log('[useConversations] Conversation mise à jour:', id, 'skipSort:', skipSort);
  }, [saveToStorage]);

  // Supprimer une conversation
  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) => {
      const updated = prev.filter((conv) => conv.id !== id);
      saveToStorage(updated);
      console.log('[useConversations] Conversation supprimée:', id);
      return updated;
    });

    // Si c'est la conversation courante, la désélectionner
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  }, [currentConversationId, saveToStorage]);

  // Charger une conversation
  const loadConversation = useCallback((id: string): Conversation | null => {
    const conv = conversations.find((c) => c.id === id);
    if (conv) {
      setCurrentConversationId(id);
      console.log('[useConversations] Conversation chargée:', id);
      return conv;
    }
    return null;
  }, [conversations]);

  // Obtenir la conversation courante
  const getCurrentConversation = useCallback((): Conversation | null => {
    if (!currentConversationId) return null;
    return conversations.find((c) => c.id === currentConversationId) || null;
  }, [currentConversationId, conversations]);

  // Déplacer une conversation vers un dossier
  const moveToFolder = useCallback((conversationId: string, folderId: string | null) => {
    setConversations((prev) => {
      const updated = prev.map((conv) =>
        conv.id === conversationId ? { ...conv, folderId } : conv
      );
      saveToStorage(updated);
      return updated;
    });

    console.log('[useConversations] Conversation déplacée:', conversationId, '→', folderId);
  }, [saveToStorage]);

  // Générer un titre automatique basé sur le premier message
  const generateTitle = useCallback((messages: OllamaMessage[]): string => {
    if (messages.length === 0) return 'Nouvelle conversation';

    const firstUserMessage = messages.find((m) => m.role === 'user');
    if (!firstUserMessage) return 'Nouvelle conversation';

    // Prendre les 50 premiers caractères du premier message
    const title = firstUserMessage.content.substring(0, 50);
    return title.length < firstUserMessage.content.length ? `${title}...` : title;
  }, []);

  return {
    conversations,
    currentConversationId,
    setCurrentConversationId,
    createConversation,
    updateConversation,
    deleteConversation,
    loadConversation,
    getCurrentConversation,
    generateTitle,
    moveToFolder,
  };
}
