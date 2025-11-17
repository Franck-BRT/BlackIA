# BlackIA - Glossaire

**Version**: 0.2.0
**Date**: Novembre 2025

---

## A

**API (Application Programming Interface)**
Interface permettant à différents logiciels de communiquer entre eux.

**Apple Silicon**
Processeurs ARM conçus par Apple (M1, M2, M3, M4). Optimisés pour l'efficacité énergétique et les performances.

**Attachment (Pièce jointe)**
Fichier joint à une conversation ou un document dans BlackIA, pouvant être indexé pour le RAG.

---

## B

**Backend IA**
Service fournissant les capacités d'intelligence artificielle (Ollama, MLX).

**better-sqlite3**
Bibliothèque Node.js pour SQLite, plus rapide que les alternatives.

**Breadcrumb (Fil d'Ariane)**
Navigation hiérarchique montrant le chemin actuel (ex: Docs > Guides > Workflows).

---

## C

**Chat Streaming**
Affichage en temps réel des réponses de l'IA, token par token.

**Chunk (Fragment)**
Portion de texte découpée d'un document pour l'indexation RAG. Taille typique: 500-2000 caractères.

**Colette**
Système de Vision RAG développé par JoliBrain, utilisant ColPali.

**ColPali**
Modèle d'embeddings multi-vecteurs pour documents visuels (PDFs, images).

**Context Window**
Nombre maximum de tokens qu'un modèle IA peut traiter simultanément.

**Conversation**
Fil de discussion avec l'IA, composé de messages utilisateur et assistant.

---

## D

**DMG (Disk Image)**
Format d'archive macOS pour distribuer des applications.

**Drizzle ORM**
ORM (Object-Relational Mapping) TypeScript pour bases de données SQL.

**Dual RAG Mode**
Capacité d'indexer un document en mode texte ET vision simultanément.

---

## E

**Electron**
Framework pour créer des applications desktop multiplateformes avec web technologies.

**Embeddings (Plongements)**
Représentation vectorielle d'un texte ou d'une image pour calculs de similarité.

**Environment Variables**
Variables système utilisables dans les workflows (secrets, configs).

---

## F

**Few-Shot Learning**
Technique d'apprentissage IA avec quelques exemples fournis dans le prompt.

**Folder (Dossier)**
Conteneur organisationnel pour conversations, workflows, ou documents.

**Full-Text Search (FTS)**
Recherche textuelle avancée dans le contenu des documents (FTS5 dans SQLite).

---

## G

**Glassmorphism**
Style visuel avec effets de transparence et flou, inspiré de macOS.

**Global Variables**
Variables utilisables dans tous les workflows de l'application.

---

## H

**Handler IPC**
Fonction côté main process qui répond aux appels IPC du renderer.

**Hot Reload**
Rechargement automatique de l'interface lors de modifications en développement.

**Hybrid RAG**
Mode RAG combinant recherche textuelle et visuelle pour meilleure précision.

---

## I

**IPC (Inter-Process Communication)**
Communication entre le main process (Node.js) et le renderer (React) dans Electron.

**Indexation**
Processus de création d'embeddings pour un document afin de le rendre cherchable.

---

## J

**JSON (JavaScript Object Notation)**
Format d'échange de données lisible par humains et machines.

---

## L

**LanceDB**
Base de données vectorielle haute performance pour RAG.

**Late Interaction**
Technique de recherche Vision RAG comparant les vecteurs au niveau des patches (MaxSim).

**Library (Bibliothèque)**
Collection de documents indexés pour le RAG.

**LLM (Large Language Model)**
Modèle d'IA entraîné sur de grandes quantités de texte (ex: Llama, Mistral).

**Loop Node (Nœud Boucle)**
Nœud de workflow répétant une série d'actions (forEach, while, count).

---

## M

**Main Process**
Processus Node.js principal d'une application Electron (backend).

**MaxSim (Maximum Similarity)**
Algorithme de scoring pour Vision RAG : max(similarité) entre patches.

**Migration**
Script de modification de schéma de base de données pour évolution.

**MLX**
Framework d'Apple pour machine learning optimisé Apple Silicon.

**Monorepo**
Dépôt Git contenant plusieurs projets/packages liés (apps/, packages/).

**Multi-Vector Embeddings**
Embeddings avec plusieurs vecteurs par document (patches pour Vision RAG).

---

## N

**NDJSON (Newline Delimited JSON)**
Format de streaming JSON avec un objet par ligne.

**Node (Nœud)**
Élément d'un workflow représentant une action (Input, AI Prompt, Condition, etc.).

**nomic-embed-text**
Modèle d'embeddings texte populaire pour RAG.

---

## O

**Ollama**
Outil pour exécuter des LLMs en local sur votre machine.

**ORM (Object-Relational Mapping)**
Mapping entre objets code et tables de base de données.

**Output Node**
Nœud de workflow capturant le résultat final.

---

## P

**Patch (Vignette)**
Sous-région d'une image utilisée pour Vision RAG (typiquement 1024 patches/page).

**Persona**
Personnalité IA avec system prompt, paramètres, et comportement spécifiques.

**pnpm**
Gestionnaire de paquets Node.js performant et économe en espace disque.

**Prompt**
Instruction donnée à un modèle IA pour générer du contenu.

**PyTorch**
Framework de deep learning open source utilisé pour ColPali/MLX.

---

## Q

**Qwen2-VL**
Modèle vision-language de Alibaba pour Vision RAG.

**Query (Requête)**
Question ou recherche posée au système RAG.

---

## R

**RAG (Retrieval-Augmented Generation)**
Technique combinant recherche documentaire et génération IA pour réponses contextuelles.

**React**
Bibliothèque JavaScript pour construire des interfaces utilisateurs.

**ReactFlow**
Bibliothèque React pour créer des éditeurs de graphes/workflows visuels.

**Renderer Process**
Processus Chromium affichant l'interface utilisateur dans Electron.

---

## S

**Schema (Schéma)**
Structure de base de données définissant tables, colonnes, et relations.

**Sentence Transformers**
Bibliothèque Python pour générer des embeddings texte.

**Service**
Module de logique métier encapsulant des opérations (PersonaService, RAGService).

**Singleton**
Pattern de conception garantissant une seule instance d'une classe.

**SQLite**
Base de données relationnelle légère, embarquée dans l'application.

**Streaming**
Transmission de données en temps réel, chunk par chunk.

**System Prompt**
Instructions initiales définissant le comportement d'une persona IA.

---

## T

**Tag (Étiquette)**
Mot-clé pour catégoriser conversations, workflows, documents.

**TailwindCSS**
Framework CSS utility-first pour styling rapide.

**Template (Modèle)**
Workflow ou persona pré-configuré réutilisable.

**Token**
Unité de texte traitée par un modèle IA (≈ 0.75 mots en anglais).

**Transform Node**
Nœud de workflow transformant des données (format, extraction, fusion).

**Turborepo**
Outil de build pour monorepos, avec cache intelligent.

**TypeScript**
Sur-ensemble typé de JavaScript apportant sécurité et auto-complétion.

---

## U

**UI (User Interface)**
Interface utilisateur, partie visible de l'application.

**Universal Binary**
Application macOS fonctionnant sur Apple Silicon ET Intel.

---

## V

**Variable Interpolation**
Remplacement de `{{variable}}` par sa valeur dans prompts et workflows.

**Vector (Vecteur)**
Représentation numérique d'un texte/image pour calculs mathématiques.

**Vector Store**
Base de données optimisée pour stocker et rechercher des vecteurs (LanceDB).

**Vision RAG**
RAG basé sur l'analyse visuelle des documents (images, PDF, schémas).

**Vite**
Outil de build moderne et rapide pour applications web (ESM, HMR).

---

## W

**WAL (Write-Ahead Logging)**
Mode SQLite améliorant performances et concurrence.

**Workflow**
Automatisation visuelle enchaînant plusieurs actions IA et transformations.

**Workspace (Espace de travail)**
Configuration pnpm pour gérer plusieurs packages dans un monorepo.

---

## Z

**Zustand**
Bibliothèque de gestion d'état React, légère et performante.

---

## Acronymes courants

| Acronyme | Signification |
|----------|---------------|
| **AI** | Artificial Intelligence |
| **API** | Application Programming Interface |
| **CLI** | Command Line Interface |
| **CPU** | Central Processing Unit |
| **CRUD** | Create, Read, Update, Delete |
| **CSS** | Cascading Style Sheets |
| **DB** | Database |
| **DI** | Dependency Injection |
| **DMG** | Disk Image |
| **DOM** | Document Object Model |
| **ESM** | ECMAScript Modules |
| **FTS** | Full-Text Search |
| **GPU** | Graphics Processing Unit |
| **GUI** | Graphical User Interface |
| **HMR** | Hot Module Replacement |
| **HTML** | HyperText Markup Language |
| **HTTP** | HyperText Transfer Protocol |
| **IDE** | Integrated Development Environment |
| **IPC** | Inter-Process Communication |
| **JS** | JavaScript |
| **JSON** | JavaScript Object Notation |
| **LLM** | Large Language Model |
| **MPS** | Metal Performance Shaders (Apple) |
| **NDJSON** | Newline Delimited JSON |
| **OCR** | Optical Character Recognition |
| **ORM** | Object-Relational Mapping |
| **PDF** | Portable Document Format |
| **RAM** | Random Access Memory |
| **RAG** | Retrieval-Augmented Generation |
| **REST** | Representational State Transfer |
| **SDK** | Software Development Kit |
| **SQL** | Structured Query Language |
| **TS** | TypeScript |
| **UI** | User Interface |
| **URL** | Uniform Resource Locator |
| **UX** | User Experience |
| **VLM** | Vision-Language Model |
| **WAL** | Write-Ahead Logging |
| **YAML** | YAML Ain't Markup Language |

---

**Fin du Glossaire**

*Dernière mise à jour: Novembre 2025*
*Version du document: 1.0*
