import { useState, useEffect } from 'react';

/**
 * Breakpoints Tailwind par défaut
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Type pour les tailles d'écran
 */
export type ScreenSize = 'mobile' | 'tablet' | 'desktop' | 'wide';

/**
 * Hook pour gérer le responsive design
 * Détecte la taille de l'écran et fournit des helpers
 */
export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Détection des breakpoints
  const isMobile = windowSize.width < BREAKPOINTS.md; // < 768px
  const isTablet = windowSize.width >= BREAKPOINTS.md && windowSize.width < BREAKPOINTS.lg; // 768px - 1023px
  const isDesktop = windowSize.width >= BREAKPOINTS.lg && windowSize.width < BREAKPOINTS.xl; // 1024px - 1279px
  const isWide = windowSize.width >= BREAKPOINTS.xl; // >= 1280px

  // Taille d'écran simplifiée
  const screenSize: ScreenSize = isMobile
    ? 'mobile'
    : isTablet
    ? 'tablet'
    : isDesktop
    ? 'desktop'
    : 'wide';

  // Helpers pour les queries media
  const isAbove = (breakpoint: Breakpoint) => windowSize.width >= BREAKPOINTS[breakpoint];
  const isBelow = (breakpoint: Breakpoint) => windowSize.width < BREAKPOINTS[breakpoint];
  const isBetween = (min: Breakpoint, max: Breakpoint) =>
    windowSize.width >= BREAKPOINTS[min] && windowSize.width < BREAKPOINTS[max];

  // Orientation
  const isLandscape = windowSize.width > windowSize.height;
  const isPortrait = windowSize.width <= windowSize.height;

  // Tailles adaptatives
  const sidebarWidth = isMobile ? 0 : isTablet ? 200 : 256; // 0, 200px ou 256px
  const chatSidebarWidth = isMobile ? 0 : isTablet ? 240 : 320; // 0, 240px ou 320px

  return {
    // Dimensions
    windowSize,
    width: windowSize.width,
    height: windowSize.height,

    // Breakpoints
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    screenSize,

    // Orientation
    isLandscape,
    isPortrait,

    // Helpers
    isAbove,
    isBelow,
    isBetween,

    // Tailles adaptatives
    sidebarWidth,
    chatSidebarWidth,
  };
}
