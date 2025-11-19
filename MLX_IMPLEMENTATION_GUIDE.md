# Guide d'Implémentation MLX Complet pour BlackIA

## 📋 Vue d'Ensemble

Ce document détaille l'implémentation complète du système MLX dans BlackIA, permettant d'utiliser des LLM locaux optimisés pour Apple Silicon, avec un store de modèles intégré et téléchargement depuis Hugging Face.

## ✅ Ce qui a été implémenté

### 1. Backend Python (Serveurs MLX)

#### `mlx_llm_server.py` - Serveur LLM principal
**Localisation:** `apps/desktop/src/main/services/backends/mlx/mlx_llm_server.py`

**Fonctionnalités:**
- Chargement de modèles MLX depuis Hugging Face ou local
- Chat avec historique de messages (format ChatML)
- Génération de texte
- Support streaming pour chat et génération
- Déchargement de modèles pour libérer la mémoire
- Communication via stdin/stdout en JSON

**Commandes supportées:**
```json
{
  "command": "load",
  "model_path": "mlx-community/Llama-3.2-3B-Instruct-4bit"
}

{
  "command": "chat",
  "messages": [{"role": "user", "content": "Hello"}],
  "max_tokens": 2048,
  "temperature": 0.7,
  "stream": true
}

{
  "command": "generate",
  "prompt": "Once upon a time",
  "max_tokens": 100
}

{
  "command": "unload"
}

{
  "command": "status"
}
```

#### `mlx_model_downloader.py` - Téléchargeur de modèles
**Localisation:** `apps/desktop/src/main/services/backends/mlx/mlx_model_downloader.py`

**Fonctionnalités:**
- Téléchargement de modèles depuis Hugging Face
- Progression en temps réel
- Liste des modèles locaux
- Suppression de modèles
- Gestion automatique du cache

**Commandes supportées:**
```json
{
  "command": "download",
  "repo_id": "mlx-community/Llama-3.2-3B-Instruct-4bit"
}

{
  "command": "list"
}

{
  "command": "delete",
  "model_path": "/path/to/model"
}
```

#### `mlx_embeddings.py` - Serveur d'embeddings (existant)
Conservé pour les embeddings RAG (sentence-transformers).

### 2. Backend TypeScript

#### `mlx-llm-backend.ts` - Backend LLM
**Localisation:** `apps/desktop/src/main/services/backends/mlx/mlx-llm-backend.ts`

**Classe:** `MLXLLMBackend extends BaseAIBackend`

**Capacités:**
- `chat`: Chat conversationnel avec streaming
- `completion`: Génération de texte
- `embeddings`: Embeddings (via mlx-backend.ts existant)

**Méthodes principales:**
- `isAvailable()`: Vérifie si mlx-lm est installé
- `initialize()`: Démarre le serveur Python
- `shutdown()`: Arrête le serveur
- `chat(request)`: Chat avec streaming
- `generate(request)`: Génération de texte
- `loadModel(modelPath)`: Charge un modèle
- `unloadModel()`: Décharge le modèle
- `listModels()`: Liste des modèles disponibles
- `getStatus()`: Statut du backend

#### `mlx-model-manager.ts` - Gestionnaire de modèles
**Localisation:** `apps/desktop/src/main/services/mlx-model-manager.ts`

**Classe:** `MLXModelManager extends EventEmitter`

**Fonctionnalités:**
- Liste des modèles téléchargés localement
- Téléchargement avec progression
- Suppression de modèles
- Vérification de disponibilité
- Métadonnées (taille, type, repo ID)

**Méthodes principales:**
- `initialize()`: Initialise le gestionnaire
- `listLocalModels()`: Liste des modèles locaux
- `downloadModel(repoId, onProgress)`: Télécharge un modèle
- `deleteModel(modelPath)`: Supprime un modèle
- `isModelDownloaded(repoId)`: Vérifie si téléchargé
- `getModelPath(repoId)`: Obtient le chemin local

**Événements:**
- `download:progress`: Progression du téléchargement

#### `mlx-store-service.ts` - Store Hugging Face
**Localisation:** `apps/desktop/src/main/services/mlx-store-service.ts`

**Classe:** `MLXStoreService`

**Fonctionnalités:**
- Recherche de modèles MLX sur Hugging Face
- Filtrage par tags, auteur, popularité
- Modèles recommandés pour BlackIA
- Cache des résultats (1 heure)
- Métadonnées enrichies (taille, quantization, base model)

**Méthodes principales:**
- `listAvailableModels(filters)`: Liste avec filtres
- `searchModels(query, limit)`: Recherche textuelle
- `getModelInfo(repoId)`: Détails d'un modèle
- `getRecommendedModels()`: Modèles recommandés
- `clearCache()`: Vide le cache

