import React, { useState } from 'react';
import { X } from 'lucide-react';
import { PromptForm } from './PromptForm';
import type { Prompt, PromptFormData } from '../../types/prompt';

interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PromptFormData) => Promise<void>;
  prompt?: Prompt | null;
  title?: string;
  submitLabel?: string;
}

export function PromptModal({
  isOpen,
  onClose,
  onSubmit,
  prompt,
  title = 'Nouveau Prompt',
  submitLabel = 'Créer',
}: PromptModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (data: PromptFormData) => {
    setLoading(true);
    try {
      await onSubmit(data);
      onClose();
    } catch (error) {
      console.error('[PromptModal] Error submitting:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto glass-card rounded-2xl p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:glass-lg transition-all text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Form */}
        <PromptForm
          prompt={prompt}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel={submitLabel}
        />
      </div>
    </div>
  );
}
