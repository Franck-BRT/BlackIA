import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type {
  AppSettings,
  AppModule,
  SettingsSection,
  GeneralSettings,
  AppearanceSettings,
  KeyboardShortcut,
  InterfaceSettings,
} from '@blackia/shared/types';

// Default settings
const defaultSettings: AppSettings = {
  general: {
    theme: 'system',
    language: 'fr',
    autoSave: true,
    notifications: true,
  },
  appearance: {
    fontSize: 'medium',
    density: 'comfortable',
    glassEffect: 'medium',
    enableGlassmorphism: false, // Désactivé par défaut pour meilleures performances
    animations: true,
    accentColor: 'purple',
    borderRadius: 'medium',
    reducedMotion: false,
  },
  keyboardShortcuts: [
    {
      id: 'new-chat',
      action: 'Nouvelle conversation',
      keys: ['Ctrl', 'N'],
      description: 'Créer une nouvelle conversation',
      enabled: true,
    },
    {
      id: 'search',
      action: 'Rechercher',
      keys: ['Ctrl', 'F'],
      description: 'Ouvrir la recherche',
      enabled: true,
    },
    {
      id: 'settings',
      action: 'Paramètres',
      keys: ['Ctrl', ','],
      description: 'Ouvrir les paramètres',
      enabled: true,
    },
  ],
  interface: {
    sectionVisibilityByModule: {
      home: {
        general: true,
        chat: true,
        workflows: true,
        prompts: true,
        personas: true,
        appearance: true,
        interface: true,
        notifications: true,
        keyboardShortcuts: true,
        about: true,
      },
      chat: {
        general: true,
        chat: true,
        workflows: true,
        prompts: true,
        personas: true,
        appearance: true,
        interface: true,
        notifications: true,
        keyboardShortcuts: true,
        about: true,
      },
      workflows: {
        general: true,
        chat: true,
        workflows: true,
        prompts: true,
        personas: true,
        appearance: true,
        interface: true,
        notifications: true,
        keyboardShortcuts: true,
        about: true,
      },
      prompts: {
        general: true,
        chat: true,
        workflows: true,
        prompts: true,
        personas: true,
        appearance: true,
        interface: true,
        notifications: true,
        keyboardShortcuts: true,
        about: true,
      },
      personas: {
        general: true,
        chat: true,
        workflows: true,
        prompts: true,
        personas: true,
        appearance: true,
        interface: true,
        notifications: true,
        keyboardShortcuts: true,
        about: true,
      },
      projects: {
        general: true,
        chat: true,
        workflows: true,
        prompts: true,
        personas: true,
        appearance: true,
        interface: true,
        notifications: true,
        keyboardShortcuts: true,
        about: true,
      },
      logs: {
        general: true,
        chat: true,
        workflows: true,
        prompts: true,
        personas: true,
        appearance: true,
        interface: true,
        notifications: true,
        keyboardShortcuts: true,
        about: true,
      },
      settings: {
        general: true,
        chat: true,
        workflows: true,
        prompts: true,
        personas: true,
        appearance: true,
        interface: true,
        notifications: true,
        keyboardShortcuts: true,
        about: true,
      },
    },
  },
};

interface SettingsContextType {
  settings: AppSettings;
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => void;
  updateAppearanceSettings: (settings: Partial<AppearanceSettings>) => void;
  updateKeyboardShortcuts: (shortcuts: KeyboardShortcut[]) => void;
  updateInterfaceSettings: (settings: Partial<InterfaceSettings>) => void;
  updateSectionVisibility: (
    module: AppModule,
    section: SettingsSection,
    visible: boolean
  ) => void;
  getSectionVisibility: (module: AppModule, section: SettingsSection) => boolean;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'blackia-settings';

// Helper pour faire un merge profond des paramètres
function deepMergeSettings(defaults: AppSettings, stored: Partial<AppSettings>): AppSettings {
  const result = { ...defaults };

  // Merge general
  if (stored.general) {
    result.general = { ...defaults.general, ...stored.general };
  }

  // Merge appearance
  if (stored.appearance) {
    result.appearance = { ...defaults.appearance, ...stored.appearance };
  }

  // Merge keyboardShortcuts
  if (stored.keyboardShortcuts) {
    result.keyboardShortcuts = stored.keyboardShortcuts;
  }

  // Merge interface avec un merge profond de sectionVisibilityByModule
  if (stored.interface?.sectionVisibilityByModule) {
    result.interface = {
      sectionVisibilityByModule: { ...defaults.interface.sectionVisibilityByModule },
    };

    // Pour chaque module, merger les sections
    Object.keys(stored.interface.sectionVisibilityByModule).forEach((moduleKey) => {
      const module = moduleKey as AppModule;
      result.interface.sectionVisibilityByModule[module] = {
        ...defaults.interface.sectionVisibilityByModule[module],
        ...stored.interface.sectionVisibilityByModule[module],
      };
    });
  }

  return result;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Load from localStorage on init
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedStored = JSON.parse(stored);
        // Deep merge pour préserver les nouvelles sections ajoutées dans defaultSettings
        return deepMergeSettings(defaultSettings, parsedStored);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    return defaultSettings;
  });

  // Save to localStorage whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings]);

  const updateGeneralSettings = (newSettings: Partial<GeneralSettings>) => {
    setSettings((prev) => ({
      ...prev,
      general: { ...prev.general, ...newSettings },
    }));
  };

  const updateAppearanceSettings = (newSettings: Partial<AppearanceSettings>) => {
    setSettings((prev) => ({
      ...prev,
      appearance: { ...prev.appearance, ...newSettings },
    }));
  };

  const updateKeyboardShortcuts = (shortcuts: KeyboardShortcut[]) => {
    setSettings((prev) => ({
      ...prev,
      keyboardShortcuts: shortcuts,
    }));
  };

  const updateInterfaceSettings = (newSettings: Partial<InterfaceSettings>) => {
    setSettings((prev) => ({
      ...prev,
      interface: { ...prev.interface, ...newSettings },
    }));
  };

  const updateSectionVisibility = (
    module: AppModule,
    section: SettingsSection,
    visible: boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      interface: {
        ...prev.interface,
        sectionVisibilityByModule: {
          ...prev.interface.sectionVisibilityByModule,
          [module]: {
            ...prev.interface.sectionVisibilityByModule[module],
            [section]: visible,
          },
        },
      },
    }));
  };

  const getSectionVisibility = (module: AppModule, section: SettingsSection): boolean => {
    return settings.interface.sectionVisibilityByModule[module]?.[section] ?? true;
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateGeneralSettings,
        updateAppearanceSettings,
        updateKeyboardShortcuts,
        updateInterfaceSettings,
        updateSectionVisibility,
        getSectionVisibility,
        resetSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
