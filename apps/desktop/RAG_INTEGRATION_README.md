# 📚 BlackIA - Système RAG (Retrieval Augmented Generation)

## Vue d'ensemble

Le système RAG permet d'enrichir les conversations avec le contexte de documents attachés (PDFs, images, textes). Il combine **Text RAG** (recherche textuelle) et **Vision RAG** (recherche visuelle) pour une compréhension multi-modale des documents.

## 🎯 Fonctionnalités

### Backend (✅ Implémenté)
- ✅ **Text RAG** : Embeddings textuels via Ollama (nomic-embed-text)
- ✅ **Vision RAG** : Embeddings visuels via MLX-VLM (Qwen2-VL-2B) - Apple Silicon only
- ✅ **Hybrid RAG** : Fusion RRF (Reciprocal Rank Fusion) des deux modes
- ✅ **Auto Mode** : Décision automatique selon le type de document
- ✅ **Attachment Service** : Upload, stockage, métadonnées
- ✅ **Vector Store** : LanceDB pour stockage embeddings
- ✅ **IPC Handlers** : Communication Electron main ↔ renderer

### Frontend (✅ Implémenté)
- ✅ **AttachmentButton** : Upload drag & drop multi-fichiers
- ✅ **AttachmentPreview** : Cartes de prévisualisation avec badges
- ✅ **AttachmentList** : Grille/liste avec filtrage avancé
- ✅ **RAGToggle** : Toggle + sélecteur de mode
- ✅ **RAGSources** : Affichage sources dans messages
- ✅ **useAttachments** : Hook de gestion attachments
- ✅ **useRAG** : Hook de recherche et contextualisation
- ✅ **ChatInputWithRAG** : Input standalone avec RAG
- ✅ Guides d'intégration pour ChatInput et ChatMessage

## 📦 Architecture

```
apps/desktop/
├── src/
│   ├── main/                           # Backend (Node.js)
│   │   ├── types/rag.ts                # Types RAG (StoredRAGMode, RAGMode, etc.)
│   │   ├── services/
│   │   │   ├── attachment-service.ts   # CRUD attachments
│   │   │   ├── text-rag-service.ts     # Embeddings textuels (Ollama)
│   │   │   ├── vision-rag-service.ts   # Embeddings visuels (MLX-VLM)
│   │   │   ├── hybrid-rag-service.ts   # Fusion RRF
│   │   │   └── vector-store.ts         # LanceDB wrapper
│   │   ├── handlers/
│   │   │   ├── attachment-handlers.ts  # IPC attachments
│   │   │   ├── text-rag-handlers.ts    # IPC text RAG
│   │   │   ├── vision-rag-handlers.ts  # IPC vision RAG
│   │   │   └── hybrid-rag-handlers.ts  # IPC hybrid RAG
│   │   └── python/
│   │       ├── mlx_vision_embedder.py  # MLX-VLM embeddings
│   │       └── colpali_adapter.py      # ColPali (futur)
│   │
│   ├── renderer/src/                   # Frontend (React)
│   │   ├── types/attachment.ts         # Types frontend
│   │   ├── hooks/
│   │   │   ├── useAttachments.ts       # Hook gestion fichiers
│   │   │   └── useRAG.ts               # Hook recherche/contextualization
│   │   └── components/
│   │       ├── attachments/
│   │       │   ├── AttachmentButton.tsx
│   │       │   ├── AttachmentPreview.tsx
│   │       │   └── AttachmentList.tsx
│   │       └── chat/
│   │           ├── RAGToggle.tsx
│   │           ├── RAGSources.tsx
│   │           ├── ChatInputWithRAG.tsx              # ✨ Nouveau composant standalone
│   │           ├── ChatInput.INTEGRATION_GUIDE.tsx   # 📖 Guide intégration
│   │           └── ChatMessage.INTEGRATION_GUIDE.tsx # 📖 Guide intégration
│   │
│   └── preload/index.ts                # IPC API exposure
│
└── RAG_INTEGRATION_README.md           # 📖 Ce fichier
```

## 🚀 Quick Start

### 1. Utiliser le composant standalone

Le moyen le plus simple est d'utiliser `ChatInputWithRAG.tsx` :

```tsx
import { ChatInputWithRAG } from './components/chat/ChatInputWithRAG';

function MyChatPage() {
  const [conversationId] = useState('conv-123');

  const handleSend = (message: string, options?: {
    attachmentIds?: string[];
    ragMetadata?: RAGMetadata;
  }) => {
    console.log('Message:', message);
    console.log('Attachments:', options?.attachmentIds);
    console.log('RAG Metadata:', options?.ragMetadata);

    // Envoyer à Ollama...
  };

  return (
    <ChatInputWithRAG
      onSend={handleSend}
      conversationId={conversationId}
      placeholder="Posez votre question..."
    />
  );
}
```