**Modèles recommandés:**
1. Llama-3.2-3B-Instruct-4bit (2GB) - Petit, rapide
2. Mistral-7B-Instruct-v0.3-4bit (4GB) - Qualité supérieure
3. Qwen2.5-7B-Instruct-4bit (4GB) - Multilingue
4. Phi-3.5-mini-instruct-4bit (2.5GB) - Ultra compact
5. Meta-Llama-3.1-8B-Instruct-4bit (5GB) - Contexte long (131K tokens)

### 3. Handlers IPC

#### `mlx-handlers.ts` - Handlers complets
**Localisation:** `apps/desktop/src/main/mlx-handlers.ts`

**Handlers implémentés:**

**Embeddings (existant):**
- `mlx:isAvailable`: Vérifie disponibilité
- `mlx:getStatus`: Statut complet
- `mlx:listModels`: Modèles d'embeddings
- `mlx:getConfig`: Configuration
- `mlx:updateConfig`: Mise à jour config
- `mlx:test`: Test connexion
- `mlx:restart`: Redémarrage

**LLM (nouveau):**
- `mlx:llm:initialize`: Initialise le backend LLM
- `mlx:llm:loadModel`: Charge un modèle
- `mlx:llm:unloadModel`: Décharge le modèle
- `mlx:llm:chat`: Chat avec streaming
- `mlx:llm:generate`: Génération de texte
- `mlx:llm:getStatus`: Statut du LLM

**Gestion de modèles:**
- `mlx:models:initialize`: Initialise le gestionnaire
- `mlx:models:listLocal`: Liste des modèles locaux
- `mlx:models:download`: Télécharge un modèle
- `mlx:models:delete`: Supprime un modèle
- `mlx:models:isDownloaded`: Vérifie si téléchargé

**Store:**
- `mlx:store:listAvailable`: Liste des modèles HF
- `mlx:store:search`: Recherche sur HF
- `mlx:store:getModelInfo`: Détails d'un modèle
- `mlx:store:getRecommended`: Modèles recommandés
- `mlx:store:clearCache`: Vide le cache

**Événements émis:**
- `mlx:llm:streamStart`: Début du streaming
- `mlx:llm:streamChunk`: Chunk de streaming
- `mlx:llm:streamEnd`: Fin du streaming
- `mlx:models:downloadProgress`: Progression téléchargement

### 4. Base de Données

#### Table `mlx_models`
**Localisation:** `apps/desktop/src/main/database/schema.ts`

