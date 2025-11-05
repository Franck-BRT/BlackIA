# Décisions Techniques - BlackIA
## Document de Référence Architecturale

**Version:** 1.0
**Date:** 5 Novembre 2025
**Statut:** Validé

---

## 1. Décisions Prioritaires Validées

### 1.1 Framework Desktop
**Décision:** Electron
**Justification:**
- Écosystème mature et stable
- Excellente intégration avec Node.js/Python
- Support complet macOS Apple Silicon
- Facilité d'intégration avec Ollama et MLX
- Outils de développement excellents

**Alternatives évaluées:**
- ❌ Tauri : Excellent mais écosystème moins mature pour nos besoins complexes

### 1.2 Framework UI
**Décision:** React 18+ avec TypeScript
**Justification:**
- Écosystème le plus riche pour composants complexes
- **ReactFlow** : Meilleure solution pour workflow editor
- **Monaco Editor** : Intégration React excellente
- **@dnd-kit** : Drag & drop moderne
- TypeScript support de première classe
- Communauté massive pour projet open source
- Performance avec React 18 (Concurrent Features)

**Stack UI complète:**
```
- React 18.x + TypeScript 5.x
- TailwindCSS 3.x (styling)
- shadcn/ui (composants UI modernes)
- ReactFlow (workflow editor)
- Monaco Editor (éditeur de code)
- @dnd-kit/core (drag & drop)
- Zustand (state management léger)
- TanStack Query (data fetching)
```

### 1.3 Stratégie IA
**Décision:** Ollama ET MLX dès le MVP
**Justification:**
- **Ollama** : LLM conversationnel principal (chat, génération)
- **MLX** : Embeddings locaux, fine-tuning, modèles custom
- Fallback mutuel pour résilience
- Optimisation maximale Apple Silicon

**Architecture IA:**
```
┌─────────────────────────────────────┐
│         BlackIA Core                │
├─────────────────────────────────────┤
│  AI Router (intelligent dispatch)   │
├──────────────┬──────────────────────┤
│   Ollama     │        MLX           │
│   - Chat     │   - Embeddings       │
│   - Generate │   - Classification   │
│   - Vision   │   - Fine-tuning      │
└──────────────┴──────────────────────┘
```

### 1.4 Complexité Workflow MVP
**Décision:** Support complet (chaînage + logique)
**Justification:**
- Différentiateur clé du produit
- Nécessaire pour cas d'usage avancés
- ReactFlow permet implémentation progressive

**Nœuds MVP:**
```
1. Nœuds de base:
   - Input (texte, fichier, variable)
   - Output (texte, fichier, export)
   - AI Prompt (génération)
   - Transform (manipulation données)

2. Nœuds logiques:
   - If/Else (conditions)
   - Loop (itérations)
   - Switch (multi-branches)

3. Nœuds avancés (Phase 2):
   - Parallel (exécution parallèle)
   - Merge (fusion de branches)
   - API Call (intégrations externes)
```

### 1.5 Modèle de Licence
**Décision:** Open Source (MIT) + Modules Propriétaires
**Justification:**
- Transparence et adoption communautaire
- Contributions externes bienvenues
- Monétisation via modules premium

**Répartition:**

**Open Source (MIT):**
- ✅ Core BlackIA
- ✅ Module Chat
- ✅ Workflow Engine (base)
- ✅ Bibliothèque Prompts
- ✅ Bibliothèque Personas
- ✅ Intégration Ollama
- ✅ Module Logs (base)
- ✅ API publique

**Propriétaire (Premium):**
- 💎 Module MLX avancé (fine-tuning)
- 💎 Workflow Engine (nœuds avancés)
- 💎 Générateurs "parfaits" (IA optimisée)
- 💎 Module MCP Server (complet)
- 💎 Projets Code (features avancées)
- 💎 Analytics et insights
- 💎 Sync cloud (optionnel)
- 💎 Support prioritaire

---

## 2. Stack Technique Complète

