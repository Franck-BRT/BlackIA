import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

/**
 * Table Personas
 * Stocke les personnalités IA personnalisables
 */
export const personas = sqliteTable('personas', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  systemPrompt: text('system_prompt').notNull(),

  // Paramètres IA optionnels
  model: text('model'), // Modèle préféré (llama3, mistral, etc.)
  temperature: real('temperature'), // 0-2
  maxTokens: integer('max_tokens'), // Limite de tokens

  // Apparence
  avatar: text('avatar').notNull(), // Emoji ou icône
  color: text('color').notNull(), // purple, blue, pink, green, orange

  // Organisation
  category: text('category'), // Développement, Écriture, etc.
  tags: text('tags').notNull().default('[]'), // JSON array

  // Métadonnées
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
  usageCount: integer('usage_count').notNull().default(0),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Table Folders
 * Dossiers pour organiser les conversations
 */
export const folders = sqliteTable('folders', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Table Conversations
 * Historique des conversations avec l'IA
 */
export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),

  // Relations
  personaId: text('persona_id').references(() => personas.id, { onDelete: 'set null' }),
  folderId: text('folder_id').references(() => folders.id, { onDelete: 'set null' }),

  // Organisation
  tags: text('tags').notNull().default('[]'), // JSON array
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Table Messages
 * Messages individuels dans les conversations
 */
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id')
    .notNull()
    .references(() => conversations.id, { onDelete: 'cascade' }),

  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text('content').notNull(),

  // Support images (pour futur)
  images: text('images'), // JSON array d'URLs ou base64

  // Timestamp
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Table Persona Suggestion Keywords
 * Mots-clés pour suggérer automatiquement des personas
 */
export const personaSuggestionKeywords = sqliteTable('persona_suggestion_keywords', {
  id: text('id').primaryKey(),
  keyword: text('keyword').notNull(), // Le mot-clé à détecter
  categories: text('categories').notNull(), // JSON array des catégories à suggérer
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false), // Keyword système par défaut
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Table Prompts
 * Bibliothèque de prompts réutilisables avec support de variables
 */
export const prompts = sqliteTable('prompts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  content: text('content').notNull(), // Le texte du prompt avec variables {{variable}}

  // Variables
  variables: text('variables').notNull().default('[]'), // JSON array de noms de variables

  // Apparence
  icon: text('icon').notNull().default('📝'), // Emoji ou icône
  color: text('color').notNull().default('purple'), // purple, blue, pink, green, orange

  // Organisation
  category: text('category'), // Développement, Écriture, etc.
  tags: text('tags').notNull().default('[]'), // JSON array

  // Métadonnées
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
  usageCount: integer('usage_count').notNull().default(0),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Table Workflows
 * Workflows d'automatisation avec éditeur visuel (ReactFlow)
 */
export const workflows = sqliteTable('workflows', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),

  // Données du workflow (ReactFlow)
  nodes: text('nodes').notNull().default('[]'), // JSON array de WorkflowNode
  edges: text('edges').notNull().default('[]'), // JSON array de WorkflowEdge
  groups: text('groups').notNull().default('[]'), // JSON array de NodeGroup
  annotations: text('annotations').notNull().default('[]'), // JSON array de Annotation

  // Apparence
  icon: text('icon').notNull().default('🔄'), // Emoji ou icône
  color: text('color').notNull().default('purple'), // purple, blue, pink, green, orange

  // Organisation
  category: text('category'), // Automation, Data Processing, etc.
  tags: text('tags').notNull().default('[]'), // JSON array

  // Métadonnées
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),
  usageCount: integer('usage_count').notNull().default(0),
  isTemplate: integer('is_template', { mode: 'boolean' }).notNull().default(false), // Template système

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Table WorkflowTemplates
 * Bibliothèque de templates de workflows réutilisables
 */
export const workflowTemplates = sqliteTable('workflow_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),

  // Données du template
  nodes: text('nodes').notNull().default('[]'), // JSON array de WorkflowNode
  edges: text('edges').notNull().default('[]'), // JSON array de WorkflowEdge
  variables: text('variables'), // JSON object de variables par défaut

  // Apparence
  icon: text('icon').notNull().default('📋'),
  thumbnail: text('thumbnail'), // URL ou base64 de l'aperçu

  // Organisation
  category: text('category').notNull(),
  tags: text('tags').notNull().default('[]'), // JSON array

  // Métadonnées
  usageCount: integer('usage_count').notNull().default(0),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Table WorkflowVersions
 * Historique des versions de workflows (Git-like)
 */
export const workflowVersions = sqliteTable('workflow_versions', {
  id: text('id').primaryKey(),
  workflowId: text('workflow_id')
    .notNull()
    .references(() => workflows.id, { onDelete: 'cascade' }),
  version: text('version').notNull(), // v1, v2, v3, etc.
  message: text('message').notNull(), // Message de commit
  author: text('author'),

  // Snapshot complet du workflow à cette version
  nodes: text('nodes').notNull(),
  edges: text('edges').notNull(),
  groups: text('groups').notNull().default('[]'),
  annotations: text('annotations').notNull().default('[]'),
  variables: text('variables'), // JSON object

  // Arbre de versions
  parentId: text('parent_id'), // ID de la version parente

  // Timestamp
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/**
 * Table WorkflowVariables
 * Variables globales et de workflow
 */
export const workflowVariables = sqliteTable('workflow_variables', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  value: text('value').notNull(), // JSON serialized value
  type: text('type', { enum: ['string', 'number', 'boolean', 'object', 'array'] }).notNull(),
  description: text('description'),

  // Scope
  scope: text('scope', { enum: ['workflow', 'global', 'environment'] }).notNull(),
  workflowId: text('workflow_id').references(() => workflows.id, { onDelete: 'cascade' }), // Null si global

  // Sécurité
  encrypted: integer('encrypted', { mode: 'boolean' }).notNull().default(false),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Types inférés pour TypeScript
export type Persona = typeof personas.$inferSelect;
export type NewPersona = typeof personas.$inferInsert;
export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type PersonaSuggestionKeyword = typeof personaSuggestionKeywords.$inferSelect;
export type NewPersonaSuggestionKeyword = typeof personaSuggestionKeywords.$inferInsert;
export type Prompt = typeof prompts.$inferSelect;
export type NewPrompt = typeof prompts.$inferInsert;
export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;
export type WorkflowTemplate = typeof workflowTemplates.$inferSelect;
export type NewWorkflowTemplate = typeof workflowTemplates.$inferInsert;
export type WorkflowVersion = typeof workflowVersions.$inferSelect;
export type NewWorkflowVersion = typeof workflowVersions.$inferInsert;
export type WorkflowVariable = typeof workflowVariables.$inferSelect;
export type NewWorkflowVariable = typeof workflowVariables.$inferInsert;

/**
 * Table Documentation
 * Documentation intégrée à l'application avec recherche full-text
 */
export const documentation = sqliteTable('documentation', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(), // URL-friendly identifier (e.g., 'guide/installation')
  title: text('title').notNull(),
  content: text('content').notNull(), // Markdown content

  // Organisation
  category: text('category', {
    enum: ['guide', 'features', 'roadmap', 'api', 'faq', 'changelog']
  }).notNull(),
  parentSlug: text('parent_slug'), // Pour structure hiérarchique (e.g., 'guide' -> 'guide/installation')
  order: integer('order').notNull().default(0), // Ordre d'affichage dans la navigation

  // Métadonnées
  icon: text('icon'), // Emoji pour l'affichage
  description: text('description'), // Courte description pour la recherche
  tags: text('tags').notNull().default('[]'), // JSON array pour filtrage
  version: text('version'), // Version de doc (e.g., '1.0', '1.1')

  // Visibilité
  published: integer('published', { mode: 'boolean' }).notNull().default(true),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type Documentation = typeof documentation.$inferSelect;
export type NewDocumentation = typeof documentation.$inferInsert;

/**
 * Table: documents
 * Documents généraux créés dans l'éditeur markdown
 * (séparés de la documentation du projet)
 */
export const documents = sqliteTable('documents', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(), // Markdown content

  // Métadonnées
  tags: text('tags').notNull().default('[]'), // JSON array pour filtrage
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
