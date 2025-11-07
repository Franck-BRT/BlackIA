import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { registerOllamaHandlers } from './ollama-handlers';
import { PersonaService } from './services/persona-service';
import { syncPersonaTags } from './services/tag-sync-service';
import { personaSuggestionService } from './services/persona-suggestion-service';
import './handlers/persona-suggestion-handlers';
import { initDatabase, runMigrations } from './database/client';

// __dirname and __filename are available in CommonJS mode

// Development mode detection
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 15, y: 15 },
    backgroundColor: '#0a0a0a',
    vibrancy: 'under-window', // macOS glassmorphism effect
    visualEffectState: 'active',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  // Load app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  try {
    // Initialiser la base de données SQLite
    console.log('[App] Initializing database...');
    initDatabase();

    // Lancer les migrations
    console.log('[App] Running database migrations...');
    runMigrations();

    // Initialiser le service personas
    console.log('[App] Initializing PersonaService...');
    await PersonaService.initialize();

    // Synchroniser les tags des personas avec le système global
    console.log('[App] Syncing persona tags...');
    await syncPersonaTags();

    // Initialiser les keywords de suggestions de personas par défaut
    console.log('[App] Initializing persona suggestion keywords...');
    const { DEFAULT_KEYWORDS } = await import('../shared/default-keywords');
    await personaSuggestionService.initializeDefaultKeywords(DEFAULT_KEYWORDS);

    // Enregistrer les handlers IPC
    registerOllamaHandlers();
    registerPersonaHandlers();
    registerTagSyncHandlers();
    // Les handlers de suggestions sont déjà enregistrés via l'import

    console.log('[App] All services initialized successfully');
  } catch (error) {
    console.error('[App] Failed to initialize:', error);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============================================================================
// PERSONA IPC HANDLERS
// ============================================================================

function registerPersonaHandlers() {
  // Récupère toutes les personas
  ipcMain.handle('personas:getAll', async () => {
    try {
      const personas = await PersonaService.getAll();
      return { success: true, data: personas };
    } catch (error) {
      console.error('[Personas] Error in getAll:', error);
      return { success: false, error: String(error) };
    }
  });

  // Récupère une persona par ID
  ipcMain.handle('personas:getById', async (_event, id: string) => {
    try {
      const persona = await PersonaService.getById(id);
      if (!persona) {
        return { success: false, error: 'Persona not found' };
      }
      return { success: true, data: persona };
    } catch (error) {
      console.error('[Personas] Error in getById:', error);
      return { success: false, error: String(error) };
    }
  });

  // Crée une nouvelle persona
  ipcMain.handle('personas:create', async (_event, data) => {
    try {
      const persona = await PersonaService.create(data);
      return { success: true, data: persona };
    } catch (error) {
      console.error('[Personas] Error in create:', error);
      return { success: false, error: String(error) };
    }
  });

  // Met à jour une persona
  ipcMain.handle('personas:update', async (_event, id: string, data) => {
    try {
      const persona = await PersonaService.update(id, data);
      if (!persona) {
        return { success: false, error: 'Persona not found' };
      }
      return { success: true, data: persona };
    } catch (error) {
      console.error('[Personas] Error in update:', error);
      return { success: false, error: String(error) };
    }
  });

  // Supprime une persona
  ipcMain.handle('personas:delete', async (_event, id: string) => {
    try {
      const success = await PersonaService.delete(id);
      if (!success) {
        return { success: false, error: 'Persona not found' };
      }
      return { success: true };
    } catch (error) {
      console.error('[Personas] Error in delete:', error);
      return { success: false, error: String(error) };
    }
  });

  // Recherche des personas
  ipcMain.handle('personas:search', async (_event, query: string) => {
    try {
      const personas = await PersonaService.search(query);
      return { success: true, data: personas };
    } catch (error) {
      console.error('[Personas] Error in search:', error);
      return { success: false, error: String(error) };
    }
  });

  // Filtre par catégorie
  ipcMain.handle('personas:filterByCategory', async (_event, category: string) => {
    try {
      const personas = await PersonaService.filterByCategory(category);
      return { success: true, data: personas };
    } catch (error) {
      console.error('[Personas] Error in filterByCategory:', error);
      return { success: false, error: String(error) };
    }
  });

  // Récupère les favorites
  ipcMain.handle('personas:getFavorites', async () => {
    try {
      const personas = await PersonaService.getFavorites();
      return { success: true, data: personas };
    } catch (error) {
      console.error('[Personas] Error in getFavorites:', error);
      return { success: false, error: String(error) };
    }
  });

  // Toggle favori
  ipcMain.handle('personas:toggleFavorite', async (_event, id: string) => {
    try {
      const persona = await PersonaService.toggleFavorite(id);
      if (!persona) {
        return { success: false, error: 'Persona not found' };
      }
      return { success: true, data: persona };
    } catch (error) {
      console.error('[Personas] Error in toggleFavorite:', error);
      return { success: false, error: String(error) };
    }
  });

  // Incrémente le compteur d'utilisation
  ipcMain.handle('personas:incrementUsage', async (_event, id: string) => {
    try {
      await PersonaService.incrementUsage(id);
      return { success: true };
    } catch (error) {
      console.error('[Personas] Error in incrementUsage:', error);
      return { success: false, error: String(error) };
    }
  });

  // Duplique une persona
  ipcMain.handle('personas:duplicate', async (_event, id: string) => {
    try {
      const persona = await PersonaService.duplicate(id);
      if (!persona) {
        return { success: false, error: 'Persona not found' };
      }
      return { success: true, data: persona };
    } catch (error) {
      console.error('[Personas] Error in duplicate:', error);
      return { success: false, error: String(error) };
    }
  });

  // Récupère les catégories
  ipcMain.handle('personas:getCategories', async () => {
    try {
      const categories = await PersonaService.getCategories();
      return { success: true, data: categories };
    } catch (error) {
      console.error('[Personas] Error in getCategories:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[IPC] Persona handlers registered');
}

// ============================================================================
// TAG SYNC IPC HANDLERS
// ============================================================================

function registerTagSyncHandlers() {
  // Récupère les tags synchronisés depuis le fichier
  ipcMain.handle('tags:getSynced', async () => {
    try {
      const tagsPath = path.join(app.getPath('userData'), 'tags.json');
      const tagsContent = await fs.readFile(tagsPath, 'utf-8');
      const tags = JSON.parse(tagsContent);
      return { success: true, data: tags };
    } catch (error) {
      // Si le fichier n'existe pas encore, retourner un tableau vide
      if ((error as any).code === 'ENOENT') {
        return { success: true, data: [] };
      }
      console.error('[Tags] Error in getSynced:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[IPC] Tag sync handlers registered');
}

// ============================================================================
// BASIC IPC HANDLERS
// ============================================================================

ipcMain.handle('ping', () => 'pong');

ipcMain.handle('app:getVersion', () => app.getVersion());

ipcMain.handle('app:getPlatform', () => process.platform);

ipcMain.handle('app:getPath', (_event, name: string) => {
  return app.getPath(name as any);
});

// ============================================================================
// FILE SYSTEM HANDLERS
// ============================================================================

ipcMain.handle('file:saveDialog', async (_event, options: {
  title?: string;
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
}) => {
  if (!mainWindow) return { canceled: true };

  const result = await dialog.showSaveDialog(mainWindow, {
    title: options.title || 'Sauvegarder le fichier',
    defaultPath: options.defaultPath,
    filters: options.filters || [],
  });

  return result;
});

ipcMain.handle('file:openDialog', async (_event, options: {
  title?: string;
  filters?: { name: string; extensions: string[] }[];
  properties?: ('openFile' | 'multiSelections')[];
}) => {
  if (!mainWindow) return { canceled: true };

  const result = await dialog.showOpenDialog(mainWindow, {
    title: options.title || 'Ouvrir un fichier',
    filters: options.filters || [],
    properties: options.properties || ['openFile'],
  });

  return result;
});

ipcMain.handle('file:writeFile', async (_event, filePath: string, content: string) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error: any) {
    console.error('Erreur lors de l\'écriture du fichier:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:readFile', async (_event, filePath: string) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error: any) {
    console.error('Erreur lors de la lecture du fichier:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('file:exportPDF', async (_event, options: {
  title: string;
  content: string;
}) => {
  if (!mainWindow) return { success: false, error: 'No main window' };

  try {
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Exporter en PDF',
      defaultPath: `${options.title}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    // Créer une nouvelle fenêtre invisible pour générer le PDF
    const pdfWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    // Charger le contenu HTML
    await pdfWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(options.content)}`
    );

    // Générer le PDF
    const pdfData = await pdfWindow.webContents.printToPDF({
      printBackground: true,
      margins: {
        marginType: 'none'
      }
    });

    // Sauvegarder le PDF
    await fs.writeFile(result.filePath, pdfData);

    // Fermer la fenêtre temporaire
    pdfWindow.close();

    return { success: true, filePath: result.filePath };
  } catch (error: any) {
    console.error('Erreur lors de l\'export PDF:', error);
    return { success: false, error: error.message };
  }
});

console.log('BlackIA Desktop started');
console.log('Development mode:', isDev);
console.log('App version:', app.getVersion());
