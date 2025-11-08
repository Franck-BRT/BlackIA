# BlackIA Codebase Analysis Report
## Comprehensive Exploration - Very Thorough Level

**Project:** BlackIA - Suite d'assistance IA complète
**Date:** November 7, 2025
**Status:** Active Development (MVP v0.2.0)

---

## 1. PROJECT STRUCTURE & ARCHITECTURE

### 1.1 Overall Architecture

BlackIA is a **monorepo** using pnpm workspaces with a modern desktop-focused architecture:

```
BlackIA/
├── apps/
│   └── desktop/              # Main Electron desktop app
│       ├── src/
│       │   ├── main/         # Electron main process (Node.js)
│       │   ├── renderer/     # React UI (Renderer process)
│       │   ├── preload/      # Security bridge between processes
│       │   └── shared/       # Shared utilities
│       ├── vite.config.ts    # Vite dev server config
│       ├── electron-builder.yml
│       └── package.json
│
├── packages/
│   ├── ui/                   # Reusable UI components library
│   │   └── src/
│   │       ├── lib/
│   │       └── components/   (Future)
│   │
│   ├── ollama/               # Ollama client library
│   │   └── src/
│   │       └── index.ts
│   │
│   └── shared/               # Shared types & utilities
│       └── src/
│           ├── types/        # Core TypeScript interfaces
│           └── utils/        # Shared utilities
│
└── scripts/                  # Build & dev scripts
    ├── dev.sh
    ├── build-dmg.sh
    └── generate-icons.sh
```

### 1.2 Monorepo Configuration

- **Package Manager:** pnpm workspaces (configured in pnpm-workspace.yaml)
- **Build Tool:** Turbo (turbo.json for build orchestration)
- **Version Control:** Git with active development

**Key Workspace Dependencies:**
```
@blackia/desktop depends on:
  - @blackia/ui
  - @blackia/ollama
  - @blackia/shared
```

---

## 2. MAIN TECHNOLOGIES & STACK

### 2.1 Frontend Stack (Renderer Process)

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.2.0 | UI framework |
| **TypeScript** | 5.3.3 | Type safety |
| **Vite** | 5.0.10 | Dev server & build tool |
| **TailwindCSS** | 3.4.0 | Styling framework |
| **lucide-react** | 0.303.0 | Icon library |
| **React Router DOM** | 6.21.0 | Client-side routing |
| **Zustand** | 4.4.7 | State management (lightweight) |
| **TanStack Query** | 5.17.0 | Data fetching & caching |
| **Zod** | 3.22.4 | Runtime schema validation |

**Key UI Components:**
- Modal dialogs
- Forms with validation
- Toast notifications
- Search/filter components
- Tree/hierarchical views

### 2.2 Backend Stack (Main Process)

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Electron** | 33.2.0 | Desktop framework |
| **Node.js** | 20+ | Runtime |
| **better-sqlite3** | 11.7.0 | Embedded database |
| **Drizzle ORM** | 0.29.1 | Type-safe database toolkit |
| **tRPC** | 10.45.0 | Type-safe API (not used yet) |
| **electron-trpc** | 0.5.2 | tRPC for Electron IPC |

### 2.3 Build & Development

| Tool | Purpose |
|------|---------|
| **TypeScript** | Full project in TypeScript |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Vitest** | Unit testing framework |
| **Electron Builder** | macOS DMG/Universal app building |
| **electron-rebuild** | Native module rebuilding |

### 2.4 External Integrations

- **Ollama** - Local/remote LLM runtime
- **MLX** - Apple Silicon ML framework (planned)
- **MCP (Model Context Protocol)** - Future integration

---

## 3. UI ORGANIZATION & COMPONENT STRUCTURE

### 3.1 Page Structure

The app uses React Router with the following pages:

```
/                    → HomePage
/chat                → ChatPage (main feature)
/personas            → PersonasPage (implemented)
/prompts             → PromptsPage (PLACEHOLDER - "En cours de développement")
/workflows           → WorkflowsPage (placeholder)
/projects            → ProjectsPage (placeholder)
/logs                → LogsPage (placeholder)
/settings            → SettingsPage (implemented)
```

### 3.2 Component Hierarchy

