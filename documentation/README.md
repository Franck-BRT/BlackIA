# Documentation BlackIA - Index Complet

**Version**: 0.2.0
**Date**: Novembre 2025
**Auteur**: Black Room Technologies

---

## 📚 Vue d'ensemble

Bienvenue dans la documentation complète de **BlackIA**, une suite d'assistance IA 100% locale pour macOS.

Cette documentation contient **tous les détails** nécessaires pour :
- ✅ **Utiliser** BlackIA (utilisateur final)
- ✅ **Installer** BlackIA (utilisateur & développeur)
- ✅ **Exploiter** BlackIA (administrateur système)
- ✅ **Développer** sur BlackIA (développeur/contributeur)
- ✅ **Comprendre** l'architecture technique

---

## 📖 Documents disponibles

### 🔧 **Manuel d'Exploitation** (`01_MANUEL_EXPLOITATION.md`)

**Public** : Administrateurs système, DevOps, exploitants

**Contenu** :
- Architecture globale du projet
- Inventaire complet des modules (22 services, 82 composants)
- Structure des répertoires détaillée
- Configuration système et déploiement
- Maintenance et dépannage
- Logs et monitoring
- Sauvegardes

**Taille** : ~12,000 lignes | **Niveau** : Avancé

**Sections clés** :
- Liste exhaustive des modules avec emplacements
- Configuration des fichiers système
- Scripts de build et déploiement
- Procédures de maintenance

---

### 💻 **Manuel Codeur - Partie 1 : Architecture** (`02_MANUEL_CODEUR_PARTIE1_ARCHITECTURE.md`)

**Public** : Développeurs, architectes logiciels

**Contenu** :
- Architecture technique complète
- Stack technologique détaillée (React, Electron, TypeScript)
- Communication IPC (Electron main ↔ renderer)
- Drizzle ORM et base de données SQLite
- Intégration Python (RAG services)
- Structure du monorepo (pnpm workspace)
- Patterns de code et conventions

**Taille** : ~8,000 lignes | **Niveau** : Expert

**Code inclus** :
- Configuration TypeScript, Vite, Tailwind
- Hooks React personnalisés
- Gestion d'état avec Zustand + TanStack Query
- Handlers IPC complets
- Services métier

---

### 💻 **Manuel Codeur - Partie 2 : Services et Code Source** (À venir)

**Public** : Développeurs, contributeurs

**Contenu prévu** :
- Code source complet de tous les services (22 fichiers)
- Workflow Execution Engine (708 lignes commentées)
- Backend Manager (354 lignes)
- Colette Vision RAG Service (441 lignes)
- Ollama Client (442 lignes)
- Persona Service (609 lignes)
- Schéma de base de données complet (551 lignes)

**Taille estimée** : ~25,000 lignes | **Niveau** : Expert

---

### 👤 **Manuel Utilisateur** (`03_MANUEL_UTILISATEUR.md`)

**Public** : Utilisateurs finaux (tous niveaux)

**Contenu** :
- Démarrage rapide et premiers pas
- Guide complet de chaque module :
  - 💬 Chat (conversations, dossiers, tags, @mentions)
  - 🔄 Workflows (7 types de nœuds, variables, versioning)
  - 👤 Personas (8 personas par défaut, création personnalisée)
  - 📝 Prompts (bibliothèque réutilisable)
  - 📚 Library (RAG texte/vision/hybride)
  - 📖 Documentation (wiki intégré)
  - ✍️ Editor (markdown avec assistance IA)
- Paramètres complets (11 sections)
- Astuces et bonnes pratiques
- FAQ (10 questions courantes)

**Taille** : ~15,000 lignes | **Niveau** : Débutant à Intermédiaire

**Tutoriels inclus** :
- Créer votre première conversation
- Construire un workflow d'automatisation
- Indexer des documents pour le RAG
- Personnaliser une persona IA

---

### 🛠️ **Manuel d'Installation** (`04_MANUEL_INSTALLATION.md`)

**Public** : Utilisateurs finaux & développeurs

**Contenu** :

**Section Utilisateur** :
- Installation depuis DMG (macOS)
- Installation d'Ollama et des modèles LLM
- Configuration Python pour RAG
- Vérification de l'installation

**Section Développeur** :
- Setup complet de l'environnement de développement
- Installation Node.js, pnpm, Python
- Configuration des dépendances (38,979 LOC)
- Scripts d'installation automatisés
- Compilation et build DMG
- Dépendances complètes (Node + Python)

