import { useState, useCallback, useRef } from 'react';

/**
 * Hook pour gérer l'historique Undo/Redo
 */

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useHistory<T>(initialState: T) {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  // Pour éviter d'ajouter des états identiques
  const lastSavedState = useRef<string>(JSON.stringify(initialState));

  const setState = useCallback((newState: T, skipHistory = false) => {
    const newStateStr = JSON.stringify(newState);

    // Si c'est le même état, on ne fait rien
    if (newStateStr === lastSavedState.current && !skipHistory) {
      return;
    }

    lastSavedState.current = newStateStr;

    setHistory((current) => {
      if (skipHistory) {
        // Remplacer le présent sans ajouter à l'historique
        return {
          ...current,
          present: newState,
        };
      }

      return {
        past: [...current.past, current.present],
        present: newState,
        future: [],
      };
    });
  }, []);

  const undo = useCallback(() => {
    setHistory((current) => {
      if (current.past.length === 0) return current;

      const previous = current.past[current.past.length - 1];
      const newPast = current.past.slice(0, current.past.length - 1);

      lastSavedState.current = JSON.stringify(previous);

      return {
        past: newPast,
        present: previous,
        future: [current.present, ...current.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => {
      if (current.future.length === 0) return current;

      const next = current.future[0];
      const newFuture = current.future.slice(1);

      lastSavedState.current = JSON.stringify(next);

      return {
        past: [...current.past, current.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((newState: T) => {
    lastSavedState.current = JSON.stringify(newState);
    setHistory({
      past: [],
      present: newState,
      future: [],
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return {
    state: history.present,
    setState,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
  };
}
