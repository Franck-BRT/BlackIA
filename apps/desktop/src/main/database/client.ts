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

    // Créer le dossier migrations s'il n'existe pas
    if (!fs.existsSync(migrationsFolder)) {
      fs.mkdirSync(migrationsFolder, { recursive: true });
    }

    migrate(dbInstance, { migrationsFolder });

    console.log('[Database] Migrations completed successfully');
  } catch (error) {
    console.error('[Database] Migration failed:', error);
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
