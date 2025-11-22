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
    console.log('[Database] Migrations folder:', migrationsFolder);
    console.log('[Database] Migrations folder exists:', fs.existsSync(migrationsFolder));

    // Vérifier si les fichiers de migration existent
    if (fs.existsSync(migrationsFolder)) {
      const files = fs.readdirSync(migrationsFolder);
      console.log('[Database] Migration files found:', files);
    }

    const hasMigrations = fs.existsSync(migrationsFolder) &&
                          fs.readdirSync(migrationsFolder).some(f => f.endsWith('.sql'));

    if (hasMigrations) {
      migrate(dbInstance, { migrationsFolder });
      console.log('[Database] Migrations completed successfully');

      // Verify library tables exist
      verifyLibraryTables();
    } else {
      console.log('[Database] No migration files found, creating tables directly...');
      createTablesDirectly();
      // Verify library tables even when using direct table creation
      verifyLibraryTables();
    }
  } catch (error) {
    console.error('[Database] Migration failed:', error);
    console.log('[Database] Falling back to direct table creation...');
    try {
      createTablesDirectly();
      // Verify library tables even in fallback mode
      verifyLibraryTables();
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

    -- Library System Tables (from migration 0004)
    CREATE TABLE IF NOT EXISTS libraries (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '' NOT NULL,
      color TEXT DEFAULT 'blue' NOT NULL,
      icon TEXT DEFAULT '📚' NOT NULL,
      rag_config TEXT DEFAULT '{}' NOT NULL,
      storage_path TEXT NOT NULL,
      document_count INTEGER DEFAULT 0 NOT NULL,
      total_size INTEGER DEFAULT 0 NOT NULL,
      total_chunks INTEGER DEFAULT 0 NOT NULL,
      total_patches INTEGER DEFAULT 0 NOT NULL,
      allowed_tags TEXT DEFAULT '[]' NOT NULL,
      is_favorite INTEGER DEFAULT 0 NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS libraries_name_idx ON libraries(name);

    CREATE TABLE IF NOT EXISTS library_documents (
      id TEXT PRIMARY KEY NOT NULL,
      library_id TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      thumbnail_path TEXT,
      extracted_text TEXT,
      extracted_metadata TEXT,
      tags TEXT DEFAULT '[]' NOT NULL,
      rag_mode TEXT DEFAULT 'text' NOT NULL CHECK(rag_mode IN ('text', 'vision', 'hybrid', 'none')),
      is_indexed_text INTEGER DEFAULT 0 NOT NULL,
      text_embedding_model TEXT,
      text_chunk_count INTEGER DEFAULT 0 NOT NULL,
      is_indexed_vision INTEGER DEFAULT 0 NOT NULL,
      vision_embedding_model TEXT,
      vision_patch_count INTEGER DEFAULT 0 NOT NULL,
      page_count INTEGER DEFAULT 0 NOT NULL,
      validation_status TEXT DEFAULT 'pending' NOT NULL CHECK(validation_status IN ('pending', 'validated', 'needs_review', 'rejected')),
      validated_by TEXT,
      validated_at INTEGER,
      validation_notes TEXT,
      last_indexed_at INTEGER,
      indexing_duration INTEGER,
      indexing_error TEXT,
      uploaded_by TEXT,
      is_analyzed INTEGER DEFAULT 0 NOT NULL,
      is_favorite INTEGER DEFAULT 0 NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS library_documents_library_idx ON library_documents(library_id);
    CREATE INDEX IF NOT EXISTS library_documents_validation_idx ON library_documents(validation_status);
    CREATE INDEX IF NOT EXISTS library_documents_rag_mode_idx ON library_documents(rag_mode);

    CREATE TABLE IF NOT EXISTS manual_chunks (
      id TEXT PRIMARY KEY NOT NULL,
      document_id TEXT NOT NULL,
      original_chunk_id TEXT NOT NULL,
      modified_text TEXT NOT NULL,
      reason TEXT NOT NULL,
      modified_by TEXT NOT NULL,
      modified_at INTEGER NOT NULL,
      FOREIGN KEY (document_id) REFERENCES library_documents(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS manual_chunks_document_idx ON manual_chunks(document_id);

    -- MCP System Tables
    CREATE TABLE IF NOT EXISTS mcp_tools_config (
      id TEXT PRIMARY KEY NOT NULL,
      tool_name TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      enabled INTEGER DEFAULT 1 NOT NULL,
      config TEXT DEFAULT '{}' NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS mcp_tools_config_name_idx ON mcp_tools_config(tool_name);

    CREATE TABLE IF NOT EXISTS mcp_permissions (
      id TEXT PRIMARY KEY NOT NULL,
      permission TEXT NOT NULL UNIQUE,
      enabled INTEGER DEFAULT 0 NOT NULL,
      granted_at INTEGER,
      last_checked_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mcp_directory_access (
      id TEXT PRIMARY KEY NOT NULL,
      path TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      permissions TEXT DEFAULT '["read"]' NOT NULL,
      include_subdirectories INTEGER DEFAULT 1 NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS mcp_directory_access_path_idx ON mcp_directory_access(path);

    CREATE TABLE IF NOT EXISTS mcp_tool_call_logs (
      id TEXT PRIMARY KEY NOT NULL,
      tool_name TEXT NOT NULL,
      parameters TEXT DEFAULT '{}' NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'success', 'error', 'cancelled', 'timeout')),
      result TEXT,
      error TEXT,
      started_at INTEGER NOT NULL,
      completed_at INTEGER,
      duration INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS mcp_tool_call_logs_tool_idx ON mcp_tool_call_logs(tool_name);
  `);

  console.log('[Database] Tables created successfully');
}

/**
 * Verify library tables exist and create them if missing
 */
function verifyLibraryTables() {
  if (!sqliteInstance) {
    return;
  }

  try {
    const tables = sqliteInstance.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'librar%'"
    ).all();

    console.log('[Database] Library tables found:', tables);

    if (tables.length === 0) {
      console.warn('[Database] ⚠️  WARNING: No library tables found after migrations!');
      console.log('[Database] Creating library tables manually...');
      createLibraryTables();
    }
  } catch (error) {
    console.error('[Database] Failed to verify library tables:', error);
  }

  // Verify MCP tables
  verifyMCPTables();
}

/**
 * Verify MCP tables exist and create them if missing
 */
function verifyMCPTables() {
  if (!sqliteInstance) {
    return;
  }

  try {
    const tables = sqliteInstance.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'mcp_%'"
    ).all();

    console.log('[Database] MCP tables found:', tables);

    if (tables.length < 3) {
      console.warn('[Database] ⚠️  WARNING: MCP tables missing after migrations!');
      console.log('[Database] Creating MCP tables manually...');
      createMCPTables();
    }
  } catch (error) {
    console.error('[Database] Failed to verify MCP tables:', error);
  }
}

/**
 * Create MCP tables manually
 */
function createMCPTables() {
  if (!sqliteInstance) {
    throw new Error('Database not initialized');
  }

  try {
    sqliteInstance.exec(`
      CREATE TABLE IF NOT EXISTS mcp_tools_config (
        id TEXT PRIMARY KEY NOT NULL,
        tool_name TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        enabled INTEGER DEFAULT 1 NOT NULL,
        config TEXT DEFAULT '{}' NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS mcp_tools_config_name_idx ON mcp_tools_config(tool_name);

      CREATE TABLE IF NOT EXISTS mcp_permissions (
        id TEXT PRIMARY KEY NOT NULL,
        permission TEXT NOT NULL UNIQUE,
        enabled INTEGER DEFAULT 0 NOT NULL,
        granted_at INTEGER,
        last_checked_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS mcp_directory_access (
        id TEXT PRIMARY KEY NOT NULL,
        path TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        permissions TEXT DEFAULT '["read"]' NOT NULL,
        include_subdirectories INTEGER DEFAULT 1 NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS mcp_directory_access_path_idx ON mcp_directory_access(path);

      CREATE TABLE IF NOT EXISTS mcp_tool_call_logs (
        id TEXT PRIMARY KEY NOT NULL,
        tool_name TEXT NOT NULL,
        parameters TEXT DEFAULT '{}' NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('pending', 'running', 'success', 'error', 'cancelled', 'timeout')),
        result TEXT,
        error TEXT,
        started_at INTEGER NOT NULL,
        completed_at INTEGER,
        duration INTEGER,
        created_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS mcp_tool_call_logs_tool_idx ON mcp_tool_call_logs(tool_name);
    `);

    console.log('[Database] ✅ MCP tables created successfully');
  } catch (error) {
    console.error('[Database] Failed to create MCP tables:', error);
    throw error;
  }
}

/**
 * Create library tables manually
 */
function createLibraryTables() {
  if (!sqliteInstance) {
    throw new Error('Database not initialized');
  }

  try {
    sqliteInstance.exec(`
      CREATE TABLE IF NOT EXISTS libraries (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT DEFAULT '' NOT NULL,
        color TEXT DEFAULT 'blue' NOT NULL,
        icon TEXT DEFAULT '📚' NOT NULL,
        rag_config TEXT DEFAULT '{}' NOT NULL,
        storage_path TEXT NOT NULL,
        document_count INTEGER DEFAULT 0 NOT NULL,
        total_size INTEGER DEFAULT 0 NOT NULL,
        total_chunks INTEGER DEFAULT 0 NOT NULL,
        total_patches INTEGER DEFAULT 0 NOT NULL,
        allowed_tags TEXT DEFAULT '[]' NOT NULL,
        is_favorite INTEGER DEFAULT 0 NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS libraries_name_idx ON libraries(name);

      CREATE TABLE IF NOT EXISTS library_documents (
        id TEXT PRIMARY KEY NOT NULL,
        library_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size INTEGER NOT NULL,
        file_path TEXT NOT NULL,
        thumbnail_path TEXT,
        extracted_text TEXT,
        extracted_metadata TEXT,
        tags TEXT DEFAULT '[]' NOT NULL,
        rag_mode TEXT DEFAULT 'text' NOT NULL CHECK(rag_mode IN ('text', 'vision', 'hybrid', 'none')),
        is_indexed_text INTEGER DEFAULT 0 NOT NULL,
        text_embedding_model TEXT,
        text_chunk_count INTEGER DEFAULT 0 NOT NULL,
        is_indexed_vision INTEGER DEFAULT 0 NOT NULL,
        vision_embedding_model TEXT,
        vision_patch_count INTEGER DEFAULT 0 NOT NULL,
        page_count INTEGER DEFAULT 0 NOT NULL,
        validation_status TEXT DEFAULT 'pending' NOT NULL CHECK(validation_status IN ('pending', 'validated', 'needs_review', 'rejected')),
        validated_by TEXT,
        validated_at INTEGER,
        validation_notes TEXT,
        last_indexed_at INTEGER,
        indexing_duration INTEGER,
        indexing_error TEXT,
        uploaded_by TEXT,
        is_analyzed INTEGER DEFAULT 0 NOT NULL,
        is_favorite INTEGER DEFAULT 0 NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (library_id) REFERENCES libraries(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS library_documents_library_idx ON library_documents(library_id);
      CREATE INDEX IF NOT EXISTS library_documents_validation_idx ON library_documents(validation_status);
      CREATE INDEX IF NOT EXISTS library_documents_rag_mode_idx ON library_documents(rag_mode);

      CREATE TABLE IF NOT EXISTS manual_chunks (
        id TEXT PRIMARY KEY NOT NULL,
        document_id TEXT NOT NULL,
        original_chunk_id TEXT NOT NULL,
        modified_text TEXT NOT NULL,
        reason TEXT NOT NULL,
        modified_by TEXT NOT NULL,
        modified_at INTEGER NOT NULL,
        FOREIGN KEY (document_id) REFERENCES library_documents(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS manual_chunks_document_idx ON manual_chunks(document_id);
    `);

    console.log('[Database] ✅ Library tables created successfully');
  } catch (error) {
    console.error('[Database] Failed to create library tables:', error);
    throw error;
  }
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
