import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { registerOllamaHandlers } from './ollama-handlers';

// Temporairement désactivé en attendant l'installation de better-sqlite3
// import { initDatabase, runMigrations } from './database/client';
// import { seedDefaultPersonas } from './database/seed';
// import { registerPersonaHandlers } from './handlers/persona-handlers';

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
    // Enregistrer les handlers IPC
    registerOllamaHandlers();

    // TODO: Activer après installation de better-sqlite3 et drizzle-orm
    // Pour l'instant, on utilise des handlers temporaires (voir ci-dessous)
    // initDatabase();
    // runMigrations();
    // await seedDefaultPersonas();
    // registerPersonaHandlers();

    console.log('[App] Handlers initialized successfully (SQLite temporairement désactivé)');
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

// Basic IPC handlers
ipcMain.handle('ping', () => 'pong');

ipcMain.handle('app:getVersion', () => app.getVersion());

ipcMain.handle('app:getPlatform', () => process.platform);

ipcMain.handle('app:getPath', (_event, name: string) => {
  return app.getPath(name as any);
});

// File system handlers
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

// ============================================================================
// HANDLERS TEMPORAIRES PERSONAS (en attendant SQLite)
// ============================================================================

// Données en mémoire temporaires
const TEMP_PERSONAS = [
  {
    id: 'temp-1',
    name: '🤖 Assistant Général',
    description: 'Un assistant IA polyvalent pour tous vos besoins',
    systemPrompt: 'Tu es un assistant IA serviable, précis et concis.',
    avatar: '🤖',
    color: 'purple',
    category: 'Général',
    tags: '["assistant","général"]',
    isDefault: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'temp-2',
    name: '🐍 Expert Python',
    description: 'Spécialiste Python pour développement et debugging',
    systemPrompt: 'Tu es un expert Python avec 10+ ans d\'expérience.',
    avatar: '🐍',
    color: 'green',
    category: 'Développement',
    tags: '["python","code"]',
    isDefault: false,
    isFavorite: true,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Handler temporaire getAll
ipcMain.handle('personas:getAll', async () => {
  console.log('[Personas TEMP] getAll called');
  return {
    success: true,
    data: TEMP_PERSONAS,
  };
});

// Autres handlers temporaires (retournent des erreurs pour l'instant)
ipcMain.handle('personas:getById', async (_event, id: string) => {
  const persona = TEMP_PERSONAS.find(p => p.id === id);
  return persona
    ? { success: true, data: persona }
    : { success: false, error: 'Persona not found' };
});

ipcMain.handle('personas:create', async () => {
  return { success: false, error: 'SQLite not available - install dependencies first' };
});

ipcMain.handle('personas:update', async () => {
  return { success: false, error: 'SQLite not available - install dependencies first' };
});

ipcMain.handle('personas:delete', async () => {
  return { success: false, error: 'SQLite not available - install dependencies first' };
});

ipcMain.handle('personas:search', async () => {
  return { success: true, data: TEMP_PERSONAS };
});

ipcMain.handle('personas:filterByCategory', async () => {
  return { success: true, data: TEMP_PERSONAS };
});

ipcMain.handle('personas:getFavorites', async () => {
  return { success: true, data: TEMP_PERSONAS.filter(p => p.isFavorite) };
});

ipcMain.handle('personas:toggleFavorite', async () => {
  return { success: false, error: 'SQLite not available - install dependencies first' };
});

ipcMain.handle('personas:incrementUsage', async () => {
  return { success: true };
});

ipcMain.handle('personas:duplicate', async () => {
  return { success: false, error: 'SQLite not available - install dependencies first' };
});

ipcMain.handle('personas:getCategories', async () => {
  return { success: true, data: ['Général', 'Développement'] };
});

console.log('[App] Temporary persona handlers registered');

// ============================================================================

console.log('BlackIA Desktop started');
console.log('Development mode:', isDev);
console.log('App version:', app.getVersion());
