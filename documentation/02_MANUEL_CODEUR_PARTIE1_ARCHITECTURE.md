# BlackIA - Manuel Codeur - Partie 1: Architecture

**Version**: 0.2.0
**Date**: Novembre 2025
**Auteur**: Black Room Technologies
**Niveau**: Avancé - Documentation technique complète

---

## Table des Matières

1. [Introduction](#introduction)
2. [Architecture globale](#architecture-globale)
3. [Stack technologique détaillée](#stack-technologique-détaillée)
4. [Structure du projet](#structure-du-projet)
5. [Communication IPC](#communication-ipc)
6. [Base de données](#base-de-données)
7. [Intégration Python](#intégration-python)

---

## 1. Introduction

### 1.1 À propos de ce manuel

Ce manuel est destiné aux développeurs qui souhaitent comprendre, maintenir ou étendre BlackIA. Il contient :
- **Le code source complet** de tous les modules clés
- **Des explications détaillées** de chaque composant
- **Les patterns architecturaux** utilisés
- **Les conventions de codage** du projet
- **Les bonnes pratiques** d'implémentation

### 1.2 Prérequis

Pour travailler sur BlackIA, vous devez maîtriser :
- **TypeScript 5.3+** (syntax avancée, generics, utility types)
- **React 18.2+** (hooks, context, suspense)
- **Electron 33.2+** (main/renderer process, IPC, security)
- **Node.js 20+** (async/await, streams, child processes)
- **Python 3.11+** (pour les services RAG)
- **SQLite** et **Drizzle ORM**
- **TailwindCSS** et **shadcn/ui**

### 1.3 Outils de développement

```bash
# Éditeur recommandé
Visual Studio Code avec extensions:
- ESLint
- Prettier
- TypeScript
- Tailwind CSS IntelliSense
- Python (si travail sur RAG)

# Gestionnaire de paquets
pnpm >= 8.0.0 (obligatoire pour workspace)

# Autres outils
- Git
- Node.js 20+
- Python 3.11+ avec pip
```

---

## 2. Architecture globale

### 2.1 Vue d'ensemble

BlackIA suit l'architecture classique d'une application Electron avec quelques spécificités :

```
┌─────────────────────────────────────────────────────────────────┐
│                        Application Electron                      │
│                                                                   │
│  ┌────────────────────────┐         ┌─────────────────────────┐│
│  │   Renderer Process     │◄───IPC─►│    Main Process         ││
│  │   (React + TypeScript) │         │    (Node.js + TypeScript)││
│  │                        │         │                         ││
│  │  • 82 composants React │         │  • 22 services métier   ││
│  │  • Zustand (state)     │         │  • 13 IPC handlers      ││
│  │  • TanStack Query      │         │  • Backend Manager      ││
│  │  • ReactFlow (workflow)│         │  • Workflow Engine      ││
│  │  • TailwindCSS + UI    │         │  • RAG Services         ││
│  └────────────────────────┘         └─────────────────────────┘│
│                                               │                  │
│                                               ▼                  │
│                                   ┌─────────────────────┐       │
│                                   │  SQLite Database    │       │
│                                   │  (Drizzle ORM)      │       │
│                                   │  • 11 tables        │       │
│                                   │  • Migrations       │       │
│                                   └─────────────────────┘       │
│                                               │                  │
│                                               ▼                  │
│                                   ┌─────────────────────┐       │
│                                   │  LanceDB            │       │
│                                   │  (Vector Store)     │       │
│                                   │  • Text embeddings  │       │
│                                   │  • Vision patches   │       │
│                                   └─────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │    Services Python              │
                    │    (Child Processes)            │
                    │                                 │
                    │  • Text RAG (Sentence Trans.)   │
                    │  • Vision RAG (Colette/ColPali) │
                    │  • MLX Vision Embedder          │
                    │  • Late Interaction (MaxSim)    │
                    └─────────────────────────────────┘
                                     │
                                     ▼
                    ┌─────────────────────────────────┐
                    │    Backends IA                  │
                    │                                 │
                    │  • Ollama (local ou remote)     │
                    │  • MLX (Apple Silicon optimisé) │
                    └─────────────────────────────────┘
```

### 2.2 Principes architecturaux

#### Separation of Concerns
```
Frontend (Renderer)      ←→     Backend (Main)      ←→     Externes
─────────────────────           ──────────────            ──────────
• Présentation                  • Logique métier          • Ollama
• Interactions UI               • Accès données           • Python
• État local                    • Sécurité                • Filesystem
• Validation UI                 • IPC handlers            • Réseau
```

#### Layered Architecture
```
┌─────────────────────────────────────────────┐
│  Presentation Layer (React Components)      │
├─────────────────────────────────────────────┤
│  State Management Layer (Zustand + Query)   │
├─────────────────────────────────────────────┤
│  IPC Communication Layer (Electron IPC)     │
├─────────────────────────────────────────────┤
│  Business Logic Layer (Services)            │
├─────────────────────────────────────────────┤
│  Data Access Layer (Drizzle ORM)            │
├─────────────────────────────────────────────┤
│  External Services (Ollama, Python, FS)     │
└─────────────────────────────────────────────┘
```

#### Event-Driven Architecture
```typescript
// Pattern utilisé pour les workflows, backends, et RAG
class WorkflowExecutionEngine extends EventEmitter {
  async execute() {
    this.emit('node:start', { nodeId });
    // ... execution
    this.emit('node:complete', { nodeId, output });
  }
}

// Frontend écoute les événements
webContents.send('workflow:node-update', { nodeId, status });
```

### 2.3 Flux de données

#### Pattern de communication IPC

```typescript
// 1. Frontend invoque une action via IPC
const personas = await window.electron.ipcRenderer.invoke('personas:getAll');

// 2. Main process reçoit via handler
ipcMain.handle('personas:getAll', async () => {
  return await personaService.getAll();
});

// 3. Service métier exécute la logique
class PersonaService {
  async getAll(): Promise<Persona[]> {
    // Lecture JSON ou DB
    return personas;
  }
}

// 4. Données retournées au frontend
// Les données sont automatiquement sérialisées par Electron
```

#### Pattern de streaming (AI responses)

```typescript
// Backend: Stream de tokens IA
async function* streamAIResponse() {
  for await (const chunk of ollamaClient.chatStream(request)) {
    webContents.send('ai:token', chunk); // Push au frontend
    yield chunk;
  }
}

// Frontend: Réception temps réel
window.electron.ipcRenderer.on('ai:token', (token) => {
  setResponse(prev => prev + token);
});
```

---

## 3. Stack technologique détaillée

### 3.1 Frontend (Renderer Process)

#### React 18.2 + TypeScript 5.3

```typescript
// Utilisation extensive des hooks modernes
import { useState, useEffect, useMemo, useCallback } from 'react';

// Pattern de composition
const ChatPage: React.FC = () => {
  const { personas } = usePersonas();
  const { sendMessage } = useChat();

  return (
    <div className="flex h-full">
      <Sidebar />
      <ChatContainer personas={personas} onSend={sendMessage} />
    </div>
  );
};

// Types stricts avec inference
type PersonaCardProps = {
  persona: Persona;
  onSelect: (id: string) => void;
};
```

#### Zustand 4.x (State Management)

```typescript
// Store global avec immer middleware
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface AppState {
  theme: 'light' | 'dark';
  sidebar: { isOpen: boolean };
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()(
  immer((set) => ({
    theme: 'dark',
    sidebar: { isOpen: true },

    setTheme: (theme) => set({ theme }),

    toggleSidebar: () => set((state) => {
      state.sidebar.isOpen = !state.sidebar.isOpen;
    }),
  }))
);

// Utilisation dans composants
const { theme, setTheme } = useAppStore();
```

#### TanStack Query 5.x (Server State)

```typescript
// Gestion du cache et des mutations
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Query avec cache automatique
export function usePersonas() {
  return useQuery({
    queryKey: ['personas'],
    queryFn: async () => {
      return await window.electron.ipcRenderer.invoke('personas:getAll');
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });
}

// Mutation avec invalidation cache
export function useCreatePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePersonaInput) => {
      return await window.electron.ipcRenderer.invoke('personas:create', data);
    },
    onSuccess: () => {
      // Invalide le cache des personas
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });
}
```

#### ReactFlow 11.x (Workflow Editor)

```typescript
// Workflow visuel avec nodes/edges
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection
} from 'reactflow';

const WorkflowEditor: React.FC = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={customNodeTypes}
    />
  );
};
```

#### TailwindCSS 3.4 + shadcn/ui

```typescript
// Composants avec Tailwind + Variants
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground',
        outline: 'border border-input hover:bg-accent',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = ({ className, variant, size, ...props }: ButtonProps) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
};
```

### 3.2 Backend (Main Process)

#### Electron 33.2

```typescript
// Point d'entrée principal
// apps/desktop/src/main/index.ts

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,    // Sécurité: pas d'accès Node dans renderer
      contextIsolation: true,    // Sécurité: contexte isolé
      sandbox: false,            // Nécessaire pour better-sqlite3
    },
  });

  // Chargement de l'app
  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

// Lifecycle
app.whenReady().then(async () => {
  await createWindow();

  // Initialiser les services
  await initializeServices();

  // Enregistrer les IPC handlers
  registerHandlers();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

#### Drizzle ORM + better-sqlite3

```typescript
// Configuration de la base de données
// apps/desktop/src/main/database/client.ts

import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import path from 'path';
import { app } from 'electron';

const dbPath = path.join(
  app.getPath('userData'),
  'database',
  'blackia.db'
);

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL'); // Write-Ahead Logging pour performance

export const db = drizzle(sqlite, { schema });

// Exécuter les migrations au démarrage
export async function runMigrations() {
  const migrationsFolder = path.join(__dirname, './migrations');
  migrate(db, { migrationsFolder });
}

// Transactions
export function transaction<T>(fn: () => T): T {
  return db.transaction(() => fn())();
}
```

#### Services métier

```typescript
// Pattern de service avec DI (Dependency Injection)
// apps/desktop/src/main/services/persona-service.ts

import { db } from '../database/client';
import { personas } from '../database/schema';
import { eq, like, or, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export class PersonaService {
  /**
   * Récupère toutes les personas
   */
  async getAll(): Promise<Persona[]> {
    const result = await db.select().from(personas);
    return result.map(this.deserialize);
  }

  /**
   * Recherche par nom ou description
   */
  async search(query: string): Promise<Persona[]> {
    const searchPattern = `%${query}%`;
    const result = await db
      .select()
      .from(personas)
      .where(
        or(
          like(personas.name, searchPattern),
          like(personas.description, searchPattern)
        )
      );
    return result.map(this.deserialize);
  }

  /**
   * Crée une nouvelle persona
   */
  async create(data: CreatePersonaInput): Promise<Persona> {
    const now = new Date();
    const newPersona = {
      id: randomUUID(),
      ...data,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(personas).values(newPersona);
    return this.deserialize(newPersona);
  }

  /**
   * Désérialise les champs JSON
   */
  private deserialize(persona: any): Persona {
    return {
      ...persona,
      tags: JSON.parse(persona.tags || '[]'),
      fewShots: persona.fewShots ? JSON.parse(persona.fewShots) : [],
    };
  }
}

// Singleton exporté
export const personaService = new PersonaService();
```

### 3.3 Intégration Python

#### Architecture des services Python

```
apps/desktop/src/python/
├── text_rag/                    # RAG texte avec Ollama
│   ├── embed.py                # Génération embeddings
│   └── requirements.txt
├── vision_rag/                  # RAG vision avec Colette
│   ├── colette_embedder.py     # ColPali/Qwen2-VL
│   ├── mlx_vision_embedder.py  # MLX-VLM (Apple Silicon)
│   ├── late_interaction.py     # Scoring MaxSim
│   ├── document_processor.py   # PDF → Images
│   └── requirements.txt
└── requirements.txt             # Dépendances globales
```

#### Communication Node.js ↔ Python

```typescript
// Pattern de subprocess avec PythonShell
import { PythonShell } from 'python-shell';
import path from 'path';

export class ColettePythonService {
  private pythonPath: string;
  private scriptPath: string;

  constructor() {
    this.pythonPath = this.detectPython();
    this.scriptPath = path.join(
      __dirname,
      '../../python/vision_rag/colette_embedder.py'
    );
  }

  /**
   * Génère des embeddings vision pour un document
   */
  async generateEmbeddings(
    documentPath: string,
    model: string
  ): Promise<VisionEmbeddings> {
    const options = {
      mode: 'json' as const,
      pythonPath: this.pythonPath,
      args: [
        '--document', documentPath,
        '--model', model,
        '--output', 'json',
      ],
    };

    return new Promise((resolve, reject) => {
      PythonShell.run(this.scriptPath, options, (err, results) => {
        if (err) {
          reject(err);
        } else {
          const embeddings = results[0] as VisionEmbeddings;
          resolve(embeddings);
        }
      });
    });
  }

  /**
   * Détecte Python avec les dépendances requises
   */
  private detectPython(): string {
    const candidates = [
      '/usr/bin/python3',
      '/usr/local/bin/python3',
      '/opt/homebrew/bin/python3',
    ];

    for (const pythonPath of candidates) {
      if (this.verifyPythonDeps(pythonPath)) {
        return pythonPath;
      }
    }

    throw new Error('Python avec dépendances RAG non trouvé');
  }

  /**
   * Vérifie les dépendances Python
   */
  private verifyPythonDeps(pythonPath: string): boolean {
    const requiredPackages = [
      'colpali_engine',
      'torch',
      'torchvision',
      'pdf2image',
      'PIL',
    ];

    try {
      const { execSync } = require('child_process');
      const command = `${pythonPath} -c "import ${requiredPackages.join(', ')}"`;
      execSync(command, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }
}
```

---

## 4. Structure du projet

### 4.1 Organisation du monorepo

BlackIA utilise **pnpm workspace** avec **Turborepo** pour gérer le monorepo :

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false
    },
    "lint": {
      "outputs": []
    },
    "type-check": {
      "outputs": []
    }
  }
}
```

### 4.2 Packages workspace

#### @blackia/ollama

```typescript
// packages/ollama/src/index.ts
// Client Ollama standalone (0 dépendances)

export { OllamaClient } from './client';
export * from './types';
export * from './errors';

// Utilisable dans le main process
import { OllamaClient } from '@blackia/ollama';

const ollama = new OllamaClient({
  baseUrl: 'http://localhost:11434',
  timeout: 60000,
});
```

#### @blackia/shared

```typescript
// packages/shared/src/types/index.ts
// Types partagés entre main et renderer

export interface Persona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  // ... autres champs
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  // ... autres champs
}

// Évite la duplication de types entre processus
```

#### @blackia/ui

```typescript
// packages/ui/src/components/button.tsx
// Composants UI réutilisables (shadcn/ui)

export { Button } from './button';
export { Input } from './input';
export { Dialog } from './dialog';
// ... tous les composants shadcn/ui
```

### 4.3 Configuration TypeScript

```json
// tsconfig.json (root)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "paths": {
      "@/*": ["./src/*"],
      "@blackia/shared": ["./packages/shared/src"],
      "@blackia/ui": ["./packages/ui/src"],
      "@blackia/ollama": ["./packages/ollama/src"]
    }
  }
}
```

```json
// apps/desktop/tsconfig.main.json (Main Process)
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",         // Node.js require()
    "outDir": "./dist/main",
    "rootDir": "./src/main"
  },
  "include": ["src/main/**/*", "src/preload/**/*"]
}
```

```json
// apps/desktop/tsconfig.json (Renderer Process)
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "module": "ESNext",           // ESM imports
    "outDir": "./dist/renderer",
    "rootDir": "./src/renderer"
  },
  "include": ["src/renderer/**/*"]
}
```

---

## 5. Communication IPC

### 5.1 Architecture IPC sécurisée

```typescript
// Preload script (pont entre renderer et main)
// apps/desktop/src/preload/index.ts

import { contextBridge, ipcRenderer } from 'electron';

// API exposée au renderer (window.electron)
const electronAPI = {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => {
      return ipcRenderer.invoke(channel, ...args);
    },
    on: (channel: string, callback: (...args: any[]) => void) => {
      const subscription = (_event: any, ...args: any[]) => callback(...args);
      ipcRenderer.on(channel, subscription);

      // Cleanup
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    send: (channel: string, ...args: any[]) => {
      ipcRenderer.send(channel, ...args);
    },
  },
};

// Injection sécurisée dans window
contextBridge.exposeInMainWorld('electron', electronAPI);

// Types pour le renderer
declare global {
  interface Window {
    electron: typeof electronAPI;
  }
}
```

### 5.2 Pattern de handlers IPC

```typescript
// apps/desktop/src/main/handlers/persona-handlers.ts

import { ipcMain } from 'electron';
import { personaService } from '../services/persona-service';

/**
 * Enregistre tous les handlers IPC pour les personas
 */
export function registerPersonaHandlers() {
  // GET ALL
  ipcMain.handle('personas:getAll', async () => {
    try {
      return await personaService.getAll();
    } catch (error) {
      console.error('Error in personas:getAll', error);
      throw error;
    }
  });

  // GET BY ID
  ipcMain.handle('personas:getById', async (_event, id: string) => {
    try {
      return await personaService.getById(id);
    } catch (error) {
      console.error(`Error in personas:getById (${id})`, error);
      throw error;
    }
  });

  // CREATE
  ipcMain.handle('personas:create', async (_event, data: CreatePersonaInput) => {
    try {
      return await personaService.create(data);
    } catch (error) {
      console.error('Error in personas:create', error);
      throw error;
    }
  });

  // UPDATE
  ipcMain.handle(
    'personas:update',
    async (_event, id: string, data: Partial<Persona>) => {
      try {
        return await personaService.update(id, data);
      } catch (error) {
        console.error(`Error in personas:update (${id})`, error);
        throw error;
      }
    }
  );

  // DELETE
  ipcMain.handle('personas:delete', async (_event, id: string) => {
    try {
      await personaService.delete(id);
      return { success: true };
    } catch (error) {
      console.error(`Error in personas:delete (${id})`, error);
      throw error;
    }
  });

  // SEARCH
  ipcMain.handle('personas:search', async (_event, query: string) => {
    try {
      return await personaService.search(query);
    } catch (error) {
      console.error(`Error in personas:search (${query})`, error);
      throw error;
    }
  });

  // TOGGLE FAVORITE
  ipcMain.handle('personas:toggleFavorite', async (_event, id: string) => {
    try {
      return await personaService.toggleFavorite(id);
    } catch (error) {
      console.error(`Error in personas:toggleFavorite (${id})`, error);
      throw error;
    }
  });

  // INCREMENT USAGE
  ipcMain.handle('personas:incrementUsage', async (_event, id: string) => {
    try {
      return await personaService.incrementUsage(id);
    } catch (error) {
      console.error(`Error in personas:incrementUsage (${id})`, error);
      throw error;
    }
  });
}
```

### 5.3 Hooks React pour IPC

```typescript
// apps/desktop/src/renderer/src/hooks/usePersonas.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function usePersonas() {
  return useQuery({
    queryKey: ['personas'],
    queryFn: async () => {
      return await window.electron.ipcRenderer.invoke('personas:getAll');
    },
    staleTime: 5 * 60 * 1000, // Cache 5 min
  });
}

export function usePersona(id: string) {
  return useQuery({
    queryKey: ['personas', id],
    queryFn: async () => {
      return await window.electron.ipcRenderer.invoke('personas:getById', id);
    },
    enabled: !!id, // Ne charge que si id fourni
  });
}

export function useCreatePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePersonaInput) => {
      return await window.electron.ipcRenderer.invoke('personas:create', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });
}

export function useUpdatePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Persona> }) => {
      return await window.electron.ipcRenderer.invoke('personas:update', id, data);
    },
    onSuccess: (_, variables) => {
      // Invalide le cache global ET le cache de cette persona
      queryClient.invalidateQueries({ queryKey: ['personas'] });
      queryClient.invalidateQueries({ queryKey: ['personas', variables.id] });
    },
  });
}

export function useDeletePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await window.electron.ipcRenderer.invoke('personas:delete', id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });
}
```

---

*Continué dans Partie 2: Services et Logique Métier*

---

**Fin de la Partie 1**

*Dernière mise à jour: Novembre 2025*
*Version du document: 1.0*
