import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type {
  AppSettings,
  AppModule,
  SettingsSection,
  GeneralSettings,
  AppearanceSettings,
  KeyboardShortcut,
  InterfaceSettings,
  PersonaSuggestionSettings,
  CategoriesSettings,
  PersonaCategory,
  OllamaSettings,
} from '@blackia/shared/types';

// Catégories par défaut basées sur PERSONA_CATEGORIES
const DEFAULT_CATEGORIES: PersonaCategory[] = [
  {
    id: 'general',
    name: 'Général',
    description: 'Catégorie générale pour tous types de personas',
    color: 'gray',
    icon: '⚙️',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'development',
    name: 'Développement',
    description: 'Personas spécialisés en développement et programmation',
    color: 'blue',
    icon: '💻',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'writing',
    name: 'Écriture',
    description: 'Personas pour la rédaction et l\'écriture',
    color: 'purple',
    icon: '✍️',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'analysis',
    name: 'Analyse',
    description: 'Personas pour l\'analyse de données et la stratégie',
    color: 'green',
    icon: '📊',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'teaching',
    name: 'Enseignement',
    description: 'Personas pédagogiques pour l\'enseignement',
    color: 'orange',
    icon: '🎓',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'creative',
    name: 'Créatif',
    description: 'Personas créatifs pour le design et l\'art',
    color: 'pink',
    icon: '🎨',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Personas business et entrepreneuriat',
    color: 'indigo',
    icon: '💼',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Personas spécialisés en marketing et communication',
    color: 'red',
    icon: '📢',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'science',
    name: 'Science',
    description: 'Personas scientifiques et techniques',
    color: 'cyan',
    icon: '🔬',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'other',
    name: 'Autre',
    description: 'Autres catégories non classifiées',
    color: 'gray',
    icon: '📁',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Default settings
const defaultSettings: AppSettings = {
  general: {
    theme: 'system',
    language: 'fr',
    autoSave: true,
    notifications: true,
    startupPage: 'home',
  },
  ollama: {
    enabled: false,
    baseUrl: 'http://localhost:11434',
    timeout: 30000,
    models: [],
    defaultModel: undefined,
    modelAliases: {},
    modelTags: {},
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
    cardSize: 320, // Taille par défaut des cartes en pixels
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
        aiLocal: true,
        chat: true,
        workflows: true,
        prompts: true,
        personas: true,
        categories: true,
        tags: true,
        appearance: true,
        interface: true,
        notifications: true,
        keyboardShortcuts: true,
        about: true,
      },
      chat: {
        general: true,
        aiLocal: true,
        chat: true,
        workflows: true,
        prompts: true,
        personas: true,
        categories: true,
        tags: true,
        appearance: true,
        interface: true,
        notifications: true,
        keyboardShortcuts: true,
        about: true,
      },
      workflows: {
        general: true,
        aiLocal: true,
        chat: true,
        workflows: true,
        prompts: true,
        personas: true,
        categories: true,
        tags: true,
        appearance: true,
        interface: true,
        notifications: true,
        keyboardShortcuts: true,
        about: true,
      },
      prompts: {
        general: true,
        aiLocal: true,
        chat: true,
        workflows: true,
        prompts: true,
        personas: true,
        categories: true,
        tags: true,
        appearance: true,
        interface: true,
        notifications: true,
        keyboardShortcuts: true,
        about: true,
      },
      personas: {
        general: true,
        aiLocal: true,
        chat: true,
        workflows: true,
        prompts: true,
        personas: true,
        categories: true,
        tags: true,
        appearance: true,
        interface: true,
        notifications: true,
        keyboardShortcuts: true,
        about: true,
      },
      projects: {
        general: true,
        aiLocal: true,
        chat: true,
        workflows: true,
        prompts: true,
        personas: true,
        categories: true,
        tags: true,
        appearance: true,
        interface: true,
        notifications: true,
        keyboardShortcuts: true,
        about: true,
      },
      logs: {
        general: true,
        aiLocal: true,
        chat: true,
        workflows: true,
        prompts: true,
        personas: true,
        categories: true,
        tags: true,
        appearance: true,
        interface: true,
        notifications: true,
        keyboardShortcuts: true,
        about: true,
      },
      settings: {
        general: true,
        aiLocal: true,
        chat: true,
        workflows: true,
        prompts: true,
        personas: true,
        categories: true,
        tags: true,
        appearance: true,
        interface: true,
        notifications: true,
        keyboardShortcuts: true,
        about: true,
      },
    },
  },
  personaSuggestions: {
    enabled: true,
    maxSuggestions: 3,
    minCharacters: 10,
    showOnlyActive: true,
  },
  categories: {
    customCategories: DEFAULT_CATEGORIES,
  },
};