```
App (SettingsProvider)
└── AppContent (BrowserRouter)
    └── Layout
        ├── Sidebar (navigation)
        └── main (page content)
            ├── HomePage
            ├── ChatPage
            │   ├── ConversationSidebar
            │   ├── ChatMessages
            │   ├── ChatInput
            │   ├── ModelSelector
            │   ├── ChatSettings
            │   ├── ExportMenu
            │   └── ImportExportMenu
            │
            ├── PersonasPage
            │   ├── PersonaList
            │   ├── PersonaCard
            │   └── PersonaModal
            │       └── PersonaForm
            │
            ├── PromptsPage (EMPTY)
            │
            └── SettingsPage
```

### 3.3 Components Directory Structure

```
components/
├── Layout.tsx               # Main layout wrapper
├── Sidebar.tsx              # Navigation sidebar
├── SettingsButton.tsx       # Settings entry point
│
├── chat/                    # Chat-related components
│   ├── ChatInput.tsx        # Message input area
│   ├── ChatMessage.tsx      # Message renderer
│   ├── ModelSelector.tsx    # Model selection
│   ├── ChatSettings.tsx     # Chat configuration
│   ├── ConversationSidebar.tsx
│   ├── ExportMenu.tsx
│   ├── ImportExportMenu.tsx
│   ├── ChatSearchBar.tsx
│   ├── MarkdownRenderer.tsx
│   ├── PersonaMentionDropdown.tsx
│   ├── PersonaSelectionModal.tsx
│   ├── StatisticsModal.tsx
│   └── [other modals]
│
├── personas/                # Personas management
│   ├── PersonaForm.tsx      # Persona form fields
│   ├── PersonaCard.tsx      # Persona card display
│   ├── PersonaList.tsx      # Persona list view
│   ├── PersonaModal.tsx     # Modal wrapper
│   ├── PersonaAvatarPicker.tsx
│   ├── PersonaImportExport.tsx
│   └── FewShotManager.tsx   # Few-shot examples management
│
├── settings/                # Settings pages
│   └── [setting sections]
│
└── shared/                  # Shared UI components
    └── [reusable components]
```

### 3.4 Design System

**Visual Style:**
- Glassmorphism theme with backdrop blur
- Dark mode (slate-950/900 gradient background)
- Animated decorative background elements
- Custom scrollbars

**Color Palette:**
- Primary: Purple gradients
- Accents: Blue, Pink, Green, Orange
- Backgrounds: Dark slate with transparency effects
- Text: High contrast white/muted foreground

**Typography:**
- Sans-serif base (Tailwind default)
- Sizes: xs, sm, base, lg, xl, 2xl, 3xl
- Weights: Regular, Bold, Semibold

---

## 4. EXISTING PROMPT & AI MANAGEMENT

### 4.1 Persona System (Similar to Prompts)

A **Persona** is the closest equivalent to what prompts will be:

**Persona Data Model:**
```typescript
interface Persona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;           // The actual prompt
  
  // AI Parameters
  model?: string;
  temperature?: number;
  maxTokens?: number;
  
  // Few-Shot Examples
  fewShots?: string;              // JSON array of examples
  
  // UI Properties
  avatar: string;                 // Emoji
  color: 'purple' | 'blue' | 'pink' | 'green' | 'orange';
  
  // Organization
  category?: string;
  tags: string[];                 // JSON array
  
  // Metadata
  isDefault: boolean;
  isFavorite: boolean;
  usageCount: number;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}
```

**Persona Storage:** SQLite database with Drizzle ORM
**Persona Categories:** General, Development, Writing, Analysis, Teaching, Creative, Business, Marketing, Science

### 4.2 Existing Prompt-like Features

1. **System Prompts in Personas**
   - Each persona has a customizable system prompt
   - Few-shot examples for behavior guidance
   - Used to shape AI responses in chat

2. **Conversation History**
   - Messages are stored in `conversations` & `messages` tables
   - Full context preservation
   - Export/import functionality

3. **Chat Settings**
   - Temperature control
   - Max tokens
   - Model selection
   - Context window management

### 4.3 Suggestion System

