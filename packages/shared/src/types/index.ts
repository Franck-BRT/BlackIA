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

export interface WorkflowNode {
  id: string;
  type: 'input' | 'output' | 'aiPrompt' | 'condition' | 'loop' | 'transform';
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: Date;
  updatedAt: Date;
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
  | 'chat'
  | 'workflows'
  | 'prompts'
  | 'personas'
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
}

// Keyboard shortcut
export interface KeyboardShortcut {
  id: string;
  action: string;
  keys: string[];
  description: string;
  enabled: boolean;
}

// Complete settings structure
export interface AppSettings {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  keyboardShortcuts: KeyboardShortcut[];
  interface: InterfaceSettings;
}
