import { useSettings } from '../../contexts/SettingsContext';
import type { AppModule, SettingsSection } from '@blackia/shared/types';
import {
  Home,
  MessageSquare,
  GitBranch,
  FileText,
  Users,
  FolderOpen,
  FileBarChart,
  Settings as SettingsIcon,
} from 'lucide-react';

interface ModuleConfig {
  id: AppModule;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SectionConfig {
  id: SettingsSection;
  label: string;
}

const modules: ModuleConfig[] = [
  { id: 'home', label: 'Accueil', icon: Home },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'workflows', label: 'Workflows', icon: GitBranch },
  { id: 'prompts', label: 'Prompts', icon: FileText },
  { id: 'personas', label: 'Personas', icon: Users },
  { id: 'projects', label: 'Projets', icon: FolderOpen },
  { id: 'logs', label: 'Logs', icon: FileBarChart },
  { id: 'settings', label: 'Paramètres', icon: SettingsIcon },
];

const settingsSections: SectionConfig[] = [
  { id: 'general', label: 'Général' },
  { id: 'chat', label: 'Chat' },
  { id: 'workflows', label: 'Workflows' },
  { id: 'prompts', label: 'Prompts' },
  { id: 'personas', label: 'Personas' },
  { id: 'appearance', label: 'Apparence' },
  { id: 'interface', label: 'Interface' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'keyboardShortcuts', label: 'Raccourcis clavier' },
  { id: 'about', label: 'À propos' },
];

export function InterfaceSection() {
  const { getSectionVisibility, updateSectionVisibility, resetSettings } = useSettings();

  const handleResetInterface = () => {
    if (confirm('Réinitialiser tous les paramètres ? Cette action rechargera l\'application.')) {
      resetSettings();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Interface</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Gérez la visibilité des sections de paramètres selon le module actif
        </p>
      </div>

      <div className="p-4 glass-card rounded-lg bg-accent/50 mb-6">
        <p className="text-xs text-muted-foreground mb-3">
          💡 Configurez quelles sections de paramètres sont visibles lorsque vous
          ouvrez les paramètres depuis chaque module. Les changements prennent effet
          immédiatement.
        </p>
        <p className="text-xs text-blue-400 mb-3">
          🧪 <span className="font-semibold">Pour tester :</span> Utilisez les boutons 'Paramètres' dans chaque module
          (HomePage, ChatPage), ou ajoutez <code className="px-1 py-0.5 bg-black/30 rounded">?from=chat</code> dans l'URL.
        </p>
        <button
          onClick={handleResetInterface}
          className="text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
        >
          🔄 Réinitialiser tous les paramètres
        </button>
      </div>

      <div className="space-y-6">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <div key={module.id} className="glass-card rounded-lg p-5">
              <div className="flex items-center gap-3 mb-4">
                <Icon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-base">{module.label}</h3>
              </div>

              <div className="space-y-3 ml-8">
                {settingsSections.map((section) => {
                  const isVisible = getSectionVisibility(module.id, section.id);
                  return (
                    <div
                      key={section.id}
                      className="flex items-center justify-between"
                    >
                      <label
                        htmlFor={`${module.id}-${section.id}`}
                        className="text-sm text-muted-foreground cursor-pointer"
                      >
                        Section "{section.label}"
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          id={`${module.id}-${section.id}`}
                          type="checkbox"
                          checked={isVisible}
                          onChange={(e) =>
                            updateSectionVisibility(
                              module.id,
                              section.id,
                              e.target.checked
                            )
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-4 glass-card rounded-lg bg-amber-500/10 border border-amber-500/20">
        <p className="text-xs text-amber-600 dark:text-amber-400">
          ⚠️ Attention : Si vous désactivez toutes les sections pour un module, la
          section "Général" restera toujours visible par défaut.
        </p>
      </div>
    </div>
  );
}
