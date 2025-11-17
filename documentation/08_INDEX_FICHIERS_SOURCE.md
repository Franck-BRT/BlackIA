# BlackIA - Index des Fichiers de Code Source

**Version**: 0.2.0
**Date**: Novembre 2025

Ce document liste **tous les fichiers de code source** du projet BlackIA avec leur emplacement exact et une brève description.

---

## 📊 Statistiques du projet

- **Total lignes de code** : 38,979
- **Fichiers TypeScript** : 152
- **Composants React** : 82
- **Services métier** : 22
- **Handlers IPC** : 13 fichiers
- **Fichiers Python** : 8
- **Tables de base de données** : 11 (+4 pour RAG)

---

## 📂 Main Process (Node.js + TypeScript)

### Point d'entrée

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/main/index.ts` | ~350 | Point d'entrée principal, gestion lifecycle Electron |

### Database

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/main/database/client.ts` | ~80 | Configuration Drizzle ORM + SQLite |
| `/apps/desktop/src/main/database/schema.ts` | **551** | Définition de toutes les tables (11 principales + 4 RAG) |
| `/apps/desktop/src/main/database/migrations/*.sql` | ~200 | 5 fichiers de migration SQL |

### Handlers IPC (13 fichiers)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/main/handlers/persona-handlers.ts` | ~180 | 13 handlers pour personas (CRUD + search) |
| `/apps/desktop/src/main/handlers/prompt-handlers.ts` | ~150 | 12 handlers pour prompts |
| `/apps/desktop/src/main/handlers/workflow-handlers.ts` | ~250 | 15 handlers pour workflows (exec, versions) |
| `/apps/desktop/src/main/handlers/chat-handlers.ts` | ~120 | Handlers conversations et messages |
| `/apps/desktop/src/main/handlers/rag-handlers.ts` | ~200 | 20+ handlers pour RAG (text, vision, hybrid) |
| `/apps/desktop/src/main/handlers/library-handlers.ts` | ~180 | 10 handlers pour bibliothèques |
| `/apps/desktop/src/main/handlers/attachment-handlers.ts` | ~160 | 12 handlers pour pièces jointes |
| `/apps/desktop/src/main/handlers/documentation-handlers.ts` | ~140 | 8 handlers pour wiki intégré |
| `/apps/desktop/src/main/handlers/log-handlers.ts` | ~80 | 6 handlers pour logs |
| `/apps/desktop/src/main/handlers/settings-handlers.ts` | ~100 | Configuration et paramètres |
| `/apps/desktop/src/main/handlers/folder-handlers.ts` | ~90 | Gestion des dossiers |
| `/apps/desktop/src/main/handlers/tag-handlers.ts` | ~85 | Gestion des tags |
| `/apps/desktop/src/main/handlers/backend-handlers.ts` | ~110 | Status et contrôle des backends IA |

### Services métier (22 fichiers)

#### Services principaux

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/main/services/persona-service.ts` | **609** | Service personas avec JSON storage et migrations |
| `/apps/desktop/src/main/services/prompt-service.ts` | 250 | CRUD prompts avec variables |
| `/apps/desktop/src/main/services/workflow-service.ts` | 280 | CRUD workflows |
| `/apps/desktop/src/main/services/workflow-db-service.ts` | 380 | Templates, versions, variables |
| `/apps/desktop/src/main/services/workflow-execution-engine.ts` | **708** | Moteur d'exécution de workflows (orchestration) |
| `/apps/desktop/src/main/services/workflow-execution-context.ts` | 320 | Contexte d'exécution runtime |

#### Services RAG

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/main/services/text-rag-service.ts` | 420 | RAG texte avec Ollama (v1) |
| `/apps/desktop/src/main/services/text-rag-service-v2.ts` | 380 | RAG texte amélioré (v2) |
| `/apps/desktop/src/main/services/vision-rag-service.ts` | 450 | RAG vision pour documents |
| `/apps/desktop/src/main/services/colette-vision-rag-service.ts` | **441** | Intégration Colette/ColPali (JoliBrain) |
| `/apps/desktop/src/main/services/hybrid-rag-service.ts` | 380 | Fusion texte + vision |
| `/apps/desktop/src/main/services/vector-store.ts` | 290 | Wrapper LanceDB pour vecteurs |

