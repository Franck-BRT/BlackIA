# BlackIA - Guide de Référence Rapide

**Version**: 0.2.0
**Date**: Novembre 2025

---

## 🎯 Raccourcis Clavier

### Navigation

| Raccourci | Action |
|-----------|--------|
| `Cmd + 1` | Ouvrir le Chat |
| `Cmd + 2` | Ouvrir les Workflows |
| `Cmd + 3` | Ouvrir les Personas |
| `Cmd + 4` | Ouvrir les Prompts |
| `Cmd + 5` | Ouvrir la Library |
| `Cmd + 6` | Ouvrir la Documentation |
| `Cmd + 7` | Ouvrir l'Editor |
| `Cmd + K` | Recherche globale |
| `Cmd + ,` | Ouvrir les Paramètres |

### Actions globales

| Raccourci | Action |
|-----------|--------|
| `Cmd + N` | Nouvelle conversation / workflow |
| `Cmd + W` | Fermer l'onglet actuel |
| `Cmd + S` | Sauvegarder (workflow, editor) |
| `Cmd + Q` | Quitter l'application |
| `Cmd + R` | Rafraîchir la page |

### Chat

| Raccourci | Action |
|-----------|--------|
| `Entrée` | Envoyer le message |
| `Shift + Entrée` | Nouvelle ligne |
| `Cmd + Shift + C` | Copier le dernier message IA |
| `Cmd + Shift + E` | Exporter la conversation |
| `@` | Mention de persona |
| `/` | Insertion de prompt |

### Editor

| Raccourci | Action |
|-----------|--------|
| `Cmd + B` | Gras |
| `Cmd + I` | Italique |
| `Cmd + K` | Insérer un lien |
| `Cmd + Shift + C` | Code inline |
| `Cmd + Shift + K` | Bloc de code |
| `Cmd + Shift + G` | Générer avec IA |
| `Cmd + /` | Commenter/décommenter |

---

## 💻 Commandes CLI

### Développement

```bash
# Lancer en mode développement
pnpm desktop:dev

# Build complet
pnpm build

# Tests
pnpm test
pnpm test:coverage

# Linting
pnpm lint
pnpm format

# Vérification
pnpm verify
```

### Scripts personnalisés

```bash
# Development avec options
./scripts/dev.sh                # Lancement standard
./scripts/dev.sh --fresh        # Rebuild complet
./scripts/dev.sh --no-build     # Skip build (rapide)
./scripts/dev.sh --clean        # Nettoie avant

# Build DMG
./scripts/build-dmg.sh
./scripts/build-dmg.sh --clean
./scripts/build-dmg.sh --arch universal
./scripts/build-dmg.sh --sign

# Vérification complète
./scripts/verify-setup.sh

# Setup Python
./scripts/setup-python-venv.sh

# Nettoyage complet
./scripts/clean-reinstall.sh
```

### Ollama

```bash
# Lancer Ollama
ollama serve

# Lister les modèles
ollama list

# Télécharger un modèle
ollama pull llama3.2:3b
ollama pull mistral:7b
ollama pull nomic-embed-text

# Tester un modèle
ollama run llama3.2:3b

# Supprimer un modèle
ollama rm llama3.2:3b

# Vérifier l'API
curl http://localhost:11434/api/tags
```

### Python / RAG

```bash
# Activer l'environnement virtuel
source venv/bin/activate

# Installer les dépendances
pip install -r apps/desktop/src/python/requirements.txt

# Tester l'importation
python3 -c "import torch; print(torch.__version__)"
python3 -c "import sentence_transformers"
python3 -c "import lancedb"
python3 -c "from colpali_engine.models import ColPali"
```

---

## 📡 API IPC (Handlers)

### Personas

```typescript
// GET
'personas:getAll' → Persona[]
'personas:getById' → Persona
'personas:search' → Persona[]
'personas:filterByCategory' → Persona[]
'personas:getFavorites' → Persona[]

// WRITE
'personas:create' → Persona
'personas:update' → Persona
'personas:delete' → void
'personas:toggleFavorite' → Persona
'personas:incrementUsage' → Persona

// BULK
'personas:import' → Persona[]
'personas:export' → void
```

### Prompts

```typescript
'prompts:getAll' → Prompt[]
'prompts:getById' → Prompt
'prompts:create' → Prompt
'prompts:update' → Prompt
'prompts:delete' → void
'prompts:search' → Prompt[]
```

### Workflows

```typescript
'workflows:getAll' → Workflow[]
'workflows:getById' → Workflow
'workflows:create' → Workflow
'workflows:update' → Workflow
'workflows:delete' → void
'workflows:execute' → ExecutionResult
'workflows:getVersions' → WorkflowVersion[]
'workflows:createVersion' → WorkflowVersion
'workflows:restoreVersion' → Workflow
```

