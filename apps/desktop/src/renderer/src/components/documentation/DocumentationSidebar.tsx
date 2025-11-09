import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, BookOpen } from 'lucide-react';
import type { Documentation } from '../../../../main/database/schema';

interface DocTree {
  doc: Documentation;
  children: DocTree[];
}

interface DocumentationSidebarProps {
  currentSlug?: string;
  onNavigate: (slug: string) => void;
}

/**
 * Catégories de documentation avec icônes
 */
const DOC_CATEGORIES = {
  guide: { icon: '📖', label: 'Guide Utilisateur', color: 'text-blue-400' },
  features: { icon: '✨', label: 'Fonctionnalités', color: 'text-purple-400' },
  roadmap: { icon: '🗺️', label: 'Roadmap', color: 'text-green-400' },
  api: { icon: '⚙️', label: 'API & Technique', color: 'text-orange-400' },
  faq: { icon: '❓', label: 'FAQ', color: 'text-yellow-400' },
  changelog: { icon: '📝', label: 'Changelog', color: 'text-pink-400' },
} as const;

/**
 * Sidebar de navigation de la documentation
 * Affiche l'arbre hiérarchique des documents par catégorie
 */
export function DocumentationSidebar({ currentSlug, onNavigate }: DocumentationSidebarProps) {
  const [docTree, setDocTree] = useState<DocTree[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [docsByCategory, setDocsByCategory] = useState<Record<string, Documentation[]>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['guide']));

  useEffect(() => {
    loadDocumentation();
  }, []);

  /**
   * Charger la documentation
   */
  const loadDocumentation = async () => {
    try {
      // Charger tous les documents
      const result = await window.electronAPI.documentation.getAll();
      if (result.success) {
        // Organiser par catégorie
        const byCategory: Record<string, Documentation[]> = {};
        result.data.forEach((doc: Documentation) => {
          if (!byCategory[doc.category]) {
            byCategory[doc.category] = [];
          }
          byCategory[doc.category].push(doc);
        });
        setDocsByCategory(byCategory);
      }

      // Charger l'arbre
      const treeResult = await window.electronAPI.documentation.getTree();
      if (treeResult.success) {
        setDocTree(treeResult.data);
      }
    } catch (error) {
      console.error('Failed to load documentation:', error);
    }
  };

  /**
   * Toggle expansion d'un noeud
   */
  const toggleNode = (slug: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(slug)) {
      newExpanded.delete(slug);
    } else {
      newExpanded.add(slug);
    }
    setExpandedNodes(newExpanded);
  };

  /**
   * Toggle expansion d'une catégorie
   */
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  /**
   * Rendre un noeud de l'arbre
   */
  const renderTreeNode = (node: DocTree, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.doc.slug);
    const isCurrent = currentSlug === node.doc.slug;
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.doc.slug}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.doc.slug);
            }
            onNavigate(node.doc.slug);
          }}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors
            ${isCurrent ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-white/5 text-gray-300'}
          `}
          style={{ paddingLeft: `${(level + 1) * 12}px` }}
        >
          {hasChildren && (
            <span className="flex-shrink-0">
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          )}
          {node.doc.icon && <span className="flex-shrink-0">{node.doc.icon}</span>}
          <span className="flex-1 text-left truncate">{node.doc.title}</span>
        </button>

        {hasChildren && isExpanded && (
          <div className="mt-1">
            {node.children.map((child) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  /**
   * Rendre une catégorie
   */
  const renderCategory = (category: string) => {
    const docs = docsByCategory[category] || [];
    if (docs.length === 0) return null;

    const categoryInfo = DOC_CATEGORIES[category as keyof typeof DOC_CATEGORIES];
    if (!categoryInfo) return null;

    const isExpanded = expandedCategories.has(category);

    return (
      <div key={category} className="mb-4">
        <button
          onClick={() => toggleCategory(category)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
        >
          <span className="flex-shrink-0">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
          <span className="text-lg">{categoryInfo.icon}</span>
          <span className={`flex-1 text-left font-semibold ${categoryInfo.color}`}>
            {categoryInfo.label}
          </span>
          <span className="text-xs text-gray-500">{docs.length}</span>
        </button>

        {isExpanded && (
          <div className="mt-2 space-y-1">
            {docs.map((doc) => (
              <button
                key={doc.slug}
                onClick={() => onNavigate(doc.slug)}
                className={`
                  w-full flex items-center gap-2 px-3 py-2 pl-10 rounded-lg text-sm transition-colors
                  ${currentSlug === doc.slug ? 'bg-purple-500/20 text-purple-400' : 'hover:bg-white/5 text-gray-300'}
                `}
              >
                {doc.icon && <span className="flex-shrink-0">{doc.icon}</span>}
                <span className="flex-1 text-left truncate">{doc.title}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className="w-64 border-r border-white/10 bg-background/50 backdrop-blur-xl overflow-auto">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 px-2">
          <BookOpen className="text-purple-400" size={24} />
          <div>
            <h2 className="text-lg font-bold text-white">Documentation</h2>
            <p className="text-xs text-muted-foreground">BlackIA v1.0</p>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-2">
          {Object.keys(DOC_CATEGORIES).map((category) => renderCategory(category))}
        </div>
      </div>
    </aside>
  );
}