#### Services documents

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/main/services/attachment-service.ts` | 480 | Upload et indexation de fichiers |
| `/apps/desktop/src/main/services/library-service.ts` | 360 | Gestion de collections |
| `/apps/desktop/src/main/services/library-document-service.ts` | 420 | CRUD documents dans bibliothèques |
| `/apps/desktop/src/main/services/chunk-editor-service.ts` | 340 | Édition manuelle de chunks RAG |
| `/apps/desktop/src/main/services/text-extraction-service.ts` | 180 | Extraction de texte PDF |
| `/apps/desktop/src/main/services/thumbnail-service.ts` | 150 | Génération d'images miniatures |

#### Services utilitaires

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/main/services/log-service.ts` | 220 | Logging centralisé |
| `/apps/desktop/src/main/services/documentation-db-service.ts` | 280 | Gestion du wiki intégré |
| `/apps/desktop/src/main/services/persona-suggestion-service.ts` | 190 | Auto-suggestions de personas |
| `/apps/desktop/src/main/services/tag-sync-service.ts` | 160 | Synchronisation de tags |

#### Backend Manager

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/main/services/backends/backend-manager.ts` | **354** | Orchestration backends IA (MLX, Ollama) |
| `/apps/desktop/src/main/services/backends/mlx/mlx-service.ts` | 280 | Service MLX (Apple Silicon) |
| `/apps/desktop/src/main/services/backends/mlx/mlx-embeddings.ts` | 150 | Embeddings avec MLX |
| `/apps/desktop/src/main/services/backends/ollama/ollama-embedded-service.ts` | 220 | Service Ollama embarqué |

### Types

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/main/types/workflow.ts` | 180 | Types pour workflows |
| `/apps/desktop/src/main/types/rag.ts` | 250 | Types pour RAG (text, vision, hybrid) |
| `/apps/desktop/src/main/types/backend.ts` | 150 | Types pour backends IA |
| `/apps/desktop/src/main/types/index.ts` | 100 | Types généraux |

---

## 🖼️ Renderer Process (React + TypeScript)

### Point d'entrée

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/renderer/src/main.tsx` | ~50 | Point d'entrée React (root) |
| `/apps/desktop/src/renderer/src/App.tsx` | ~200 | Composant racine avec routing |

### Pages (11 fichiers)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/renderer/src/pages/ChatPage.tsx` | 520 | Page principale du Chat |
| `/apps/desktop/src/renderer/src/pages/WorkflowsPage.tsx` | 480 | Page des Workflows |
| `/apps/desktop/src/renderer/src/pages/PersonasPage.tsx` | 380 | Page des Personas |
| `/apps/desktop/src/renderer/src/pages/PromptsPage.tsx` | 320 | Page des Prompts |
| `/apps/desktop/src/renderer/src/pages/LibraryPage.tsx` | 550 | Page de la Bibliothèque (RAG) |
| `/apps/desktop/src/renderer/src/pages/DocumentationPage.tsx` | 290 | Page du wiki intégré |
| `/apps/desktop/src/renderer/src/pages/SettingsPage.tsx` | 680 | Page des Paramètres (11 sections) |
| `/apps/desktop/src/renderer/src/pages/EditorPage.tsx` | 420 | Page de l'éditeur Markdown |
| `/apps/desktop/src/renderer/src/pages/ProjectsPage.tsx` | ~50 | Page Projets (planifié v1.1) |
| `/apps/desktop/src/renderer/src/pages/LogsPage.tsx` | ~80 | Page Logs (planifié v1.1) |
| `/apps/desktop/src/renderer/src/pages/NotFoundPage.tsx` | ~40 | Page 404 |

