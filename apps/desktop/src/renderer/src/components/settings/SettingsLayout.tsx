import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import type { SettingsSection, AppModule } from '@blackia/shared/types';
import { useSettings } from '../../contexts/SettingsContext';
import { Settings, Keyboard, Layout, Info } from 'lucide-react';

interface SettingsLayoutProps {
  children: (activeSection: SettingsSection) => React.ReactNode;
}

interface SectionTab {
  id: SettingsSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const sections: SectionTab[] = [
  { id: 'general', label: 'Général', icon: Settings },
  { id: 'keyboardShortcuts', label: 'Raccourcis clavier', icon: Keyboard },
  { id: 'interface', label: 'Interface', icon: Layout },
  { id: 'about', label: 'À propos', icon: Info },
];

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const { getSectionVisibility } = useSettings();
  const location = useLocation();

  // Determine current module from location
  const getCurrentModule = (): AppModule => {
    const path = location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/chat')) return 'chat';
    if (path.startsWith('/workflows')) return 'workflows';
    if (path.startsWith('/prompts')) return 'prompts';
    if (path.startsWith('/personas')) return 'personas';
    if (path.startsWith('/projects')) return 'projects';
    if (path.startsWith('/logs')) return 'logs';
    return 'settings';
  };

  const currentModule = getCurrentModule();

  // When in settings page, show all sections (no filtering)
  // Otherwise, filter visible sections based on current module
  const visibleSections =
    currentModule === 'settings'
      ? sections
      : sections.filter((section) => getSectionVisibility(currentModule, section.id));

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Paramètres</h1>
          <p className="text-muted-foreground">
            Configurez votre application BlackIA
          </p>
        </div>

        <div className="flex gap-6">
          {/* Sidebar navigation */}
          <aside className="w-64 shrink-0">
            <nav className="glass-card rounded-xl p-2 space-y-1">
              {visibleSections.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="glass-card rounded-xl p-6">{children(activeSection)}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