interface SettingsContextType {
  settings: AppSettings;
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => void;
  updateOllamaSettings: (settings: Partial<OllamaSettings>) => void;
  updateAppearanceSettings: (settings: Partial<AppearanceSettings>) => void;
  updateKeyboardShortcuts: (shortcuts: KeyboardShortcut[]) => void;
  updateInterfaceSettings: (settings: Partial<InterfaceSettings>) => void;
  updatePersonaSuggestionSettings: (settings: Partial<PersonaSuggestionSettings>) => void;
  updateCategoriesSettings: (settings: Partial<CategoriesSettings>) => void;
  addCategory: (category: Omit<PersonaCategory, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCategory: (id: string, updates: Partial<PersonaCategory>) => void;
  deleteCategory: (id: string) => void;
  getAllCategories: () => PersonaCategory[];
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

  // Merge ollama
  if (stored.ollama) {
    result.ollama = { ...defaults.ollama, ...stored.ollama };
  }

  // Merge appearance
  if (stored.appearance) {
    result.appearance = { ...defaults.appearance, ...stored.appearance };

    // Migration: Si enableGlassmorphism n'est pas défini, utiliser le nouveau défaut (false)
    if (stored.appearance.enableGlassmorphism === undefined) {
      result.appearance.enableGlassmorphism = false;
    }
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

  // Merge personaSuggestions
  if (stored.personaSuggestions) {
    result.personaSuggestions = { ...defaults.personaSuggestions, ...stored.personaSuggestions };
  }

  // Merge categories
  if (stored.categories) {
    result.categories = { ...defaults.categories, ...stored.categories };
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

  const updateOllamaSettings = (newSettings: Partial<OllamaSettings>) => {
    setSettings((prev) => ({
      ...prev,
      ollama: { ...prev.ollama, ...newSettings },
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

  const updatePersonaSuggestionSettings = (newSettings: Partial<PersonaSuggestionSettings>) => {
    setSettings((prev) => ({
      ...prev,
      personaSuggestions: { ...prev.personaSuggestions, ...newSettings },
    }));
  };

  const updateCategoriesSettings = (newSettings: Partial<CategoriesSettings>) => {
    setSettings((prev) => ({
      ...prev,
      categories: { ...prev.categories, ...newSettings },
    }));
  };

  const addCategory = (category: Omit<PersonaCategory, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();

    // Générer un ID propre basé sur le nom
    const baseId = category.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
      .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
      .replace(/^-+|-+$/g, ''); // Enlever les tirets au début/fin

    // Ajouter un suffixe court si l'ID existe déjà
    let finalId = baseId;
    let counter = 1;
    while (settings.categories.customCategories.some(cat => cat.id === finalId)) {
      finalId = `${baseId}-${counter}`;
      counter++;
    }

    const newCategory: PersonaCategory = {
      ...category,
      id: finalId,
      createdAt: now,
      updatedAt: now,
    };

    setSettings((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        customCategories: [...prev.categories.customCategories, newCategory],
      },
    }));
  };

  const updateCategory = (id: string, updates: Partial<PersonaCategory>) => {
    setSettings((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        customCategories: prev.categories.customCategories.map((cat) =>
          cat.id === id ? { ...cat, ...updates, updatedAt: new Date() } : cat
        ),
      },
    }));
  };

  const deleteCategory = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      categories: {
        ...prev.categories,
        customCategories: prev.categories.customCategories.filter((cat) => cat.id !== id),
      },
    }));
  };

  const getAllCategories = () => {
    return settings.categories.customCategories;
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
        updateOllamaSettings,
        updateAppearanceSettings,
        updateKeyboardShortcuts,
        updateInterfaceSettings,
        updatePersonaSuggestionSettings,
        updateCategoriesSettings,
        addCategory,
        updateCategory,
        deleteCategory,
        getAllCategories,
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
