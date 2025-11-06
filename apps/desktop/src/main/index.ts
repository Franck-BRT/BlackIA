import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { registerOllamaHandlers } from './ollama-handlers';

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
app.whenReady().then(() => {
  // Enregistrer les handlers IPC Ollama
  registerOllamaHandlers();

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
      marginsType: 1, // No margins
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
