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

// Types inférés pour TypeScript
export type Persona = typeof personas.$inferSelect;
export type NewPersona = typeof personas.$inferInsert;
export type Folder = typeof folders.$inferSelect;
export type NewFolder = typeof folders.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