### 2.1 Frontend (Renderer Process)
```json
{
  "framework": "React 18.3 + TypeScript 5.3",
  "ui": {
    "styling": "TailwindCSS 3.4",
    "components": "shadcn/ui",
    "icons": "lucide-react"
  },
  "features": {
    "workflow": "ReactFlow 11.x",
    "editor": "@monaco-editor/react 4.x",
    "dragDrop": "@dnd-kit/core 6.x",
    "state": "Zustand 4.x",
    "data": "@tanstack/react-query 5.x",
    "forms": "react-hook-form + zod",
    "routing": "react-router-dom 6.x"
  },
  "build": "Vite 5.x"
}
```

### 2.2 Backend (Main Process + Services)
```json
{
  "runtime": "Electron 28+",
  "mainProcess": "Node.js 20+ (TypeScript)",
  "aiServices": {
    "ollama": {
      "client": "@ollama/ollama (officiel)",
      "integration": "embedded + remote"
    },
    "mlx": {
      "binding": "Python bridge (IPC)",
      "package": "mlx-lm, mlx-embeddings"
    }
  },
  "database": {
    "sql": "better-sqlite3 (SQLite)",
    "vector": "lancedb (embeddings local)",
    "orm": "Drizzle ORM (TypeScript-native)"
  },
  "ipc": "electron-trpc (type-safe IPC)"
}
```

### 2.3 Services Python
```json
{
  "purpose": "MLX, AI orchestration",
  "version": "Python 3.11+",
  "packages": [
    "mlx",
    "mlx-lm",
    "numpy",
    "sentence-transformers",
    "fastapi (API interne)",
    "uvicorn"
  ],
  "communication": "HTTP + IPC",
  "packaging": "PyInstaller (embedded dans Electron)"
}
```

### 2.4 Build & Dev Tools
```json
{
  "packageManager": "pnpm (performant)",
  "builder": "electron-builder",
  "linter": "ESLint + Prettier",
  "typecheck": "TypeScript strict mode",
  "testing": {
    "unit": "Vitest",
    "integration": "Playwright",
    "e2e": "Playwright"
  },
  "ci": "GitHub Actions"
}
```

---

## 3. Architecture Détaillée

### 3.1 Structure du Projet
```
BlackIA/
├── apps/
│   ├── desktop/              # Application Electron
│   │   ├── src/
│   │   │   ├── main/        # Main process (Node.js/TS)
│   │   │   ├── renderer/    # React app
│   │   │   └── preload/     # Preload scripts
│   │   └── electron-builder.yml
│   └── python-service/       # Service MLX (Python)
│       ├── main.py
│       ├── mlx_engine/
│       └── requirements.txt
├── packages/
│   ├── core/                 # Core business logic
│   ├── ui/                   # Composants UI partagés
│   ├── shared/               # Types, utils partagés
│   └── proprietary/          # Modules propriétaires
│       ├── mlx-advanced/
│       ├── workflow-pro/
│       └── mcp-server/
├── docs/                     # Documentation
├── scripts/                  # Scripts de build/dev
└── tests/                    # Tests E2E
```

### 3.2 Architecture en Couches

```
┌─────────────────────────────────────────┐
│        UI Layer (React)                 │
│  Chat │ Workflow │ Prompts │ Projects   │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│    Application Layer (TypeScript)       │
│  State Management │ Business Logic      │
└────────────────┬────────────────────────┘
                 │
┌────────────────┴────────────────────────┐
│      Service Layer (Main Process)       │
│  AI Router │ DB │ MCP │ Workflow Engine │
└────────┬───────────────┬────────────────┘
         │               │
    ┌────┴────┐     ┌────┴─────┐
    │ Ollama  │     │   MLX    │
    │ Service │     │ (Python) │
    └─────────┘     └──────────┘
```

### 3.3 Communication Inter-Process

```typescript
// electron-trpc pour IPC type-safe
// renderer → main
import { trpc } from './trpc';

const result = await trpc.ai.chat.mutate({
  message: "Hello",
  persona: "expert-python"
});

// main → python service
// Via HTTP (FastAPI) ou stdio
const embeddings = await mlxService.embed(text);
```

