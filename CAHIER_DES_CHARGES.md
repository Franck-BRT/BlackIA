# Cahier des Charges - BlackIA
## Outil d'Assistance IA - Black Room Technologies

**Version:** 1.0
**Date:** 4 Novembre 2025
**Statut:** En développement

---

## 1. Présentation du Projet

### 1.1 Contexte
BlackIA est une suite d'assistance IA complète fonctionnant intégralement en local, conçue pour offrir des outils avancés de productivité et d'automatisation basés sur l'intelligence artificielle.

### 1.2 Objectifs
Créer une plateforme d'assistance IA tout-en-un permettant :
- Des interactions conversationnelles intelligentes
- L'automatisation de flux de travail complexes
- La gestion de projets de développement
- La personnalisation avancée via prompts et personas

---

## 2. Public Cible

**Cible:** Tout public
- Développeurs
- Créateurs de contenu
- Professionnels de divers secteurs
- Utilisateurs souhaitant une IA locale et privée

---

## 3. Fonctionnalités Principales

### 3.1 Module Chat Conversationnel
**Description:** Interface de discussion pour interactions et questions avec l'IA

**Fonctionnalités:**
- Interface de chat intuitive
- Historique des conversations
- Support multi-sessions
- Intégration avec bibliothèque de prompts et personas
- Export/import de conversations

### 3.2 Module Workflow (Style MstyStudio)
**Description:** Système de création et exécution de flux de production automatisés

**Fonctionnalités:**
- Éditeur visuel de workflow (drag & drop)
- Nœuds de traitement variés :
  - Nœuds IA (génération, analyse, transformation)
  - Nœuds de logique (conditions, boucles)
  - Nœuds d'entrée/sortie (fichiers, API, base de données)
- Connexion entre nœuds
- Exécution pas à pas ou complète
- Sauvegarde et partage de workflows
- Templates de workflows pré-configurés

### 3.3 Bibliothèque de Prompts
**Description:** Collection organisée de prompts réutilisables

**Fonctionnalités:**
- Création, édition, suppression de prompts
- Catégorisation et tags
- Recherche et filtrage
- Variables dynamiques dans les prompts
- Import/export de prompts
- Utilisation dans :
  - Chat
  - Projets
  - Workflows

### 3.4 Bibliothèque de Personas
**Description:** Collection de personnalités IA personnalisables

**Fonctionnalités:**
- Création de personas avec :
  - Nom et description
  - Style de communication
  - Domaine d'expertise
  - Instructions système
  - Paramètres de modèle (température, etc.)
- Catégorisation et recherche
- Import/export de personas
- Utilisation dans :
  - Chat
  - Projets
  - Workflows

### 3.5 Module de Génération de Prompts Parfaits
**Description:** Assistant pour créer des prompts optimisés

**Fonctionnalités:**
- Interface guidée de création de prompts
- Analyse et suggestions d'amélioration
- Tests en temps réel
- Génération basée sur des objectifs
- Historique des versions
- Export vers bibliothèque de prompts

### 3.6 Module de Génération de Personas Parfaits
**Description:** Assistant pour créer des personas optimisés

**Fonctionnalités:**
- Wizard de création guidée
- Templates de personas par domaine
- Tests et validation
- Suggestions d'amélioration
- Export vers bibliothèque de personas

### 3.7 Module de Logs
**Description:** Système de journalisation et monitoring

**Fonctionnalités:**
- Logs applicatifs complets
- Logs des requêtes IA (tokens, latence)
- Logs des workflows (exécution, erreurs)
- Interface de visualisation
- Filtrage et recherche
- Export des logs
- Statistiques d'utilisation

### 3.8 Module Serveur MCP Intégré
**Description:** Serveur Model Context Protocol intégré

**Fonctionnalités:**
- Serveur MCP local
- Configuration des contextes
- Gestion des ressources
- API pour intégration externe
- Monitoring des connexions

### 3.9 Module de Gestion de Projets de Code
**Description:** Outils de création et suivi de projets de développement

**Fonctionnalités:**
- Création de projets
- Arborescence de fichiers
- Éditeur de code intégré
- Génération de code assistée par IA
- Analyse de code
- Refactoring assisté
- Tests et debugging
- Gestion de version (Git)
- Documentation automatique
- Suivi de tâches et TODOs

