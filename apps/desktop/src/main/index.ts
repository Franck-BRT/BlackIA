import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { registerOllamaHandlers } from './ollama-handlers';
import { registerWebSearchHandlers } from './web-search-handlers';
import { PersonaService } from './services/persona-service';
import { PromptService } from './services/prompt-service';
import { WorkflowService } from './services/workflow-service';
import { syncPersonaTags } from './services/tag-sync-service';
import { personaSuggestionService } from './services/persona-suggestion-service';
import './handlers/persona-suggestion-handlers';
import { registerPromptHandlers } from './handlers/prompt-handlers';
import { registerWorkflowHandlers as registerWorkflowAdvancedHandlers } from './handlers/workflow-handlers';
import { registerDocumentationHandlers } from './handlers/documentation-handlers';
import { registerDocumentHandlers } from './handlers/document-handlers';
import { registerLogHandlers } from './handlers/log-handlers';
import { registerTextRAGHandlers } from './handlers/text-rag-handlers';
import { registerVisionRAGHandlers } from './handlers/vision-rag-handlers';
import { initDatabase, runMigrations } from './database/client';
import { DocumentationService } from './services/documentation-db-service';
import { WorkflowTemplateService } from './services/workflow-db-service';
import { logService, logger } from './services/log-service';
import { vectorStore } from './services/vector-store';

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

  // Initialiser le service de logs avec la fenêtre principale
  logService.setMainWindow(mainWindow);
  logger.info('system', 'Application window created', `Mode: ${isDev ? 'development' : 'production'}`);

  // Load app
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    logService.setMainWindow(null);
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  console.log('[App] =====================================');
  console.log('[App] BlackIA Desktop Starting...');
  console.log('[App] Version:', app.getVersion());
  console.log('[App] User Data Path:', app.getPath('userData'));
  console.log('[App] App Path:', app.getAppPath());
  console.log('[App] Is Packaged:', app.isPackaged);
  console.log('[App] Development mode:', isDev);
  console.log('[App] =====================================');

  let initializationError: Error | null = null;

  try {
    // Initialiser la base de données SQLite
    console.log('[App] Initializing database...');
    initDatabase();
    console.log('[App] ✅ Database initialized');

    // Lancer les migrations
    console.log('[App] Running database migrations...');
    runMigrations();
    console.log('[App] ✅ Migrations completed');

    // Initialiser la recherche FTS5 pour la documentation
    console.log('[App] Initializing Documentation FTS5...');
    await DocumentationService.initializeFTS();
    console.log('[App] ✅ Documentation FTS5 initialized');

    // Auto-importer la documentation par défaut si nécessaire
    console.log('[App] Checking for documentation auto-import...');
    await DocumentationService.autoImport();
    console.log('[App] ✅ Documentation auto-import completed');

    // Initialiser le service personas
    console.log('[App] Initializing PersonaService...');
    await PersonaService.initialize();
    console.log('[App] ✅ PersonaService initialized');

    // Vérifier que les personas sont chargées
    const personas = await PersonaService.getAll();
    console.log(`[App] ✅ ${personas.length} personas loaded`);
    if (personas.length === 0) {
      console.warn('[App] ⚠️  WARNING: No personas found!');
    }

    // Initialiser le service prompts
    console.log('[App] Initializing PromptService...');
    await PromptService.initialize();
    console.log('[App] ✅ PromptService initialized');

    // Vérifier que les prompts sont chargés
    const prompts = await PromptService.getAll();
    console.log(`[App] ✅ ${prompts.length} prompts loaded`);
    if (prompts.length === 0) {
      console.warn('[App] ⚠️  WARNING: No prompts found!');
    }

    // Initialiser le service workflows
    console.log('[App] Initializing WorkflowService...');
    await WorkflowService.initialize();
    console.log('[App] ✅ WorkflowService initialized');

    // Vérifier que les workflows sont chargés
    const workflows = await WorkflowService.getAll();
    console.log(`[App] ✅ ${workflows.length} workflows loaded`);
    if (workflows.length === 0) {
      console.warn('[App] ⚠️  WARNING: No workflows found!');
    }

    // Synchroniser les tags des personas avec le système global
    console.log('[App] Syncing persona tags...');
    await syncPersonaTags();
    console.log('[App] ✅ Persona tags synced');

    // Initialiser les keywords de suggestions de personas par défaut
    console.log('[App] Initializing persona suggestion keywords...');
    const { DEFAULT_KEYWORDS } = await import('../shared/default-keywords');
    await personaSuggestionService.initializeDefaultKeywords(DEFAULT_KEYWORDS);
    console.log('[App] ✅ Persona suggestion keywords initialized');

    // Initialiser le vector store (LanceDB)
    console.log('[App] Initializing Vector Store (LanceDB)...');
    await vectorStore.initialize();
    console.log('[App] ✅ Vector Store initialized');

    // Enregistrer les handlers IPC
    console.log('[App] Registering IPC handlers...');
    registerOllamaHandlers();
    registerWebSearchHandlers();
    registerPersonaHandlers();
    registerPromptHandlers();
    registerWorkflowHandlers();
    registerWorkflowAdvancedHandlers(); // Templates, Versions, Variables
    registerDocumentationHandlers(); // Documentation
    registerDocumentHandlers(); // General documents
    registerTagSyncHandlers();
    registerLogHandlers(); // Logs system
    registerTextRAGHandlers(); // Text RAG
    registerVisionRAGHandlers(); // Vision RAG
    console.log('[App] ✅ IPC handlers registered');

    console.log('[App] =====================================');
    console.log('[App] ✅ ALL SERVICES INITIALIZED SUCCESSFULLY');
    console.log('[App] =====================================');
  } catch (error) {
    initializationError = error as Error;
    console.error('[App] =====================================');
    console.error('[App] ❌ CRITICAL ERROR during initialization:');
    console.error('[App]', error);
    console.error('[App] Stack:', (error as Error).stack);
    console.error('[App] =====================================');
  }

  // Créer la fenêtre
  createWindow();

  // Si erreur d'initialisation, l'afficher dans la fenêtre
  if (initializationError && mainWindow) {
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow?.webContents.executeJavaScript(`
        console.error('❌ Initialization Error:', ${JSON.stringify(initializationError.message)});
        console.error('Stack:', ${JSON.stringify(initializationError.stack)});
      `);
    });
  }

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
// WORKFLOW IPC HANDLERS
// ============================================================================

