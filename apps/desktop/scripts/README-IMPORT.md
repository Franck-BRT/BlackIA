# Script d'Importation de Workflow

Ce script permet d'importer des workflows JSON dans la base de données BlackIA.

## 📋 Prérequis

1. **BlackIA doit avoir été lancé au moins une fois** pour créer la base de données
2. Node.js installé
3. Le package `better-sqlite3` installé (déjà dans les dépendances du projet)

## 🚀 Usage

### Importer comme Template (par défaut)

```bash
node import-workflow.js ../../persona-generator-workflow.json
```

Les templates apparaissent dans la bibliothèque de templates de l'éditeur de workflow.

### Importer comme Workflow Utilisateur

```bash
node import-workflow.js ../../persona-generator-workflow.json --as-workflow
```

Les workflows apparaissent directement dans la liste des workflows de l'utilisateur.

## 📁 Localisation de la Base de Données

Le script détecte automatiquement l'emplacement de la base de données selon votre OS:

- **Linux**: `~/.config/blackia-desktop/blackia.db`
- **macOS**: `~/Library/Application Support/blackia-desktop/blackia.db`
- **Windows**: `%APPDATA%/blackia-desktop/blackia.db`

## 📝 Format du Fichier JSON

Le fichier JSON doit contenir au minimum:

```json
{
  "id": "workflow_unique_id",
  "name": "Nom du Workflow",
  "description": "Description",
  "nodes": [...],
  "edges": [...],
  "tags": ["tag1", "tag2"],
  "metadata": {
    "category": "AI Generation",
    "difficulty": "intermediate",
    "estimatedDuration": 60
  }
}
```

### Champs Requis

- `id`: Identifiant unique du workflow
- `name`: Nom affiché
- `description`: Description courte
- `nodes`: Array de nodes (WorkflowNode[])
- `edges`: Array d'edges (WorkflowEdge[])

### Champs Optionnels

- `tags`: Array de tags pour la recherche
- `icon`: Emoji ou icône (défaut: 🔄 ou 📋)
- `color`: Couleur (purple, blue, pink, green, orange)
- `metadata`:
  - `category`: Catégorie (défaut: "AI Generation")
  - `difficulty`: Difficulté (beginner, intermediate, advanced)
  - `estimatedDuration`: Durée estimée en secondes
  - `author`: Auteur du workflow
  - `version`: Version du workflow

## 🔄 Mise à Jour

Si un workflow avec le même ID existe déjà, le script le **mettra à jour** automatiquement.

## ✅ Exemple Complet

```bash
cd /home/user/BlackIA/apps/desktop/scripts

# Importer le workflow persona generator comme template
node import-workflow.js ../../persona-generator-workflow.json

# Résultat:
# ✅ Workflow imported successfully!
#    Name: Générateur de Persona IA avec Amélioration
#    ID: workflow_persona_generator
#    Type: Template
#    Nodes: 9
#    Edges: 10
#
# 💡 Restart BlackIA to see the changes.
```

## 🐛 Dépannage

### Erreur: Database not found

```
❌ Error: Database not found at ~/.config/blackia-desktop/blackia.db
```

**Solution**: Lancez BlackIA au moins une fois pour créer la base de données.

### Erreur: File not found

```
❌ Error: File not found: /path/to/workflow.json
```

**Solution**: Vérifiez le chemin du fichier JSON. Utilisez un chemin absolu ou relatif correct.

### Erreur: Invalid workflow structure

```
❌ Error: Invalid workflow structure. Required fields: id, name, nodes, edges
```

**Solution**: Vérifiez que votre JSON contient tous les champs requis.

## 🧪 Test

Pour tester le script sans importer réellement:

```bash
# Vérifier la structure du JSON
node -e "console.log(JSON.parse(require('fs').readFileSync('../../persona-generator-workflow.json', 'utf-8')))"
```

## 📚 Structure des Tables

### workflow_templates

```sql
CREATE TABLE workflow_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  nodes TEXT NOT NULL DEFAULT '[]',
  edges TEXT NOT NULL DEFAULT '[]',
  variables TEXT,
  icon TEXT NOT NULL DEFAULT '📋',
  thumbnail TEXT,
  category TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  difficulty TEXT CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration INTEGER,
  usage_count INTEGER NOT NULL DEFAULT 0,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### workflows

```sql
CREATE TABLE workflows (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  nodes TEXT NOT NULL DEFAULT '[]',
  edges TEXT NOT NULL DEFAULT '[]',
  groups TEXT NOT NULL DEFAULT '[]',
  annotations TEXT NOT NULL DEFAULT '[]',
  icon TEXT NOT NULL DEFAULT '🔄',
  color TEXT NOT NULL DEFAULT 'purple',
  category TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  is_favorite INTEGER NOT NULL DEFAULT 0,
  usage_count INTEGER NOT NULL DEFAULT 0,
  is_template INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## 🎯 Workflows Disponibles

### 1. Persona Generator (`persona-generator-workflow.json`)

Workflow complet pour générer et optimiser des personas IA:

- **Nodes**: 9 (Input, AI Analysis, Loop, Extract, Condition, Output)
- **Features**: Loop avec 3 variations, extraction de score, amélioration conditionnelle
- **Durée estimée**: ~60 secondes
- **Difficulté**: Intermédiaire

**Démontre**:
- Node Extract pour extraction de valeurs
- Loop avec re-exécution
- Conditional branching
- Smart variable mapping

## 📖 En Savoir Plus

Voir la documentation complète sur les workflows dans:
- `/docs/workflows/README.md`
- Documentation in-app BlackIA
