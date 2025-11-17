# BlackIA - Diagrammes et Schémas

**Version**: 0.2.0
**Date**: Novembre 2025

Ce document contient tous les diagrammes et schémas de l'architecture BlackIA en format texte (Mermaid, ASCII art).

---

## Table des Matières

1. [Architecture globale](#1-architecture-globale)
2. [Flux de données](#2-flux-de-données)
3. [Schéma de base de données](#3-schéma-de-base-de-données)
4. [Architecture des workflows](#4-architecture-des-workflows)
5. [Système RAG](#5-système-rag)
6. [Backend Manager](#6-backend-manager)
7. [Communication IPC](#7-communication-ipc)
8. [Cycle de vie de l'application](#8-cycle-de-vie-de-lapplication)

---

## 1. Architecture globale

### 1.1 Vue d'ensemble (Mermaid)

```mermaid
graph TB
    subgraph "Electron Application"
        R[Renderer Process<br/>React + TypeScript]
        M[Main Process<br/>Node.js + TypeScript]
        P[Preload Script<br/>IPC Bridge]

        R <--> |IPC| P
        P <--> M
    end

    subgraph "Data Layer"
        DB[(SQLite<br/>Drizzle ORM)]
        VDB[(LanceDB<br/>Vector Store)]
    end

    subgraph "Python Services"
        PY1[Text RAG<br/>Sentence Transformers]
        PY2[Vision RAG<br/>Colette/ColPali]
        PY3[MLX Embedder<br/>Apple Silicon]
    end

    subgraph "AI Backends"
        OL[Ollama<br/>Local/Remote LLM]
        MLX[MLX<br/>Apple Silicon]
    end

    M --> DB
    M --> VDB
    M <--> |Child Process| PY1
    M <--> |Child Process| PY2
    M <--> |Child Process| PY3
    M <--> |HTTP| OL
    M <--> |Native| MLX

    PY1 --> OL
    PY2 --> MLX
    PY3 --> MLX
```

### 1.2 Architecture en couches (ASCII)

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│  React Components | Pages | Hooks | Context | State (Zustand)  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  STATE MANAGEMENT LAYER                         │
│  TanStack Query (Server State) | Zustand (Client State)         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  IPC COMMUNICATION LAYER                        │
│  Preload Bridge | IPC Handlers | Event Emitters                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  BUSINESS LOGIC LAYER                           │
│  Services (22) | Workflow Engine | Backend Manager | RAG        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  DATA ACCESS LAYER                              │
│  Drizzle ORM | LanceDB Client | Filesystem | Python Shell      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                              │
│  SQLite | LanceDB | Ollama HTTP API | Python Services           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Flux de données

### 2.1 Flux Chat (Mermaid)

```mermaid
sequenceDiagram
    participant U as User
    participant R as Renderer (React)
    participant P as Preload
    participant M as Main Process
    participant BM as Backend Manager
    participant O as Ollama

    U->>R: Type message
    R->>R: Update UI state
    R->>P: ipcRenderer.invoke('chat:send', message)
    P->>M: IPC Handler
    M->>BM: backendManager.chatStream(request)
    BM->>O: HTTP POST /api/chat (stream)

    loop Streaming Tokens
        O-->>BM: Token chunk
        BM-->>M: Token chunk
        M-->>R: webContents.send('chat:token', chunk)
        R-->>U: Display token
    end

    O-->>BM: Stream complete
    BM-->>M: Chat complete
    M->>M: Save to DB
    M-->>R: Final response
    R-->>U: Show complete message
```

### 2.2 Flux RAG (Mermaid)

```mermaid
sequenceDiagram
    participant U as User
    participant R as Renderer
    participant M as Main Process
    participant AS as Attachment Service
    participant RS as RAG Service
    participant PY as Python Service
    participant VDB as LanceDB

    U->>R: Upload document
    R->>M: ipcRenderer.invoke('attachments:upload', file)
    M->>AS: attachmentService.create(file)
    AS->>AS: Extract metadata
    AS->>AS: Generate thumbnail
    M-->>R: Upload complete (pending state)

    R->>M: ipcRenderer.invoke('attachments:index', id, mode)
    M->>RS: ragService.indexDocument(params)

    alt Text RAG
        RS->>RS: Extract text
        RS->>RS: Chunk text
        RS->>PY: Generate embeddings (Ollama)
        PY-->>RS: Embeddings array
        RS->>VDB: Store vectors
    else Vision RAG
        RS->>PY: colette_embedder.py (document, model)
        PY->>PY: Convert PDF to images
        PY->>PY: Generate multi-vector embeddings
        PY-->>RS: Patches embeddings [pages][patches][dims]
        RS->>VDB: Store patches
    end

    VDB-->>RS: Indexed successfully
    RS-->>M: Indexing complete
    M->>AS: Update status (indexed)
    M-->>R: Document ready for search
```

### 2.3 Flux Workflow (Mermaid)

```mermaid
sequenceDiagram
    participant U as User
    participant R as Renderer
    participant M as Main Process
    participant WE as Workflow Engine
    participant WC as Workflow Context
    participant BM as Backend Manager

    U->>R: Click "Execute"
    R->>M: ipcRenderer.invoke('workflows:execute', id, inputs)
    M->>WE: engine.execute(inputs)
    WE->>WC: Create execution context
    WC->>WC: Initialize variables

    loop For each node (topological order)
        WE->>M: emit('node:start', nodeId)
        M-->>R: webContents.send('workflow:node-update', {status: 'running'})
        R-->>U: Highlight node (blue)

        alt AI Prompt Node
            WE->>WC: Interpolate variables {{var}}
            WE->>BM: chatStream(prompt)
            loop Streaming
                BM-->>WE: Token
                WE-->>M: emit('ai:token')
                M-->>R: webContents.send('workflow:ai-token')
                R-->>U: Display token in panel
            end
        else Condition Node
            WE->>WC: Evaluate condition
            WE->>WE: Choose path (yes/no)
        else Loop Node
            WE->>WE: Execute body nodes
            WE->>WE: Unmark nodes for re-execution
        else Transform Node
            WE->>WC: Transform data
        end

        WE->>WC: Store output
        WE->>M: emit('node:complete', nodeId, output)
        M-->>R: webContents.send('workflow:node-update', {status: 'completed'})
        R-->>U: Highlight node (green)
    end

    WE->>WC: Capture outputs
    WE-->>M: Execution complete
    M-->>R: Return results
    R-->>U: Display results panel
```

---

## 3. Schéma de base de données

### 3.1 ERD (Entity-Relationship Diagram)

```mermaid
erDiagram
    PERSONAS {
        text id PK
        text name
        text description
        text systemPrompt
        text model
        real temperature
        integer maxTokens
        text fewShots
        text avatar
        text color
        text category
        text tags
        boolean isDefault
        boolean isFavorite
        integer usageCount
        timestamp createdAt
        timestamp updatedAt
    }

    PROMPTS {
        text id PK
        text name
        text content
        text category
        text tags
        boolean isFavorite
        integer usageCount
        timestamp createdAt
        timestamp updatedAt
    }

    WORKFLOWS {
        text id PK
        text name
        text description
        text nodes
        text edges
        text group
        boolean isFavorite
        timestamp createdAt
        timestamp updatedAt
    }

    WORKFLOW_TEMPLATES {
        text id PK
        text name
        text description
        text category
        text tags
        text thumbnail
        text nodes
        text edges
        timestamp createdAt
    }

    WORKFLOW_VERSIONS {
        text id PK
        text workflowId FK
        text parentVersionId FK
        text name
        text message
        text snapshot
        text author
        boolean isActive
        integer version
        timestamp createdAt
    }

    WORKFLOW_VARIABLES {
        text id PK
        text workflowId FK
        text scope
        text name
        text value
        text type
        boolean isEncrypted
        text description
        timestamp createdAt
        timestamp updatedAt
    }

    CONVERSATIONS {
        text id PK
        text folderId FK
        text personaId FK
        text title
        text tags
        boolean isFavorite
        timestamp createdAt
        timestamp updatedAt
    }

    MESSAGES {
        text id PK
        text conversationId FK
        text role
        text content
        text images
        timestamp createdAt
    }

    FOLDERS {
        text id PK
        text name
        text color
        integer order
    }

    ATTACHMENTS {
        text id PK
        text conversationId FK
        text filename
        text filepath
        text mimeType
        integer filesize
        text ragMode
        boolean isIndexedText
        text textEmbeddingModel
        integer textChunkCount
        boolean isIndexedVision
        text visionEmbeddingModel
        integer visionPatchCount
        integer pageCount
        text thumbnail
        text metadata
        timestamp createdAt
        timestamp updatedAt
    }

    LIBRARIES {
        text id PK
        text name
        text description
        text ragMode
        text textEmbeddingModel
        text visionEmbeddingModel
        integer chunkSize
        integer chunkOverlap
        text storagePath
        integer documentCount
        timestamp createdAt
        timestamp updatedAt
    }

    LIBRARY_DOCUMENTS {
        text id PK
        text libraryId FK
        text filename
        text filepath
        text mimeType
        integer filesize
        text status
        boolean isIndexed
        text ragMode
        integer chunkCount
        integer pageCount
        text thumbnail
        text metadata
        timestamp createdAt
        timestamp updatedAt
    }

    MANUAL_CHUNKS {
        text id PK
        text documentId FK
        text chunkId
        text originalContent
        text editedContent
        text reason
        timestamp createdAt
    }

    DOCUMENTATION {
        text id PK
        text parentId FK
        text title
        text slug
        text content
        text category
        text tags
        integer order
        boolean isPublished
        text metadata
        timestamp createdAt
        timestamp updatedAt
    }

    WORKFLOWS ||--o{ WORKFLOW_VERSIONS : "has versions"
    WORKFLOWS ||--o{ WORKFLOW_VARIABLES : "has variables"
    CONVERSATIONS ||--o{ MESSAGES : "contains"
    CONVERSATIONS }o--|| FOLDERS : "in folder"
    CONVERSATIONS }o--|| PERSONAS : "uses persona"
    CONVERSATIONS ||--o{ ATTACHMENTS : "has attachments"
    LIBRARIES ||--o{ LIBRARY_DOCUMENTS : "contains"
    LIBRARY_DOCUMENTS ||--o{ MANUAL_CHUNKS : "has edited chunks"
    DOCUMENTATION ||--o{ DOCUMENTATION : "has children"
```

### 3.2 Tables principales (Texte)

```
┌─────────────────────────────────────────────────────────────────┐
│                       CORE TABLES (4)                            │
├─────────────────────────────────────────────────────────────────┤
│ • personas (13 fields)        - AI personalities                │
│ • prompts (12 fields)         - Reusable prompt library         │
│ • conversations (8 fields)    - Chat history                    │
│ • messages (5 fields)         - Individual messages             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     WORKFLOW TABLES (4)                          │
├─────────────────────────────────────────────────────────────────┤
│ • workflows (9 fields)        - Visual workflows                │
│ • workflowTemplates (9 fields)- Reusable templates              │
│ • workflowVersions (11 fields)- Git-like versioning             │
│ • workflowVariables (9 fields)- Scoped variables                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      RAG TABLES (4)                              │
├─────────────────────────────────────────────────────────────────┤
│ • attachments (25 fields)     - File attachments with RAG       │
│ • libraries (14 fields)       - Document collections            │
│ • libraryDocuments (25 fields)- Documents in libraries          │
│ • manualChunks (6 fields)     - Manually edited chunks          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   ORGANIZATION TABLES (2)                        │
├─────────────────────────────────────────────────────────────────┤
│ • folders (4 fields)          - Conversation folders            │
│ • documentation (11 fields)   - Integrated wiki                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Architecture des workflows

### 4.1 Types de nœuds (Mermaid)

```mermaid
graph LR
    subgraph "Entry/Exit Nodes"
        I[🔵 Input<br/>Entry point]
        O[⚪ Output<br/>Exit point]
    end

    subgraph "AI Nodes"
        AI[🟢 AI Prompt<br/>LLM generation]
    end

    subgraph "Control Flow"
        C[🟡 Condition<br/>if/else]
        L[🟠 Loop<br/>forEach/while/count]
        S[🟣 Switch<br/>multi-branch]
    end

    subgraph "Data Processing"
        T[🔴 Transform<br/>format/extract/merge]
        E[🔺 Extract<br/>regex/JSON/numbers]
    end

    I --> AI
    AI --> C
    C -->|Yes| L
    C -->|No| T
    L --> E
    E --> O
    T --> S
    S --> O
```

### 4.2 Execution Flow (ASCII)

```
Workflow Execution Flow
═══════════════════════

1. START
   ↓
2. LOAD WORKFLOW
   • Parse nodes & edges from JSON
   • Build adjacency list (graph)
   ↓
3. TOPOLOGICAL SORT
   • Kahn's algorithm
   • Ensures dependencies respected
   ↓
4. CREATE CONTEXT
   • Initialize variables map
   • Set up input values
   • Prepare output collectors
   ↓
5. EXECUTE NODES (in sorted order)
   ↓
   ┌─────────────────────────────────┐
   │  For each node:                 │
   │  ─────────────────────────────  │
   │  ① Mark as "running"            │
   │  ② Send event to UI             │
   │  ③ Execute node logic:          │
   │     • Input → Store in context  │
   │     • AI Prompt → Stream LLM    │
   │     • Condition → Eval & branch │
   │     • Loop → Iterate & recurse  │
   │     • Transform → Process data  │
   │     • Output → Collect result   │
   │  ④ Store output in context      │
   │  ⑤ Mark as "completed"          │
   │  ⑥ Send event to UI             │
   └─────────────────────────────────┘
   ↓
6. COLLECT OUTPUTS
   • Gather all Output node values
   • Build results object
   ↓
7. RETURN RESULTS
   {
     success: true,
     outputs: {...},
     logs: [...],
     duration: 5432ms
   }
```

### 4.3 Variable Interpolation

```
Variable Interpolation System
═════════════════════════════

Context Variables Map:
┌────────────────────────────────────┐
│ input_text: "Hello world"          │
│ ai_response: "Generated content"   │
│ loop_index: 2                      │
│ loop_item: {...}                   │
│ global.author_name: "John Doe"     │
│ env.API_KEY: "***encrypted***"     │
└────────────────────────────────────┘

Prompt Template:
┌────────────────────────────────────┐
│ Résume ce texte pour {{global.     │
│ author_name}} :                    │
│                                    │
│ {{input_text}}                     │
│                                    │
│ Style: Item #{{loop_index}}        │
└────────────────────────────────────┘
              ↓
        INTERPOLATION
              ↓
Resolved Prompt:
┌────────────────────────────────────┐
│ Résume ce texte pour John Doe :    │
│                                    │
│ Hello world                        │
│                                    │
│ Style: Item #2                     │
└────────────────────────────────────┘
```

---

## 5. Système RAG

### 5.1 Architecture RAG globale (Mermaid)

```mermaid
graph TB
    subgraph "Document Upload"
        U[User uploads file]
        M[Extract metadata]
        T[Generate thumbnail]
        S[Store in library]
    end

    subgraph "Indexation Choice"
        MODE{RAG Mode?}
    end

    subgraph "Text RAG Pipeline"
        TE[Extract text]
        TC[Chunk text<br/>size: 1000, overlap: 200]
        TM[Ollama embeddings<br/>nomic-embed-text]
        TVS[(LanceDB<br/>text_embeddings)]
    end

    subgraph "Vision RAG Pipeline"
        VC[Convert PDF to images]
        VP[Process with ColPali/Qwen2-VL]
        VM[Multi-vector embeddings<br/>1024 patches/page]
        VVS[(LanceDB<br/>vision_patches)]
    end

    subgraph "Hybrid RAG"
        H[Index both modes]
    end

    subgraph "Search"
        Q[User query]
        QE[Encode query]

        QTS[Text Search<br/>Cosine similarity]
        QVS[Vision Search<br/>MaxSim scoring]

        R[Merge results<br/>Weighted fusion]
        CTX[Inject in AI context]
    end

    U --> M --> T --> S --> MODE

    MODE -->|Text| TE --> TC --> TM --> TVS
    MODE -->|Vision| VC --> VP --> VM --> VVS
    MODE -->|Hybrid| H --> TE
    H --> VC

    Q --> QE
    QE --> QTS
    QE --> QVS

    TVS --> QTS
    VVS --> QVS

    QTS --> R
    QVS --> R

    R --> CTX
```

### 5.2 Text RAG Chunking (ASCII)

```
Text RAG - Document Chunking
═════════════════════════════

Original Document (2500 chars):
┌────────────────────────────────────────────────────────────┐
│ Introduction aux conteneurs Docker...                      │
│                                                            │
│ Docker est une plateforme de conteneurisation...          │
│                                                            │
│ [... 2500 caractères ...]                                 │
└────────────────────────────────────────────────────────────┘

Parameters:
• chunk_size: 1000 characters
• chunk_overlap: 200 characters

Chunking Process:
┌────────────────────────────────────────────────────────────┐
│ CHUNK 1 (0-1000)                                           │
│ "Introduction aux conteneurs Docker..."                   │
│ [1000 chars]                                               │
└────────────────────────────────────────────────────────────┘
         │ overlap (200 chars)
         ▼
┌────────────────────────────────────────────────────────────┐
│ CHUNK 2 (800-1800)                                         │
│ "...conteneurisation permet de..."                        │
│ [1000 chars]                                               │
└────────────────────────────────────────────────────────────┘
         │ overlap (200 chars)
         ▼
┌────────────────────────────────────────────────────────────┐
│ CHUNK 3 (1600-2500)                                        │
│ "...Docker compose orchestrate..."                        │
│ [900 chars]                                                │
└────────────────────────────────────────────────────────────┘

Embeddings Generation:
Chunk 1 → [0.12, 0.45, -0.33, ..., 0.78]  (768 dims)
Chunk 2 → [-0.22, 0.67, 0.14, ..., -0.45] (768 dims)
Chunk 3 → [0.55, -0.12, 0.88, ..., 0.32]  (768 dims)
          ↓
    Store in LanceDB
```

### 5.3 Vision RAG avec MaxSim (ASCII)

```
Vision RAG - Multi-Vector Embeddings with MaxSim
═════════════════════════════════════════════════

Document: Technical_Manual.pdf (3 pages)
                ↓
        Convert to Images
                ↓
┌─────────────────────────────────────────────────────┐
│ Page 1          Page 2          Page 3              │
│ [Image]         [Image]         [Image]             │
└─────────────────────────────────────────────────────┘
                ↓
    Process with ColPali/Qwen2-VL
                ↓
┌─────────────────────────────────────────────────────┐
│         Multi-Vector Embeddings (Patches)           │
├─────────────────────────────────────────────────────┤
│ Page 1: [                                           │
│   Patch 1:   [0.12, -0.45, ..., 0.78]  (128 dims)  │
│   Patch 2:   [-0.33, 0.67, ..., -0.22] (128 dims)  │
│   ...                                               │
│   Patch 1024: [0.88, 0.14, ..., 0.55]  (128 dims)  │
│ ]                                                   │
│                                                     │
│ Page 2: [ 1024 patches x 128 dims ]                │
│ Page 3: [ 1024 patches x 128 dims ]                │
└─────────────────────────────────────────────────────┘
                ↓
        Store in LanceDB

Query: "diagram showing authentication flow"
                ↓
        Encode query to multi-vector
                ↓
      Query embedding: [0.45, -0.12, ..., 0.67]
                ↓
┌─────────────────────────────────────────────────────┐
│              MaxSim Scoring Algorithm               │
├─────────────────────────────────────────────────────┤
│ For each page:                                      │
│   For each patch in page:                           │
│     similarity = cosine(query, patch)               │
│   page_score = MAX(all similarities)  ← MaxSim     │
│                                                     │
│ Page 1: max_sim = 0.87  (from patch 234)           │
│ Page 2: max_sim = 0.92  (from patch 567) ← Best    │
│ Page 3: max_sim = 0.76  (from patch 89)            │
└─────────────────────────────────────────────────────┘
                ↓
        Return Page 2 (score: 0.92)
```

---

## 6. Backend Manager

### 6.1 Architecture Backend Manager (Mermaid)

```mermaid
graph TB
    BM[Backend Manager]

    subgraph "Backends"
        MLX[MLX Backend<br/>Apple Silicon]
        OE[Ollama External<br/>Remote HTTP]
        OI[Ollama Embedded<br/>Bundled]
    end

    subgraph "Capabilities"
        C1[chat]
        C2[embeddings]
        C3[vision]
    end

    subgraph "Fallback Chain"
        F1[1. Try MLX]
        F2[2. Try Ollama External]
        F3[3. Try Ollama Embedded]
    end

    BM --> MLX
    BM --> OE
    BM --> OI

    MLX --> C1
    MLX --> C2
    MLX --> C3

    OE --> C1
    OE --> C2

    OI --> C1
    OI --> C2

    BM --> F1
    F1 -->|unavailable| F2
    F2 -->|unavailable| F3
    F3 -->|unavailable| Error[Throw Error]
```

### 6.2 Backend Selection Logic (ASCII)

```
Backend Selection & Fallback
═════════════════════════════

Initial Setup:
┌──────────────────────────────────────────┐
│ Preferred Backend: MLX                   │
│ Fallback Order:                          │
│   1. mlx                                 │
│   2. ollama-external                     │
│   3. ollama-embedded                     │
└──────────────────────────────────────────┘

Request: chat(message)
         ↓
┌──────────────────────────────────────────┐
│ Try Backend #1: MLX                      │
│ ────────────────────────────────────     │
│ • Check availability: isAvailable()      │
│ • Check capability: hasCapability('chat')│
│   → Result: ✅ Available                 │
│   → Execute: mlx.chat(message)           │
└──────────────────────────────────────────┘
         ↓
    Success! Return response

─────────────────────────────────────────────

Request: embeddings(text)
         ↓
┌──────────────────────────────────────────┐
│ Try Backend #1: MLX                      │
│ • Check: hasCapability('embeddings')     │
│   → Result: ❌ Not Available             │
└──────────────────────────────────────────┘
         ↓ Fallback
┌──────────────────────────────────────────┐
│ Try Backend #2: Ollama External          │
│ • Check: hasCapability('embeddings')     │
│   → Result: ✅ Available                 │
│   → Execute: ollama.embed(text)          │
└──────────────────────────────────────────┘
         ↓
    Success! Return embeddings

─────────────────────────────────────────────

Request: vision(image)
         ↓
┌──────────────────────────────────────────┐
│ Try Backend #1: MLX                      │
│ • Check: hasCapability('vision')         │
│   → Result: ❌ Not Available             │
└──────────────────────────────────────────┘
         ↓ Fallback
┌──────────────────────────────────────────┐
│ Try Backend #2: Ollama External          │
│ • Check: hasCapability('vision')         │
│   → Result: ❌ Not Available             │
└──────────────────────────────────────────┘
         ↓ Fallback
┌──────────────────────────────────────────┐
│ Try Backend #3: Ollama Embedded          │
│ • Check: hasCapability('vision')         │
│   → Result: ❌ Not Available             │
└──────────────────────────────────────────┘
         ↓
    ❌ Throw Error: No backend supports 'vision'
```

---

## 7. Communication IPC

### 7.1 Architecture IPC (Mermaid)

```mermaid
sequenceDiagram
    participant R as Renderer<br/>(React)
    participant W as window.electron
    participant P as Preload Script
    participant IPC as Electron IPC
    participant M as Main Process<br/>(Handler)
    participant S as Service

    Note over R,S: IPC Request (invoke)
    R->>W: window.electron.ipcRenderer.invoke('action', args)
    W->>P: contextBridge exposed API
    P->>IPC: ipcRenderer.invoke('action', args)
    IPC->>M: ipcMain.handle('action', handler)
    M->>S: service.method(args)
    S-->>M: Result
    M-->>IPC: Return result
    IPC-->>P: Promise resolved
    P-->>W: Return to renderer
    W-->>R: Data available

    Note over R,S: IPC Event (send/on)
    M->>IPC: webContents.send('event', data)
    IPC->>P: ipcRenderer.on('event', callback)
    P->>W: Listener triggered
    W->>R: React state update
```

### 7.2 Security Model (ASCII)

```
Electron Security Model
═══════════════════════

┌──────────────────────────────────────────────────────┐
│                  Renderer Process                    │
│                 (Untrusted Context)                  │
│  ┌────────────────────────────────────────────────┐  │
│  │          React Application                     │  │
│  │  • No Node.js access                           │  │
│  │  • No filesystem access                        │  │
│  │  • No native modules                           │  │
│  │                                                │  │
│  │  Can only use:                                 │  │
│  │  window.electron.ipcRenderer.*                 │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                        │
                        │ IPC Bridge
                        ▼
┌──────────────────────────────────────────────────────┐
│                  Preload Script                      │
│               (Isolated Context)                     │
│  ┌────────────────────────────────────────────────┐  │
│  │     contextBridge.exposeInMainWorld()          │  │
│  │                                                │  │
│  │  Exposed API:                                  │  │
│  │  • ipcRenderer.invoke() ✅                     │  │
│  │  • ipcRenderer.on() ✅                         │  │
│  │  • ipcRenderer.send() ✅                       │  │
│  │                                                │  │
│  │  Blocked:                                      │  │
│  │  • Direct IPC access ❌                        │  │
│  │  • Node.js require() ❌                        │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                        │
                        │ Electron IPC
                        ▼
┌──────────────────────────────────────────────────────┐
│                   Main Process                       │
│                (Trusted Context)                     │
│  ┌────────────────────────────────────────────────┐  │
│  │           IPC Handlers                         │  │
│  │  • Full Node.js access ✅                      │  │
│  │  • Filesystem ✅                               │  │
│  │  • Native modules ✅                           │  │
│  │  • Database ✅                                 │  │
│  │  • Network ✅                                  │  │
│  │                                                │  │
│  │  Security:                                     │  │
│  │  • Validate all inputs                         │  │
│  │  • Whitelist allowed channels                  │  │
│  │  • Sanitize file paths                         │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘

Configuration (BrowserWindow):
─────────────────────────────
webPreferences: {
  nodeIntegration: false,      ✅ No Node in renderer
  contextIsolation: true,      ✅ Isolated contexts
  sandbox: false,              ⚠️  Disabled for SQLite
  preload: 'preload/index.js'  ✅ Secure bridge
}
```

---

## 8. Cycle de vie de l'application

### 8.1 Startup Sequence (Mermaid)

```mermaid
sequenceDiagram
    participant OS as macOS
    participant E as Electron App
    participant M as Main Process
    participant DB as Database
    participant BE as Backends
    participant R as Renderer

    OS->>E: Launch BlackIA.app
    E->>M: app.whenReady()
    M->>M: Initialize logger
    M->>DB: Connect to SQLite
    DB->>DB: Run migrations
    DB-->>M: Connection ready
    M->>BE: Initialize Backend Manager
    BE->>BE: Detect Ollama
    BE->>BE: Detect MLX
    BE-->>M: Backends registered
    M->>M: Register IPC handlers (90+)
    M->>M: createWindow()
    M->>R: Load index.html
    R->>R: Initialize React app
    R->>R: Load settings
    R->>M: ipcRenderer.invoke('backends:getStatus')
    M-->>R: Return backend status
    R->>R: Render UI
    R-->>OS: Application ready
```

### 8.2 Shutdown Sequence (ASCII)

```
Application Shutdown Sequence
═════════════════════════════

User clicks "Quit" or Cmd+Q
          ↓
┌────────────────────────────────────┐
│ 1. app.on('before-quit')           │
│    • Save application state        │
│    • Flush logs                    │
└────────────────────────────────────┘
          ↓
┌────────────────────────────────────┐
│ 2. window.on('close')              │
│    • Save window position/size     │
│    • Cleanup renderer resources    │
└────────────────────────────────────┘
          ↓
┌────────────────────────────────────┐
│ 3. Backend Manager cleanup         │
│    • Stop streaming requests       │
│    • Disconnect Ollama             │
│    • Shutdown MLX                  │
└────────────────────────────────────┘
          ↓
┌────────────────────────────────────┐
│ 4. Database cleanup                │
│    • Commit pending transactions   │
│    • Close SQLite connection       │
│    • WAL checkpoint                │
└────────────────────────────────────┘
          ↓
┌────────────────────────────────────┐
│ 5. Python subprocess cleanup       │
│    • Kill active Python processes  │
│    • Clean temp files              │
└────────────────────────────────────┘
          ↓
┌────────────────────────────────────┐
│ 6. app.on('will-quit')             │
│    • Final cleanup                 │
│    • Remove event listeners        │
└────────────────────────────────────┘
          ↓
┌────────────────────────────────────┐
│ 7. app.quit()                      │
│    • Exit application              │
└────────────────────────────────────┘
          ↓
    Process terminated
```

---

**Fin des Diagrammes et Schémas**

*Ces diagrammes peuvent être rendus avec :*
- **Mermaid**: https://mermaid.live/ ou intégration VSCode
- **PlantUML**: Pour diagrammes UML plus complexes
- **ASCII**: Directement lisibles en texte brut

*Dernière mise à jour: Novembre 2025*
*Version du document: 1.0*