### Chat

```typescript
'conversations:getAll' → Conversation[]
'conversations:create' → Conversation
'conversations:update' → Conversation
'conversations:delete' → void
'messages:getByConversation' → Message[]
'messages:create' → Message
'chat:send' → void (+ events 'chat:token')
```

### RAG / Library

```typescript
'libraries:getAll' → Library[]
'libraries:create' → Library
'library:addDocument' → LibraryDocument
'library:indexDocument' → IndexResult
'rag:search' → RAGSearchResult[]
'attachments:upload' → Attachment
'attachments:index' → void
```

### Backends

```typescript
'backends:getStatus' → BackendStatus[]
'backends:switch' → void
'backends:getModels' → Model[]
'ollama:pullModel' → void (+ events 'ollama:pull-progress')
```

---

## 🎨 Types TypeScript principaux

### Persona

```typescript
interface Persona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
  fewShots?: FewShotExample[] | null;
  avatar: string;
  color: 'purple' | 'blue' | 'pink' | 'green' | 'orange';
  category?: string | null;
  tags: string[];
  isDefault: boolean;
  isFavorite: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface FewShotExample {
  id: string;
  userMessage: string;
  assistantResponse: string;
}
```

### Workflow

```typescript
interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  group?: string | null;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface WorkflowNode {
  id: string;
  type: 'input' | 'output' | 'aiPrompt' | 'condition' | 'loop' | 'transform' | 'switch' | 'extract';
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}
```

### RAG

```typescript
interface Attachment {
  id: string;
  conversationId?: string;
  filename: string;
  filepath: string;
  mimeType: string;
  filesize: number;
  ragMode: 'none' | 'text' | 'vision' | 'hybrid';
  isIndexedText: boolean;
  textEmbeddingModel?: string;
  textChunkCount?: number;
  isIndexedVision: boolean;
  visionEmbeddingModel?: string;
  visionPatchCount?: number;
  pageCount?: number;
  thumbnail?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

interface RAGSearchParams {
  query: string;
  libraryIds?: string[];
  mode: 'text' | 'vision' | 'hybrid';
  topK?: number;
  minScore?: number;
}

interface RAGSearchResult {
  documentId: string;
  chunkId: string;
  content: string;
  score: number;
  metadata: {
    filename: string;
    page?: number;
    chunkIndex?: number;
  };
}
```

---

## 📁 Emplacements importants

### Données utilisateur (macOS)

```
~/Library/Application Support/BlackIA/
├── database/
│   └── blackia.db                  # Base de données SQLite
├── vector-store/                   # LanceDB (embeddings RAG)
│   ├── text_embeddings/
│   └── vision_embeddings/
├── libraries/                      # Documents utilisateur
│   └── [library-id]/
│       ├── documents/
│       └── thumbnails/
├── logs/                           # Logs applicatifs
│   ├── main.log
│   ├── renderer.log
│   └── python.log
└── cache/                          # Cache temporaire
```

### Projet développeur

```
/path/to/BlackIA/
├── apps/desktop/
│   ├── src/
│   │   ├── main/                   # Main process (Node.js)
│   │   ├── renderer/               # Frontend (React)
│   │   ├── python/                 # Services Python
│   │   └── preload/                # Preload script
│   ├── dist/                       # Build output
│   └── release/                    # DMG files
├── packages/                       # Workspace packages
│   ├── ollama/                     # Ollama client
│   ├── shared/                     # Types partagés
│   └── ui/                         # Composants UI
├── scripts/                        # Scripts de build
└── documentation/                  # Cette doc
```

---

## 🔧 Configuration rapide

### tsconfig.json (raccourci)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "jsx": "react-jsx",
    "strict": true,
    "paths": {
      "@/*": ["./src/*"],
      "@blackia/shared": ["./packages/shared/src"]
    }
  }
}
```

### vite.config.ts (raccourci)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173 }
});
```

### electron-builder.yml (raccourci)

```yaml
appId: com.blackroom.blackia
productName: BlackIA
mac:
  category: public.app-category.productivity
  target: [dmg]
  icon: resources/icon.icns
```

---

## 🐛 Debug rapide

### Logs en temps réel

```bash
# Main process
tail -f ~/Library/Application\ Support/BlackIA/logs/main.log

# Python
tail -f ~/Library/Application\ Support/BlackIA/logs/python.log

# Tous les erreurs
grep -r "ERROR" ~/Library/Application\ Support/BlackIA/logs/
```

### Vérifications système

```bash
# Vérifier les ports
lsof -i :5173    # Vite dev server
lsof -i :11434   # Ollama

# Vérifier les processus
ps aux | grep -i electron
ps aux | grep -i python
ps aux | grep -i ollama

# Espace disque
du -h ~/Library/Application\ Support/BlackIA/database/blackia.db
du -sh ~/Library/Application\ Support/BlackIA/vector-store/
```