function registerWorkflowHandlers() {
  // Récupère tous les workflows
  ipcMain.handle('workflows:getAll', async () => {
    try {
      const workflows = await WorkflowService.getAll();
      return { success: true, data: workflows };
    } catch (error) {
      console.error('[Workflows] Error in getAll:', error);
      return { success: false, error: String(error) };
    }
  });

  // Récupère un workflow par ID
  ipcMain.handle('workflows:getById', async (_event, id: string) => {
    try {
      const workflow = await WorkflowService.getById(id);
      if (!workflow) {
        return { success: false, error: 'Workflow not found' };
      }
      return { success: true, data: workflow };
    } catch (error) {
      console.error('[Workflows] Error in getById:', error);
      return { success: false, error: String(error) };
    }
  });

  // Crée un nouveau workflow
  ipcMain.handle('workflows:create', async (_event, data) => {
    try {
      const workflow = await WorkflowService.create(data);
      return { success: true, data: workflow };
    } catch (error) {
      console.error('[Workflows] Error in create:', error);
      return { success: false, error: String(error) };
    }
  });

  // Met à jour un workflow
  ipcMain.handle('workflows:update', async (_event, id: string, data) => {
    try {
      const workflow = await WorkflowService.update(id, data);
      if (!workflow) {
        return { success: false, error: 'Workflow not found' };
      }
      return { success: true, data: workflow };
    } catch (error) {
      console.error('[Workflows] Error in update:', error);
      return { success: false, error: String(error) };
    }
  });

  // Supprime un workflow
  ipcMain.handle('workflows:delete', async (_event, id: string) => {
    try {
      const success = await WorkflowService.delete(id);
      if (!success) {
        return { success: false, error: 'Workflow not found' };
      }
      return { success: true };
    } catch (error) {
      console.error('[Workflows] Error in delete:', error);
      return { success: false, error: String(error) };
    }
  });

  // Recherche des workflows
  ipcMain.handle('workflows:search', async (_event, query: string) => {
    try {
      const workflows = await WorkflowService.search(query);
      return { success: true, data: workflows };
    } catch (error) {
      console.error('[Workflows] Error in search:', error);
      return { success: false, error: String(error) };
    }
  });

  // Filtre par catégorie
  ipcMain.handle('workflows:filterByCategory', async (_event, category: string) => {
    try {
      const workflows = await WorkflowService.filterByCategory(category);
      return { success: true, data: workflows };
    } catch (error) {
      console.error('[Workflows] Error in filterByCategory:', error);
      return { success: false, error: String(error) };
    }
  });

  // Récupère les favoris
  ipcMain.handle('workflows:getFavorites', async () => {
    try {
      const workflows = await WorkflowService.getFavorites();
      return { success: true, data: workflows };
    } catch (error) {
      console.error('[Workflows] Error in getFavorites:', error);
      return { success: false, error: String(error) };
    }
  });

  // Récupère les templates (depuis fichier JSON ET base de données)
  ipcMain.handle('workflows:getTemplates', async () => {
    try {
      // Récupérer les templates depuis le fichier JSON
      const jsonTemplates = await WorkflowService.getTemplates();

      // Récupérer les templates depuis la base de données
      let dbTemplates: any[] = [];
      try {
        dbTemplates = await WorkflowTemplateService.getAll();
        console.log(`[Workflows] Loaded ${dbTemplates.length} templates from database`);
      } catch (dbError) {
        console.warn('[Workflows] Could not load templates from database:', dbError);
        // Continue même si la DB échoue
      }

      // Convertir les templates de la DB au format Workflow standard
      const convertedDbTemplates = dbTemplates.map((template) => ({
        id: template.id,
        name: template.name,
        description: template.description,
        nodes: template.nodes || '[]',
        edges: template.edges || '[]',
        icon: template.icon || '📋',
        color: 'purple', // Pas de color dans workflow_templates
        category: template.category,
        tags: template.tags || '[]',
        isFavorite: false, // Les templates ne sont pas favoris par défaut
        usageCount: template.usageCount || 0,
        isTemplate: true, // Force isTemplate à true
        createdAt: new Date(template.createdAt).toISOString(),
        updatedAt: new Date(template.updatedAt).toISOString(),
      }));

      // Combiner les deux sources (en évitant les doublons par ID)
      const allTemplates = [...jsonTemplates];
      for (const dbTemplate of convertedDbTemplates) {
        if (!allTemplates.find((t) => t.id === dbTemplate.id)) {
          allTemplates.push(dbTemplate);
        }
      }

      console.log(`[Workflows] Returning ${allTemplates.length} templates (${jsonTemplates.length} from JSON, ${convertedDbTemplates.length} from DB)`);
      return { success: true, data: allTemplates };
    } catch (error) {
      console.error('[Workflows] Error in getTemplates:', error);
      return { success: false, error: String(error) };
    }
  });

  // Toggle favori
  ipcMain.handle('workflows:toggleFavorite', async (_event, id: string) => {
    try {
      const workflow = await WorkflowService.toggleFavorite(id);
      if (!workflow) {
        return { success: false, error: 'Workflow not found' };
      }
      return { success: true, data: workflow };
    } catch (error) {
      console.error('[Workflows] Error in toggleFavorite:', error);
      return { success: false, error: String(error) };
    }
  });

  // Incrémente le compteur d'utilisation
  ipcMain.handle('workflows:incrementUsage', async (_event, id: string) => {
    try {
      await WorkflowService.incrementUsage(id);
      return { success: true };
    } catch (error) {
      console.error('[Workflows] Error in incrementUsage:', error);
      return { success: false, error: String(error) };
    }
  });

  // Duplique un workflow
  ipcMain.handle('workflows:duplicate', async (_event, id: string) => {
    try {
      const workflow = await WorkflowService.duplicate(id);
      if (!workflow) {
        return { success: false, error: 'Workflow not found' };
      }
      return { success: true, data: workflow };
    } catch (error) {
      console.error('[Workflows] Error in duplicate:', error);
      return { success: false, error: String(error) };
    }
  });

  // Récupère les catégories
  ipcMain.handle('workflows:getCategories', async () => {
    try {
      const categories = await WorkflowService.getCategories();
      return { success: true, data: categories };
    } catch (error) {
      console.error('[Workflows] Error in getCategories:', error);
      return { success: false, error: String(error) };
    }
  });

  // Exécuter un workflow
  ipcMain.handle('workflows:execute', async (_event, workflowId: string, inputs: Record<string, unknown>) => {
    try {
      const { WorkflowExecutionEngine } = await import('./services/workflow-execution-engine');

      // Récupérer le workflow
      const workflow = await WorkflowService.getById(workflowId);
      if (!workflow) {
        return { success: false, error: 'Workflow not found' };
      }

      // Parser les nodes et edges
      const parsedWorkflow = {
        id: workflow.id,
        name: workflow.name,
        nodes: JSON.parse(workflow.nodes),
        edges: JSON.parse(workflow.edges),
      };

      // Créer et exécuter le workflow avec streaming AI
      const engine = new WorkflowExecutionEngine(
        parsedWorkflow,
        (nodeId, status) => {
          // Envoyer les événements de progression
          _event.sender.send('workflow:progress', { nodeId, status });
        },
        _event.sender // Passer le sender pour les events de streaming AI
      );

      const result = await engine.execute(inputs);

      // Incrémenter le compteur d'utilisation
      if (result.success) {
        await WorkflowService.incrementUsage(workflowId);
      }

      return { success: true, data: result };
    } catch (error) {
      console.error('[Workflows] Error in execute:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[IPC] Workflow handlers registered');
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
