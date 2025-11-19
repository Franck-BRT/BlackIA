/**
 * Hook for creating resizable panels with drag handle
 */

import { useState, useCallback, useEffect, useRef } from 'react';

interface UseResizableOptions {
  initialWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  storageKey?: string; // Pour sauvegarder la largeur dans localStorage
}

export function useResizable(options: UseResizableOptions = {}) {
  const {
    initialWidth = 400,
    minWidth = 200,
    maxWidth = 800,
    storageKey,
  } = options;

  // Charger la largeur depuis localStorage si disponible
  const getStoredWidth = useCallback(() => {
    if (!storageKey) return initialWidth;
    const stored = localStorage.getItem(storageKey);
    return stored ? parseInt(stored, 10) : initialWidth;
  }, [storageKey, initialWidth]);

  const [width, setWidth] = useState(getStoredWidth());
  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  // Sauvegarder dans localStorage quand la largeur change
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, width.toString());
    }
  }, [width, storageKey]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  }, [width]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    const deltaX = e.clientX - startXRef.current;
    // Inverser le delta pour que tirer vers la droite réduise le panneau
    const newWidth = startWidthRef.current - deltaX;

    // Appliquer les limites min/max
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
    setWidth(clampedWidth);
  }, [isResizing, minWidth, maxWidth]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  // Ajouter/retirer les event listeners globaux
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      // Empêcher la sélection de texte pendant le drag
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return {
    width,
    isResizing,
    handleMouseDown,
  };
}
