/**
 * Catégories prédéfinies pour les templates de workflows
 * Chaque catégorie a une icône emoji et une couleur pour l'affichage
 */

export interface TemplateCategory {
  value: string;
  label: string;
  icon: string;
  color: string;
  description: string;
}

/**
 * Liste des catégories prédéfinies
 */
export const templateCategories: TemplateCategory[] = [
  {
    value: 'ai',
    label: 'Intelligence Artificielle',
    icon: '🤖',
    color: '#8b5cf6',
    description: 'Workflows utilisant des modèles IA pour la génération de contenu',
  },
  {
    value: 'data',
    label: 'Données & Analyse',
    icon: '📊',
    color: '#3b82f6',
    description: 'Traitement et analyse de données, CSV, JSON',
  },
  {
    value: 'content',
    label: 'Création de contenu',
    icon: '✍️',
    color: '#ec4899',
    description: 'Génération de contenu marketing, articles, posts',
  },
  {
    value: 'productivity',
    label: 'Productivité',
    icon: '⚡',
    color: '#f59e0b',
    description: 'Workflows pour améliorer la productivité quotidienne',
  },
  {
    value: 'translation',
    label: 'Traduction',
    icon: '🌐',
    color: '#10b981',
    description: 'Traduction et localisation multilingue',
  },
  {
    value: 'automation',
    label: 'Automatisation',
    icon: '🔄',
    color: '#06b6d4',
    description: 'Workflows d\'automatisation de tâches répétitives',
  },
  {
    value: 'integration',
    label: 'Intégration',
    icon: '🔗',
    color: '#6366f1',
    description: 'Connexion avec des APIs et services externes',
  },
  {
    value: 'general',
    label: 'Général',
    icon: '📁',
    color: '#64748b',
    description: 'Templates génériques et polyvalents',
  },
];

/**
 * Obtenir une catégorie par sa valeur
 */
export function getCategoryByValue(value: string): TemplateCategory | undefined {
  return templateCategories.find((cat) => cat.value === value);
}

/**
 * Obtenir l'icône d'une catégorie
 */
export function getCategoryIcon(value: string): string {
  const category = getCategoryByValue(value);
  return category?.icon || '📁';
}

/**
 * Obtenir le label d'une catégorie
 */
export function getCategoryLabel(value: string): string {
  const category = getCategoryByValue(value);
  return category?.label || value;
}

/**
 * Obtenir la couleur d'une catégorie
 */
export function getCategoryColor(value: string): string {
  const category = getCategoryByValue(value);
  return category?.color || '#64748b';
}
