import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * Type de thème disponible
 */
export type Theme = 'light' | 'dark' | 'auto';

/**
 * Interface du contexte de thème
 */
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: 'light' | 'dark';
}

/**
 * Contexte pour gérer le thème de l'application
 */
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Props du ThemeProvider
 */
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Provider pour le contexte de thème
 * Gère le mode sombre/clair/auto avec détection du thème système
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('auto');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('dark');

  // Détecter le thème système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Fonction pour mettre à jour le thème système
    const updateSystemTheme = (e: MediaQueryList | MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    // Initialiser
    updateSystemTheme(mediaQuery);

    // Écouter les changements
    const handler = (e: MediaQueryListEvent) => updateSystemTheme(e);
    mediaQuery.addEventListener('change', handler);

    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Charger le thème sauvegardé au démarrage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
  }, []);

  // Appliquer le thème effectif au DOM
  useEffect(() => {
    const effectiveTheme = theme === 'auto' ? systemTheme : theme;

    // Ajouter/retirer la classe 'dark' sur l'élément html
    if (effectiveTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Sauvegarder le choix de l'utilisateur
    localStorage.setItem('theme', theme);
  }, [theme, systemTheme]);

  /**
   * Change le thème
   */
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  // Calculer le thème effectif (celui réellement appliqué)
  const effectiveTheme = theme === 'auto' ? systemTheme : theme;

  return (
    <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook pour utiliser le contexte de thème
 * @throws Error si utilisé en dehors du ThemeProvider
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
