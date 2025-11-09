import { useState, useCallback } from 'react';
import type { Annotation, Position } from './types';

/**
 * Hook pour gérer les annotations sur le canvas
 */
export function useAnnotations() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [editingAnnotation, setEditingAnnotation] = useState<string | null>(null);

  // Créer une annotation
  const createAnnotation = useCallback(
    (type: Annotation['type'], position: Position, content = '') => {
      const newAnnotation: Annotation = {
        id: `annotation-${Date.now()}`,
        type,
        position,
        content,
        color: type === 'note' ? '#fef3c7' : type === 'comment' ? '#ddd6fe' : '#93c5fd',
        fontSize: 14,
        createdAt: new Date().toISOString(),
        size: type === 'arrow' ? undefined : { width: 200, height: 100 },
      };

      setAnnotations((prev) => [...prev, newAnnotation]);
      return newAnnotation.id;
    },
    []
  );

  // Supprimer une annotation
  const deleteAnnotation = useCallback((annotationId: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));
  }, []);

  // Mettre à jour une annotation
  const updateAnnotation = useCallback(
    (annotationId: string, updates: Partial<Annotation>) => {
      setAnnotations((prev) =>
        prev.map((annotation) =>
          annotation.id === annotationId ? { ...annotation, ...updates } : annotation
        )
      );
    },
    []
  );

  // Déplacer une annotation
  const moveAnnotation = useCallback((annotationId: string, position: Position) => {
    setAnnotations((prev) =>
      prev.map((annotation) =>
        annotation.id === annotationId ? { ...annotation, position } : annotation
      )
    );
  }, []);

  // Redimensionner une annotation
  const resizeAnnotation = useCallback(
    (annotationId: string, width: number, height: number) => {
      setAnnotations((prev) =>
        prev.map((annotation) =>
          annotation.id === annotationId
            ? { ...annotation, size: { width, height } }
            : annotation
        )
      );
    },
    []
  );

  // Commencer l'édition
  const startEditing = useCallback((annotationId: string) => {
    setEditingAnnotation(annotationId);
  }, []);

  // Arrêter l'édition
  const stopEditing = useCallback(() => {
    setEditingAnnotation(null);
  }, []);

  // Changer la couleur
  const changeColor = useCallback((annotationId: string, color: string) => {
    updateAnnotation(annotationId, { color });
  }, [updateAnnotation]);

  // Définir toutes les annotations
  const setAllAnnotations = useCallback((newAnnotations: Annotation[]) => {
    setAnnotations(newAnnotations);
  }, []);

  return {
    annotations,
    editingAnnotation,
    createAnnotation,
    deleteAnnotation,
    updateAnnotation,
    moveAnnotation,
    resizeAnnotation,
    startEditing,
    stopEditing,
    changeColor,
    setAllAnnotations,
  };
}
