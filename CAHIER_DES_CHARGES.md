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

#### Stack Technologique (Recommandations)
- **Interface:**
  - Electron ou Tauri pour application desktop native
  - React/Vue/Svelte pour l'UI
  - TailwindCSS pour le styling
- **Backend:**
  - Python (pour MLX, orchestration IA)
  - Node.js/TypeScript (pour serveur MCP, API)
- **Base de données:**
  - SQLite (local, léger)
  - Vector DB local (ChromaDB, LanceDB) pour embeddings
- **Workflow Engine:**
  - Custom ou adaptation de Node-RED, Temporal
- **Éditeur de code:**
  - Monaco Editor (VSCode base)

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

## 10. Extensibilité

### 10.1 Système de Plugins
- Architecture modulaire permettant ajout de fonctionnalités
- API pour développeurs tiers
- Marketplace de prompts/personas/workflows communautaires

### 10.2 API Interne
- RESTful API pour modules
- WebSocket pour temps réel
- Documentation complète

---

## 11. Phases de Développement

### Phase 1: MVP (Minimum Viable Product)
- Module Chat basique
- Intégration Ollama
- Bibliothèque de prompts simple
- Interface de base

### Phase 2: Modules Principaux
- Workflow engine
- Bibliothèque personas
- Générateurs de prompts/personas
- Module logs

### Phase 3: Modules Avancés
- Serveur MCP
- Gestion de projets de code
- Optimisations performances
- Tests et stabilisation

### Phase 4: Polish et Extensions
- UI/UX améliorée
- Documentation complète
- Système de plugins
- Tests utilisateurs

---

## 12. Critères de Succès

### 12.1 Métriques Techniques
- ✅ 100% fonctionnement local
- ✅ Support complet Apple Silicon
- ✅ Tous les modules fonctionnels
- ✅ Performance satisfaisante

### 12.2 Métriques Utilisateur
- Interface intuitive (feedback utilisateurs)
- Productivité améliorée
- Adoption des différents modules
- Satisfaction générale

---

## 13. Risques et Mitigation

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| Performance MLX insuffisante | Moyen | Faible | Fallback sur Ollama optimisé |
| Complexité UI workflow | Moyen | Moyen | Itérations UX, templates |
| Consommation mémoire élevée | Élevé | Moyen | Optimisation, modèles quantifiés |
| Compatibilité modèles Ollama | Faible | Faible | Tests extensifs |

---

## 14. Livrables

### 14.1 Code
- Application desktop BlackIA
- Documentation technique
- Tests unitaires et d'intégration

### 14.2 Documentation
- Guide utilisateur
- Documentation API
- Tutoriels et exemples
- Documentation d'architecture

### 14.3 Assets
- Bibliothèques de prompts/personas par défaut
- Templates de workflows
- Exemples de projets

---

## 15. Maintenance et Évolution

### 15.1 Mises à jour
- Système de mise à jour automatique
- Changelog détaillé
- Rétrocompatibilité

### 15.2 Support
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

---

**Document vivant - Sera mis à jour au fil du développement**
