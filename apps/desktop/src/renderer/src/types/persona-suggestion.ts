/**
 * Types pour le système de suggestions intelligentes de personas
 */

// Réexporter les types et constantes partagées
export { DEFAULT_KEYWORDS, type DefaultKeywordData } from '../../../shared/default-keywords';

export interface PersonaSuggestionKeyword {
  id: string;
  keyword: string;
  categories: string; // JSON array
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonaSuggestionKeywordParsed {
  id: string;
  keyword: string;
  categories: string[]; // Parsed array
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePersonaSuggestionKeywordData {
  keyword: string;
  categories: string[];
  isActive?: boolean;
  isDefault?: boolean;
}

export interface UpdatePersonaSuggestionKeywordData {
  keyword?: string;
  categories?: string[];
  isActive?: boolean;
}

/**
 * Configuration des suggestions de personas
 */
export interface PersonaSuggestionSettings {
  enabled: boolean; // Activer/désactiver les suggestions
  maxSuggestions: number; // Nombre maximum de suggestions à afficher
  minCharacters: number; // Nombre minimum de caractères avant de suggérer
  showOnlyActive: boolean; // Ne montrer que les keywords actifs
}

/**
 * Valeurs par défaut
 */
export const DEFAULT_SUGGESTION_SETTINGS: PersonaSuggestionSettings = {
  enabled: true,
  maxSuggestions: 3,
  minCharacters: 10,
  showOnlyActive: true,
};

export interface PersonaSuggestionIpcResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