### 2. Ou intégrer dans ChatInput existant

Suivre le guide : `src/renderer/src/components/chat/ChatInput.INTEGRATION_GUIDE.tsx`

**Étapes principales :**
1. Importer `AttachmentButton`, `RAGToggle`, `useAttachments`, `useRAG`
2. Ajouter états pour attachments et RAG
3. Modifier `handleSubmit` pour enrichir le message
4. Ajouter les composants dans le JSX

### 3. Afficher les sources dans ChatMessage

Suivre le guide : `src/renderer/src/components/chat/ChatMessage.INTEGRATION_GUIDE.tsx`

**Étapes principales :**
1. Importer `RAGSources`
2. Ajouter prop `ragMetadata?: RAGMetadata`
3. Afficher `<RAGSources>` sous le message assistant

## 📖 Utilisation du Hook useRAG

```tsx
import { useRAG } from '../../hooks/useRAG';

function MyComponent() {
  const {
    search,
    contextualizeMessage,
    enrichPrompt,
    isSearching,
    lastMetadata,
  } = useRAG({
    enabled: true,
    defaultMode: 'auto',
    topK: 5,
    minScore: 0.7,
  });

  // Recherche simple
  const handleSearch = async () => {
    const result = await search({
      query: 'Comment installer Python?',
      mode: 'hybrid',
      filters: {
        conversationId: 'conv-123',
      },
    });

    console.log('Results:', result.results);
    console.log('Mode used:', result.mode);
  };

  // Contextualisation automatique
  const handleContextualize = async (userMessage: string) => {
    const { context, sources, metadata } = await contextualizeMessage(
      userMessage,
      {
        conversationId: 'conv-123',
        mode: 'auto',
      }
    );

    console.log('Context:', context);
    console.log('Sources:', sources);
    console.log('Chunks used:', metadata.chunksUsed);
  };

  // Enrichissement prompt (tout-en-un)
  const handleEnrich = async () => {
    const { enrichedPrompt, ragMetadata } = await enrichPrompt(
      'Explique-moi le code',
      'Tu es un expert en programmation',
      { mode: 'text' }
    );

    console.log('Enriched:', enrichedPrompt);
    console.log('Metadata:', ragMetadata);
  };

  return (
    <div>
      <button onClick={handleSearch}>Search</button>
      <button onClick={() => handleContextualize('Hello')}>
        Contextualize
      </button>
      {isSearching && <p>Searching...</p>}
    </div>
  );
}
```

## 📖 Utilisation du Hook useAttachments

```tsx
import { useAttachments } from '../../hooks/useAttachments';

function MyComponent() {
  const {
    attachments,
    upload,
    remove,
    download,
    isLoading,
    uploadProgress,
  } = useAttachments({
    entityType: 'conversation',
    entityId: 'conv-123',
    autoLoad: true,
  });

  const handleUpload = async (files: File[]) => {
    const uploaded = await upload(files);
    console.log('Uploaded:', uploaded);
  };

  const handleRemove = async (attachmentId: string) => {
    const success = await remove(attachmentId);
    console.log('Removed:', success);
  };

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={(e) => {
          if (e.target.files) {
            handleUpload(Array.from(e.target.files));
          }
        }}
      />

      {uploadProgress.map((progress) => (
        <div key={progress.fileName}>
          {progress.fileName}: {progress.progress}%
          {progress.status === 'error' && <span>Error: {progress.error}</span>}
        </div>
      ))}

      <ul>
        {attachments.map((att) => (
          <li key={att.id}>
            {att.originalName} - {att.ragMode}
            <button onClick={() => handleRemove(att.id)}>Remove</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 🔧 Configuration

### RAG Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| `text` | Embeddings textuels uniquement | Documents texte, code, markdown |
| `vision` | Embeddings visuels uniquement | Images, PDFs avec schémas |
| `hybrid` | Fusion text + vision (RRF) | Documents mixtes (texte + images) |
| `auto` | Décision automatique | Laisse le système choisir |
| `none` | Pas de RAG | Fichiers non-indexés |

### Paramètres de recherche

```typescript
interface RAGSearchParams {
  query: string;              // Requête utilisateur
  mode?: RAGMode;             // Mode de recherche (default: 'auto')
  topK?: number;              // Nombre de résultats (default: 5)
  minScore?: number;          // Score minimum 0-1 (default: 0.7)
  filters?: {
    entityType?: EntityType;  // Filtrer par type
    entityId?: string;        // Filtrer par ID
    conversationId?: string;  // Filtrer par conversation
    attachmentIds?: string[]; // Filtrer par fichiers spécifiques
  };
}
```

## 🎨 Composants UI

### AttachmentButton

Upload drag & drop avec validation.

```tsx
<AttachmentButton
  entityType="conversation"
  entityId="conv-123"
  onUpload={(files) => console.log('Uploaded:', files)}
  onError={(error) => console.error(error)}
  maxFiles={10}
  maxSizeBytes={50 * 1024 * 1024} // 50MB
  accept="image/*,application/pdf,text/*"