**Persona Suggestion Keywords** table allows automatic persona suggestions:
```typescript
interface PersonaSuggestionKeyword {
  id: string;
  keyword: string;
  categories: string[];           // JSON array
  isActive: boolean;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

This could be extended for prompt suggestions based on keywords.

---

## 5. DATABASE STRUCTURE

### 5.1 SQLite Database Architecture

**Location:** `~/.config/BlackIA/blackia.db` (userData path)

**Database Tool:** Drizzle ORM + better-sqlite3

### 5.2 Current Database Schema

```sql
-- Personas Table
personas
  ├── id (PRIMARY KEY)
  ├── name
  ├── description
  ├── systemPrompt
  ├── model
  ├── temperature
  ├── maxTokens
  ├── avatar
  ├── color
  ├── category
  ├── tags (JSON array)
  ├── isDefault (boolean)
  ├── isFavorite (boolean)
  ├── usageCount
  ├── createdAt
  └── updatedAt

-- Conversations Table
conversations
  ├── id (PRIMARY KEY)
  ├── title
  ├── personaId (FOREIGN KEY → personas.id)
  ├── folderId (FOREIGN KEY → folders.id)
  ├── tags (JSON array)
  ├── isFavorite (boolean)
  ├── createdAt
  └── updatedAt

-- Messages Table
messages
  ├── id (PRIMARY KEY)
  ├── conversationId (FOREIGN KEY → conversations.id)
  ├── role (enum: user|assistant|system)
  ├── content
  ├── images (JSON array, for future)
  └── createdAt

-- Folders Table
folders
  ├── id (PRIMARY KEY)
  ├── name
  ├── color
  └── createdAt

-- Persona Suggestion Keywords Table
personaSuggestionKeywords
  ├── id (PRIMARY KEY)
  ├── keyword
  ├── categories (JSON array)
  ├── isActive (boolean)
  ├── isDefault (boolean)
  ├── createdAt
  └── updatedAt
```

### 5.3 Database Configuration

**Features:**
- Foreign key constraints enabled
- Cascade delete for message cleanup
- UUID primary keys
- Timestamp tracking (creation & update)
- JSON column support for array storage

**Initialization Flow:**
1. Database client initialized in main process
2. Migrations run (or fallback to direct table creation)
3. Default personas seeded if database is new
4. Schema version tracked for upgrades

---

## 6. STATE MANAGEMENT APPROACH

### 6.1 State Management Strategy

**Hybrid Approach:**
1. **React Context + Hooks** - For global app state
2. **Local Component State (useState)** - For UI state
3. **localStorage** - For persistence (chat settings, etc.)
4. **Zustand** - Configured but not heavily used yet

### 6.2 Context System

**SettingsContext** (Primary Global State)
```typescript
interface AppSettings {
  appearance: AppearanceSettings;
  general: GeneralSettings;
  interface: InterfaceSettings;
  personaSuggestion: PersonaSuggestionSettings;
  categories: CategoriesSettings;
  keyboardShortcuts: Record<string, KeyboardShortcut>;
}
```

**Features:**
- Theme management (light/dark)
- Font size control
- Animation settings
- Module visibility toggles
- Custom categories
- Default keyboard shortcuts

### 6.3 Data Fetching Pattern

**Custom Hooks for Data Management:**

```typescript
// Chat data
const {
  conversations,
  currentConversationId,
  createConversation,
  updateConversation,
  deleteConversation
} = useConversations();

// Personas
const {
  personas,
  loading,
  createPersona,
  updatePersona,
  deletePersona,
  toggleFavorite
} = usePersonas();

// Folders
const {
  folders,
  createFolder,
  renameFolder,
  deleteFolder
} = useFolders();

