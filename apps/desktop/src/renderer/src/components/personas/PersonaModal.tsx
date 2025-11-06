import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { PersonaForm } from './PersonaForm';
import type { Persona, PersonaFormData } from '../../types/persona';

interface PersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PersonaFormData) => Promise<void>;
  persona?: Persona | null;
  title: string;
  submitLabel: string;
}

export function PersonaModal({
  isOpen,
  onClose,
  onSubmit,
  persona,
  title,
  submitLabel,
}: PersonaModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Bloquer le scroll du body quand le modal est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (data: PersonaFormData) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('Error submitting persona:', error);
      alert('Erreur lors de la sauvegarde de la persona');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convertir Persona en PersonaFormData pour l'édition
  const initialData: Partial<PersonaFormData> | undefined = persona
    ? {
        name: persona.name,
        description: persona.description,
        systemPrompt: persona.systemPrompt,
        model: persona.model || undefined,
        temperature: persona.temperature || undefined,
        maxTokens: persona.maxTokens || undefined,
        fewShots: persona.fewShots ? JSON.parse(persona.fewShots) : [],
        avatar: persona.avatar,
        color: persona.color as any,
        category: persona.category || undefined,
        tags: JSON.parse(persona.tags || '[]'),
      }
    : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl p-8 m-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:glass-lg transition-all text-muted-foreground hover:text-foreground"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        {isSubmitting ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Sauvegarde en cours...</p>
            </div>
          </div>
        ) : (
          <PersonaForm
            initialData={initialData}
            onSubmit={handleSubmit}
            onCancel={onClose}
            submitLabel={submitLabel}
          />
        )}
      </div>
    </div>
  );
}