---

## 4. Intégration Ollama + MLX

### 4.1 Ollama Integration

**Mode Embedded:**
```typescript
import { Ollama } from '@ollama/ollama';

class OllamaService {
  private client: Ollama;

  async start() {
    // Démarrer Ollama embedded (binaire inclus)
    await this.startOllamaProcess();
    this.client = new Ollama({ host: 'http://localhost:11434' });
  }

  async chat(model: string, messages: Message[]) {
    return this.client.chat({ model, messages, stream: true });
  }
}
```

**Mode Remote:**
```typescript
// Connexion à instance externe
const ollama = new Ollama({
  host: userConfig.ollamaHost // ex: http://192.168.1.100:11434
});
```

### 4.2 MLX Integration

**Python Service (FastAPI):**
```python
from fastapi import FastAPI
from mlx_lm import load, generate
import mlx.core as mx

app = FastAPI()

@app.post("/generate")
async def generate_text(prompt: str, model: str):
    model, tokenizer = load(model)
    response = generate(model, tokenizer, prompt)
    return {"text": response}

@app.post("/embed")
async def embed_text(text: str):
    # Embeddings avec MLX
    embeddings = embed_model.encode(text)
    return {"embeddings": embeddings.tolist()}
```

**Electron Bridge:**
```typescript
import { spawn } from 'child_process';

class MLXService {
  private pythonProcess: ChildProcess;

  async start() {
    // Démarrer service Python
    this.pythonProcess = spawn('python', ['service/main.py']);
  }

  async embed(text: string): Promise<number[]> {
    const response = await fetch('http://localhost:8000/embed', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
    return response.json();
  }
}
```

### 4.3 AI Router (Intelligent Dispatch)

```typescript
class AIRouter {
  // Décide automatiquement : Ollama ou MLX ?
  async process(task: AITask) {
    switch (task.type) {
      case 'chat':
      case 'generate':
        return this.ollama.generate(task);

      case 'embed':
      case 'classify':
        return this.mlx.process(task);

      case 'fine-tune':
        if (this.hasPremium()) {
          return this.mlx.fineTune(task);
        }
        throw new Error('Premium required');
    }
  }
}
```

---

## 5. Base de Données

### 5.1 Schéma SQLite (Drizzle ORM)

```typescript
// schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  personaId: text('persona_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull(),
  role: text('role', { enum: ['user', 'assistant'] }),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
});

export const prompts = sqliteTable('prompts', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  content: text('content').notNull(),
  category: text('category'),
  tags: text('tags', { mode: 'json' }).$type<string[]>(),
  variables: text('variables', { mode: 'json' }).$type<Variable[]>()
});

export const personas = sqliteTable('personas', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  systemPrompt: text('system_prompt').notNull(),
  temperature: integer('temperature'),
  model: text('model')
});

export const workflows = sqliteTable('workflows', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  nodes: text('nodes', { mode: 'json' }).$type<WorkflowNode[]>(),
  edges: text('edges', { mode: 'json' }).$type<WorkflowEdge[]>()
});
```

### 5.2 Vector Database (LanceDB)

```typescript
import lancedb from 'lancedb';

class VectorStore {
  private db: lancedb.Connection;

  async initialize() {
    this.db = await lancedb.connect('./data/vectors');

    // Table pour embeddings de prompts
    await this.db.createTable('prompt_embeddings', [
      { id: 'string', embedding: 'vector[384]', promptId: 'string' }
    ]);
  }

  async searchSimilarPrompts(query: string, limit = 5) {
    const embedding = await mlxService.embed(query);
    return this.db
      .table('prompt_embeddings')
      .search(embedding)
      .limit(limit)
      .execute();
  }
}
```

---

## 6. Module Workflow - Spécifications

### 6.1 ReactFlow Integration