// Tags
const {
  tags,
  createTag,
  updateTag,
  deleteTag
} = useTags();
```

**Pattern:**
- React hooks communicate with IPC API
- Data cached in component state
- Optimistic updates with refetch on error
- Error handling & loading states built in

### 6.4 IPC Communication

**Preload API Structure:**
```typescript
window.electronAPI = {
  // Basic
  ping: () => Promise<string>,
  getVersion: () => Promise<string>,
  getPlatform: () => Promise<string>,
  
  // File system
  file: {
    saveDialog,
    openDialog,
    writeFile,
    readFile,
    exportPDF
  },
  
  // Personas
  personas: {
    getAll,
    getById,
    create,
    update,
    delete,
    search,
    filterByCategory,
    getFavorites,
    toggleFavorite,
    incrementUsage,
    duplicate,
    getCategories
  },
  
  // Tags
  tags: {
    getSynced
  },
  
  // Persona Suggestions
  personaSuggestions: {
    getAll,
    getActive,
    create,
    update,
    delete,
    toggleActive,
    search,
    initializeDefaults,
    resetToDefaults,
    getStats
  },
  
  // Ollama
  ollama: {
    isAvailable,
    getVersion,
    listModels,
    chat,
    chatStream,
    generate,
    embeddings
  }
}
```

---

## 7. KEY ENTRY POINTS & FILES

### 7.1 Application Entry Points

**Main Process:**
- **File:** `/apps/desktop/src/main/index.ts`
- **Responsibility:** 
  - Electron window creation
  - Service initialization
  - IPC handler registration
  - Database setup
  - Ollama integration

**Renderer Process:**
- **File:** `/apps/desktop/src/renderer/src/main.tsx`
- **Renders to:** `index.html`
- **Wraps:** React app with providers

**Preload Script:**
- **File:** `/apps/desktop/src/preload/index.ts`
- **Responsibility:** 
  - Secure context bridge
  - IPC API exposure
  - Type definitions for renderer

### 7.2 Critical Services

**Persona Service** (`src/main/services/persona-service.ts`)
- CRUD operations for personas
- Caching mechanism
- Search & filtering
- Favorite management
- Usage tracking

**Database Client** (`src/main/database/client.ts`)
- Singleton database instance
- Drizzle ORM setup
- Migration management
- Table creation fallback

**Ollama Handlers** (`src/main/ollama-handlers.ts`)
- Model management
- Chat streaming
- Generation requests
- Version checking

**Persona Suggestion Service**
- Keyword management
- Suggestion generation
- Default keywords initialization

### 7.3 Configuration Files

**Vite Config** (`apps/desktop/vite.config.ts`)
- React plugin
- Path aliases (@, @blackia/*)
- Dev server on port 5173
- Build output to `dist/renderer`

**Electron Builder** (`electron-builder.yml`)
- App ID: `com.blackroomtech.blackia`
- Target: macOS DMG (arm64)
- Entitlements configuration
- GitHub releases publishing

**TypeScript** (`tsconfig.json` + `tsconfig.main.json`)
- Strict mode enabled
- Target: ES2020
- Module: ESNext

---

## 8. MAIN APPLICATION FLOW

### 8.1 Application Startup Sequence

```
1. Electron main process starts (main/index.ts)
   ↓
2. Environment detection (dev vs packaged)
   ↓
3. Database initialization
   ├── Create/open SQLite file
   └── Run migrations
   ↓
4. Service initialization
   ├── PersonaService.initialize()
   ├── Load all personas from DB
   ├── Sync persona tags
   └── Initialize suggestion keywords
   ↓
5. IPC handlers registration
   ├── Persona handlers
   ├── Tag sync handlers
   ├── Ollama handlers
   └── File system handlers
   ↓
6. Create BrowserWindow
   ├── Dev mode: Load http://localhost:5173
   └── Production: Load dist/renderer/index.html
   ↓
7. Renderer process starts (main.tsx)
   ├── Mount React app
   ├── Load SettingsProvider
   ├── Apply appearance settings
   └── Initialize routing
```

### 8.2 Chat Flow (Example Usage)

```
User Types Message in ChatInput
   ↓
Message sent to window.electronAPI.ollama.chatStream()
   ↓
Main process receives 'ollama:chatStream' IPC call
   ↓
Ollama handler streams response
   ↓
Stream events emitted back to renderer via ipcRenderer.on()
   ↓
React component updates state with chunks
   ↓
Message displayed in ChatMessage component
   ↓
On completion, message saved to database via conversations store
```

### 8.3 Persona Management Flow

```
User clicks "Create Persona"
   ↓
PersonaModal opens with PersonaForm
   ↓
User fills form (name, prompt, category, etc.)
   ↓
Submit → usePersonas().createPersona(data)
   ↓
Calls window.electronAPI.personas.create(data)
   ↓
Main process handler calls PersonaService.create()
   ↓
Service writes to database
   ↓
Response sent back to renderer
   ↓
Hook reloads personas list
   ↓
UI updates with new persona
```

---

## 9. DEVELOPMENT WORKFLOW

### 9.1 Scripts Available

```bash
# Development
pnpm start              # Start dev with fresh builds
pnpm start:quick       # Start without rebuilding
pnpm dev               # Run all packages in dev mode