### 3.10 Module Bibliothèque de Documents ✅
**Description:** Système de gestion documentaire avec capacités RAG avancées

**Statut:** ✅ **CORE COMPLÉTÉ** - Phase de tests

**Fonctionnalités Implémentées:**
- Gestion de bibliothèques de documents :
  - Création, édition, suppression avec configuration RAG
  - Emplacement de stockage personnalisable
  - Statistiques automatiques
- Upload et gestion de documents :
  - Support PDF, images, documents texte
  - Extraction automatique du texte
  - Génération de vignettes
  - Système de validation (pending, validated, needs_review, rejected)
- Indexation RAG multi-mode :
  - **TEXT RAG** : Chunking configurable + Ollama embeddings
  - **VISION RAG** : Intégration Colette/ColPali (JoliBrain)
  - **HYBRID RAG** : Fusion text + vision
  - **AUTO** : Sélection intelligente du mode optimal
- Visualisation et édition des chunks :
  - Affichage côte-à-côte (document + chunks)
  - Opérations : split, merge, edit, insert, delete
  - Système de chunks manuels avec historique
  - Interface UX moderne (modals personnalisés)
- Recherche RAG avancée :
  - Late Interaction avec MaxSim scoring
  - Filtres multiples
  - Support multi-vecteurs

**Technologies Clés:**
- Colette/ColPali pour Vision RAG (JoliBrain)
- LanceDB pour vector store
- Drizzle ORM + SQLite
- Python ↔ Node.js communication

**Documentation Détaillée:** Voir [MODULE_BIBLIOTHEQUE_DOCUMENTS.md](MODULE_BIBLIOTHEQUE_DOCUMENTS.md)

---

## 4. Architecture Technique

### 4.1 Contraintes Techniques
- **100% Local:** Aucune dépendance cloud obligatoire
- **Plateforme:** macOS avec puces Apple Silicon (M1/M2/M3/M4)
- **Confidentialité:** Toutes les données restent sur la machine de l'utilisateur

### 4.2 Technologies Principales