### Composants Chat (22 fichiers)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/renderer/src/components/chat/ChatContainer.tsx` | 380 | Container principal du chat |
| `/apps/desktop/src/renderer/src/components/chat/ChatSidebar.tsx` | 290 | Barre latérale (liste conversations) |
| `/apps/desktop/src/renderer/src/components/chat/ChatInput.tsx` | 220 | Zone de saisie des messages |
| `/apps/desktop/src/renderer/src/components/chat/MessageList.tsx` | 180 | Liste des messages |
| `/apps/desktop/src/renderer/src/components/chat/Message.tsx` | 150 | Message individuel |
| `/apps/desktop/src/renderer/src/components/chat/ConversationList.tsx` | 240 | Liste des conversations |
| `/apps/desktop/src/renderer/src/components/chat/ConversationItem.tsx` | 120 | Item de conversation |
| `/apps/desktop/src/renderer/src/components/chat/FolderTree.tsx` | 200 | Arbre des dossiers |
| `/apps/desktop/src/renderer/src/components/chat/TagManager.tsx` | 180 | Gestionnaire de tags |
| `/apps/desktop/src/renderer/src/components/chat/PersonaMention.tsx` | 130 | Autocomplete @mention |
| `/apps/desktop/src/renderer/src/components/chat/PromptSlash.tsx` | 140 | Autocomplete /prompt |
| `/apps/desktop/src/renderer/src/components/chat/AttachmentButton.tsx` | 160 | Bouton pièces jointes |
| `/apps/desktop/src/renderer/src/components/chat/AttachmentPreview.tsx` | 100 | Prévisualisation pièce jointe |
| `/apps/desktop/src/renderer/src/components/chat/ExportDialog.tsx` | 150 | Dialog d'export |
| `/apps/desktop/src/renderer/src/components/chat/ChatStats.tsx` | 180 | Statistiques d'utilisation |
| `/apps/desktop/src/renderer/src/components/chat/StreamingIndicator.tsx` | 60 | Indicateur de streaming |
| ... | ... | +6 autres composants |

### Composants Workflows (14+ fichiers)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/renderer/src/components/workflows/WorkflowCanvas.tsx` | 420 | Canvas ReactFlow principal |
| `/apps/desktop/src/renderer/src/components/workflows/WorkflowSidebar.tsx` | 280 | Barre latérale (liste workflows) |
| `/apps/desktop/src/renderer/src/components/workflows/NodePalette.tsx` | 220 | Palette de nœuds |
| `/apps/desktop/src/renderer/src/components/workflows/nodes/InputNode.tsx` | 180 | Nœud Input |
| `/apps/desktop/src/renderer/src/components/workflows/nodes/AIPromptNode.tsx` | 250 | Nœud AI Prompt |
| `/apps/desktop/src/renderer/src/components/workflows/nodes/ConditionNode.tsx` | 200 | Nœud Condition |
| `/apps/desktop/src/renderer/src/components/workflows/nodes/LoopNode.tsx` | 240 | Nœud Loop |
| `/apps/desktop/src/renderer/src/components/workflows/nodes/TransformNode.tsx` | 190 | Nœud Transform |
| `/apps/desktop/src/renderer/src/components/workflows/nodes/SwitchNode.tsx` | 180 | Nœud Switch |
| `/apps/desktop/src/renderer/src/components/workflows/nodes/OutputNode.tsx` | 150 | Nœud Output |
| `/apps/desktop/src/renderer/src/components/workflows/ExecutionPanel.tsx` | 280 | Panneau d'exécution |
| `/apps/desktop/src/renderer/src/components/workflows/VariableEditor.tsx` | 210 | Éditeur de variables |
| `/apps/desktop/src/renderer/src/components/workflows/VersionHistory.tsx` | 190 | Historique des versions |
| `/apps/desktop/src/renderer/src/components/workflows/TemplateLibrary.tsx` | 220 | Bibliothèque de templates |

### Composants Personas (8 fichiers)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/renderer/src/components/personas/PersonaList.tsx` | 220 | Liste des personas |
| `/apps/desktop/src/renderer/src/components/personas/PersonaCard.tsx` | 150 | Carte persona |
| `/apps/desktop/src/renderer/src/components/personas/PersonaEditor.tsx` | 380 | Éditeur de persona |
| `/apps/desktop/src/renderer/src/components/personas/FewShotEditor.tsx` | 240 | Éditeur d'exemples few-shot |
| `/apps/desktop/src/renderer/src/components/personas/PersonaFilters.tsx` | 120 | Filtres (catégories, tags) |
| `/apps/desktop/src/renderer/src/components/personas/PersonaImportExport.tsx` | 160 | Import/Export JSON |
| `/apps/desktop/src/renderer/src/components/personas/PersonaSuggestions.tsx` | 140 | Suggestions automatiques |
| `/apps/desktop/src/renderer/src/components/personas/PersonaUsageStats.tsx` | 100 | Statistiques d'usage |

