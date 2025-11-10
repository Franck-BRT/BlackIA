/**
 * Types pour les Prompts
 * Synchronisés avec le schéma de base de données
 */

export interface Prompt {
  id: string;
  name: string;
  description: string;
  content: string;

  // Variables
  variables: string; // JSON array of variable names

  // Apparence
  icon: string;
  color: PromptColor;

  // Organisation
  category?: string | null;
  tags: string; // JSON array

  // Persona par défaut
  defaultPersonaId?: string | null;
  defaultIncludeFewShots: boolean;

  // Éditeur
  availableInEditor: boolean; // Si true, le prompt est disponible dans l'éditeur
  editorTitle: string | null; // Titre personnalisé pour l'éditeur (si différent de name)

  // Métadonnées
  isFavorite: boolean;
  usageCount: number;

  // Timestamps
  createdAt: string; // ISO date string from backend
  updatedAt: string; // ISO date string from backend
}

export type PromptColor = 'purple' | 'blue' | 'pink' | 'green' | 'orange';

export interface PromptFormData {
  name: string;
  description: string;
  content: string;
  variables: string[]; // Array of variable names in form
  icon: string;
  color: PromptColor;
  category?: string;
  tags: string[];
  defaultPersonaId?: string;
  defaultIncludeFewShots: boolean;
  availableInEditor: boolean;
  editorTitle?: string;
}

export interface CreatePromptData {
  name: string;
  description: string;
  content: string;
  variables: string; // JSON string for storage
  icon: string;
  color: PromptColor;
  category?: string;
  tags: string; // JSON string
  defaultPersonaId?: string;
  defaultIncludeFewShots: boolean;
  availableInEditor?: boolean;
  editorTitle?: string;
  isFavorite?: boolean;
}

export interface UpdatePromptData {
  name?: string;
  description?: string;
  content?: string;
  variables?: string;
  icon?: string;
  color?: PromptColor;
  category?: string | null;
  tags?: string;
  defaultPersonaId?: string | null;
  defaultIncludeFewShots?: boolean;
  availableInEditor?: boolean;
  editorTitle?: string | null;
  isFavorite?: boolean;
}

// Catégories prédéfinies (mêmes que les personas)
export const PROMPT_CATEGORIES = [
  'Général',
  'Développement',
  'Écriture',
  'Analyse',
  'Enseignement',
  'Créatif',
  'Business',
  'Marketing',
  'Science',
  'Autre',
] as const;

export type PromptCategory = (typeof PROMPT_CATEGORIES)[number];

// Couleurs disponibles pour les prompts
export const PROMPT_COLORS: PromptColor[] = ['purple', 'blue', 'pink', 'green', 'orange'];

// Mapping couleur -> classe Tailwind
export const PROMPT_COLOR_CLASSES: Record<PromptColor, string> = {
  purple: 'from-purple-500 to-purple-600',
  blue: 'from-blue-500 to-blue-600',
  pink: 'from-pink-500 to-pink-600',
  green: 'from-green-500 to-green-600',
  orange: 'from-orange-500 to-orange-600',
};

// Emojis suggérés pour les icônes de prompts
export const SUGGESTED_PROMPT_ICONS = [
  '📝', '✍️', '💡', '🎯', '🚀', '⚡', '🔥', '💎',
  '🎨', '🔧', '📊', '📈', '🎓', '💻', '🌟', '✨',
  '🎭', '🔍', '📚', '🎪', '🎬', '🎵', '🎮', '🎲',
];

// Export type for IPC responses
export interface PromptIpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Extrait les variables d'un contenu de prompt
 * Variables au format {{nom_variable}}
 */
export function extractVariables(content: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g;
  const variables = new Set<string>();
  let match;

  while ((match = regex.exec(content)) !== null) {
    variables.add(match[1].trim());
  }

  return Array.from(variables);
}

/**
 * Remplace les variables dans un prompt
 */
export function replaceVariables(
  content: string,
  values: Record<string, string>
): string {
  let result = content;

  Object.entries(values).forEach(([key, value]) => {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(regex, value);
  });

  return result;
}

/**
 * Vérifie si un prompt contient des variables non renseignées
 */
export function hasUnfilledVariables(
  content: string,
  values: Record<string, string>
): boolean {
  const variables = extractVariables(content);
  return variables.some((v) => !values[v] || values[v].trim() === '');
}
