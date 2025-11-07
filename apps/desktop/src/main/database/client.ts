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
    const sqlite = new Database(DB_PATH);

    // Enable foreign keys
    sqlite.pragma('foreign_keys = ON');

    // Créer l'instance Drizzle
    dbInstance = drizzle(sqlite, { schema });

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
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }

  const db = (dbInstance as any)._.session.db as Database.Database;

  // Créer les tables si elles n'existent pas
  db.exec(`
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
 * Ferme la connexion à la base de données
 */
export function closeDatabase() {
  if (dbInstance) {
    // @ts-expect-error - Drizzle ne fournit pas de méthode close directement
    dbInstance._.close();
    dbInstance = null;
    console.log('[Database] Database closed');
  }
}
