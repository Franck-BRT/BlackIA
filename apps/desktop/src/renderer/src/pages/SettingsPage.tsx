import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Settings,
  MessageSquare,
  Workflow,
  FileText,
  User,
  Tag,
  FolderOpen,
  Folder,
  Globe,
  Bell,
  Palette,
  Keyboard,
  Eye,
  Info,
} from 'lucide-react';
import { ChatSettings } from '../components/settings/ChatSettings';
import { TagsSettings } from '../components/settings/TagsSettings';
import { KeyboardShortcutsSettings } from '../components/settings/KeyboardShortcutsSettings';
import { AppearanceSettings } from '../components/settings/AppearanceSettings';
import { InterfaceSection } from '../components/settings/InterfaceSection';
import { PersonaSuggestionsSettings } from '../components/settings/PersonaSuggestionsSettings';
import { CategoriesSettings } from '../components/settings/CategoriesSettings';
import { useConversations } from '../hooks/useConversations';
import { useFolders } from '../hooks/useFolders';
import { useTags } from '../hooks/useTags';
import { usePersonas } from '../hooks/usePersonas';
import { useSettings } from '../contexts/SettingsContext';
import type { AppModule, SettingsSection } from '@blackia/shared/types';

interface NavItem {
  icon: React.ElementType;
  label: string;
  section: SettingsSection;
}

const navItems: NavItem[] = [
  { icon: Settings, label: 'Général', section: 'general' },
  { icon: MessageSquare, label: 'Chat', section: 'chat' },
  { icon: Workflow, label: 'Workflows', section: 'workflows' },
  { icon: FileText, label: 'Prompts', section: 'prompts' },
  { icon: User, label: 'Personas', section: 'personas' },
  { icon: Folder, label: 'Catégories', section: 'categories' },
  { icon: Tag, label: 'Tags', section: 'tags' },
  { icon: Palette, label: 'Apparence', section: 'appearance' },
  { icon: Eye, label: 'Interface', section: 'interface' },
  { icon: Bell, label: 'Notifications', section: 'notifications' },
  { icon: Keyboard, label: 'Raccourcis clavier', section: 'keyboardShortcuts' },
  { icon: Info, label: 'À propos', section: 'about' },
];

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [searchParams] = useSearchParams();
  const { getSectionVisibility } = useSettings();

  // Détecter depuis quel module on vient
  const fromModule = searchParams.get('from') as AppModule | null;

  // Hooks pour la section Chat
  const { conversations } = useConversations();
  const {
    folders,
    renameFolder,
    changeFolderColor,
    deleteFolder,
  } = useFolders();
  const { tags, createTag, updateTag, deleteTag } = useTags();
  const { personas } = usePersonas();

  // Filtrer les sections visibles en fonction du module
  const visibleNavItems = useMemo(() => {
    // Si pas de module spécifié, afficher toutes les sections
    if (!fromModule) {
      return navItems;
    }

    // Filtrer selon les paramètres de visibilité
    return navItems.filter((item) => {
      return getSectionVisibility(fromModule, item.section);
    });
  }, [fromModule, getSectionVisibility]);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sidebar de navigation */}
      <aside className="w-64 border-r border-white/10 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center">
              <Settings className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Paramètres</h1>
              <p className="text-xs text-muted-foreground">
                {fromModule ? `Depuis ${fromModule}` : 'Configuration'}
              </p>
            </div>
          </div>

          {fromModule && (
            <div className="mb-4 p-3 glass-card rounded-lg text-xs">
              <p className="text-blue-400">
                ℹ️ Sections filtrées pour le module <span className="font-semibold">{fromModule}</span>
              </p>
            </div>
          )}

          <nav className="space-y-1">
            {visibleNavItems.map((item) => (
              <button
                key={item.section}
                onClick={() => setActiveSection(item.section)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === item.section
                    ? 'glass-lg text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8">
          {activeSection === 'general' && <GeneralSettings />}
          {activeSection === 'chat' && (
            <ChatSettings
              folders={folders}
              onRenameFolder={renameFolder}
              onChangeFolderColor={changeFolderColor}
              onDeleteFolder={deleteFolder}
              conversations={conversations}
            />
          )}
          {activeSection === 'workflows' && <PlaceholderSection title="Workflows" />}
          {activeSection === 'prompts' && <PlaceholderSection title="Prompts" />}
          {activeSection === 'personas' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Personas</h2>
                <p className="text-muted-foreground">
                  Configuration des personas et de leurs suggestions intelligentes
                </p>
              </div>
              <div className="glass-card rounded-xl p-6">
                <PersonaSuggestionsSettings />
              </div>
            </div>
          )}
          {activeSection === 'categories' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Catégories</h2>
                <p className="text-muted-foreground">
                  Gérez les catégories pour organiser vos personas et mots-clés
                </p>
              </div>
              <div className="glass-card rounded-xl p-6">
                <CategoriesSettings />
              </div>
            </div>
          )}
          {activeSection === 'tags' && (
            <TagsSettings
              tags={tags}
              onCreateTag={createTag}
              onUpdateTag={updateTag}
              onDeleteTag={deleteTag}
              conversations={conversations}
              personas={personas}
            />
          )}
          {activeSection === 'appearance' && <AppearanceSettings />}
          {activeSection === 'interface' && <InterfaceSection />}
          {activeSection === 'notifications' && <PlaceholderSection title="Notifications" />}
          {activeSection === 'keyboardShortcuts' && <KeyboardShortcutsSettings />}
          {activeSection === 'about' && <PlaceholderSection title="À propos" />}
        </div>
      </main>
    </div>
  );
}