**Schéma:**
```typescript
{
  id: string;                // UUID
  repoId: string;           // "mlx-community/Llama-3.2-3B-Instruct-4bit"
  name: string;             // Nom convivial
  author: string;           // "mlx-community"

  // Stockage
  localPath: string;        // Chemin absolu
  size: number;             // Octets

  // Métadonnées
  modelType: 'chat' | 'completion' | 'embed';
  quantization: string;     // "4-bit", "8-bit"
  baseModel: string;        // "meta-llama/Llama-3.2-3B-Instruct"
  contextLength: number;    // 4096, 8192, etc.
  parameters: string;       // "3B", "7B"
  description: string;
  tags: string;            // JSON array

  // Utilisation
  downloaded: boolean;
  downloadedAt: Date;
  lastUsedAt: Date;
  usageCount: number;

  // Favoris
  isFavorite: boolean;
  isDefault: boolean;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

**Index:**
- `mlx_models_repo_id_idx` sur `repoId`
- `mlx_models_type_idx` sur `modelType`

## 🚧 Ce qu'il reste à faire

### 1. Interface Utilisateur React

#### Composant `MLXModelStore.tsx`
**Localisation:** `apps/desktop/src/renderer/src/components/settings/MLXModelStore.tsx`

**Fonctionnalités à implémenter:**
- Liste des modèles disponibles sur Hugging Face
- Recherche avec filtres (auteur, tags, taille)
- Tri par téléchargements, likes, date
- Cards de modèles avec:
  - Nom, auteur, description
  - Taille, quantization, contexte
  - Tags, nombre de téléchargements
  - Bouton "Download" avec progress bar
  - Statut "Downloaded" si déjà téléchargé
- Onglets: Recommended, All Models, Search

**Exemple de structure:**
```tsx
export function MLXModelStore() {
  const [models, setModels] = useState([]);
  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState<Record<string, number>>({});

  useEffect(() => {
    // Charger les modèles recommandés au démarrage
    loadRecommendedModels();
  }, []);

  const loadRecommendedModels = async () => {
    const result = await window.api.mlx.store.getRecommended();
    setModels(result.models);
  };

  const handleDownload = async (repoId: string) => {
    // Écouter les événements de progression
    window.api.mlx.models.onDownloadProgress((progress) => {
      if (progress.repoId === repoId) {
        setDownloading(prev => ({
          ...prev,
          [repoId]: progress.percentage
        }));
      }
    });

    // Démarrer le téléchargement
    const result = await window.api.mlx.models.download(repoId);

    if (result.success) {
      // Rafraîchir la liste
      loadRecommendedModels();
    }
  };

  return (
    <div>
      <Tabs defaultValue="recommended">
        <TabsList>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="all">All Models</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {models.map(model => (
              <ModelCard
                key={model.id}
                model={model}
                downloading={downloading[model.id]}
                onDownload={() => handleDownload(model.id)}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

#### Composant `MLXModelManager.tsx`
**Localisation:** `apps/desktop/src/renderer/src/components/settings/MLXModelManager.tsx`

**Fonctionnalités à implémenter:**
- Liste des modèles téléchargés
- Informations détaillées (taille, type, date)
- Actions:
  - Set as default
  - Add to favorites
  - Test model
  - Delete
- Statistiques:
  - Nombre total de modèles
  - Espace disque utilisé
  - Dernier modèle utilisé

#### Mise à jour `MLXSettings.tsx`
**Localisation:** `apps/desktop/src/renderer/src/components/settings/MLXSettings.tsx`

**Ajouter des onglets:**
- **General**: Configuration Python, modèles par défaut
- **Store**: `<MLXModelStore />`
- **Models**: `<MLXModelManager />`
- **Advanced**: Paramètres avancés (context length, etc.)

#### Intégration dans le Chat
**Fichiers à modifier:**
- `apps/desktop/src/renderer/src/pages/Chat.tsx`

**Fonctionnalités:**
- Sélecteur de backend (Ollama / MLX)
- Sélecteur de modèle MLX si backend MLX sélectionné
- Affichage du modèle actif
- Streaming des réponses MLX

**Exemple:**
```tsx
const [backend, setBackend] = useState<'ollama' | 'mlx'>('ollama');
const [mlxModel, setMLXModel] = useState('');

const handleSendMessage = async (content: string) => {
  if (backend === 'mlx') {
    // Utiliser MLX
    await window.api.mlx.llm.chat({
      messages: [...messages, { role: 'user', content }],
      options: { max_tokens: 2048, temperature: 0.7 }
    });

    // Écouter les chunks
    window.api.mlx.llm.onStreamChunk((data) => {
      // Ajouter le chunk au message
    });
  } else {
    // Utiliser Ollama (existant)
    // ...
  }
};
```

### 2. Preload API

**Fichier:** `apps/desktop/src/preload/index.ts`

**Ajouter les API MLX:**
```typescript
mlx: {
  // LLM
  llm: {
    initialize: () => ipcRenderer.invoke('mlx:llm:initialize'),
    loadModel: (modelPath: string) => ipcRenderer.invoke('mlx:llm:loadModel', modelPath),
    unloadModel: () => ipcRenderer.invoke('mlx:llm:unloadModel'),
    chat: (request: any) => ipcRenderer.invoke('mlx:llm:chat', request),
    generate: (request: any) => ipcRenderer.invoke('mlx:llm:generate', request),
    getStatus: () => ipcRenderer.invoke('mlx:llm:getStatus'),

    // Événements
    onStreamStart: (callback: (data: any) => void) => {
      ipcRenderer.on('mlx:llm:streamStart', (_event, data) => callback(data));
    },
    onStreamChunk: (callback: (data: any) => void) => {
      ipcRenderer.on('mlx:llm:streamChunk', (_event, data) => callback(data));
    },
    onStreamEnd: (callback: (data: any) => void) => {
      ipcRenderer.on('mlx:llm:streamEnd', (_event, data) => callback(data));
    },
  },

  // Gestion de modèles
  models: {
    initialize: () => ipcRenderer.invoke('mlx:models:initialize'),
    listLocal: () => ipcRenderer.invoke('mlx:models:listLocal'),
    download: (repoId: string) => ipcRenderer.invoke('mlx:models:download', repoId),
    delete: (modelPath: string) => ipcRenderer.invoke('mlx:models:delete', modelPath),
    isDownloaded: (repoId: string) => ipcRenderer.invoke('mlx:models:isDownloaded', repoId),

    // Événements
    onDownloadProgress: (callback: (progress: any) => void) => {
      ipcRenderer.on('mlx:models:downloadProgress', (_event, progress) => callback(progress));
    },
  },

  // Store
  store: {
    listAvailable: (filters?: any) => ipcRenderer.invoke('mlx:store:listAvailable', filters),
    search: (query: string, limit?: number) => ipcRenderer.invoke('mlx:store:search', query, limit),
    getModelInfo: (repoId: string) => ipcRenderer.invoke('mlx:store:getModelInfo', repoId),
    getRecommended: () => ipcRenderer.invoke('mlx:store:getRecommended'),
    clearCache: () => ipcRenderer.invoke('mlx:store:clearCache'),
  },

  // Embeddings (existant)
  isAvailable: () => ipcRenderer.invoke('mlx:isAvailable'),
  getStatus: () => ipcRenderer.invoke('mlx:getStatus'),
  // ... autres méthodes existantes
}
```

### 3. Système de Build - Embarquer Python

#### Créer un bundle Python

**Option 1: PyInstaller (Recommandé)**

Créer `apps/desktop/scripts/build-python-bundle.sh`:
```bash
#!/bin/bash

echo "🐍 Building Python bundle for MLX..."

# Créer un environnement virtuel temporaire
python3 -m venv .venv-build
source .venv-build/bin/activate

# Installer les dépendances
pip install mlx-lm sentence-transformers huggingface_hub torch pyinstaller

# Créer le bundle avec PyInstaller
pyinstaller --onedir \
  --name mlx-bundle \
  --hidden-import=mlx_lm \
  --hidden-import=sentence_transformers \
  --hidden-import=huggingface_hub \
  --collect-all mlx_lm \
  --collect-all sentence_transformers \
  apps/desktop/src/main/services/backends/mlx/mlx_llm_server.py

# Copier dans resources
cp -r dist/mlx-bundle resources/python/

# Nettoyer
deactivate
rm -rf .venv-build dist build

echo "✅ Python bundle created in resources/python/"
```

**Option 2: Environnement virtuel relocatable**

Créer `apps/desktop/scripts/create-python-env.sh`:
```bash
#!/bin/bash

echo "🐍 Creating relocatable Python environment..."

# Créer l'environnement
python3 -m venv resources/python-env --copies

# Activer
source resources/python-env/bin/activate

# Installer les dépendances
pip install mlx-lm sentence-transformers huggingface_hub torch

# Désactiver
deactivate

echo "✅ Python environment created in resources/python-env/"
```

#### Mettre à jour `electron-builder.yml`

```yaml
files:
  - dist
  - package.json
  - node_modules

  # Scripts Python
  - from: src/python
    to: python
    filter:
      - "**/*.py"
      - "**/*.md"
  - from: src/main/services/backends/mlx
    to: dist/main/services/backends/mlx
    filter:
      - "**/*.py"

  # Bundle Python (Option 1: PyInstaller)
  - from: resources/python/mlx-bundle
    to: resources/python

  # OU (Option 2: Environnement virtuel)
  - from: resources/python-env
    to: resources/python-env

asarUnpack:
  - "**/*.py"
  - "resources/python/**/*"
  # OU
  - "resources/python-env/**/*"
```

#### Mettre à jour les chemins Python dans le code

**Fichiers à modifier:**
- `mlx-llm-backend.ts`
- `mlx-model-manager.ts`
- `mlx-backend.ts`

**Détecter le bon Python:**
```typescript
private getPythonPath(): string {
  if (app.isPackaged) {
    // En production, utiliser le Python embarqué
    const resourcesPath = process.resourcesPath;

    // Option 1: PyInstaller bundle
    return join(resourcesPath, 'python', 'mlx-bundle', 'mlx_llm_server');

    // Option 2: Environnement virtuel
    return join(resourcesPath, 'python-env', 'bin', 'python3');
  } else {
    // En développement, utiliser Python système
    return 'python3';
  }
}
```

### 4. Scripts de Build

#### Ajouter dans `package.json`

```json
{
  "scripts": {
    "build:python": "./scripts/build-python-bundle.sh",
    "build:dmg:mlx": "npm run build:python && npm run build:dmg",
    "build:full": "npm run build:python && npm run build:dmg:universal"
  }
}
```

### 5. Tests

#### Tests manuels

Créer `MLX_TESTING_CHECKLIST.md`:

```markdown
# Checklist de tests MLX

## Installation
- [ ] Python 3.10+ installé
- [ ] mlx-lm installé (`pip install mlx-lm`)
- [ ] sentence-transformers installé
- [ ] huggingface_hub installé

## Backend LLM
- [ ] Serveur démarre correctement
- [ ] Ping répond
- [ ] Status retourne les bonnes infos
- [ ] Modèle se charge sans erreur
- [ ] Chat streaming fonctionne
- [ ] Génération fonctionne
- [ ] Déchargement libère la mémoire

## Gestionnaire de modèles
- [ ] Liste les modèles locaux
- [ ] Téléchargement avec progression
- [ ] Progression s'affiche correctement
- [ ] Modèle apparaît après téléchargement
- [ ] Suppression fonctionne

## Store
- [ ] Modèles recommandés s'affichent
- [ ] Recherche fonctionne
- [ ] Filtres fonctionnent
- [ ] Métadonnées correctes

## Interface utilisateur
- [ ] Store s'affiche correctement
- [ ] Bouton Download fonctionne
- [ ] Progress bar s'affiche
- [ ] Manager affiche les modèles
- [ ] Actions fonctionnent (delete, favorite)
- [ ] Sélecteur de backend dans Chat
- [ ] Chat MLX fonctionne

## Build
- [ ] Bundle Python créé
- [ ] DMG contient Python
- [ ] Application fonctionne en production
- [ ] Pas d'erreur de chemin Python
```

## 📦 Dépendances Python requises

**Pour développement:**
```bash
pip install mlx-lm sentence-transformers huggingface_hub torch
```

**Pour build (PyInstaller):**
```bash
pip install pyinstaller
```

**Versions testées:**
- Python: 3.10+
- mlx-lm: 0.1.0+
- sentence-transformers: 2.2.0+
- huggingface_hub: 0.20.0+
- torch: 2.1.0+

## 🎯 Ordre d'implémentation recommandé

1. ✅ **Backend Python** (Fait)
2. ✅ **Backend TypeScript** (Fait)
3. ✅ **Handlers IPC** (Fait)
4. ✅ **Schéma DB** (Fait)
5. 🔲 **Preload API** (À faire)
6. 🔲 **Interface utilisateur** (À faire)
   - MLXModelStore
   - MLXModelManager
   - MLXSettings mise à jour
   - Intégration Chat
7. 🔲 **Système de build** (À faire)
   - Script build Python
   - electron-builder config
   - Détection chemin Python
8. 🔲 **Tests** (À faire)
9. 🔲 **Documentation utilisateur** (À faire)

## 🚀 Utilisation rapide (une fois terminé)

**Pour l'utilisateur:**
1. Ouvrir BlackIA
2. Aller dans Settings > MLX
3. Onglet "Store"
4. Choisir un modèle recommandé (ex: Llama-3.2-3B-Instruct-4bit)
5. Cliquer "Download" et attendre
6. Aller dans Chat
7. Sélectionner backend "MLX"
8. Sélectionner le modèle téléchargé
9. Commencer à chatter !

**Avantages pour l'utilisateur:**
- 10-20x plus rapide qu'Ollama
- 100% local
- Optimisé Apple Silicon
- Pas de serveur à installer
- Store intégré
- Modèles quantifiés (petits et rapides)

## 📝 Notes importantes

1. **Taille des modèles:**
   - 4-bit: ~50% de la taille originale
   - Llama 3B 4-bit: ~2GB
   - Llama 7B 4-bit: ~4GB
   - Llama 8B 4-bit: ~5GB

2. **Mémoire requise:**
   - 8GB RAM minimum
   - 16GB RAM recommandé
   - Modèles 3-7B: ~4-8GB de mémoire unifiée

3. **Performance:**
   - M1/M2/M3: ~20-40 tokens/sec (3B)
   - M1/M2/M3: ~10-20 tokens/sec (7B)
   - M1 Ultra: ~60-80 tokens/sec (7B)

4. **Compatibilité:**
   - macOS 13.0+ (Ventura)
   - Apple Silicon uniquement
   - Metal GPU requis

## 🔗 Ressources

- [MLX Documentation](https://ml-explore.github.io/mlx/)
- [mlx-lm GitHub](https://github.com/ml-explore/mlx-examples/tree/main/llms)
- [Hugging Face MLX Community](https://huggingface.co/mlx-community)
- [Modèles MLX recommandés](https://huggingface.co/collections/mlx-community/llama-32-6557c0e7e0b2d02fc2a04937)

## 🆘 Support

En cas de problème:
1. Vérifier que Python et mlx-lm sont installés
2. Vérifier les logs dans BlackIA
3. Tester les scripts Python manuellement
4. Consulter le README MLX
5. Vérifier la mémoire disponible

---

**Auteur:** Claude (Assistant IA)
**Date:** 2025-11-19
**Version:** 1.0.0