# Building
pnpm build             # Build all packages
pnpm build:packages    # Build packages only
pnpm desktop:build     # Build desktop app

# DMG (macOS distribution)
pnpm build:dmg         # Build unsigned DMG
pnpm build:dmg:clean   # Clean and rebuild
pnpm build:dmg:sign    # Build with signature

# Code quality
pnpm lint              # Run ESLint
pnpm format            # Format with Prettier
pnpm type-check        # TypeScript validation
pnpm test              # Run tests

# Utilities
pnpm clean             # Clean all builds
pnpm verify            # Verify setup
pnpm generate:icons    # Generate app icons
```

### 9.2 Development Environment Setup

**Prerequisites:**
- Node.js 20+
- pnpm 8+
- macOS (Apple Silicon recommended)
- Ollama (for AI features)

**Dev Server:**
- Vite runs on http://localhost:5173
- Electron watches for changes
- Hot module reload support
- DevTools automatically open

### 9.3 Build Process

**Desktop App Build Chain:**
```
TypeScript Compilation (tsconfig.main.json)
   ↓
Vite Build (React + TailwindCSS)
   ↓
Electron Builder
   ├── Bundle electron executable
   ├── Include native modules (better-sqlite3)
   └── Create DMG for distribution
```

---

## 10. INTEGRATION POINTS FOR PROMPT LIBRARY

### 10.1 Recommended Architecture

Based on the existing structure, a Prompt Library should follow this pattern:

**Database Table:**
```typescript
prompts
  ├── id (PRIMARY KEY, UUID)
  ├── name
  ├── description
  ├── content              // The actual prompt text
  ├── category
  ├── tags (JSON array)
  ├── variables (JSON array) // {{variable}} support
  ├── useCount
  ├── isFavorite
  ├── createdAt
  └── updatedAt

promptVariables (optional separate table)
  ├── id
  ├── promptId (FOREIGN KEY)
  ├── name
  ├── description
  ├── defaultValue
  └── required
```

### 10.2 Service Layer

```typescript
// src/main/services/prompt-service.ts
class PromptService {
  getAll(): Promise<Prompt[]>
  getById(id: string): Promise<Prompt | null>
  create(data: CreatePromptData): Promise<Prompt>
  update(id: string, data: UpdatePromptData): Promise<Prompt>
  delete(id: string): Promise<boolean>
  search(query: string): Promise<Prompt[]>
  filterByCategory(category: string): Promise<Prompt[]>
  getFavorites(): Promise<Prompt[]>
  toggleFavorite(id: string): Promise<Prompt>
  renderPrompt(promptId: string, variables: Record<string, string>): Promise<string>
}
```

### 10.3 Hooks (Renderer)

```typescript
// src/renderer/src/hooks/usePrompts.ts
export function usePrompts() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  
  const createPrompt = useCallback(async (data) => { ... });
  const updatePrompt = useCallback(async (id, data) => { ... });
  const deletePrompt = useCallback(async (id) => { ... });
  const searchPrompts = useCallback(async (query) => { ... });
  const renderPrompt = useCallback(async (id, variables) => { ... });
  
  return {
    prompts,
    loading,
    createPrompt,
    updatePrompt,
    deletePrompt,
    searchPrompts,
    renderPrompt
  };
}
```

### 10.4 UI Components

```
components/prompts/
  ├── PromptList.tsx        # List view
  ├── PromptCard.tsx        # Card display
  ├── PromptModal.tsx       # Create/edit modal
  ├── PromptForm.tsx        # Form fields
  ├── PromptPreview.tsx     # Rendered preview
  ├── VariableEditor.tsx    # Variable management
  ├── PromptImportExport.tsx # Import/export
  └── PromptCategory.tsx    # Category management
