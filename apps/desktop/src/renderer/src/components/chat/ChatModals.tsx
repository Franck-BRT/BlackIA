import React from 'react';
import { ChatSettings, ChatSettingsData } from './ChatSettings';
import { TagModal } from './TagModal';
import { FolderModal } from './FolderModal';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { StatisticsModal } from './StatisticsModal';
import { PersonaSelectionModal } from './PersonaSelectionModal';
import type { Persona } from '../../types/persona';
import type { Folder } from '../../hooks/useConversations';
import type { KeyboardShortcut } from '../../hooks/useKeyboardShortcuts';
import type { Statistics } from '../../hooks/useStatistics';

interface ChatModalsProps {
  // Settings Modal
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  chatSettings: ChatSettingsData;
  updateChatSettings: (settings: ChatSettingsData) => void;

  // Tag Modal
  isTagModalOpen: boolean;
  setIsTagModalOpen: (open: boolean) => void;
  createTag: (name: string, color: string, icon: string) => void;

  // Folder Modal
  isFolderModalOpen: boolean;
  setIsFolderModalOpen: (open: boolean) => void;
  editingFolder: Folder | null;
  setEditingFolder: (folder: Folder | null) => void;
  createFolder: (name: string, color?: string) => void;
  renameFolder: (id: string, name: string) => void;

  // Shortcuts Modal
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (open: boolean) => void;
  keyboardShortcuts: KeyboardShortcut[];

  // Statistics Modal
  isStatisticsModalOpen: boolean;
  setIsStatisticsModalOpen: (open: boolean) => void;
  statistics: Statistics;

  // Persona Modal
  isPersonaModalOpen: boolean;
  setIsPersonaModalOpen: (open: boolean) => void;
  personas: Persona[];
  currentPersona: Persona | null;
  handleSelectPersona: (persona: Persona | null, includeFewShots: boolean) => void;
}

/**
 * Composant regroupant tous les modals du ChatPage
 * Simplifie la structure du composant principal
 */
export function ChatModals({
  isSettingsOpen,
  setIsSettingsOpen,
  chatSettings,
  updateChatSettings,
  isTagModalOpen,
  setIsTagModalOpen,
  createTag,
  isFolderModalOpen,
  setIsFolderModalOpen,
  editingFolder,
  setEditingFolder,
  createFolder,
  renameFolder,
  isShortcutsModalOpen,
  setIsShortcutsModalOpen,
  keyboardShortcuts,
  isStatisticsModalOpen,
  setIsStatisticsModalOpen,
  statistics,
  isPersonaModalOpen,
  setIsPersonaModalOpen,
  personas,
  currentPersona,
  handleSelectPersona,
}: ChatModalsProps) {
  return (
    <>
      {/* Settings Modal */}
      <ChatSettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={chatSettings}
        onSave={updateChatSettings}
      />

      {/* Tag Modal */}
      <TagModal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        onSave={(name, color, icon) => {
          createTag(name, color, icon);
          setIsTagModalOpen(false);
        }}
      />

      {/* Folder Modal */}
      <FolderModal
        isOpen={isFolderModalOpen}
        onClose={() => {
          setIsFolderModalOpen(false);
          setEditingFolder(null);
        }}
        onSave={(name, color) => {
          if (editingFolder) {
            renameFolder(editingFolder.id, name);
          } else {
            createFolder(name, color);
          }
          setIsFolderModalOpen(false);
          setEditingFolder(null);
        }}
        initialName={editingFolder?.name}
        initialColor={editingFolder?.color}
        title={editingFolder ? 'Modifier le dossier' : 'Nouveau dossier'}
      />

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        shortcuts={keyboardShortcuts}
      />

      {/* Statistics Modal */}
      <StatisticsModal
        isOpen={isStatisticsModalOpen}
        onClose={() => setIsStatisticsModalOpen(false)}
        statistics={statistics}
      />

      {/* Persona Selection Modal */}
      <PersonaSelectionModal
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        onSelect={handleSelectPersona}
        personas={personas}
        currentPersonaId={currentPersona?.id}
      />
    </>
  );
}