### Composants Prompts (6 fichiers)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/renderer/src/components/prompts/PromptList.tsx` | 200 | Liste des prompts |
| `/apps/desktop/src/renderer/src/components/prompts/PromptCard.tsx` | 130 | Carte prompt |
| `/apps/desktop/src/renderer/src/components/prompts/PromptEditor.tsx` | 280 | Éditeur de prompt |
| `/apps/desktop/src/renderer/src/components/prompts/VariableDetector.tsx` | 150 | Détection de variables {{}} |
| `/apps/desktop/src/renderer/src/components/prompts/PromptFilters.tsx` | 110 | Filtres |
| `/apps/desktop/src/renderer/src/components/prompts/PromptUsageStats.tsx` | 90 | Statistiques |

### Composants Library (12 fichiers)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/renderer/src/components/library/LibraryList.tsx` | 240 | Liste des bibliothèques |
| `/apps/desktop/src/renderer/src/components/library/LibraryCard.tsx` | 160 | Carte bibliothèque |
| `/apps/desktop/src/renderer/src/components/library/DocumentList.tsx` | 280 | Liste des documents |
| `/apps/desktop/src/renderer/src/components/library/DocumentCard.tsx` | 180 | Carte document |
| `/apps/desktop/src/renderer/src/components/library/DocumentUpload.tsx` | 220 | Upload de documents |
| `/apps/desktop/src/renderer/src/components/library/DocumentViewer.tsx` | 320 | Visualiseur de document |
| `/apps/desktop/src/renderer/src/components/library/ChunkEditor.tsx` | 380 | Éditeur de chunks |
| `/apps/desktop/src/renderer/src/components/library/ChunkList.tsx` | 200 | Liste des chunks |
| `/apps/desktop/src/renderer/src/components/library/RAGSearch.tsx` | 250 | Interface de recherche RAG |
| `/apps/desktop/src/renderer/src/components/library/RAGModeSelector.tsx` | 140 | Sélecteur de mode RAG |
| `/apps/desktop/src/renderer/src/components/library/IndexingProgress.tsx` | 160 | Barre de progression indexation |
| `/apps/desktop/src/renderer/src/components/library/ValidationWorkflow.tsx` | 190 | Workflow de validation |

### Composants Settings (11 fichiers)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/renderer/src/components/settings/GeneralSettings.tsx` | 180 | Paramètres généraux |
| `/apps/desktop/src/renderer/src/components/settings/AILocalSettings.tsx` | 280 | Configuration Ollama/MLX |
| `/apps/desktop/src/renderer/src/components/settings/WebSearchSettings.tsx` | 150 | Configuration Web Search |
| `/apps/desktop/src/renderer/src/components/settings/AppearanceSettings.tsx` | 220 | Apparence et thèmes |
| `/apps/desktop/src/renderer/src/components/settings/InterfaceSettings.tsx` | 190 | Personnalisation interface |
| `/apps/desktop/src/renderer/src/components/settings/KeyboardShortcuts.tsx` | 240 | Raccourcis clavier |
| `/apps/desktop/src/renderer/src/components/settings/ChatSettings.tsx` | 130 | Paramètres Chat |
| `/apps/desktop/src/renderer/src/components/settings/WorkflowSettings.tsx` | 140 | Paramètres Workflows |
| `/apps/desktop/src/renderer/src/components/settings/CategoriesManager.tsx` | 160 | Gestion des catégories |
| `/apps/desktop/src/renderer/src/components/settings/TagsManager.tsx` | 150 | Gestion des tags |
| `/apps/desktop/src/renderer/src/components/settings/AboutSection.tsx` | 120 | À propos |

### Composants UI (shadcn/ui)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/renderer/src/components/ui/button.tsx` | 80 | Bouton avec variants |
| `/apps/desktop/src/renderer/src/components/ui/input.tsx` | 60 | Input texte |
| `/apps/desktop/src/renderer/src/components/ui/dialog.tsx` | 120 | Dialog modal |
| `/apps/desktop/src/renderer/src/components/ui/dropdown-menu.tsx` | 150 | Menu déroulant |
| `/apps/desktop/src/renderer/src/components/ui/select.tsx` | 140 | Sélecteur |
| `/apps/desktop/src/renderer/src/components/ui/textarea.tsx` | 70 | Zone de texte |
| `/apps/desktop/src/renderer/src/components/ui/checkbox.tsx` | 60 | Case à cocher |
| `/apps/desktop/src/renderer/src/components/ui/tabs.tsx` | 110 | Onglets |
| `/apps/desktop/src/renderer/src/components/ui/toast.tsx` | 90 | Notifications |
| ... | ... | +20 autres composants UI |

