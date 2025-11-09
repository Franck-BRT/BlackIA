import { useState, useEffect } from 'react';
import { List, X } from 'lucide-react';

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface DocumentationTOCProps {
  content: string;
  onClose: () => void;
}

/**
 * Table of Contents automatique
 * Extrait les headings du markdown et génère une navigation
 */
export function DocumentationTOC({ content, onClose }: DocumentationTOCProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    extractHeadings();
  }, [content]);

  /**
   * Extraire les headings du markdown
   */
  const extractHeadings = () => {
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const matches = [...content.matchAll(headingRegex)];

    const extractedHeadings: Heading[] = matches.map((match) => {
      const level = match[1].length; // Nombre de #
      const text = match[2].trim();
      const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');

      return { id, text, level };
    });

    setHeadings(extractedHeadings);
  };

  /**
   * Naviguer vers un heading
   */
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  /**
   * Obtenir le padding basé sur le niveau
   */
  const getPaddingLeft = (level: number) => {
    return `${(level - 1) * 12}px`;
  };

  if (headings.length === 0) {
    return null;
  }

  return (
    <aside className="w-64 border-l border-white/10 bg-background/30 backdrop-blur-xl overflow-auto">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <List size={18} className="text-purple-400" />
            <h3 className="font-semibold text-white text-sm">Sur cette page</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
            title="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* TOC List */}
        <nav className="space-y-1">
          {headings.map((heading, index) => (
            <button
              key={`${heading.id}-${index}`}
              onClick={() => scrollToHeading(heading.id)}
              className={`
                w-full text-left py-2 px-2 rounded text-sm transition-colors
                ${activeId === heading.id ? 'text-purple-400 bg-purple-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}
              `}
              style={{ paddingLeft: getPaddingLeft(heading.level) }}
              title={heading.text}
            >
              <span className="line-clamp-2">{heading.text}</span>
            </button>
          ))}
        </nav>

        {/* Scroll hint */}
        {headings.length > 10 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-muted-foreground text-center">
              {headings.length} sections
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
