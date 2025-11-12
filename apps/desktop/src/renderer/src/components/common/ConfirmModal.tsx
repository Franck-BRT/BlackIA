/**
 * Confirm Modal
 * Reusable confirmation dialog
 */

import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  confirmVariant = 'danger',
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getConfirmButtonClass = () => {
    const base = 'px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
    switch (confirmVariant) {
      case 'danger':
        return `${base} bg-red-600 hover:bg-red-700 text-white`;
      case 'warning':
        return `${base} bg-yellow-600 hover:bg-yellow-700 text-white`;
      case 'primary':
        return `${base} bg-blue-600 hover:bg-blue-700 text-white`;
      default:
        return `${base} bg-red-600 hover:bg-red-700 text-white`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              confirmVariant === 'danger' ? 'bg-red-900/20' :
              confirmVariant === 'warning' ? 'bg-yellow-900/20' :
              'bg-blue-900/20'
            }`}>
              <AlertTriangle className={`w-5 h-5 ${
                confirmVariant === 'danger' ? 'text-red-400' :
                confirmVariant === 'warning' ? 'text-yellow-400' :
                'text-blue-400'
              }`} />
            </div>
            <h2 className="text-xl font-semibold text-neutral-100">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-neutral-300 leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg transition-colors"
            disabled={loading}
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className={getConfirmButtonClass()}
            disabled={loading}
          >
            {loading ? 'En cours...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
