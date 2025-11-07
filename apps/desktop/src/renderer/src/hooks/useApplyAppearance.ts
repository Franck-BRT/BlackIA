import { useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';

/**
 * Hook qui applique les paramètres d'apparence à l'interface
 * Modifie les variables CSS et les classes du DOM
 */
export function useApplyAppearance() {
  const { settings } = useSettings();
  const { appearance } = settings;

  useEffect(() => {
    const root = document.documentElement;

    // Accent Colors - Définir les couleurs HSL pour chaque thème
    const accentColors = {
      purple: {
        primary: '270 91% 65%', // Purple 500
        primaryForeground: '0 0% 98%',
        ring: '270 91% 65%',
      },
      blue: {
        primary: '217 91% 60%', // Blue 500
        primaryForeground: '0 0% 98%',
        ring: '217 91% 60%',
      },
      pink: {
        primary: '330 81% 60%', // Pink 500
        primaryForeground: '0 0% 98%',
        ring: '330 81% 60%',
      },
      green: {
        primary: '142 71% 45%', // Green 500
        primaryForeground: '0 0% 98%',
        ring: '142 71% 45%',
      },
      orange: {
        primary: '25 95% 53%', // Orange 500
        primaryForeground: '0 0% 98%',
        ring: '25 95% 53%',
      },
    };

    // Appliquer la couleur d'accent
    const colors = accentColors[appearance.accentColor];
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
    root.style.setProperty('--ring', colors.ring);

    // Font Size
    const fontSizes = {
      small: '14px',
      medium: '16px',
      large: '18px',
    };
    root.style.setProperty('font-size', fontSizes[appearance.fontSize]);

    // Border Radius
    const borderRadii = {
      sharp: '0.25rem',
      medium: '0.5rem',
      round: '1rem',
    };
    root.style.setProperty('--radius', borderRadii[appearance.borderRadius]);

    // Density - Modifier les espacements
    const densityClasses = ['density-compact', 'density-comfortable', 'density-spacious'];
    densityClasses.forEach((cls) => root.classList.remove(cls));
    root.classList.add(`density-${appearance.density}`);

    // Glass Effect
    const glassClasses = ['glass-subtle', 'glass-medium', 'glass-intense'];
    glassClasses.forEach((cls) => root.classList.remove(cls));

    // Enable/Disable Glassmorphism
    if (appearance.enableGlassmorphism) {
      root.classList.remove('no-glassmorphism');
      root.classList.add(`glass-${appearance.glassEffect}`);
    } else {
      root.classList.add('no-glassmorphism');
      glassClasses.forEach((cls) => root.classList.remove(cls));
    }

    // Animations
    if (appearance.animations) {
      root.classList.remove('no-animations');
    } else {
      root.classList.add('no-animations');
    }

    // Reduced Motion
    if (appearance.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [appearance]);
}
