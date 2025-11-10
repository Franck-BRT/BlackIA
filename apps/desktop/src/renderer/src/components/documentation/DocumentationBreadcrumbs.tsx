import { ChevronRight, Home } from 'lucide-react';
import type { Documentation } from '../../../../main/database/schema';

interface DocumentationBreadcrumbsProps {
  breadcrumbs: Documentation[];
  onNavigate: (slug: string) => void;
}

/**
 * Fil d'ariane (breadcrumbs) pour la navigation hiérarchique
 */
export function DocumentationBreadcrumbs({ breadcrumbs, onNavigate }: DocumentationBreadcrumbsProps) {
  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
      {/* Home */}
      <button
        onClick={() => onNavigate('accueil')}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        title="Accueil"
      >
        <Home size={14} />
      </button>

      {/* Breadcrumb trail */}
      {breadcrumbs.map((doc, index) => {
        const isLast = index === breadcrumbs.length - 1;

        return (
          <div key={doc.slug} className="flex items-center gap-2">
            <ChevronRight size={14} className="text-gray-600" />
            {isLast ? (
              <span className="px-2 py-1 text-white font-medium">
                {doc.icon && <span className="mr-1">{doc.icon}</span>}
                {doc.title}
              </span>
            ) : (
              <button
                onClick={() => onNavigate(doc.slug)}
                className="px-2 py-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                {doc.icon && <span className="mr-1">{doc.icon}</span>}
                {doc.title}
              </button>
            )}
          </div>
        );
      })}
    </nav>
  );
}