### Hooks personnalisés (12 fichiers)

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/renderer/src/hooks/usePersonas.ts` | 180 | Hook personas (queries + mutations) |
| `/apps/desktop/src/renderer/src/hooks/usePrompts.ts` | 150 | Hook prompts |
| `/apps/desktop/src/renderer/src/hooks/useWorkflows.ts` | 200 | Hook workflows |
| `/apps/desktop/src/renderer/src/hooks/useChat.ts` | 240 | Hook chat avec streaming |
| `/apps/desktop/src/renderer/src/hooks/useBackend.ts` | 160 | Hook backends IA |
| `/apps/desktop/src/renderer/src/hooks/useRAG.ts` | 190 | Hook RAG |
| `/apps/desktop/src/renderer/src/hooks/useLibrary.ts` | 170 | Hook bibliothèques |
| `/apps/desktop/src/renderer/src/hooks/useSettings.ts` | 140 | Hook paramètres |
| `/apps/desktop/src/renderer/src/hooks/useKeyboardShortcuts.ts` | 120 | Hook raccourcis clavier |
| `/apps/desktop/src/renderer/src/hooks/useTheme.ts` | 100 | Hook thème clair/sombre |
| `/apps/desktop/src/renderer/src/hooks/useTags.ts` | 110 | Hook tags |
| `/apps/desktop/src/renderer/src/hooks/useFolders.ts` | 100 | Hook dossiers |

### Contextes React

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/renderer/src/contexts/ThemeContext.tsx` | 120 | Contexte thème |
| `/apps/desktop/src/renderer/src/contexts/BackendContext.tsx` | 150 | Contexte backends IA |
| `/apps/desktop/src/renderer/src/contexts/SettingsContext.tsx` | 180 | Contexte paramètres |

### Utils

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/renderer/src/utils/ipc.ts` | 100 | Helpers IPC |
| `/apps/desktop/src/renderer/src/utils/format.ts` | 80 | Formatage de données |
| `/apps/desktop/src/renderer/src/utils/validation.ts` | 120 | Validation de formulaires |
| `/apps/desktop/src/renderer/src/utils/cn.ts` | 20 | Utility pour classes CSS (clsx + twMerge) |

---

## 🐍 Python Services

### Text RAG

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/python/text_rag/embed.py` | 150 | Embeddings texte avec Sentence Transformers |
| `/apps/desktop/src/python/text_rag/requirements.txt` | ~10 | Dépendances Text RAG |

### Vision RAG

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/python/vision_rag/colette_embedder.py` | **282** | Embeddings ColPali/Qwen2-VL |
| `/apps/desktop/src/python/vision_rag/mlx_vision_embedder.py` | 220 | Embeddings MLX-VLM (Apple Silicon) |
| `/apps/desktop/src/python/vision_rag/late_interaction.py` | 180 | Scoring MaxSim pour Vision RAG |
| `/apps/desktop/src/python/vision_rag/document_processor.py` | 240 | Traitement PDF → Images |
| `/apps/desktop/src/python/vision_rag/requirements.txt` | ~20 | Dépendances Vision RAG |

### Global

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/src/python/requirements.txt` | ~40 | Dépendances Python globales |

---

## 📦 Packages Workspace

### @blackia/ollama

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/packages/ollama/src/client.ts` | **442** | Client Ollama complet (0 dépendances) |
| `/packages/ollama/src/types.ts` | 280 | Types TypeScript pour Ollama API |
| `/packages/ollama/src/errors.ts` | 80 | Classes d'erreur personnalisées |
| `/packages/ollama/src/index.ts` | 20 | Exports publics |

### @blackia/shared

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/packages/shared/src/types/index.ts` | **395** | Types partagés (Persona, Workflow, etc.) |
| `/packages/shared/src/utils/index.ts` | 100 | Utilitaires partagés |