```typescript
import ReactFlow, { Node, Edge } from 'reactflow';

// Type des nœuds
type BlackIANode =
  | InputNode
  | AIPromptNode
  | ConditionNode
  | LoopNode
  | OutputNode;

// Composant Workflow Editor
export function WorkflowEditor() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Custom node types
  const nodeTypes = {
    input: InputNodeComponent,
    aiPrompt: AIPromptNodeComponent,
    condition: ConditionNodeComponent,
    loop: LoopNodeComponent,
    output: OutputNodeComponent
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
    />
  );
}
```

### 6.2 Workflow Execution Engine

```typescript
class WorkflowEngine {
  async execute(workflow: Workflow, inputs: Record<string, any>) {
    const context = new ExecutionContext(inputs);
    const startNode = workflow.nodes.find(n => n.type === 'start');

    return this.executeNode(startNode, context, workflow);
  }

  private async executeNode(
    node: WorkflowNode,
    context: ExecutionContext,
    workflow: Workflow
  ) {
    // Exécuter le nœud
    const result = await this.runNodeLogic(node, context);
    context.setVariable(node.id, result);

    // Trouver le prochain nœud
    const nextEdge = workflow.edges.find(e => e.source === node.id);

    if (!nextEdge) return context.getAllVariables();

    // Conditions : évaluer quelle branche prendre
    if (node.type === 'condition') {
      const condition = node.data.condition;
      const branch = this.evaluateCondition(condition, context);
      nextEdge = workflow.edges.find(
        e => e.source === node.id && e.sourceHandle === branch
      );
    }

    const nextNode = workflow.nodes.find(n => n.id === nextEdge.target);
    return this.executeNode(nextNode, context, workflow);
  }
}
```

---

## 7. Sécurité & Sandboxing

### 7.1 Electron Security

```typescript
// main.ts
app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    webPreferences: {
      nodeIntegration: false,          // ✅ Désactivé
      contextIsolation: true,           // ✅ Activé
      sandbox: true,                    // ✅ Activé
      preload: path.join(__dirname, 'preload.js')
    }
  });
});
```

### 7.2 Code Execution Sandbox (Module Projets)

```typescript
import { VM } from 'vm2'; // Sandbox JavaScript sécurisé

class CodeExecutor {
  async executeUserCode(code: string, timeout = 5000) {
    const vm = new VM({
      timeout,
      sandbox: {
        console: this.createSafeConsole()
      }
    });

    try {
      return vm.run(code);
    } catch (error) {
      return { error: error.message };
    }
  }
}
```

---

## 8. Distribution & Packaging

### 8.1 Electron Builder Config

```yaml
# electron-builder.yml
appId: com.blackroomtech.blackia
productName: BlackIA
copyright: Copyright © 2025 Black Room Technologies

mac:
  category: public.app-category.developer-tools
  target:
    - target: dmg
      arch: [arm64, x64]
    - target: zip
      arch: [arm64]
  icon: build/icon.icns
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist

dmg:
  sign: false
  contents:
    - x: 410
      y: 150
      type: link
      path: /Applications
    - x: 130
      y: 150
      type: file

files:
  - from: dist
    filter:
      - "**/*"
  - python-service/**/*  # Service Python embarqué
  - ollama-binary/**/*   # Ollama binaire (optionnel)
```

### 8.2 Code Signing & Notarization

```bash
# Sign et notarize pour macOS
export APPLE_ID="your@email.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"

# Build + sign + notarize
pnpm build:mac
```

---

## 9. Performance & Optimisation

### 9.1 Métriques Cibles

| Métrique | Cible | Priorité |
|----------|-------|----------|
| **Cold start** | < 3s | P0 |
| **UI response** | < 50ms | P0 |
| **Chat first token** | < 500ms | P1 |
| **Workflow execution** | Dépend complexité | P1 |
| **Memory usage** | < 500MB idle | P1 |
| **Install size** | < 800MB (sans modèles) | P2 |

### 9.2 Optimisations Apple Silicon

