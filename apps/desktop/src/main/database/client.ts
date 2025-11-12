import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

/**
 * Client de base de données SQLite pour BlackIA
 * Utilise Drizzle ORM pour la manipulation des données
 */

// Chemin vers le fichier de base de données
const USER_DATA_PATH = app.getPath('userData');
const DB_PATH = path.join(USER_DATA_PATH, 'blackia.db');

// Instance singleton de la base de données
let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let sqliteInstance: Database.Database | null = null;

/**
 * Initialise la connexion à la base de données
 * Crée le fichier DB si nécessaire et lance les migrations
 */
export function initDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    // S'assurer que le répertoire existe
    if (!fs.existsSync(USER_DATA_PATH)) {
      fs.mkdirSync(USER_DATA_PATH, { recursive: true });
    }

    console.log('[Database] Initializing database at:', DB_PATH);

    // Créer la connexion SQLite
    sqliteInstance = new Database(DB_PATH);

    // Enable foreign keys
    sqliteInstance.pragma('foreign_keys = ON');

    // Créer l'instance Drizzle
    dbInstance = drizzle(sqliteInstance, { schema });

    console.log('[Database] Database initialized successfully');

    return dbInstance;
  } catch (error) {
    console.error('[Database] Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Lance les migrations de la base de données
 */
export function runMigrations() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }

  try {
    console.log('[Database] Running migrations...');

    const migrationsFolder = path.join(__dirname, 'migrations');

    // Vérifier si les fichiers de migration existent
    const hasMigrations = fs.existsSync(migrationsFolder) &&
                          fs.readdirSync(migrationsFolder).some(f => f.endsWith('.sql'));

    if (hasMigrations) {
      migrate(dbInstance, { migrationsFolder });
      console.log('[Database] Migrations completed successfully');
    } else {
      console.log('[Database] No migration files found, creating tables directly...');
      createTablesDirectly();
    }
  } catch (error) {
    console.error('[Database] Migration failed:', error);
    console.log('[Database] Falling back to direct table creation...');
    try {
      createTablesDirectly();
    } catch (fallbackError) {
      console.error('[Database] Fallback table creation also failed:', fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Crée les tables directement via SQL
 * Utilisé comme fallback si les migrations ne sont pas disponibles
 */
function createTablesDirectly() {
  if (!sqliteInstance) {
    throw new Error('Database not initialized');
  }

  // Créer les tables si elles n'existent pas
  sqliteInstance.exec(`
    CREATE TABLE IF NOT EXISTS personas (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      system_prompt TEXT NOT NULL,
      model TEXT,
      temperature REAL,
      max_tokens INTEGER,
      avatar TEXT NOT NULL,
      color TEXT NOT NULL,
      category TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      is_default INTEGER NOT NULL DEFAULT 0,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      usage_count INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      persona_id TEXT REFERENCES personas(id) ON DELETE SET NULL,
      folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      images TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS persona_suggestion_keywords (
      id TEXT PRIMARY KEY,
      keyword TEXT NOT NULL,
      categories TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documentation (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('guide', 'features', 'roadmap', 'api', 'faq', 'changelog')),
      parent_slug TEXT,
      "order" INTEGER NOT NULL DEFAULT 0,
      icon TEXT,
      description TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      version TEXT,
      published INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id TEXT PRIMARY KEY,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      thumbnail_path TEXT,
      extracted_text TEXT,
      extracted_metadata TEXT,
      entity_type TEXT NOT NULL CHECK(entity_type IN ('message', 'workflow', 'document', 'persona', 'prompt', 'conversation')),
      entity_id TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      rag_mode TEXT NOT NULL DEFAULT 'text' CHECK(rag_mode IN ('text', 'vision', 'hybrid', 'none')),
      is_indexed_text INTEGER NOT NULL DEFAULT 0,
      text_embedding_model TEXT,
      text_chunk_count INTEGER NOT NULL DEFAULT 0,
      is_indexed_vision INTEGER NOT NULL DEFAULT 0,
      vision_embedding_model TEXT,
      vision_patch_count INTEGER NOT NULL DEFAULT 0,
      page_count INTEGER NOT NULL DEFAULT 0,
      last_indexed_at INTEGER,
      indexing_duration INTEGER,
      indexing_error TEXT,
      uploaded_by TEXT,
      is_analyzed INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS attachments_entity_idx ON attachments(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS attachments_indexed_text_idx ON attachments(is_indexed_text);
    CREATE INDEX IF NOT EXISTS attachments_indexed_vision_idx ON attachments(is_indexed_vision);
  `);

  console.log('[Database] Tables created successfully');
}

/**
 * Retourne l'instance de la base de données
 * Lance une erreur si la DB n'est pas initialisée
 */
export function getDatabase() {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbInstance;
}

/**
 * Retourne l'instance SQLite brute (pour requêtes SQL directes)
 * Nécessaire pour FTS5 et autres features avancées
 */
export function getSqliteInstance() {
  if (!sqliteInstance) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return sqliteInstance;
}

/**
 * Ferme la connexion à la base de données
 */
export function closeDatabase() {
  if (sqliteInstance) {
    sqliteInstance.close();
    sqliteInstance = null;
    dbInstance = null;
    console.log('[Database] Database closed');
  }
}