### @blackia/ui

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/packages/ui/src/components/*.tsx` | ~2000 | Composants shadcn/ui réutilisables |
| `/packages/ui/src/index.ts` | 50 | Exports publics |

---

## 🔧 Scripts

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/scripts/dev.sh` | 180 | Script de développement avec options |
| `/scripts/build-dmg.sh` | **299** | Build DMG production avec gestion des erreurs |
| `/scripts/verify-setup.sh` | **271** | Vérification complète de l'installation |
| `/scripts/setup-python-venv.sh` | 120 | Setup environnement Python |
| `/scripts/generate-icons.sh` | 80 | Génération d'icônes macOS |
| `/scripts/clean-reinstall.sh` | 60 | Nettoyage complet |

---

## ⚙️ Configuration

### Root

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/package.json` | 48 | Package root avec scripts turbo |
| `/pnpm-workspace.yaml` | 5 | Configuration workspace |
| `/turbo.json` | 30 | Configuration Turborepo |
| `/tsconfig.json` | 40 | Config TypeScript globale |
| `/.eslintrc.json` | 60 | Configuration ESLint |
| `/.prettierrc` | 20 | Configuration Prettier |
| `/.gitignore` | 80 | Fichiers ignorés par Git |

### Desktop App

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/apps/desktop/package.json` | 87 | Dépendances et scripts desktop |
| `/apps/desktop/tsconfig.json` | 25 | Config TypeScript renderer |
| `/apps/desktop/tsconfig.main.json` | 25 | Config TypeScript main process |
| `/apps/desktop/vite.config.ts` | 40 | Configuration Vite |
| `/apps/desktop/tailwind.config.js` | 80 | Configuration TailwindCSS |
| `/apps/desktop/electron-builder.yml` | 60 | Configuration electron-builder |
| `/apps/desktop/drizzle.config.ts` | 20 | Configuration Drizzle ORM |

---

## 📄 Documentation

| Fichier | Lignes | Description |
|---------|--------|-------------|
| `/documentation/README.md` | ~800 | Index de la documentation |
| `/documentation/01_MANUEL_EXPLOITATION.md` | ~12,000 | Manuel d'exploitation |
| `/documentation/02_MANUEL_CODEUR_PARTIE1_ARCHITECTURE.md` | ~8,000 | Architecture technique |
| `/documentation/03_MANUEL_UTILISATEUR.md` | ~15,000 | Guide utilisateur complet |
| `/documentation/04_MANUEL_INSTALLATION.md` | ~10,000 | Installation utilisateur et développeur |
| `/documentation/05_GLOSSAIRE.md` | ~3,000 | Définitions et acronymes |
| `/documentation/06_DIAGRAMMES_ET_SCHEMAS.md` | ~5,000 | Diagrammes visuels |
| `/documentation/07_REFERENCE_RAPIDE.md` | ~2,000 | Référence rapide |
| `/documentation/08_INDEX_FICHIERS_SOURCE.md` | Ce fichier | Index des fichiers de code |

**Total documentation** : ~60,000 lignes

---

## 📊 Résumé par catégorie

| Catégorie | Fichiers | Lignes | % |
|-----------|----------|--------|---|
| **Main Process (Services)** | 22 | ~6,500 | 17% |
| **Main Process (Handlers)** | 13 | ~1,800 | 5% |
| **Renderer (Pages)** | 11 | ~3,700 | 9% |
| **Renderer (Composants)** | 82 | ~15,000 | 38% |
| **Renderer (Hooks)** | 12 | ~1,900 | 5% |
| **Python Services** | 8 | ~1,300 | 3% |
| **Packages Workspace** | 15 | ~3,500 | 9% |
| **Database** | 6 | ~800 | 2% |
| **Configuration** | 20 | ~800 | 2% |
| **Scripts** | 6 | ~1,000 | 3% |
| **Types** | 10 | ~1,500 | 4% |
| **Utils** | 8 | ~600 | 2% |
| **Tests** | ~10 | ~500 | 1% |
| **TOTAL** | **~200+** | **~38,979** | **100%** |

---

**Notes** :
- Les nombres de lignes sont approximatifs et incluent code, commentaires et espaces
- Les pourcentages sont calculés sur le total de ~39,000 lignes
- Certains fichiers très petits (<20 lignes) ne sont pas listés individuellement

---

**Fin de l'Index des Fichiers Source**

*Pour le code source complet avec explications, voir :*
- **Manuel Codeur Partie 2** (à venir) : Code source commenté de tous les services

*Dernière mise à jour : Novembre 2025*
*Version du document : 1.0*
