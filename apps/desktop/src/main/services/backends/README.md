# Backend System Architecture

Système multi-backend pour supporter MLX, Ollama External et Ollama Embedded.

## 📁 Structure

```
backends/
├── README.md                          # Ce fichier
├── index.ts                           # Exports publics
├── backend-types.ts                   # Types et interfaces
├── backend-interface.ts               # Interface AIBackend
├── backend-manager.ts                 # Orchestrateur principal
├── initialize-backends.ts             # Initialisation au démarrage
├── ollama/
│   └── ollama-external-backend.ts    # Ollama externe (Phase 1) ✅
├── mlx/                              # MLX backend (Phase 2) 🚧
│   ├── mlx-backend.ts
│   ├── mlx_server.py
│   └── ...
└── ollama/
    ├── ollama-embedded-backend.ts    # Ollama embarqué (Phase 3) 📅
    └── ollama-downloader.ts
```

## 🎯 Phases d'implémentation

### Phase 1: Architecture de base ✅ TERMINÉE

**Objectif**: Créer l'architecture et migrer le code Ollama existant

**Fichiers créés**:
- ✅ `backend-types.ts` - Types communs
- ✅ `backend-interface.ts` - Interface AIBackend
- ✅ `backend-manager.ts` - Gestionnaire avec fallback
- ✅ `ollama-external-backend.ts` - Migration du code Ollama
- ✅ `text-rag-service-v2.ts` - Service RAG utilisant le Backend Manager
- ✅ `initialize-backends.ts` - Initialisation

**Statut**: ✅ Architecture complète, prête pour Phase 2

### Phase 2: MLX Integration 🚧 PROCHAINE

**Objectif**: Ajouter le support MLX pour Apple Silicon

**À créer**:
- `mlx/mlx-backend.ts` - Backend MLX TypeScript
- `mlx/mlx_server.py` - Serveur Python MLX
- `mlx/mlx_embeddings.py` - Génération d'embeddings
- `mlx/mlx_vision.py` - Vision avec mlx-vlm
- `mlx/mlx_chat.py` - Chat avec mlx-lm (optionnel)

**Modèles MLX recommandés**:
- Embeddings: `sentence-transformers/all-MiniLM-L6-v2` (384 dims, 80MB)
- Vision: `mlx-community/pixtral-12b-4bit` (déjà utilisé)
- Chat: `mlx-community/Llama-3.2-3B-Instruct-4bit` (optionnel)

### Phase 3: Ollama Embedded 📅 FUTURE

**Objectif**: Embarquer Ollama dans l'application

**À créer**:
- `ollama/ollama-embedded-backend.ts` - Gestion du processus Ollama
- `ollama/ollama-downloader.ts` - Téléchargement du binaire
- Scripts de packaging pour inclure Ollama dans le bundle

**Défis**:
- Taille du bundle (~700MB avec Ollama + modèles)
- Gestion des processus multi-plateforme
- Téléchargement des modèles

### Phase 4: UI & Settings 📅 FUTURE

**Objectif**: Interface utilisateur pour gérer les backends

**À créer**:
- Panneau Settings pour sélectionner le backend
- Indicateurs de statut des backends
- Gestion des modèles (téléchargement, suppression)
- Tests de performance comparatifs

## 📖 Usage

### Initialisation (dans main.ts)

```typescript
import { initializeBackends, shutdownBackends } from './services/backends/initialize-backends';

// Au démarrage de l'app
app.on('ready', async () => {
  await initializeBackends();
  // ... reste du code de démarrage
});

// À la fermeture
app.on('before-quit', async () => {
  await shutdownBackends();
});
```

### Utilisation dans les services

```typescript
import { backendManager } from './services/backends';

// Générer un embedding
const response = await backendManager.generateEmbedding({
  text: 'Hello world',
  model: 'nomic-embed-text',
});

// Chat
const stream = await backendManager.chat({
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
  model: 'llama3',
});

// Vision
const vision = await backendManager.processImage({
  image: base64Image,
  prompt: 'Describe this image',
  model: 'llava',
});
```

### Basculer entre backends

```typescript
// Manuellement
await backendManager.switchBackend('mlx');

// Via settings
await backendManager.updateSettings({
  preferredBackend: 'mlx',
});
```