```

### 10.5 Page Structure

```typescript
// src/renderer/src/pages/PromptsPage.tsx
// Replace the current placeholder with:
// - Search bar
// - Filter by category
// - Favorites toggle
// - Create button
// - Grid/list of PromptCard components
// - Modal for create/edit
```

### 10.6 IPC Handlers

Add to `src/main/index.ts`:
```typescript
ipcMain.handle('prompts:getAll', async () => { ... });
ipcMain.handle('prompts:create', async (_event, data) => { ... });
ipcMain.handle('prompts:update', async (_event, id, data) => { ... });
ipcMain.handle('prompts:delete', async (_event, id) => { ... });
ipcMain.handle('prompts:render', async (_event, id, variables) => { ... });
// ... etc
```

### 10.7 Preload API Extension

Add to `src/preload/index.ts`:
```typescript
prompts: {
  getAll: () => ipcRenderer.invoke('prompts:getAll'),
  create: (data) => ipcRenderer.invoke('prompts:create', data),
  update: (id, data) => ipcRenderer.invoke('prompts:update', id, data),
  delete: (id) => ipcRenderer.invoke('prompts:delete', id),
  search: (query) => ipcRenderer.invoke('prompts:search', query),
  render: (id, variables) => ipcRenderer.invoke('prompts:render', id, variables)
}
```

---

## 11. KEY DESIGN PATTERNS

### 11.1 Service Pattern

All backend logic uses service classes:
- Singleton instances
- Encapsulated business logic
- Consistent error handling
- Caching where appropriate

### 11.2 Hook Pattern

All React components use custom hooks for data:
- useState for local state
- useCallback for memoized functions
- useEffect for side effects
- Custom hooks abstract IPC calls

### 11.3 Modal Pattern

All forms use modal dialogs:
- Backdrop with blur
- Keyboard shortcuts (Escape to close)
- Submission handling with loading state
- Validation with Zod

### 11.4 IPC Communication

Electron IPC pattern:
- Preload exposes safe API
- Main process handles IPC
- Handlers call services
- Services access database
- Responses sent back with success/error

---

## 12. NOTABLE TECHNICAL DECISIONS

### 12.1 Why SQLite + Drizzle?

- **Embedded:** No external database needed
- **Fast:** Suitable for local app
- **Type-safe:** Drizzle provides TypeScript support
- **Migrations:** Schema versioning built-in
- **Fallback:** Direct SQL creation if migrations fail

### 12.2 Why better-sqlite3?

- **Synchronous:** Simpler for main process
- **Native module:** Good performance
- **Electron rebuild:** Automatic recompilation

### 12.3 Why No Redux/MobX?

- **Lightweight approach:** Context + hooks sufficient
- **Zustand configured:** Can be expanded if needed
- **TanStack Query:** Used for data fetching state
- **localStorage:** For persistence

### 12.4 Why Vite?

- **Fast:** Instant hot module reload
- **Modern:** ESM-first approach
- **Small config:** Clean build setup
- **TS support:** First-class TypeScript

---

## 13. KNOWN LIMITATIONS & GAPS

1. **PromptsPage:** Currently a placeholder
2. **WorkflowsPage:** Not yet implemented
3. **ProjectsPage:** Not yet implemented
4. **LogsPage:** Minimal implementation
5. **tRPC:** Configured but not actively used
6. **Zustand:** Imported but not heavily utilized
7. **MLX integration:** Planned but not implemented
8. **Sync cloud:** Not implemented

---

## 14. RECOMMENDED NEXT STEPS FOR PROMPT LIBRARY

1. **Create database schema** for prompts table
2. **Build PromptService** following PersonaService pattern
3. **Create usePrompts hook** mirroring usePersonas
4. **Add IPC handlers** in main/index.ts
5. **Extend preload API** for prompts
6. **Build UI components** (list, card, modal, form)
7. **Implement PromptsPage** replacing placeholder
8. **Add import/export** functionality
9. **Implement variable substitution** engine
10. **Add category management** for prompts

---

## APPENDIX A: FILE LOCATIONS REFERENCE

**Critical Files:**
- Electron entry: `/apps/desktop/src/main/index.ts`
- React entry: `/apps/desktop/src/renderer/src/main.tsx`
- Preload API: `/apps/desktop/src/preload/index.ts`
- Database schema: `/apps/desktop/src/main/database/schema.ts`
- Shared types: `/packages/shared/src/types/index.ts`

**Personas (as reference):**
- Service: `/apps/desktop/src/main/services/persona-service.ts`
- Handlers: `/apps/desktop/src/main/handlers/persona-handlers.ts`
- Hook: `/apps/desktop/src/renderer/src/hooks/usePersonas.ts`
- Types: `/apps/desktop/src/renderer/src/types/persona.ts`
- Components: `/apps/desktop/src/renderer/src/components/personas/`
- Page: `/apps/desktop/src/renderer/src/pages/PersonasPage.tsx`

---

**End of Analysis Report**
