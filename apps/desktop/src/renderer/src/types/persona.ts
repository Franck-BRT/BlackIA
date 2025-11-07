/**
 * Types pour les Personas
 * Synchronisés avec le schéma de base de données
 */

/**
 * Few-Shot Example
 * Exemple de conversation pour guider le comportement de la persona
 */
export interface FewShotExample {
  id: string;
  userMessage: string;
  assistantResponse: string;
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;

  // Paramètres IA optionnels
  model?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;

  // Few-Shot Examples
  fewShots?: string; // JSON array of FewShotExample
  fewShotExamples?: FewShotExample[]; // Parsed array (computed from fewShots)

  // Apparence
  avatar: string;
  color: PersonaColor;

  // Organisation
  category?: string | null;
  tags: string;

  // Métadonnées
  isDefault: boolean;
  isFavorite: boolean;
  usageCount: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export type PersonaColor = 'purple' | 'blue' | 'pink' | 'green' | 'orange';

export interface PersonaFormData {
  name: string;
  description: string;
  systemPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  fewShots: FewShotExample[]; // Array of examples in form
  avatar: string;
  color: PersonaColor;
  category?: string;
  tags: string[];
}

export interface CreatePersonaData {
  name: string;
  description: string;
  systemPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  fewShots?: string; // JSON string for storage
  avatar: string;
  color: PersonaColor;
  category?: string;
  tags: string;
  isDefault?: boolean;
  isFavorite?: boolean;
}

export interface UpdatePersonaData {
  name?: string;
  description?: string;
  systemPrompt?: string;
  model?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
  fewShots?: string; // JSON string for storage
  avatar?: string;
  color?: PersonaColor;
  category?: string | null;
  tags?: string;
  isDefault?: boolean;
  isFavorite?: boolean;
}

// Catégories prédéfinies
export const PERSONA_CATEGORIES = [
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

export type PersonaCategory = (typeof PERSONA_CATEGORIES)[number];

// Couleurs disponibles pour les personas
export const PERSONA_COLORS: PersonaColor[] = ['purple', 'blue', 'pink', 'green', 'orange'];

// Mapping couleur -> classe Tailwind
export const PERSONA_COLOR_CLASSES: Record<PersonaColor, string> = {
  purple: 'from-purple-500 to-purple-600',
  blue: 'from-blue-500 to-blue-600',
  pink: 'from-pink-500 to-pink-600',
  green: 'from-green-500 to-green-600',
  orange: 'from-orange-500 to-orange-600',
};

// Emojis suggérés pour les avatars
export const SUGGESTED_AVATARS = [
  '🤖', '🐍', '⚛️', '✍️', '🎓', '🔍', '🎨', '💼',
  '💻', '🎯', '🚀', '⚡', '🎭', '📊', '🔬', '🎪',
  '🦾', '🧠', '💡', '🔮', '🎬', '📚', '🎵', '🎮',
];

// Export type for IPC responses
export interface PersonaIpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
