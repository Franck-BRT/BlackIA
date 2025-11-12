import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';

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

/**
 * Table Attachments
 * Pièces jointes pour messages, workflows, documents, etc. avec support RAG dual-mode
 */
export const attachments = sqliteTable('attachments', {
  id: text('id').primaryKey(),

  // Métadonnées fichier
  filename: text('filename').notNull(), // Nom unique stocké (UUID-based)
  originalName: text('original_name').notNull(), // Nom original du fichier
  mimeType: text('mime_type').notNull(), // image/png, application/pdf, text/plain, etc.
  size: integer('size').notNull(), // Taille en bytes

  // Chemins (relatifs à userData)
  filePath: text('file_path').notNull(), // Chemin relatif vers le fichier
  thumbnailPath: text('thumbnail_path'), // Miniature pour images (optionnel)

  // Contenu extrait
  extractedText: text('extracted_text'), // Texte extrait (PDF, OCR futur)
  extractedMetadata: text('extracted_metadata'), // JSON (dimensions, pages, auteur, etc.)

  // Relation polymorphique (réutilisable pour n'importe quelle entité)
  entityType: text('entity_type', {
    enum: ['message', 'workflow', 'document', 'persona', 'prompt', 'conversation']
  }).notNull(),
  entityId: text('entity_id').notNull(), // ID de l'entité parente

  // Tags (organisation manuelle)
  tags: text('tags').notNull().default('[]'), // JSON array d'IDs de tags

  // RAG MODE CONFIGURATION
  ragMode: text('rag_mode', {
    enum: ['text', 'vision', 'hybrid', 'none']
  }).notNull().default('text'),

  // TEXT RAG (embeddings textuels via Ollama)
  isIndexedText: integer('is_indexed_text', { mode: 'boolean' }).notNull().default(false),
  textEmbeddingModel: text('text_embedding_model'), // nomic-embed-text, mxbai-embed-large
  textChunkCount: integer('text_chunk_count').notNull().default(0),

  // VISION RAG (embeddings visuels via MLX-VLM)
  isIndexedVision: integer('is_indexed_vision', { mode: 'boolean' }).notNull().default(false),
  visionEmbeddingModel: text('vision_embedding_model'), // qwen2-vl-2b, qwen2-vl-7b, colpali-adapter
  visionPatchCount: integer('vision_patch_count').notNull().default(0), // Nombre de patches (1024 par page)
  pageCount: integer('page_count').notNull().default(0), // Nombre de pages (pour PDF/multi-page)

  // Métadonnées indexation
  lastIndexedAt: integer('last_indexed_at', { mode: 'timestamp' }),
  indexingDuration: integer('indexing_duration'), // Durée en millisecondes
  indexingError: text('indexing_error'), // Message d'erreur si échec

  // Métadonnées générales
  uploadedBy: text('uploaded_by'), // Pour futur multi-user
  isAnalyzed: integer('is_analyzed', { mode: 'boolean' }).notNull().default(false),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Index pour requêtes rapides sur attachments
export const attachmentsEntityIndex = index('attachments_entity_idx').on(
  attachments.entityType,
  attachments.entityId
);

export const attachmentsIndexedTextIndex = index('attachments_indexed_text_idx').on(
  attachments.isIndexedText
);

export const attachmentsIndexedVisionIndex = index('attachments_indexed_vision_idx').on(
  attachments.isIndexedVision
);

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;

/**
 * Table Libraries
 * Bibliothèques de documents avec configuration RAG personnalisée
 */
export const libraries = sqliteTable('libraries', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),

  // Apparence
  color: text('color').notNull().default('blue'), // Comme folders
  icon: text('icon').notNull().default('📚'), // Emoji ou icône

  // Configuration RAG (JSON)
  ragConfig: text('rag_config').notNull().default('{}'), // JSON object avec chunkSize, overlap, models, etc.

  // Stockage
  storagePath: text('storage_path').notNull(), // Chemin personnalisé ou défaut

  // Statistiques (dénormalisé pour performance)
  documentCount: integer('document_count').notNull().default(0),
  totalSize: integer('total_size').notNull().default(0), // bytes
  totalChunks: integer('total_chunks').notNull().default(0),
  totalPatches: integer('total_patches').notNull().default(0),

  // Tags autorisés (filtrage)
  allowedTags: text('allowed_tags').notNull().default('[]'), // JSON array

  // Métadonnées
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Index pour recherche rapide
export const librariesNameIndex = index('libraries_name_idx').on(libraries.name);

export type Library = typeof libraries.$inferSelect;
export type NewLibrary = typeof libraries.$inferInsert;

/**
 * Table LibraryDocuments
 * Documents dans les bibliothèques avec validation RAG
 */
export const libraryDocuments = sqliteTable('library_documents', {
  id: text('id').primaryKey(),
  libraryId: text('library_id')
    .notNull()
    .references(() => libraries.id, { onDelete: 'cascade' }),

  // Métadonnées fichier (similaire à attachments)
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(),

  // Chemins
  filePath: text('file_path').notNull(),
  thumbnailPath: text('thumbnail_path'),

  // Contenu extrait
  extractedText: text('extracted_text'),
  extractedMetadata: text('extracted_metadata'), // JSON

  // Tags
  tags: text('tags').notNull().default('[]'), // JSON array

  // RAG configuration
  ragMode: text('rag_mode', {
    enum: ['text', 'vision', 'hybrid', 'none']
  }).notNull().default('text'),

  // TEXT RAG
  isIndexedText: integer('is_indexed_text', { mode: 'boolean' }).notNull().default(false),
  textEmbeddingModel: text('text_embedding_model'),
  textChunkCount: integer('text_chunk_count').notNull().default(0),

  // VISION RAG
  isIndexedVision: integer('is_indexed_vision', { mode: 'boolean' }).notNull().default(false),
  visionEmbeddingModel: text('vision_embedding_model'),
  visionPatchCount: integer('vision_patch_count').notNull().default(0),
  pageCount: integer('page_count').notNull().default(0),

  // Validation RAG
  validationStatus: text('validation_status', {
    enum: ['pending', 'validated', 'needs_review', 'rejected']
  }).notNull().default('pending'),
  validatedBy: text('validated_by'),
  validatedAt: integer('validated_at', { mode: 'timestamp' }),
  validationNotes: text('validation_notes'),

  // Indexation metadata
  lastIndexedAt: integer('last_indexed_at', { mode: 'timestamp' }),
  indexingDuration: integer('indexing_duration'), // ms
  indexingError: text('indexing_error'),

  // Métadonnées
  uploadedBy: text('uploaded_by'),
  isAnalyzed: integer('is_analyzed', { mode: 'boolean' }).notNull().default(false),
  isFavorite: integer('is_favorite', { mode: 'boolean' }).notNull().default(false),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Index pour requêtes fréquentes
export const libraryDocumentsLibraryIndex = index('library_documents_library_idx').on(
  libraryDocuments.libraryId
);
export const libraryDocumentsValidationIndex = index('library_documents_validation_idx').on(
  libraryDocuments.validationStatus
);
export const libraryDocumentsRagModeIndex = index('library_documents_rag_mode_idx').on(
  libraryDocuments.ragMode
);

export type LibraryDocument = typeof libraryDocuments.$inferSelect;
export type NewLibraryDocument = typeof libraryDocuments.$inferInsert;

/**
 * Table ManualChunks
 * Chunks modifiés manuellement pour améliorer le RAG
 */
export const manualChunks = sqliteTable('manual_chunks', {
  id: text('id').primaryKey(),
  documentId: text('document_id')
    .notNull()
    .references(() => libraryDocuments.id, { onDelete: 'cascade' }),

  // Référence au chunk original
  originalChunkId: text('original_chunk_id').notNull(), // ID du chunk dans LanceDB

  // Contenu modifié
  modifiedText: text('modified_text').notNull(),
  reason: text('reason').notNull(), // Pourquoi la modification

  // Métadonnées
  modifiedBy: text('modified_by').notNull(),
  modifiedAt: integer('modified_at', { mode: 'timestamp' }).notNull(),
});

// Index pour accès rapide
export const manualChunksDocumentIndex = index('manual_chunks_document_idx').on(
  manualChunks.documentId
);

export type ManualChunk = typeof manualChunks.$inferSelect;
export type NewManualChunk = typeof manualChunks.$inferInsert;
