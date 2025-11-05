import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CollapsibleSectionProps {
  label: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  storageKey?: string;
}

export function CollapsibleSection({
  label,
  count,
  defaultOpen = true,
  children,
  storageKey,
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
      <button
        onClick={toggleOpen}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left group"
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

      {/* Contenu du groupe */}
      {isOpen && <div className="mt-1 space-y-1">{children}</div>}
    </div>
  );
}