```typescript
// Vérifier architecture et optimiser
import { arch } from 'os';

if (arch() === 'arm64') {
  // Utiliser MLX (natif Apple Silicon)
  aiEngine.setPreferredBackend('mlx');
} else {
  // Fallback Ollama CPU
  aiEngine.setPreferredBackend('ollama');
}
```

### 9.3 Lazy Loading

```typescript
// Code splitting React
const WorkflowEditor = lazy(() => import('./modules/workflow/Editor'));
const CodeEditor = lazy(() => import('./modules/projects/CodeEditor'));

// Dans le router
<Suspense fallback={<LoadingSpinner />}>
  <Route path="/workflow" element={<WorkflowEditor />} />
</Suspense>
```

---

## 10. Tests Strategy

### 10.1 Pyramide de Tests

```
      /\
     /E2E\        ← Playwright (5%)
    /──────\
   /  INTEG \     ← Vitest + Electron (15%)
  /──────────\
 /    UNIT    \   ← Vitest (80%)
/______________\
```

### 10.2 Exemples de Tests

```typescript
// Unit test (Vitest)
describe('AIRouter', () => {
  it('should route chat to Ollama', async () => {
    const router = new AIRouter(mockOllama, mockMLX);
    const result = await router.process({ type: 'chat', message: 'Hello' });
    expect(mockOllama.chat).toHaveBeenCalled();
  });
});

// Integration test (Electron)
describe('Workflow Execution', () => {
  it('should execute simple workflow', async () => {
    const workflow = createTestWorkflow();
    const engine = new WorkflowEngine();
    const result = await engine.execute(workflow, { input: 'test' });
    expect(result.output).toBe('expected');
  });
});

// E2E test (Playwright)
test('create and save prompt', async ({ page }) => {
  await page.goto('/prompts');
  await page.click('button:has-text("New Prompt")');
  await page.fill('input[name="name"]', 'Test Prompt');
  await page.fill('textarea[name="content"]', 'Content');
  await page.click('button:has-text("Save")');
  await expect(page.locator('text=Test Prompt')).toBeVisible();
});
```

---

## 11. Roadmap Technique

### Phase 1: Foundation (Semaines 1-4)
- ✅ Setup projet (pnpm workspace, Electron)
- ✅ Architecture de base (TypeScript, React)
- ✅ Intégration Ollama basique
- ✅ Module Chat MVP
- ✅ Base de données SQLite

### Phase 2: Core Features (Semaines 5-10)
- 🔄 Bibliothèque Prompts/Personas
- 🔄 Workflow Editor (ReactFlow)
- 🔄 Workflow Engine (exécution)
- 🔄 Intégration MLX (embeddings)
- 🔄 Module Logs

### Phase 3: Advanced (Semaines 11-16)
- ⏳ Module Projets (Monaco Editor)
- ⏳ Générateurs IA
- ⏳ MCP Server
- ⏳ Modules propriétaires
- ⏳ Optimisations performances

### Phase 4: Polish (Semaines 17-20)
- ⏳ UI/UX refinement
- ⏳ Tests complets
- ⏳ Documentation
- ⏳ Build & distribution
- ⏳ Beta testing

---

## 12. Risques Techniques Identifiés

| Risque | Impact | Mitigation |
|--------|--------|------------|
| **Ollama embed complexe** | Moyen | Utiliser mode remote comme fallback |
| **MLX Python bridge latence** | Moyen | Cache + async operations |
| **ReactFlow perf (100+ nodes)** | Moyen | Virtualisation, lazy rendering |
| **Electron bundle size** | Faible | Code splitting, compression |
| **Apple notarization délais** | Faible | Automatiser CI/CD early |

---

## Conclusion

Stack validée et prête pour développement :
- ✅ **Electron + React + TypeScript**
- ✅ **Ollama + MLX** (dual AI backend)
- ✅ **ReactFlow** (workflow)
- ✅ **SQLite + LanceDB** (data)
- ✅ **Licence mixte** (open source + propriétaire)

**Prochaine étape:** Initialisation du projet et setup de l'architecture.