/>
```

### RAGToggle

Toggle + sélecteur de mode.

```tsx
<RAGToggle
  enabled={ragEnabled}
  mode={ragMode}
  onToggle={() => setRagEnabled(!ragEnabled)}
  onModeChange={setRagMode}
/>
```

### RAGSources

Affichage sources dans messages.

```tsx
<RAGSources
  metadata={ragMetadata}
  onViewSource={(source) => console.log('View:', source)}
/>
```

## 🔌 IPC API

L'API IPC est exposée via `window.api` :

```typescript
// Attachments
await window.api.attachments.upload({ fileName, buffer, mimeType, entityType, entityId });
await window.api.attachments.getByEntity({ entityType, entityId });
await window.api.attachments.delete({ attachmentId });
await window.api.attachments.getStats();

// Text RAG
await window.api.textRAG.index({ text, attachmentId, entityType, entityId });
await window.api.textRAG.search({ query, topK, minScore, filters });
await window.api.textRAG.delete({ attachmentId });

// Vision RAG
await window.api.visionRAG.index({ imagePaths, attachmentId, entityType, entityId });
await window.api.visionRAG.search({ query, topK, minScore, filters });
await window.api.visionRAG.delete({ attachmentId });

// Hybrid RAG
await window.api.hybridRAG.search({ query, mode: 'auto', topK, minScore, filters });
```

## 🐛 Debugging

### Activer les logs

```typescript
// Dans useRAG.ts
console.log('[useRAG] Searching:', params);
console.log('[useRAG] Results:', results);

// Dans useAttachments.ts
console.log('[useAttachments] Uploading:', files.length);
console.log('[useAttachments] Progress:', progress);
```

### Vérifier l'indexation

```typescript
const stats = await window.api.attachments.getStats();
console.log('Stats:', stats);
// {
//   total: 10,
//   indexed: { text: 5, vision: 3 },
//   byType: { image: 3, pdf: 5, text: 2 }
// }
```

### Tester la recherche

```typescript
const result = await window.api.hybridRAG.search({
  query: 'test query',
  mode: 'hybrid',
  topK: 5,
});
console.log('Search results:', result);
```

## 📝 TODO

### Prioritaire
- [ ] Implémenter extraction texte (pdf-parse)
- [ ] Implémenter génération thumbnails (sharp)
- [ ] Créer AttachmentViewer modal fullscreen
- [ ] Intégrer dans useChatStreaming.ts

### Futur
- [ ] Job queue pour indexation background
- [ ] Cache LRU pour embeddings
- [ ] Nettoyage automatique (cleanOrphans)
- [ ] Settings UI pour configuration RAG
- [ ] Stats dashboard (RAGStatsPanel)
- [ ] Memory checker (warning 16GB+)
- [ ] Tests unitaires et E2E
- [ ] Documentation utilisateur complète

## 🤝 Contribution

Pour contribuer au système RAG :

1. Backend : `apps/desktop/src/main/services/*-rag-service.ts`
2. Frontend : `apps/desktop/src/renderer/src/hooks/useRAG.ts`
3. UI : `apps/desktop/src/renderer/src/components/attachments/`
4. Types : `apps/desktop/src/main/types/rag.ts`

## 📚 Ressources

- [LanceDB Documentation](https://lancedb.github.io/lancedb/)
- [ColPali Paper](https://arxiv.org/abs/2407.01449)
- [MLX-VLM GitHub](https://github.com/Blaizzy/mlx-vlm)
- [Ollama Embeddings](https://ollama.com/library/nomic-embed-text)
- [Reciprocal Rank Fusion](https://plg.uwaterloo.ca/~gvcormac/cormacksigir09-rrf.pdf)

---

**Version**: 1.0.0
**Date**: 2025-01-12
**Status**: ✅ Core système implémenté, intégration chat en cours