// Section Général
function GeneralSettings() {
  const { settings, updateSettings } = useSettings();

  const startupPageOptions: { value: AppModule; label: string }[] = [
    { value: 'home', label: 'Accueil' },
    { value: 'chat', label: 'Chat' },
    { value: 'workflows', label: 'Workflows' },
    { value: 'prompts', label: 'Prompts' },
    { value: 'personas', label: 'Personas' },
    { value: 'projects', label: 'Projets' },
    { value: 'logs', label: 'Logs' },
  ];

  const handleStartupPageChange = (page: AppModule) => {
    updateSettings({
      general: {
        ...settings.general,
        startupPage: page,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Paramètres généraux</h2>
        <p className="text-muted-foreground">
          Configuration générale de l'application BlackIA
        </p>
      </div>

      <div className="glass-card rounded-xl p-6 space-y-6">
        {/* Page de démarrage */}
        <div>
          <h3 className="text-lg font-semibold mb-4">Démarrage</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">
                Page d'ouverture au démarrage
              </label>
              <select
                value={settings.general.startupPage}
                onChange={(e) => handleStartupPageChange(e.target.value as AppModule)}
                className="w-full px-4 py-3 glass-card rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                {startupPageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                Choisissez la page qui s'ouvrira au lancement de l'application
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h3 className="text-lg font-semibold mb-4">Informations</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Version</span>
              <span className="font-medium">0.1.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Développeur</span>
              <span className="font-medium">Black Room Technologies</span>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <h3 className="text-lg font-semibold mb-4">À propos</h3>
          <p className="text-muted-foreground text-sm">
            BlackIA est une suite d'assistant IA développée par Black Room Technologies.
            Elle offre des fonctionnalités avancées de chat, workflows, gestion de prompts
            et personas pour vous aider dans vos tâches quotidiennes.
          </p>
        </div>
      </div>
    </div>
  );
}

// Section placeholder pour les autres sections
function PlaceholderSection({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground">
          Configuration des paramètres {title.toLowerCase()}
        </p>
      </div>

      <div className="glass-card rounded-xl p-12 text-center">
        <div className="w-20 h-20 rounded-2xl glass-lg flex items-center justify-center mx-auto mb-6">
          <Settings className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold mb-2">Section en développement</h3>
        <p className="text-muted-foreground">
          Les paramètres pour {title.toLowerCase()} seront disponibles prochainement.
        </p>
      </div>
    </div>
  );
}
