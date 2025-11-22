import React, { RefObject, useState } from 'react';
import { ChatMessage } from './ChatMessage';
import { SourcesList } from './SourcesList';
import { RAGSources } from './RAGSources';
import { ChunkViewModal } from './ChunkViewModal';
import { ToolCallDisplay, ToolCallData } from './ToolCallDisplay';
import type { OllamaMessage } from '@blackia/ollama';
import type { Persona } from '../../types/persona';
import type { MessageMetadata } from '../../hooks/useConversations';
import type { ChatSettingsData } from './ChatSettings';
import type { WebSearchResponse } from '@blackia/shared';
import type { RAGSource } from '../../types/attachment';

interface ChatMessagesProps {
  // Messages
  messages: OllamaMessage[];
  messageMetadata: Record<number, MessageMetadata>;
  streamingMessage: string;
  isGenerating: boolean;
  regenerationCounts: Map<number, number>;

  // Model
  selectedModel: string;

  // Personas
  personas: Persona[];
  currentMentionedPersonaIdsRef: React.MutableRefObject<string[] | undefined>;

  // Search
  chatSearchQuery: string;
  searchResults: {
    totalCount: number;
    messageOccurrences: Array<{ messageIndex: number; startIndex: number; count: number }>;
  };
  currentSearchIndex: number;

  // Settings
  chatSettings: ChatSettingsData;

  // Web Search
  webSearchResults: Record<number, WebSearchResponse>;
  webSearchSettings: { showSources: boolean; sourcesCollapsed: boolean };

  // MCP Tool Calls
  mcpToolCalls?: Record<number, ToolCallData[]>;

  // Handlers
  handleRegenerate: () => void;
  handleEditUserMessage: (content: string) => void;

  // Ref
  messagesEndRef: RefObject<HTMLDivElement>;
}

/**
 * Composant d'affichage des messages du chat
 * Gère l'état vide, la liste des messages, et le streaming
 */
export function ChatMessages({
  messages,
  messageMetadata,
  streamingMessage,
  isGenerating,
  regenerationCounts,
  selectedModel,
  personas,
  currentMentionedPersonaIdsRef,
  chatSearchQuery,
  searchResults,
  currentSearchIndex,
  chatSettings,
  webSearchResults,
  webSearchSettings,
  mcpToolCalls,
  handleRegenerate,
  handleEditUserMessage,
  messagesEndRef,
}: ChatMessagesProps) {
  // State pour la modal de visualisation des chunks
  const [selectedChunk, setSelectedChunk] = useState<RAGSource | null>(null);

  // Si aucun message, afficher l'état vide
  if (messages.length === 0 && !streamingMessage) {
    return (
      <div className="flex-1 overflow-y-auto p-6 relative">
        <div className="h-full flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-2xl font-bold mb-2">Commencez une conversation</h2>
            <p className="text-muted-foreground mb-6">
              Posez une question ou démarrez une discussion avec l'IA
            </p>
            {!selectedModel && (
              <div className="glass-card px-4 py-2 rounded-xl text-sm text-yellow-400 inline-block">
                ⚠️ Sélectionnez d'abord un modèle
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Afficher les messages
  return (
    <div className="flex-1 overflow-y-auto p-6 relative">
      <div className="max-w-4xl xl:max-w-5xl 2xl:max-w-6xl mx-auto">
        {messages.map((message, index) => {
          // Déterminer si c'est le dernier message assistant
          const lastAssistantIndex = messages.findLastIndex((m) => m.role === 'assistant');
          const isLastAssistantMessage = message.role === 'assistant' && index === lastAssistantIndex && !isGenerating;

          // Déterminer si c'est le dernier message utilisateur
          const lastUserIndex = messages.findLastIndex((m) => m.role === 'user');
          const isLastUserMessage = message.role === 'user' && index === lastUserIndex && !isGenerating;

          // Calculer les props de recherche pour ce message
          const messageOccurrence = searchResults.messageOccurrences.find(
            (occ) => occ.messageIndex === index
          );

          // Récupérer les personas mentionnés pour ce message
          const metadata = messageMetadata[index];
          const mentionedPersonas = metadata?.personaIds
            ? metadata.personaIds.map(id => personas.find((p) => p.id === id)).filter((p): p is Persona => p !== undefined)
            : (metadata?.personaId
                ? [personas.find((p) => p.id === metadata.personaId)].filter((p): p is Persona => p !== undefined)
                : undefined);

          const webSearch = webSearchResults[index];
          const shouldShowWebSources = webSearch && webSearchSettings.showSources && message.role === 'assistant';
          const shouldShowRAGSources = metadata?.ragMetadata && message.role === 'assistant';
          const toolCalls = mcpToolCalls?.[index];
          const shouldShowToolCalls = toolCalls && toolCalls.length > 0 && message.role === 'assistant';

          // Debug logging pour RAG
          if (message.role === 'assistant') {
            console.log('[ChatMessages] 🔍 Assistant message debug:', {
              index,
              hasMetadata: !!metadata,
              hasRagMetadata: !!metadata?.ragMetadata,
              ragMetadata: metadata?.ragMetadata,
              shouldShowRAGSources,
            });
          }

          return (
            <React.Fragment key={index}>
              <ChatMessage
                message={message}
                regenerationCount={regenerationCounts.get(index) || 0}
                onRegenerate={isLastAssistantMessage ? handleRegenerate : undefined}
                isLastAssistantMessage={isLastAssistantMessage}
                isLastUserMessage={isLastUserMessage}
                onEdit={isLastUserMessage ? handleEditUserMessage : undefined}
                searchQuery={chatSearchQuery}
                searchStartIndex={messageOccurrence?.startIndex}
                activeGlobalIndex={currentSearchIndex}
                syntaxTheme={chatSettings.syntaxTheme}
                showLineNumbers={chatSettings.showLineNumbers}
                mentionedPersonas={mentionedPersonas}
                attachmentIds={metadata?.attachmentIds}
              />
              {shouldShowRAGSources && (
                <RAGSources
                  metadata={metadata.ragMetadata!}
                  onViewSource={setSelectedChunk}
                />
              )}
              {shouldShowWebSources && (
                <SourcesList
                  results={webSearch.results}
                  query={webSearch.query}
                  provider={webSearch.provider}
                  defaultCollapsed={webSearchSettings.sourcesCollapsed}
                />
              )}
              {shouldShowToolCalls && (
                <div className="max-w-3xl w-full ml-[52px]">
                  <ToolCallDisplay
                    toolCalls={toolCalls}
                    collapsed={true}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Message en cours de streaming */}
        {streamingMessage && (
          <ChatMessage
            message={{
              role: 'assistant',
              content: streamingMessage,
            }}
            isStreaming={true}
            syntaxTheme={chatSettings.syntaxTheme}
            showLineNumbers={chatSettings.showLineNumbers}
            mentionedPersonas={
              currentMentionedPersonaIdsRef.current
                ? currentMentionedPersonaIdsRef.current.map(id => personas.find((p) => p.id === id)).filter((p): p is Persona => p !== undefined)
                : undefined
            }
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Modal pour visualiser un chunk complet */}
      {selectedChunk && (
        <ChunkViewModal
          source={selectedChunk}
          onClose={() => setSelectedChunk(null)}
        />
      )}
    </div>
  );
}
