import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Edit2, Trash2 } from 'lucide-react';

interface CollapsibleSectionProps {
  label: string | React.ReactNode;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  storageKey?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function CollapsibleSection({
  label,
  count,
  defaultOpen = true,
  children,
  storageKey,
  onEdit,
  onDelete,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(() => {
    // Charger l'état depuis localStorage si storageKey est fourni
    if (storageKey) {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : defaultOpen;
    }
    return defaultOpen;
  });

  // Sauvegarder l'état dans localStorage
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(isOpen));
    }
  }, [isOpen, storageKey]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="mb-1">
      {/* Header du groupe */}
      <div className="group/header relative flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
        <button
          onClick={toggleOpen}
          className="flex-1 flex items-center gap-2 text-left"
        >
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex-1">
            {label}
          </span>
          <span className="text-xs text-muted-foreground opacity-60">{count}</span>
        </button>

        {/* Actions (si dossier) */}
        {(onEdit || onDelete) && (
          <div className="flex gap-1 opacity-0 group-hover/header:opacity-100">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1 rounded hover:bg-white/10 transition-colors"
                title="Modifier"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 rounded hover:bg-red-500/20 transition-colors text-red-400"
                title="Supprimer"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Contenu du groupe */}
      {isOpen && <div className="mt-1 space-y-1">{children}</div>}
    </div>
  );
}