### Reset complet

```bash
# ⚠️ ATTENTION : Supprime TOUTES les données

# Arrêter l'app d'abord !

# Supprimer les données
rm -rf ~/Library/Application\ Support/BlackIA/

# Au prochain lancement, tout est recréé
```

---

## 📊 Benchmarks & Limites

### Modèles Ollama recommandés

| Modèle | Taille | RAM | Vitesse | Usage |
|--------|--------|-----|---------|-------|
| llama3.2:1b | 1 GB | 4 GB | ⚡⚡⚡⚡⚡ | Tests rapides |
| llama3.2:3b | 2 GB | 8 GB | ⚡⚡⚡⚡ | Usage quotidien |
| mistral:7b | 4 GB | 16 GB | ⚡⚡⚡ | Équilibré |
| llama3.1:70b | 39 GB | 64 GB | ⚡ | Production |

### Performances RAG

| Mode RAG | Indexation | Recherche | RAM | Précision |
|----------|------------|-----------|-----|-----------|
| Text | ~1s/page | ~50ms | 2 GB | ⭐⭐⭐ |
| Vision | ~5s/page | ~200ms | 8 GB | ⭐⭐⭐⭐ |
| Hybrid | ~6s/page | ~250ms | 10 GB | ⭐⭐⭐⭐⭐ |

### Limites système

```
Maximum simultané :
• Conversations : Illimité (limité par DB size)
• Workflows : Illimité
• Documents RAG : ~10,000 (performance optimale)
• Chunks par document : ~1,000
• Taille document : 100 MB (recommandé < 10 MB)

Context window (dépend du modèle) :
• llama3.2:3b : 8,192 tokens (~6,000 mots)
• mistral:7b : 32,768 tokens (~24,000 mots)
• llama3.1:70b : 128,000 tokens (~96,000 mots)
```

---

## 🌐 URLs et Endpoints

### Ollama API

```
Base URL : http://localhost:11434

Endpoints :
POST /api/chat         # Chat avec streaming
POST /api/generate     # Génération texte
POST /api/embeddings   # Embeddings
GET  /api/tags         # Liste modèles
POST /api/pull         # Télécharger modèle
GET  /api/version      # Version Ollama
```

### MLX (Apple Silicon)

```
Local Python module import :
from mlx_lm import load, generate

Pas d'API HTTP (import direct)
```

---

## 📝 Snippets de code courants

### Appeler l'IPC depuis React

```typescript
// GET data
const personas = await window.electron.ipcRenderer.invoke('personas:getAll');

// POST data
const newPersona = await window.electron.ipcRenderer.invoke(
  'personas:create',
  {
    name: 'Expert Docker',
    description: '...',
    systemPrompt: '...',
    // ...
  }
);

// Écouter un événement
useEffect(() => {
  const unsubscribe = window.electron.ipcRenderer.on(
    'chat:token',
    (token) => {
      setMessage(prev => prev + token);
    }
  );

  return () => unsubscribe();
}, []);
```

### Créer un service

```typescript
// apps/desktop/src/main/services/my-service.ts
export class MyService {
  async getAll() {
    const results = await db.select().from(myTable);
    return results;
  }

  async create(data: CreateInput) {
    const newItem = {
      id: randomUUID(),
      ...data,
      createdAt: new Date(),
    };
    await db.insert(myTable).values(newItem);
    return newItem;
  }
}

export const myService = new MyService();
```

### Enregistrer un handler IPC

```typescript
// apps/desktop/src/main/handlers/my-handlers.ts
import { ipcMain } from 'electron';
import { myService } from '../services/my-service';

export function registerMyHandlers() {
  ipcMain.handle('my:getAll', async () => {
    return await myService.getAll();
  });

  ipcMain.handle('my:create', async (_event, data) => {
    return await myService.create(data);
  });
}

// Dans main/index.ts
import { registerMyHandlers } from './handlers/my-handlers';

app.whenReady().then(() => {
  registerMyHandlers();
  // ... autres handlers
});
```

### Hook React personnalisé

```typescript
// apps/desktop/src/renderer/src/hooks/useMyData.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useMyData() {
  return useQuery({
    queryKey: ['myData'],
    queryFn: async () => {
      return await window.electron.ipcRenderer.invoke('my:getAll');
    },
  });
}

export function useCreateMyData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInput) => {
      return await window.electron.ipcRenderer.invoke('my:create', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myData'] });
    },
  });
}
```

---

**Fin du Guide de Référence Rapide**

*Pour plus de détails, consultez les manuels complets.*

*Dernière mise à jour: Novembre 2025*
*Version du document: 1.0*