#### Backend IA
- **Ollama:**
  - Mode intégré (embarqué dans l'application)
  - Mode distant (connexion à instance externe)
  - Gestion des modèles
- **MLX:** Framework d'apprentissage automatique optimisé pour Apple Silicon
- Support multi-modèles (LLM, vision, embeddings)

#### Stack Technologique (Décidée)
- **Interface:**
  - **Electron** pour application desktop native
  - **React 18+ avec TypeScript** pour l'UI
  - **TailwindCSS + shadcn/ui** pour le styling
  - **ReactFlow** pour le workflow editor
  - **Monaco Editor** pour l'éditeur de code
- **Backend:**
  - **Python 3.11+** (pour MLX, orchestration IA)
  - **Node.js 20+ / TypeScript** (main process, API)
  - **electron-trpc** pour IPC type-safe
- **Base de données:**
  - **SQLite** avec Drizzle ORM (local, léger)
  - **LanceDB** pour vector embeddings
- **IA:**
  - **Ollama** (mode intégré + distant)
  - **MLX** (optimisé Apple Silicon)
  - AI Router intelligent pour dispatch automatique
- **État:**
  - **Zustand** (state management)
  - **TanStack Query** (data fetching)

### 4.3 Architecture Modulaire

```
BlackIA/
├── core/                  # Noyau de l'application
│   ├── ai-engine/        # Gestion Ollama, MLX
│   ├── mcp-server/       # Serveur MCP
│   └── database/         # Gestion données locales
├── modules/
│   ├── chat/             # Module chat
│   ├── workflow/         # Module workflow
│   ├── prompt-library/   # Bibliothèque prompts
│   ├── persona-library/  # Bibliothèque personas
│   ├── prompt-generator/ # Générateur prompts
│   ├── persona-generator/# Générateur personas
│   ├── logs/             # Système de logs
│   └── code-project/     # Gestion projets code
├── ui/                   # Interface utilisateur
└── shared/               # Utilitaires partagés
```

---

## 5. Spécifications Fonctionnelles Détaillées

### 5.1 Flux d'Utilisation Typiques

**Scénario 1: Développeur créant un projet**
1. Créer nouveau projet de code
2. Sélectionner un persona "Expert Python"
3. Utiliser prompts de génération de code
4. Créer workflow de tests automatisés
5. Consulter logs pour debugging

**Scénario 2: Créateur de contenu**
1. Ouvrir chat avec persona "Rédacteur Marketing"
2. Utiliser prompts de la bibliothèque
3. Créer workflow de génération multi-étapes
4. Exporter résultats

**Scénario 3: Optimisation de prompts**
1. Ouvrir générateur de prompts
2. Définir objectif
3. Tester variations
4. Sauvegarder le prompt parfait
5. Utiliser dans workflow

### 5.2 Intégrations Entre Modules

- **Chat ↔ Bibliothèques:** Sélection rapide de prompts/personas
- **Workflow ↔ Bibliothèques:** Utilisation dans les nœuds
- **Projet ↔ Chat:** Assistance contextuelle au code
- **Logs ↔ Tous modules:** Traçabilité complète
- **MCP ↔ Tous modules:** Contexte partagé

---

## 6. Interface Utilisateur

### 6.1 Principes de Design
- **Simplicité:** Interface intuitive, courbe d'apprentissage douce
- **Productivité:** Raccourcis clavier, actions rapides
- **Thème:** Support mode clair/sombre
- **Responsive:** Adaptabilité aux différentes tailles d'écran

### 6.2 Navigation Principale
```
┌─────────────────────────────────────┐
│  BlackIA                      ⚙️ 👤 │
├─────────────────────────────────────┤
│ 💬 Chat                             │
│ 🔄 Workflows                        │
│ 📝 Prompts                          │
│ 🎭 Personas                         │
│ ✨ Générateurs                      │
│ 📊 Projets                          │
│ 📜 Logs                             │
│ 🔌 MCP Server                       │
└─────────────────────────────────────┘
```

---

## 7. Données et Persistance

### 7.1 Stockage Local
- **Base de données SQLite:** Métadonnées, configurations
- **Fichiers JSON:** Export/import, backups
- **Vector Store:** Embeddings pour recherche sémantique
- **Système de fichiers:** Projets, logs, cache

### 7.2 Sauvegarde et Export
- Backup automatique configurable
- Export sélectif par module
- Import/export de configurations complètes

---

## 8. Performance et Optimisation

### 8.1 Exigences
- **Démarrage:** < 5 secondes
- **Temps de réponse UI:** < 100ms
- **Génération IA:** Dépendant du modèle (streaming pour feedback immédiat)
- **Workflow:** Exécution parallèle quand possible

### 8.2 Optimisations Apple Silicon
- Utilisation de MLX pour performances maximales
- Metal pour accélération GPU
- Unified Memory optimization

---

## 9. Sécurité et Confidentialité

### 9.1 Principes
- **Privacy by design:** Aucune donnée ne quitte la machine
- **Chiffrement:** Données sensibles chiffrées au repos
- **Isolation:** Sandboxing des exécutions de code

### 9.2 Gestion des Modèles
- Téléchargement sécurisé depuis sources officielles
- Vérification d'intégrité (checksums)
- Gestion locale complète

---

## 10. Modèle de Licence

### 10.1 Open Source (MIT)
**Composants Open Source:**
- Core BlackIA et architecture de base
- Module Chat conversationnel
- Workflow Engine (fonctionnalités de base)
- Bibliothèques de Prompts et Personas
- Intégration Ollama
- Module Logs (fonctionnalités de base)
- API publique et documentation

### 10.2 Modules Propriétaires (Premium)
**Composants Propriétaires:**
- Module MLX avancé (fine-tuning, modèles custom)
- Workflow Engine (nœuds avancés : parallélisme, API, intégrations)
- Générateurs "parfaits" optimisés par IA
- Module MCP Server complet
- Module Projets (fonctionnalités avancées : refactoring IA, tests auto)
- Analytics et insights détaillés
- Synchronisation cloud optionnelle (chiffrée)
- Support technique prioritaire

### 10.3 Stratégie
- **Freemium:** Core gratuit et puissant pour adoption
- **Premium:** Fonctionnalités avancées pour professionnels
- **Communauté:** Contributions bienvenues sur partie open source
- **Transparence:** Code source core accessible sur GitHub

---

## 11. Extensibilité

### 11.1 Système de Plugins
- Architecture modulaire permettant ajout de fonctionnalités
- API pour développeurs tiers
- Marketplace de prompts/personas/workflows communautaires

### 11.2 API Interne
- Type-safe IPC avec electron-trpc
- RESTful API pour modules Python
- WebSocket pour temps réel
- Documentation complète auto-générée

---

## 12. Phases de Développement

### Phase 1: MVP (Minimum Viable Product) ✅ COMPLÉTÉ
- ✅ Module Chat basique
- ✅ Intégration Ollama
- ✅ Bibliothèque de prompts simple
- ✅ Interface de base

### Phase 2: Modules Principaux 🟡 EN COURS
- ✅ **Module Bibliothèque de Documents (CORE COMPLÉTÉ)**
  - Gestion de bibliothèques
  - Upload et indexation de documents
  - TEXT RAG + VISION RAG (Colette/ColPali)
  - Édition de chunks
  - Recherche RAG avancée
- ⏳ Workflow engine
- ⏳ Bibliothèque personas
- ⏳ Générateurs de prompts/personas
- ⏳ Module logs

### Phase 3: Modules Avancés ⏳ À VENIR
- Serveur MCP
- Gestion de projets de code
- Optimisations performances
- Tests et stabilisation

### Phase 4: Polish et Extensions ⏳ À VENIR
- UI/UX améliorée
- Documentation complète
- Système de plugins
- Tests utilisateurs

---

## 13. Critères de Succès

### 13.1 Métriques Techniques
- ✅ 100% fonctionnement local
- ✅ Support complet Apple Silicon
- ✅ Tous les modules fonctionnels
- ✅ Performance satisfaisante

### 13.2 Métriques Utilisateur
- Interface intuitive (feedback utilisateurs)
- Productivité améliorée
- Adoption des différents modules
- Satisfaction générale

---

## 14. Risques et Mitigation

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Performance MLX insuffisante | Moyen | Faible | Fallback sur Ollama optimisé |
| Complexité UI workflow | Moyen | Moyen | Itérations UX, templates |
| Consommation mémoire élevée | Élevé | Moyen | Optimisation, modèles quantifiés |
| Compatibilité modèles Ollama | Faible | Faible | Tests extensifs |

---

## 15. Livrables

### 15.1 Code
- Application desktop BlackIA
- Documentation technique
- Tests unitaires et d'intégration

### 15.2 Documentation
- Guide utilisateur
- Documentation API
- Tutoriels et exemples
- Documentation d'architecture

### 15.3 Assets
- Bibliothèques de prompts/personas par défaut
- Templates de workflows
- Exemples de projets

---

## 16. Maintenance et Évolution

### 16.1 Mises à jour
- Système de mise à jour automatique
- Changelog détaillé
- Rétrocompatibilité

### 16.2 Support
- Documentation en ligne
- Système de feedback intégré
- Issues GitHub

---

## Annexes

### A. Glossaire
- **MCP:** Model Context Protocol
- **MLX:** Machine Learning framework pour Apple Silicon
- **Ollama:** Runtime local pour LLM
- **Persona:** Personnalité IA prédéfinie
- **Workflow:** Flux d'automatisation

### B. Références
- Ollama: https://ollama.ai
- MLX: https://github.com/ml-explore/mlx
- MCP: https://modelcontextprotocol.io
- React: https://react.dev
- Electron: https://www.electronjs.org
- ReactFlow: https://reactflow.dev

### C. Documents Complémentaires
- [Décisions Techniques](DECISIONS_TECHNIQUES.md) - Choix technologiques détaillés et architecture
- [Module Bibliothèque de Documents](MODULE_BIBLIOTHEQUE_DOCUMENTS.md) - Cahier des charges et état d'avancement détaillé du module RAG
- [Tests de la Bibliothèque](LIBRARY_TESTS.md) - Plan de tests pour le module bibliothèque

---

**Document vivant - Sera mis à jour au fil du développement**
**Dernière mise à jour:** 12 Novembre 2025