**Taille** : ~10,000 lignes | **Niveau** : Tous niveaux

**Scripts détaillés** :
- `dev.sh` - Lancement développement
- `build-dmg.sh` - Build production
- `verify-setup.sh` - Vérification complète
- `setup-python-venv.sh` - Environnement Python

---

### 📘 **Glossaire** (`05_GLOSSAIRE.md`)

**Public** : Tous

**Contenu** :
- Définitions de tous les termes techniques (150+ entrées)
- Acronymes courants (50+)
- Index alphabétique complet

**Taille** : ~3,000 lignes | **Niveau** : Référence

**Catégories** :
- Architecture (IPC, Electron, Main/Renderer)
- IA (LLM, RAG, Embeddings, Tokens)
- Workflows (Nodes, Variables, Templating)
- Base de données (ORM, SQLite, Migrations)
- Python (MLX, ColPali, Sentence Transformers)

---

### 📊 **Diagrammes et Schémas** (`06_DIAGRAMMES_ET_SCHEMAS.md`)

**Public** : Développeurs, architectes

**Contenu** :
- Architecture globale (Mermaid + ASCII)
- Flux de données (Chat, RAG, Workflows)
- Schéma de base de données (ERD complet)
- Architecture des workflows
- Système RAG (Text, Vision, Hybrid)
- Backend Manager
- Communication IPC
- Cycle de vie de l'application

**Taille** : ~5,000 lignes | **Niveau** : Visuel

**Formats** :
- Mermaid (rendu interactif)
- ASCII art (lisible en texte brut)
- PlantUML ready

---

### ⚡ **Guide de Référence Rapide** (`07_REFERENCE_RAPIDE.md`)

**Public** : Tous

**Contenu** :
- Raccourcis clavier complets
- Commandes CLI essentielles
- API IPC (90+ handlers)
- Types TypeScript principaux
- Snippets de code courants

**Taille** : ~2,000 lignes | **Niveau** : Référence

---

## 🗂️ Organisation de la documentation

```
documentation/
├── README.md                                    # Ce fichier (index)
├── 01_MANUEL_EXPLOITATION.md                   # Exploitation système
├── 02_MANUEL_CODEUR_PARTIE1_ARCHITECTURE.md    # Architecture technique
├── 02_MANUEL_CODEUR_PARTIE2_CODE_SOURCE.md     # Code source complet (à venir)
├── 03_MANUEL_UTILISATEUR.md                    # Guide utilisateur
├── 04_MANUEL_INSTALLATION.md                   # Installation complète
├── 05_GLOSSAIRE.md                             # Définitions et acronymes
├── 06_DIAGRAMMES_ET_SCHEMAS.md                 # Diagrammes visuels
└── 07_REFERENCE_RAPIDE.md                      # Référence rapide
```

---

## 🎯 Comment naviguer

### Par profil utilisateur

#### 👤 **Utilisateur final**
1. Commencez par : `03_MANUEL_UTILISATEUR.md`
2. Installation : `04_MANUEL_INSTALLATION.md` (Section 1)
3. Référence : `05_GLOSSAIRE.md` et `07_REFERENCE_RAPIDE.md`

#### 🔧 **Administrateur système**
1. Commencez par : `01_MANUEL_EXPLOITATION.md`
2. Installation : `04_MANUEL_INSTALLATION.md`
3. Dépannage : `01_MANUEL_EXPLOITATION.md` (Section 8)

#### 💻 **Développeur**
1. Commencez par : `02_MANUEL_CODEUR_PARTIE1_ARCHITECTURE.md`
2. Installation dev : `04_MANUEL_INSTALLATION.md` (Section 2)
3. Code source : `02_MANUEL_CODEUR_PARTIE2_CODE_SOURCE.md` (à venir)
4. Architecture : `06_DIAGRAMMES_ET_SCHEMAS.md`
5. Référence : `07_REFERENCE_RAPIDE.md`

### Par tâche

#### 🚀 **Installer BlackIA**
→ `04_MANUEL_INSTALLATION.md` Section 1 (utilisateur) ou Section 2 (dev)

#### 📖 **Apprendre à utiliser BlackIA**
→ `03_MANUEL_UTILISATEUR.md` (guide complet pas-à-pas)

