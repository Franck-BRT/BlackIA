// Core types for BlackIA

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  title: string;
  personaId?: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export interface Prompt {
  id: string;
  name: string;
  content: string;
  category?: string;
  tags: string[];
  variables: PromptVariable[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptVariable {
  name: string;
  description?: string;
  defaultValue?: string;
  required: boolean;
}

export interface Persona {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  category?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Workflow types (compatible avec ReactFlow)
export type WorkflowNodeType = 'input' | 'output' | 'aiPrompt' | 'condition' | 'loop' | 'transform' | 'switch';

export interface WorkflowNodeData {
  label?: string;
  config?: Record<string, unknown>;
  // Input node
  inputType?: 'text' | 'file' | 'variable';
  inputValue?: string;
  // Output node
  outputType?: 'text' | 'file' | 'variable';
  outputFormat?: string;
  // AI Prompt node
  promptTemplate?: string;
  personaId?: string;
  temperature?: number;
  maxTokens?: number;
  // Condition node
  condition?: string;
  conditionType?: 'equals' | 'contains' | 'greater' | 'less' | 'regex';
  // Loop node
  loopType?: 'forEach' | 'while' | 'count';
  loopCount?: number;
  loopCondition?: string;
  // Transform node
  transformType?: 'extract' | 'format' | 'merge' | 'split';
  transformScript?: string;
}

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: WorkflowNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  animated?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  icon?: string;
  color?: string;
  category?: string;
  tags: string[];
  isFavorite: boolean;
  usageCount: number;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Workflow execution types
export interface WorkflowExecutionResult {
  success: boolean;
  outputs: Record<string, unknown>;
  logs: WorkflowExecutionLog[];
  error?: string;
  duration?: number;
}

export interface WorkflowExecutionLog {
  nodeId: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  data?: Record<string, unknown>;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  path: string;
  language?: string;
  framework?: string;
  createdAt: Date;
  updatedAt: Date;
}

// AI Provider types
export type AIProvider = 'ollama' | 'mlx';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  size?: string;
  capabilities: ('chat' | 'completion' | 'embeddings' | 'vision')[];
}

export interface AIRequest {
  model: string;
  messages?: Message[];
  prompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIResponse {
  content: string;
  model: string;
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  finishReason?: string;
}

// Application modules
export type AppModule =
  | 'home'
  | 'chat'
  | 'workflows'
  | 'prompts'
  | 'personas'
  | 'projects'
  | 'logs'
  | 'settings';

// Settings sections
export type SettingsSection =
  | 'general'
  | 'aiLocal'
  | 'chat'
  | 'workflows'
  | 'prompts'
  | 'personas'
  | 'categories'
  | 'tags'
  | 'appearance'
  | 'interface'
  | 'notifications'
  | 'keyboardShortcuts'
  | 'about';

// Interface settings - visibility management
export interface SectionVisibility {
  [sectionName: string]: boolean;
}

export interface InterfaceSettings {
  sectionVisibilityByModule: {
    [moduleName in AppModule]?: SectionVisibility;
  };
}

// General settings
export interface GeneralSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  autoSave: boolean;
  notifications: boolean;
  startupPage: AppModule;
}

// Appearance settings
export interface AppearanceSettings {
  fontSize: 'small' | 'medium' | 'large';
  density: 'compact' | 'comfortable' | 'spacious';
  glassEffect: 'subtle' | 'medium' | 'intense';
  enableGlassmorphism: boolean; // Active/désactive complètement le glassmorphism
  animations: boolean;
  accentColor: 'purple' | 'blue' | 'pink' | 'green' | 'orange';
  borderRadius: 'sharp' | 'medium' | 'round';
  reducedMotion: boolean;
  cardSize: number; // Taille des cartes en pixels (280-400)
}

// Keyboard shortcut
export interface KeyboardShortcut {
  id: string;
  action: string;
  keys: string[];
  description: string;
  enabled: boolean;
}

// Persona suggestions settings
export interface PersonaSuggestionSettings {
  enabled: boolean; // Activer/désactiver les suggestions
  maxSuggestions: number; // Nombre maximum de suggestions à afficher
  minCharacters: number; // Nombre minimum de caractères avant de suggérer
  showOnlyActive: boolean; // Ne montrer que les keywords actifs
}

// Category definition
export interface PersonaCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Categories settings
export interface CategoriesSettings {
  customCategories: PersonaCategory[]; // Catégories personnalisées
}

// Model capability tags
export type ModelCapability =
  | 'vision'      // Vision multimodale (images)
  | 'embedding'   // Embeddings de texte
  | 'chat'        // Conversation
  | 'code'        // Génération de code
  | 'instruct'    // Instructions
  | 'tools'       // Function calling/Tools
  | 'reasoning'   // Raisonnement avancé
  | 'multimodal'; // Autre multimodal (audio, etc.)

// Ollama settings
export interface OllamaSettings {
  enabled: boolean; // Activer/désactiver Ollama
  baseUrl: string; // URL de base d'Ollama (ex: http://localhost:11434)
  timeout: number; // Timeout des requêtes en ms
  models: string[]; // Liste des modèles disponibles
  defaultModel?: string; // Modèle par défaut
  modelAliases: Record<string, string>; // Noms personnalisés pour les modèles (clé: nom technique, valeur: alias)
  modelTags: Record<string, ModelCapability[]>; // Tags/capacités pour chaque modèle (clé: nom technique, valeur: liste de tags)
}

// Web Search types
export type WebSearchProvider = 'duckduckgo' | 'brave' | 'custom';

export interface WebSearchProviderConfig {
  id: string;
  name: string;
  type: WebSearchProvider;
  enabled: boolean;
  apiKey?: string; // Pour Brave et providers custom
  baseUrl?: string; // Pour providers custom
  description?: string;
}

export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  favicon?: string;
  publishedDate?: string;
  source?: string; // Domain name
}

export interface WebSearchResponse {
  query: string;
  results: WebSearchResult[];
  provider: string;
  timestamp: number;
  cached?: boolean;
}

export interface WebSearchSettings {
  enabled: boolean; // Activer/désactiver la recherche web
  defaultProvider: string; // ID du provider par défaut
  providers: WebSearchProviderConfig[]; // Liste des providers configurés
  maxResults: number; // Nombre maximum de résultats (3-10)
  language: string; // Code langue (fr, en, etc.)
  region: string; // Code région (fr-FR, en-US, etc.)
  safeSearch: boolean; // Recherche sécurisée
  timeout: number; // Timeout des requêtes en ms
  cacheEnabled: boolean; // Activer le cache
  cacheDuration: number; // Durée du cache en ms (défaut: 1h)
  showSources: boolean; // Afficher les sources dans le chat
  sourcesCollapsed: boolean; // Sources repliées par défaut
  includeSnippets: boolean; // Inclure les extraits dans le contexte
  snippetMaxLength: number; // Longueur max des extraits (caractères)
}

// Complete settings structure
export interface AppSettings {
  general: GeneralSettings;
  ollama: OllamaSettings;
  appearance: AppearanceSettings;
  keyboardShortcuts: KeyboardShortcut[];
  interface: InterfaceSettings;
  personaSuggestions: PersonaSuggestionSettings;
  categories: CategoriesSettings;
  webSearch: WebSearchSettings;
}
