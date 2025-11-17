# BlackIA - Manuel Utilisateur

**Version**: 0.2.0
**Date**: Novembre 2025
**Auteur**: Black Room Technologies
**Public**: Utilisateurs finaux

---

## Table des Matières

1. [Introduction](#introduction)
2. [Démarrage rapide](#démarrage-rapide)
3. [Module Chat](#module-chat)
4. [Module Workflows](#module-workflows)
5. [Module Personas](#module-personas)
6. [Module Prompts](#module-prompts)
7. [Module Library (Bibliothèque)](#module-library)
8. [Module Documentation](#module-documentation)
9. [Module Editor](#module-editor)
10. [Paramètres](#paramètres)
11. [Astuces et bonnes pratiques](#astuces-et-bonnes-pratiques)
12. [FAQ](#faq)

---

## 1. Introduction

### 1.1 Qu'est-ce que BlackIA ?

**BlackIA** est une suite complète d'assistance IA qui fonctionne **100% en local** sur votre Mac. Aucune connexion internet n'est requise pour utiliser les fonctionnalités principales. Vos données restent sur votre ordinateur.

**Fonctionnalités principales** :
- 💬 **Chat IA** avec conversations illimitées
- 🔄 **Workflows** automatisés pour tâches complexes
- 👤 **Personas** IA personnalisables
- 📝 **Bibliothèque de prompts** réutilisables
- 📚 **Gestion documentaire** avec RAG (Retrieval-Augmented Generation)
- ✍️ **Éditeur** markdown avec assistance IA
- 📖 **Documentation** intégrée

### 1.2 Configuration système requise

- **macOS**: 11.0 (Big Sur) ou supérieur
- **RAM**: 16 GB minimum (32 GB recommandé pour les gros modèles)
- **Stockage**: 5 GB + espace pour vos documents
- **Processeur**: Apple Silicon (M1/M2/M3/M4) recommandé

### 1.3 Premiers pas

1. **Installer Ollama** (recommandé) :
   ```bash
   # Depuis https://ollama.ai
   brew install ollama
   ollama serve
   ```

2. **Télécharger des modèles** :
   ```bash
   ollama pull llama3.2:3b      # Modèle léger (2 GB)
   ollama pull mistral:7b       # Modèle moyen (4 GB)
   ollama pull llama3.1:70b     # Modèle puissant (39 GB)
   ```

3. **Lancer BlackIA** :
   - Double-cliquez sur l'icône dans `/Applications`
   - L'application détectera automatiquement Ollama

---

## 2. Démarrage rapide

### 2.1 Interface principale

```
┌─────────────────────────────────────────────────────────┐
│  ☰ Menu   BlackIA                    🔍 Recherche   ⚙️  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [💬 Chat]  [🔄 Workflows]  [👤 Personas]  [📝 Prompts] │
│  [📚 Library]  [📖 Docs]  [✍️ Editor]                   │
│                                                          │
│                                                          │
│              Zone de contenu principale                  │
│                                                          │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Navigation rapide

**Raccourcis clavier** :
- `Cmd + 1` : Ouvrir le Chat
- `Cmd + 2` : Ouvrir les Workflows
- `Cmd + 3` : Ouvrir les Personas
- `Cmd + 4` : Ouvrir les Prompts
- `Cmd + 5` : Ouvrir la Library
- `Cmd + K` : Recherche globale
- `Cmd + ,` : Paramètres

### 2.3 Première conversation

1. Cliquez sur **💬 Chat**
2. Tapez votre message dans la zone de texte en bas
3. Appuyez sur `Entrée` ou cliquez sur le bouton d'envoi
4. L'IA répond en temps réel (streaming)

**Exemple** :
```
Vous : Explique-moi ce qu'est une API REST en termes simples

IA : Une API REST est comme un menu de restaurant pour
     votre logiciel...
```

---

## 3. Module Chat

### 3.1 Créer une conversation

1. Cliquez sur **"Nouvelle conversation"** (+)
2. (Optionnel) Sélectionnez une **Persona** avec `@mention`
3. Commencez à taper votre message

### 3.2 Organisation des conversations

#### Dossiers
Organisez vos conversations par projets ou thèmes :

1. Clic droit dans la barre latérale → **"Nouveau dossier"**
2. Nommez le dossier (ex: "Développement Web")
3. Glissez-déposez des conversations dans le dossier

#### Tags
Ajoutez des étiquettes pour retrouver vos conversations :

1. Clic droit sur une conversation → **"Gérer les tags"**
2. Ajoutez ou créez des tags (ex: `#python`, `#urgent`)
3. Les tags sont synchronisés dans toute l'application

#### Favoris
Marquez vos conversations importantes avec ⭐

### 3.3 Mentions

#### @Personas
Utilisez des personas spécialisées dans votre message :

```
Vous : @Python Expert comment optimiser cette boucle ?
       for i in range(len(data)):
           process(data[i])

IA (Python Expert) : Je recommande d'utiliser enumerate()...
```

#### /Prompts
Insérez des prompts réutilisables :

```
Vous : /expliquer-code
       function add(a, b) { return a + b; }

IA : Ce code définit une fonction JavaScript qui...
```

### 3.4 Pièces jointes

Joignez des fichiers à vos conversations :

1. Cliquez sur 📎 (trombone) ou glissez-déposez un fichier
2. Formats supportés : `.txt`, `.md`, `.pdf`, `.doc`, `.jpg`, `.png`
3. Le contenu est automatiquement indexé (RAG) si activé

**Modes RAG** :
- **Aucun** : Fichier joint sans indexation
- **Texte** : Indexation du texte uniquement
- **Vision** : Indexation visuelle (PDF, images)
- **Hybride** : Texte + Vision (meilleure qualité)

### 3.5 Export et sauvegarde

#### Exporter une conversation
1. Clic droit sur la conversation → **"Exporter"**
2. Choisissez le format :
   - **Markdown** (.md) - Texte brut
   - **PDF** (.pdf) - Prêt à imprimer
   - **JSON** (.json) - Avec métadonnées

#### Sauvegarde automatique
Toutes les conversations sont sauvegardées automatiquement dans :
```
~/Library/Application Support/BlackIA/database/blackia.db
```

### 3.6 Statistiques

Consultez vos statistiques d'utilisation :
- Nombre de messages par jour (graphique 7 jours)
- Conversations les plus actives
- Personas les plus utilisées
- Tokens consommés

---

## 4. Module Workflows

### 4.1 Qu'est-ce qu'un workflow ?

Un **workflow** est une automatisation visuelle qui enchaîne plusieurs actions :
- Génération de contenu avec IA
- Transformations de données
- Conditions et boucles
- Extraction d'informations

**Exemple** : "Analyser un fichier CSV et générer un rapport"

### 4.2 Créer un workflow

1. Cliquez sur **🔄 Workflows** → **"Nouveau workflow"**
2. Donnez-lui un nom (ex: "Résumé de documents")
3. Glissez-déposez des **nœuds** depuis la palette de gauche
4. Connectez les nœuds avec des **flèches** (cliquez-glissez)
5. Configurez chaque nœud en cliquant dessus

### 4.3 Types de nœuds

#### 🔵 Input (Entrée)
Point de départ du workflow. Définit les données d'entrée.

**Configuration** :
- Type : Texte, Fichier, Variable
- Nom de la variable : `input_text`
- Valeur par défaut (optionnel)

**Exemple** :
```
Type : Texte
Variable : article_text
Valeur : [Contenu de l'article à résumer]
```

#### 🟢 AI Prompt
Génère du contenu avec l'IA.

**Configuration** :
- Prompt : Votre instruction à l'IA
- Modèle : llama3.2, mistral, etc.
- Variables : Utilisez `{{variable_name}}`

**Exemple** :
```
Prompt : Résume cet article en 3 points clés :
{{article_text}}

Variables : article_text (depuis Input)
```

#### 🟡 Condition
Branche le workflow selon une condition.

**Configuration** :
- Condition : Expression JavaScript
- Sortie "Oui" (true) → Nœud A
- Sortie "Non" (false) → Nœud B

**Exemple** :
```
Condition : {{word_count}} > 500
Oui → Résumé long
Non → Résumé court
```

#### 🟠 Loop (Boucle)
Répète une série de nœuds.

**Types** :
- **For Each** : Itère sur un tableau
- **While** : Répète tant qu'une condition est vraie
- **Count** : Répète N fois

**Configuration** :
```
Type : For Each
Collection : {{paragraphs}}
Variable : current_paragraph
Corps : [Nœuds à répéter]
```

#### 🔴 Transform
Transforme des données.

**Opérations** :
- **Format** : Changer le format (JSON, CSV, texte)
- **Extract** : Extraire des champs
- **Merge** : Fusionner des données

**Exemple** :
```
Opération : Extract
Champ : "summary" depuis {{ai_response}}
```

#### 🟣 Switch
Branche vers plusieurs chemins selon une valeur.

**Configuration** :
```
Variable : {{document_type}}
Cas "PDF" → Traitement PDF
Cas "Word" → Traitement Word
Défaut → Erreur
```

#### ⚪ Output (Sortie)
Point de sortie du workflow. Capture le résultat final.

**Configuration** :
- Nom : Nom du résultat (ex: "final_summary")
- Valeur : `{{summary_text}}`

### 4.4 Variables

#### Types de variables

**Variables de workflow** :
```
{{input_text}}      # Variable depuis un nœud Input
{{ai_response}}     # Réponse d'un nœud AI Prompt
{{loop_index}}      # Index de boucle actuel
```

**Variables globales** :
```
{{global.author_name}}     # Définies dans Settings
{{global.company_name}}
```

**Variables d'environnement** :
```
{{env.OPENAI_API_KEY}}     # Secrets chiffrés
```

#### Définir des variables

1. **Settings** → **Variables**
2. Cliquez sur **"Nouvelle variable"**
3. Type : Workflow, Global, ou Environnement
4. Nom : `company_name`
5. Valeur : `Black Room Technologies`

### 4.5 Templates de workflows

#### Utiliser un template

1. **Workflows** → **"Nouveau depuis template"**
2. Parcourez les templates disponibles :
   - 📄 "Résumé de document"
   - 📧 "Génération d'emails"
   - 📊 "Analyse de données"
   - ✍️ "Rédaction d'article"
3. Cliquez sur **"Utiliser ce template"**
4. Personnalisez selon vos besoins

#### Créer un template

1. Créez un workflow complet et testé
2. Clic droit → **"Sauvegarder comme template"**
3. Remplissez les métadonnées :
   - Nom : "Mon template personnalisé"
   - Description : "Ce que fait le template"
   - Catégorie : "Productivité"
   - Tags : `#automation`, `#text`
4. Le template apparaît dans la bibliothèque

### 4.6 Versioning des workflows

BlackIA inclut un système de **contrôle de version Git-like** :

#### Créer une version

1. Après avoir modifié un workflow
2. Cliquez sur **"Créer une version"** (icône 🔖)
3. Donnez un nom : `v1.1 - Amélioration du résumé`
4. Message de commit : "Ajout de la gestion des images"

#### Restaurer une version

1. **Historique des versions** (icône 📜)
2. Parcourez les versions précédentes
3. Cliquez sur **"Restaurer"** pour revenir à cette version

#### Comparer des versions

Visualisez les différences entre deux versions :
- Nœuds ajoutés (vert)
- Nœuds supprimés (rouge)
- Nœuds modifiés (orange)

### 4.7 Exécution de workflows

#### Exécuter manuellement

1. Ouvrez votre workflow
2. Cliquez sur **"Exécuter"** (▶️)
3. Fournissez les entrées demandées
4. Suivez l'exécution en temps réel :
   - Nœuds en attente (gris)
   - Nœud en cours (bleu animé)
   - Nœuds terminés (vert)
   - Erreurs (rouge)

#### Voir les résultats

1. Panneau **"Résultats"** en bas
2. Consultez :
   - Sorties finales (Output nodes)
   - Logs d'exécution
   - Durée totale
   - Variables intermédiaires

#### Debug d'un workflow

1. Cliquez sur un nœud après exécution
2. Consultez :
   - **Input** : Données entrantes
   - **Output** : Données sortantes
   - **Logs** : Messages de debug
   - **Durée** : Temps d'exécution

---

## 5. Module Personas

### 5.1 Qu'est-ce qu'une persona ?

Une **persona** est une personnalité IA spécialisée avec :
- Un **système prompt** qui définit son comportement
- Des **paramètres** (température, tokens max)
- Des **exemples few-shot** pour guider les réponses
- Une **apparence** (avatar, couleur)

### 5.2 Personas par défaut

BlackIA inclut 8 personas pré-configurées :

| Persona | Spécialité | Usage |
|---------|------------|-------|
| 🤖 **Assistant Général** | Polyvalent | Questions générales |
| 🐍 **Expert Python** | Programmation Python | Code, debug, optimisation |
| ⚛️ **Dev React/TypeScript** | Frontend | React, TS, composants |
| ✍️ **Rédacteur Pro** | Écriture | Articles, contenu web |
| 👨‍🏫 **Professeur** | Pédagogie | Explications simples |
| 🔍 **Analyste** | Recherche | Analyse de données |
| 🎨 **Créatif** | Storytelling | Histoires, créativité |
| 💼 **Consultant Business** | Stratégie | Plans d'affaires |

### 5.3 Créer une persona personnalisée

1. **Personas** → **"Nouvelle persona"**
2. Remplissez les champs :

#### Informations de base
```
Nom : Expert Docker
Description : Spécialiste des conteneurs et orchestration
Avatar : 🐳
Couleur : Bleu
Catégorie : Développement
Tags : #docker, #kubernetes, #devops
```

#### Système Prompt
```
Tu es un expert Docker et Kubernetes avec 10 ans d'expérience.
Tu fournis des solutions pratiques et production-ready.
Tu expliques toujours les best practices de sécurité.
Format tes réponses avec :
1. Solution rapide
2. Explication détaillée
3. Alternatives à considérer
```

#### Paramètres IA
```
Modèle préféré : mistral:7b
Température : 0.7 (créativité moyenne)
Max tokens : 2000
```

#### Few-Shot Examples (optionnel)
Ajoutez des exemples de conversations pour guider l'IA :

```
Utilisateur : Comment optimiser la taille de mon image Docker ?

Assistant : **Solution rapide:**
FROM python:3.11-slim  # Utilisez une image slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

**Explications:**
- `python:3.11-slim` : Réduit de 900 MB → 150 MB
- `--no-cache-dir` : Évite le cache pip
- Multi-stage builds pour encore plus de réduction

**Alternatives:**
- Alpine Linux (encore plus léger mais complexe)
- Distroless (Google, ultra sécurisé)
```

### 5.4 Utiliser une persona

#### Dans le Chat
```
@Docker Expert comment créer un réseau bridge personnalisé ?
```

#### Dans un Workflow
Sélectionnez la persona dans le nœud **AI Prompt** :
```
Persona : Expert Docker
Prompt : Génère un docker-compose.yml pour...
```

### 5.5 Suggestions automatiques

BlackIA suggère automatiquement des personas selon vos mots-clés :

```
Vous tapez : "comment faire un composant react"
              ↓
Suggestion : @Dev React/TypeScript

Vous tapez : "écris un article sur"
              ↓
Suggestion : @Rédacteur Pro
```

**Configuration** :
1. **Personas** → Sélectionnez une persona → **"Mots-clés de suggestion"**
2. Ajoutez des mots-clés : `react`, `composant`, `jsx`, `hooks`

### 5.6 Import/Export de personas

#### Exporter
```
Clic droit → "Exporter" → Choisir l'emplacement
Fichier : expert_docker.persona.json
```

#### Importer
```
"Importer une persona" → Sélectionner le fichier .persona.json
```

**Partager avec la communauté** :
Les fichiers `.persona.json` peuvent être partagés avec d'autres utilisateurs !

---

## 6. Module Prompts

### 6.1 Bibliothèque de prompts

Créez une collection de prompts réutilisables pour gagner du temps.

### 6.2 Créer un prompt

1. **Prompts** → **"Nouveau prompt"**
2. Remplissez :

```
Nom : Expliquer du code
Catégorie : Développement
Tags : #code, #explanation

Contenu :
Explique ce code de manière claire et structurée :

```{{language}}
{{code}}
```

Inclus :
1. Ce que fait le code (résumé)
2. Explication ligne par ligne des parties complexes
3. Améliorations possibles

Variables : language, code
```

### 6.3 Variables dans les prompts

Utilisez `{{variable_name}}` pour créer des prompts dynamiques :

```
Génère un article de blog sur {{sujet}}
pour un public {{niveau}}
en {{nombre_mots}} mots.

Ton : {{ton}}
Style : {{style}}
```

**Lors de l'utilisation** :
```
→ Sujet : Intelligence Artificielle
→ Niveau : Débutant
→ Nombre de mots : 500
→ Ton : Pédagogique
→ Style : Vulgarisé
```

### 6.4 Utiliser un prompt

#### Dans le Chat
```
/expliquer-code

[Le système demande les variables]
→ Language : python
→ Code : [collez votre code]
```

#### Dans un Workflow
Sélectionnez le prompt dans un nœud **AI Prompt** :
```
Prompt : {{prompts.expliquer-code}}
Variables automatiquement injectées
```

### 6.5 Organisation

- **Catégories** : Développement, Écriture, Analyse, etc.
- **Tags** : `#quick`, `#detailed`, `#code`, `#text`
- **Favoris** : ⭐ pour accès rapide
- **Recherche** : Recherche full-text dans noms et contenus

---

## 7. Module Library (Bibliothèque)

### 7.1 Qu'est-ce que le RAG ?

**RAG** (Retrieval-Augmented Generation) permet à l'IA de :
- Rechercher dans vos documents
- Fournir des réponses basées sur vos données
- Citer les sources utilisées

**Exemple** :
```
Vous : Quel est le processus de déploiement décrit dans notre doc ?

IA : D'après votre document "Guide DevOps.pdf", le processus est :
     1. Tests automatisés
     2. Build Docker
     3. Déploiement sur staging
     4. Tests d'intégration
     5. Déploiement production

     Source : Guide DevOps.pdf, page 12
```

### 7.2 Créer une bibliothèque

1. **Library** → **"Nouvelle bibliothèque"**
2. Configuration :

```
Nom : Documentation Technique
Description : Guides et specs du projet

Mode RAG : Hybride (Texte + Vision)
Modèle Texte : nomic-embed-text
Modèle Vision : colpali

Chunk size : 1000 caractères
Chunk overlap : 200 caractères
```

### 7.3 Ajouter des documents

#### Méthode 1 : Glisser-déposer
Glissez des fichiers directement dans la bibliothèque

#### Méthode 2 : Upload
1. **"Ajouter des documents"**
2. Sélectionnez un ou plusieurs fichiers
3. Formats supportés :
   - **Texte** : `.txt`, `.md`, `.doc`, `.docx`
   - **PDF** : `.pdf`
   - **Images** : `.jpg`, `.png` (avec Vision RAG)
   - **Code** : `.py`, `.js`, `.ts`, `.java`, etc.

#### Méthode 3 : Depuis une URL
```
"Ajouter depuis URL" → Collez l'URL → "Télécharger"
```

### 7.4 Workflow de validation

Les documents passent par 4 états :

```
1. ⏳ En attente (pending)
   ↓
2. ✅ Validé (validated) ← Prêt pour indexation
   ↓
3. 📊 Indexé (indexed) ← Utilisable dans RAG

   ou

   ⚠️ À revoir (needs_review) ← Problème détecté
   ❌ Rejeté (rejected) ← Document invalide
```

**Actions** :
- Clic droit → **"Valider"** : Marque comme validé et lance l'indexation
- Clic droit → **"Rejeter"** : Exclut du RAG

### 7.5 Modes RAG

#### Texte (Text RAG)
Indexe le contenu textuel uniquement.

**Avantages** :
- ✅ Rapide
- ✅ Faible consommation RAM
- ✅ Recherche précise sur texte

**Utilisations** :
- Documents texte
- Code source
- Logs

#### Vision (Vision RAG)
Indexe le contenu visuel (images, tableaux, schémas).

**Avantages** :
- ✅ Comprend la structure visuelle
- ✅ Détecte tableaux et graphiques
- ✅ OCR intégré

**Utilisations** :
- PDFs avec schémas
- Présentations
- Documents scannés

#### Hybride (Hybrid RAG)
Combine Texte + Vision pour meilleure qualité.

**Avantages** :
- ✅ Meilleure précision
- ✅ Comprend contexte ET visuel
- ✅ Résultats enrichis

**Utilisations** :
- Documentation technique
- Rapports avec graphiques
- Livres illustrés

#### Aucun
Stocke le document sans indexation (simple archivage).

### 7.6 Éditeur de chunks

L'éditeur de chunks permet d'affiner la découpe automatique :

1. Sélectionnez un document indexé
2. **"Éditer les chunks"**
3. Actions disponibles :

```
📝 Éditer : Modifier le contenu d'un chunk
✂️ Diviser : Couper un chunk trop long
🔗 Fusionner : Combiner deux chunks connexes
➕ Insérer : Ajouter un chunk entre deux existants
🗑️ Supprimer : Retirer un chunk
```

**Vue côte-à-côte** :
```
┌────────────────┬────────────────┐
│   Document     │     Chunks     │
│   Original     │   Découpage    │
│                │                │
│   [PDF view]   │   [Chunk 1]    │
│                │   [Chunk 2]    │
│                │   [Chunk 3]    │
│                │   ...          │
└────────────────┴────────────────┘
```

### 7.7 Recherche dans les bibliothèques

#### Recherche simple
```
Barre de recherche → "kubernetes deployment"
```

#### Recherche avancée
```
Filtres :
☑️ Bibliothèques : "Documentation Technique", "Guides DevOps"
☑️ Types : PDF, Markdown
☑️ Dates : Derniers 30 jours
☑️ Tags : #prod, #deployment
☑️ Score minimum : 0.7 (similarité)
```

#### Utiliser les résultats

**Dans le Chat** :
Les résultats pertinents sont automatiquement injectés dans le contexte de l'IA.

**Dans un Workflow** :
Nœud **"RAG Search"** pour rechercher programmatiquement.

---

## 8. Module Documentation

### 8.1 Wiki intégré

BlackIA inclut un système de documentation intégré avec :
- Recherche full-text (FTS5)
- Navigation hiérarchique
- Markdown avec coloration syntaxique
- Import automatique de fichiers `.md`

### 8.2 Catégories

```
📘 Guides          # Tutoriels pas-à-pas
⚡ Features        # Fonctionnalités détaillées
🗺️ Roadmap         # Planification et futures features
🔧 API             # Documentation technique
❓ FAQ             # Questions fréquentes
📝 Changelog       # Historique des versions
```

### 8.3 Recherche

**Recherche full-text** :
```
"workflow variables" → Trouve tous les docs mentionnant ces mots
```

**Opérateurs** :
```
"workflow AND variables"     # Les deux mots requis
"workflow OR automation"     # Au moins un des deux
"workflow NOT basic"         # Exclut "basic"
```

### 8.4 Navigation

#### Breadcrumbs
```
📖 Documentation > Guides > Workflows > Variables
```

#### Table des matières
Générée automatiquement depuis les headers markdown :
```
1. Introduction
2. Variables de workflow
   2.1 Types de variables
   2.2 Interpolation
3. Variables globales
```

### 8.5 Import de documentation personnalisée

1. **"Importer des documents"**
2. Sélectionnez des fichiers `.md`
3. Structure hiérarchique automatiquement créée depuis :
   - Noms de fichiers
   - Headers H1/H2/H3

---

## 9. Module Editor

### 9.1 Éditeur markdown

Éditeur de texte avec :
- Coloration syntaxique (15+ langages)
- Prévisualisation en temps réel
- Assistance IA intégrée

### 9.2 Fonctionnalités

#### Raccourcis clavier
```
Cmd + B         # Gras
Cmd + I         # Italique
Cmd + K         # Lien
Cmd + Shift + C # Code inline
Cmd + Shift + K # Bloc de code
```

#### Coloration syntaxique
Langages supportés :
- JavaScript/TypeScript
- Python
- Java
- C/C++/C#
- Go
- Rust
- PHP
- Ruby
- SQL
- HTML/CSS
- Markdown
- YAML/JSON
- Shell/Bash

#### Thèmes
5 thèmes de code disponibles :
```
- GitHub Light
- GitHub Dark
- VS Code Dark
- Monokai
- Dracula
```

### 9.3 Assistance IA

#### Insérer un prompt
```
Sélectionnez du texte → Clic droit → "Demander à l'IA"

Exemple :
"Améliore ce paragraphe"
"Corrige les fautes"
"Traduis en anglais"
"Résume ce texte"
```

#### Génération de contenu
```
Cmd + Shift + G → Fenêtre de génération

Prompt : "Écris une introduction pour un article sur Docker"
→ L'IA génère et insère le texte
```

### 9.4 Export

```
Fichier → Exporter
- Markdown (.md)
- HTML (.html)
- PDF (.pdf)
```

---

## 10. Paramètres

### 10.1 Général

```
⚙️ Paramètres → Général

- Thème : Clair / Sombre / Système
- Langue : Français / English
- Démarrage : Lancer au démarrage de macOS
- Mise à jour : Vérifier automatiquement
```

### 10.2 AI Local (Ollama)

```
⚙️ Paramètres → AI Local

Configuration Ollama :
- URL : http://localhost:11434
- Timeout : 60 secondes
- Auto-démarrage : ✅

Gestion des modèles :
- Télécharger de nouveaux modèles
- Voir les modèles installés
- Supprimer des modèles
```

### 10.3 Web Search

```
⚙️ Paramètres → Web Search

Moteurs de recherche :
- DuckDuckGo (défaut)
- Brave Search
- Personnalisé (API custom)

Configuration :
- Nombre de résultats : 5
- Timeout : 10 secondes
```

### 10.4 Apparence

```
⚙️ Paramètres → Apparence

Interface :
- Glassmorphism : ✅ (effet verre macOS)
- Animations : ✅ / ❌ (désactiver si lenteurs)
- Couleur d'accent : Violet / Bleu / Rose / Vert

Polices :
- Interface : System (San Francisco)
- Éditeur : Monospace (JetBrains Mono)
- Taille : 14px
```

### 10.5 Interface

Personnalisez les sections visibles pour chaque module :

```
⚙️ Paramètres → Interface

Module Chat :
☑️ Barre latérale
☑️ Dossiers
☑️ Tags
☑️ Recherche
☑️ Statistiques

Module Workflows :
☑️ Palette de nœuds
☑️ Minimap
☑️ Panneau de propriétés
☑️ Console d'exécution
```

### 10.6 Raccourcis clavier

```
⚙️ Paramètres → Raccourcis Clavier

Personnalisez tous les raccourcis :

Navigation :
- Chat : Cmd + 1 (modifiable)
- Workflows : Cmd + 2
- ...

Actions :
- Nouvelle conversation : Cmd + N
- Recherche : Cmd + K
- Paramètres : Cmd + ,
```

### 10.7 Catégories et Tags

```
⚙️ Paramètres → Catégories

Gérez les catégories globales :
- Développement (🔧)
- Écriture (✍️)
- Recherche (🔍)
- Personnel (👤)

⚙️ Paramètres → Tags

Gérez les tags globaux :
#urgent, #todo, #important, #archive
```

### 10.8 À propos

```
⚙️ Paramètres → À propos

BlackIA v0.2.0
© 2025 Black Room Technologies

Licence : MIT (Open Source)
Electron : 33.2.0
Node.js : 20.11.0

- Voir les licences open source
- Signaler un bug
- Consulter la documentation
```

---

## 11. Astuces et bonnes pratiques

### 11.1 Optimisation des performances

#### Choix du modèle
```
Tâche simple (résumé, correction) :
→ llama3.2:3b (rapide, 2 GB)

Tâche moyenne (code, analyse) :
→ mistral:7b (équilibré, 4 GB)

Tâche complexe (recherche, création) :
→ llama3.1:70b (puissant, 39 GB)
```

#### Gestion de la RAM
```
Fermer les conversations inutilisées
Limiter le nombre de documents RAG actifs
Désactiver les animations (Paramètres > Apparence)
```

### 11.2 Prompting efficace

#### Soyez spécifique
```
❌ Mauvais : "Parle-moi de Python"
✅ Bon : "Explique les décorateurs Python avec 3 exemples pratiques"
```

#### Fournissez du contexte
```
Je suis développeur junior en Python.
J'ai besoin d'optimiser une fonction qui traite 1M de lignes CSV.
Actuellement, elle prend 5 minutes. Comment l'améliorer ?
```

#### Structurez vos demandes
```
Contexte : [situation]
Objectif : [ce que vous voulez obtenir]
Contraintes : [limitations]
Format attendu : [structure de réponse]
```

### 11.3 Organisation

#### Nommage cohérent
```
Conversations : "[Projet] - Sujet - Date"
Workflows : "Action + Objet" (ex: "Résumer Documents")
Personas : "Rôle + Spécialité" (ex: "Expert Python")
```

#### Structure de dossiers
```
📁 Projets
  📁 BlackIA
    💬 Features Ideas
    💬 Bug Reports
  📁 Client XYZ
    💬 Requirements
    💬 Technical Specs
📁 Personnel
  💬 Apprentissage
  💬 Idées
```

### 11.4 Sauvegardes

```bash
# Sauvegarde manuelle
cp -r ~/Library/Application\ Support/BlackIA ~/Backups/BlackIA_$(date +%Y%m%d)

# Restauration
cp -r ~/Backups/BlackIA_20250115 ~/Library/Application\ Support/BlackIA
```

---

## 12. FAQ

### Q1 : BlackIA nécessite-t-il Internet ?

**Non** pour les fonctionnalités principales (Chat, Workflows, Personas). L'IA fonctionne 100% localement avec Ollama.

**Oui** pour :
- Web Search (DuckDuckGo, Brave)
- Téléchargement de nouveaux modèles Ollama
- Mises à jour de l'application

### Q2 : Mes données sont-elles sécurisées ?

**Oui**. Toutes vos données restent sur votre Mac :
- Base de données : `~/Library/Application Support/BlackIA/`
- Aucune télémétrie
- Aucun envoi de données à des serveurs externes (sauf si Web Search activé)

### Q3 : Combien de RAM faut-il ?

**Minimum** : 16 GB
- Permet d'utiliser des modèles 3B-7B

**Recommandé** : 32 GB
- Permet d'utiliser des modèles jusqu'à 70B
- Meilleure performance avec RAG

### Q4 : Comment réduire l'utilisation de RAM ?

```
1. Utilisez des modèles plus petits (3B au lieu de 70B)
2. Fermez les conversations inutilisées
3. Limitez le nombre de documents indexés simultanément
4. Désactivez les animations (Paramètres > Apparence)
```

### Q5 : L'IA ne répond pas / est lente

**Vérifications** :
```bash
# 1. Vérifier qu'Ollama fonctionne
ollama list
curl http://localhost:11434/api/tags

# 2. Vérifier les ressources
Activity Monitor → Rechercher "Ollama"

# 3. Redémarrer Ollama
killall ollama
ollama serve
```

### Q6 : Comment importer mes anciennes conversations ChatGPT ?

Actuellement non supporté directement. Workaround :
1. Exportez vos conversations ChatGPT en JSON
2. Utilisez un workflow personnalisé pour parser et importer

### Q7 : Puis-je utiliser d'autres LLM (OpenAI, Claude) ?

Actuellement, BlackIA supporte :
- ✅ Ollama (local & remote)
- ✅ MLX (Apple Silicon)

Planifié pour v1.1 :
- OpenAI API
- Anthropic Claude API
- Backends personnalisés

### Q8 : Le RAG Vision fonctionne-t-il avec des PDF scannés ?

**Oui** ! Le Vision RAG inclut de l'OCR automatique via :
- Colette (ColPali)
- Qwen2-VL

Il peut extraire du texte depuis :
- PDFs scannés
- Images de documents
- Captures d'écran

### Q9 : Comment partager un workflow avec un collègue ?

```
1. Clic droit sur le workflow → "Exporter"
2. Sauvegardez le fichier .workflow.json
3. Partagez le fichier
4. Votre collègue : "Importer un workflow" → Sélectionner le .json
```

### Q10 : Y a-t-il des limites sur le nombre de conversations / documents ?

**Non**, aucune limite artificielle. Les seules limites sont :
- Espace disque disponible
- RAM disponible pour l'indexation RAG

---

**Fin du Manuel Utilisateur**

*Pour plus d'informations, consultez :*
- **Documentation intégrée** : Module Documentation dans l'app
- **Manuel d'installation** : `documentation/04_MANUEL_INSTALLATION.md`
- **Manuel d'exploitation** : `documentation/01_MANUEL_EXPLOITATION.md`

*Dernière mise à jour: Novembre 2025*
*Version du document: 1.0*
