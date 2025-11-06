import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type {
  AppSettings,
  AppModule,
  SettingsSection,
  GeneralSettings,
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
        keyboardShortcuts: true,
        interface: true,
        about: true,
      },
      chat: {
        general: true,
        keyboardShortcuts: true,
        interface: true,
        about: true,
      },
      workflows: {
        general: true,
        keyboardShortcuts: true,
        interface: true,
        about: true,
      },
      prompts: {
        general: true,
        keyboardShortcuts: true,
        interface: true,
        about: true,
      },
      personas: {
        general: true,
        keyboardShortcuts: true,
        interface: true,
        about: true,
      },
      projects: {
        general: true,
        keyboardShortcuts: true,
        interface: true,
        about: true,
      },
      logs: {
        general: true,
        keyboardShortcuts: true,
        interface: true,
        about: true,
      },
      settings: {
        general: true,
        keyboardShortcuts: true,
        interface: true,
        about: true,
      },
    },
  },
};

interface SettingsContextType {
  settings: AppSettings;
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => void;
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

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Load from localStorage on init
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) };
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