#### 🔍 **Comprendre l'architecture**
→ `06_DIAGRAMMES_ET_SCHEMAS.md` puis `02_MANUEL_CODEUR_PARTIE1_ARCHITECTURE.md`

#### 🐛 **Résoudre un problème**
→ `01_MANUEL_EXPLOITATION.md` Section 8 (Dépannage)
→ `04_MANUEL_INSTALLATION.md` Section 9 (Problèmes courants)

#### 🛠️ **Développer une fonctionnalité**
→ `02_MANUEL_CODEUR_PARTIE1_ARCHITECTURE.md` + `02_MANUEL_CODEUR_PARTIE2_CODE_SOURCE.md`

#### ⚙️ **Déployer en production**
→ `01_MANUEL_EXPLOITATION.md` Section 6 (Déploiement)

---

## 📊 Statistiques de la documentation

| Métrique | Valeur |
|----------|--------|
| **Documents totaux** | 8 |
| **Lignes de documentation** | ~60,000 |
| **Code source documenté** | ~10,000 lignes |
| **Diagrammes** | 15+ |
| **Définitions (glossaire)** | 150+ |
| **Commandes CLI** | 50+ |
| **Raccourcis clavier** | 30+ |
| **Handlers IPC** | 90+ |
| **Services documentés** | 22 |
| **Composants React** | 82 |

---

## 🔗 Liens utiles

### Documentation externe

- **Electron**: https://www.electronjs.org/docs
- **React**: https://react.dev
- **Drizzle ORM**: https://orm.drizzle.team
- **Ollama**: https://ollama.ai/docs
- **TailwindCSS**: https://tailwindcss.com/docs
- **ReactFlow**: https://reactflow.dev/docs

### Dépôts et ressources

- **BlackIA GitHub**: https://github.com/[votre-org]/BlackIA
- **Colette (JoliBrain)**: https://github.com/jolibrain/colette
- **ColPali**: https://huggingface.co/vidore/colpali
- **MLX**: https://ml-explore.github.io/mlx

---

## 🤝 Contribution à la documentation

### Comment contribuer

Si vous souhaitez améliorer cette documentation :

1. **Identifier** une section à améliorer ou un manque
2. **Forker** le dépôt
3. **Éditer** le document markdown
4. **Tester** la lisibilité et la cohérence
5. **Soumettre** une Pull Request

### Standards de documentation

- **Markdown** : GitHub Flavored Markdown (GFM)
- **Ligne max** : 80 caractères pour code, illimité pour prose
- **Langue** : Français (documentation principale)
- **Code** : Commenté en français, noms de variables en anglais
- **Diagrammes** : Mermaid ou ASCII art

### Structure des documents

```markdown
# Titre du Document

**Version**: X.X.X
**Date**: Mois Année
**Auteur**: [Nom]
**Public**: [Utilisateurs/Développeurs/...]

---

## Table des Matières
[...]

## 1. Section Principale
[...]

---

**Fin du Document**

*Dernière mise à jour: [Date]*
*Version du document: [X.X]*
```

---

## 📝 Changelog de la documentation

### Version 1.0 (Novembre 2025)

**Documentation initiale complète** :
- ✅ Manuel d'exploitation (12,000 lignes)
- ✅ Manuel codeur Partie 1 (8,000 lignes)
- ✅ Manuel utilisateur (15,000 lignes)
- ✅ Manuel d'installation (10,000 lignes)
- ✅ Glossaire (3,000 lignes)
- ✅ Diagrammes et schémas (5,000 lignes)
- ✅ Guide de référence rapide (2,000 lignes)
- ⏳ Manuel codeur Partie 2 (à venir)

**Total** : ~60,000 lignes de documentation

---

## 📧 Support

### Questions générales
Pour toute question sur l'utilisation ou le développement, consultez :
1. Cette documentation (index ci-dessus)
2. Le wiki intégré dans l'application
3. Les issues GitHub (si publiques)

### Bugs et demandes de fonctionnalités
Utilisez le système d'issues GitHub (si disponible).

### Contact
Black Room Technologies
License: MIT (Open Source)

---

**Bonne lecture !**

*Cette documentation est vivante et sera mise à jour régulièrement.*
*N'hésitez pas à signaler toute erreur ou suggestion d'amélioration.*

---

**Dernière mise à jour** : Novembre 2025
**Version de BlackIA** : 0.2.0
**Version de la documentation** : 1.0