### Vérifier le statut

```typescript
const activeBackend = backendManager.getActiveBackendType();
console.log(`Active backend: ${activeBackend}`);

const allStatuses = await backendManager.getAllBackendStatus();
for (const [type, status] of allStatuses) {
  console.log(`${type}: ${status.available ? 'Available' : 'Unavailable'}`);
}
```

## 🔄 Migration depuis l'ancien système

### Avant (ancien text-rag-service.ts)

```typescript
import { textRAGService } from './services/text-rag-service';

const result = await textRAGService.indexDocument({
  text: 'Document content',
  attachmentId: 'doc-123',
  model: 'nomic-embed-text',
});
```

### Après (text-rag-service-v2.ts)

```typescript
import { textRAGServiceV2 } from './services/text-rag-service-v2';

// Initialiser une fois au démarrage
await initializeBackends();

// Utiliser normalement (API identique)
const result = await textRAGServiceV2.indexDocument({
  text: 'Document content',
  attachmentId: 'doc-123',
  model: 'nomic-embed-text',
});

// Bonus: Basculer de backend si nécessaire
await textRAGServiceV2.switchBackend('mlx');
```

## 🎨 Architecture des backends

```
┌─────────────────────────────────────────────────────┐
│           BackendManager (Orchestrateur)             │
│  - Sélection du backend actif                       │
│  - Fallback automatique                             │
│  - API unifiée (chat, embed, vision)                │
└─────────────────┬───────────────────────────────────┘
                  │
      ┌───────────┼───────────┐
      │           │           │
┌─────▼────┐ ┌───▼─────┐ ┌──▼──────────┐
│   MLX    │ │ Ollama  │ │   Ollama    │
│ Backend  │ │ External│ │  Embedded   │
│          │ │ Backend │ │   Backend   │
│ Python   │ │         │ │             │
│ Process  │ │ HTTP    │ │ Managed     │
│          │ │ API     │ │ Process     │
└──────────┘ └─────────┘ └─────────────┘
     │            │             │
     │            │             │
     ▼            ▼             ▼
  Direct      External      Bundled
   Call        Ollama       Ollama
```

## 🚀 Avantages de cette architecture

1. **Flexibilité**: Basculer entre backends sans changer le code
2. **Fallback**: Si un backend échoue, bascule automatiquement
3. **Performance**: MLX optimisé pour Apple Silicon
4. **Simplicité**: API unifiée pour tous les backends
5. **Évolutivité**: Facile d'ajouter de nouveaux backends

## 📊 Comparaison des backends

| Feature          | MLX         | Ollama External | Ollama Embedded |
|------------------|-------------|-----------------|-----------------|
| Performance      | ⭐⭐⭐⭐⭐   | ⭐⭐⭐          | ⭐⭐⭐          |
| Setup            | Python req  | User installs   | Auto-bundled    |
| Bundle Size      | ~200MB      | 0 (external)    | ~700MB          |
| Platform         | macOS only  | All             | All             |
| Latency          | Très faible | Moyenne         | Moyenne         |
| Maintenance      | Automatique | Manuelle        | Automatique     |

## 🐛 Debug

Activer les logs détaillés:

```typescript
// Dans log-service.ts, ajouter la catégorie 'backend'
logger.debug('backend', 'Message', 'Details', { data });
```

Vérifier les backends disponibles:

```bash
# MLX
python3 -c "import mlx; print('MLX OK')"

# Ollama
curl http://localhost:11434/api/tags
```

## 📝 TODO

- [ ] Phase 2: Implémenter MLX Backend
- [ ] Phase 2: Tests MLX vs Ollama performance
- [ ] Phase 3: Implémenter Ollama Embedded
- [ ] Phase 3: Scripts de packaging
- [ ] Phase 4: UI Settings pour backends
- [ ] Phase 4: Migration automatique des anciens services
- [ ] Documentation API complète
- [ ] Tests unitaires pour chaque backend

## 🤝 Contribution

Lors de l'ajout d'un nouveau backend:

1. Créer une classe qui étend `BaseAIBackend`
2. Implémenter les méthodes requises
3. Définir les `capabilities` supportées
4. Ajouter au `initialize-backends.ts`
5. Documenter les modèles et dépendances
6. Ajouter des tests
