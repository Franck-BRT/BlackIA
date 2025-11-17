# BlackIA - Manuel d'Installation

**Version**: 0.2.0
**Date**: Novembre 2025
**Auteur**: Black Room Technologies
**Public**: Utilisateurs et développeurs

---

## Table des Matières

1. [Installation utilisateur final](#installation-utilisateur-final)
2. [Installation développeur](#installation-développeur)
3. [Installation des backends IA](#installation-des-backends-ia)
4. [Configuration Python pour RAG](#configuration-python-pour-rag)
5. [Vérification de l'installation](#vérification-de-linstallation)
6. [Scripts d'installation](#scripts-dinstallation)
7. [Dépendances complètes](#dépendances-complètes)
8. [Désinstallation](#désinstallation)
9. [Problèmes courants](#problèmes-courants)

---

## 1. Installation utilisateur final

### 1.1 Prérequis système

```
Système d'exploitation : macOS 11.0+ (Big Sur ou supérieur)
Architecture : Apple Silicon (M1/M2/M3/M4) ou Intel (x64)
RAM : 16 GB minimum, 32 GB recommandé
Stockage : 5 GB pour l'app + espace pour vos données
```

### 1.2 Installation depuis DMG

#### Étape 1 : Télécharger

Téléchargez le fichier DMG correspondant à votre processeur :

```
BlackIA-0.2.0-arm64.dmg        # Apple Silicon (M1/M2/M3/M4)
BlackIA-0.2.0-x64.dmg          # Intel
BlackIA-0.2.0-universal.dmg    # Universal (les deux)
```

#### Étape 2 : Monter le DMG

1. Double-cliquez sur le fichier `.dmg` téléchargé
2. Une fenêtre s'ouvre avec l'icône BlackIA

#### Étape 3 : Installer

1. **Glissez-déposez** l'icône `BlackIA.app` dans le dossier `Applications`
2. Attendez la fin de la copie

#### Étape 4 : Premier lancement

1. Allez dans `/Applications`
2. Double-cliquez sur `BlackIA.app`

**⚠️ Si l'app ne s'ouvre pas** (DMG non signé) :

```
macOS Sequoia/Sonoma :
1. Préférences Système → Confidentialité et sécurité
2. Dans "Sécurité", cliquez sur "Ouvrir quand même"
3. Confirmez l'ouverture

Ou via Terminal :
xattr -cr /Applications/BlackIA.app
```

#### Étape 5 : Configuration initiale

Au premier lancement, BlackIA :
1. Crée sa base de données dans `~/Library/Application Support/BlackIA/`
2. Applique les migrations
3. Crée les personas par défaut
4. Détecte les backends IA disponibles (Ollama, MLX)

### 1.3 Installation d'Ollama (recommandé)

BlackIA fonctionne mieux avec **Ollama** pour les LLMs locaux.

#### Installation via Homebrew

```bash
# Installer Homebrew si pas déjà fait
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installer Ollama
brew install ollama

# Lancer Ollama en arrière-plan
brew services start ollama

# Ou lancer manuellement
ollama serve
```

#### Installation via le site officiel

1. Allez sur https://ollama.ai
2. Téléchargez Ollama pour macOS
3. Installez l'application
4. Lancez Ollama depuis `/Applications`

#### Télécharger des modèles

```bash
# Modèles recommandés pour commencer

# Léger et rapide (2 GB)
ollama pull llama3.2:3b

# Équilibré (4 GB)
ollama pull mistral:7b

# Puissant (5 GB)
ollama pull llama3.2:latest

# Pour le RAG texte (embeddings)
ollama pull nomic-embed-text
ollama pull mxbai-embed-large
```

#### Vérifier l'installation

```bash
# Lister les modèles installés
ollama list

# Tester Ollama
ollama run llama3.2:3b
>>> Hello! (testez une question)
>>> /bye (pour quitter)

# Vérifier le service
curl http://localhost:11434/api/tags
```

### 1.4 Lancer BlackIA

```
/Applications/BlackIA.app
```

L'application devrait :
- ✅ Démarrer sans erreur
- ✅ Afficher l'interface principale
- ✅ Détecter Ollama automatiquement
- ✅ Lister les modèles disponibles dans Paramètres → AI Local

---

## 2. Installation développeur

### 2.1 Prérequis

#### Logiciels requis

```bash
# Node.js (version 20+)
node --version  # Doit afficher v20.x.x ou supérieur

# Si pas installé
brew install node@20

# pnpm (gestionnaire de paquets)
npm install -g pnpm@8

# Vérifier
pnpm --version  # Doit afficher 8.x.x ou supérieur

# Python (version 3.11+) pour les services RAG
python3 --version  # Doit afficher 3.11.x ou supérieur

# Si pas installé
brew install python@3.11

# Git
git --version
```

#### Outils optionnels mais recommandés

```bash
# Ollama pour développement
brew install ollama
brew services start ollama

# Visual Studio Code
brew install --cask visual-studio-code

# Extensions VSCode recommandées
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension ms-python.python
code --install-extension bradlc.vscode-tailwindcss
```

### 2.2 Cloner le dépôt

```bash
# Cloner le projet
git clone https://github.com/[votre-org]/BlackIA.git
cd BlackIA

# Vérifier la branche
git branch
# Devrait afficher: * main ou * develop
```

### 2.3 Installer les dépendances Node.js

```bash
# À la racine du projet
pnpm install

# Cela installe :
# - Dépendances root
# - Dépendances de tous les packages workspace (apps/*, packages/*)
# - Compile automatiquement better-sqlite3 pour votre système
```

**⚠️ Si erreur avec better-sqlite3** :

```bash
cd apps/desktop
pnpm exec electron-rebuild -f -w better-sqlite3
cd ../..
```

### 2.4 Installer les dépendances Python

```bash
# Créer un environnement virtuel (recommandé)
python3 -m venv venv
source venv/bin/activate  # Sur macOS/Linux

# Installer les dépendances Python
cd apps/desktop/src/python
pip install -r requirements.txt

# Cela installe :
# - sentence-transformers (Text RAG)
# - colpali-engine (Vision RAG)
# - torch, torchvision (PyTorch)
# - lancedb, pyarrow (Vector DB)
# - Pillow, pdf2image (traitement images)

# Optionnel : MLX (Apple Silicon uniquement)
# Décommenter dans requirements.txt puis :
pip install mlx mlx-lm mlx-vlm

# Revenir à la racine
cd ../../../..
```

#### Installation des dépendances système (pour pdf2image)

```bash
# Poppler (pour pdf2image)
brew install poppler

# Vérifier
pdftoppm -v
```

### 2.5 Vérifier l'installation

```bash
# Script de vérification complet
pnpm verify

# Ce script vérifie :
# - Versions Node.js et pnpm
# - Structure du projet
# - Dépendances installées
# - Configuration TypeScript
# - Fichiers source principaux
# - Compilation TypeScript
# - Linting ESLint
```

**Sortie attendue** :

```
🔍 BlackIA Setup Verification
==============================

1️⃣  Checking Prerequisites...
✅ PASS: Node.js version v20.11.0
✅ PASS: pnpm version 8.15.0

2️⃣  Checking Project Structure...
✅ PASS: Workspace configuration exists
✅ PASS: Directory apps/desktop exists
✅ PASS: Directory packages/shared exists
✅ PASS: Directory packages/ui exists

3️⃣  Checking Dependencies Installation...
✅ PASS: Root node_modules exists
✅ PASS: Desktop app node_modules exists

...

📊 Results Summary
==================
✅ Passed: 28
⚠️  Warnings: 2
❌ Failed: 0

🎉 Setup verification completed successfully!
```

### 2.6 Configuration de développement

#### Fichier `.env` (optionnel)

Créez un fichier `.env` à la racine pour des configurations personnalisées :

```bash
# .env (à la racine du projet)

# Développement
NODE_ENV=development
ELECTRON_DISABLE_SECURITY_WARNINGS=true
LOG_LEVEL=DEBUG

# Ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_TIMEOUT=120000

# Python
PYTHONPATH=/path/to/BlackIA/apps/desktop/src/python

# MLX (Apple Silicon)
PYTORCH_ENABLE_MPS_FALLBACK=1

# Ports
VITE_DEV_SERVER_PORT=5173
```

#### Configuration VSCode (`.vscode/settings.json`)

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ],
  "python.defaultInterpreterPath": "${workspaceFolder}/venv/bin/python"
}
```

### 2.7 Lancer en mode développement

```bash
# Méthode 1 : Script dev.sh complet
./scripts/dev.sh

# Méthode 2 : Script dev.sh avec options
./scripts/dev.sh --fresh          # Rebuild tout
./scripts/dev.sh --no-build       # Skip le build (plus rapide)
./scripts/dev.sh --clean          # Nettoie avant de lancer

# Méthode 3 : Commande pnpm directe
pnpm desktop:dev

# Cela lance en parallèle :
# - Vite dev server (port 5173) - React HMR
# - TypeScript watch (main process)
# - Electron app avec DevTools
```

**Fenêtre Electron** :
- L'app s'ouvre automatiquement
- DevTools ouverts par défaut
- Hot reload activé (modifications React = refresh auto)

**Logs de développement** :
```
[vite] dev server running at http://localhost:5173
[tsc] Starting TypeScript compilation in watch mode...
[electron] Electron app started
```

### 2.8 Compiler pour production

```bash
# Build complet (TypeScript + Vite)
pnpm build

# Build uniquement le desktop
pnpm desktop:build

# Résultats dans :
# apps/desktop/dist/main/       # Main process compilé
# apps/desktop/dist/renderer/   # Frontend compilé
```

### 2.9 Créer un DMG

```bash
# DMG pour votre architecture (arm64 ou x64)
pnpm build:dmg

# Ou avec le script :
./scripts/build-dmg.sh

# Avec options :
./scripts/build-dmg.sh --clean          # Nettoie avant
./scripts/build-dmg.sh --arch universal # Universal binary
./scripts/build-dmg.sh --sign           # Signe le DMG (certificat requis)

# Résultat dans :
apps/desktop/release/BlackIA-0.2.0-arm64.dmg
```

---

## 3. Installation des backends IA

### 3.1 Ollama (recommandé)

Déjà couvert dans la section 1.3.

### 3.2 MLX (Apple Silicon uniquement)

**MLX** est un framework d'Apple optimisé pour Apple Silicon.

#### Installation

```bash
# Dans l'environnement Python
source venv/bin/activate

# Installer MLX
pip install mlx mlx-lm mlx-vlm

# Vérifier
python3 -c "import mlx; print(mlx.__version__)"
```

#### Télécharger des modèles MLX

```bash
# Créer un répertoire pour les modèles
mkdir -p ~/mlx-models

# Télécharger un modèle (exemple : Llama 3.2 3B quantized)
cd ~/mlx-models
git clone https://huggingface.co/mlx-community/Llama-3.2-3B-Instruct-4bit

# Ou via Python
python3 -c "from mlx_lm import load; load('mlx-community/Llama-3.2-3B-Instruct-4bit')"
```

#### Configuration dans BlackIA

1. Ouvrez BlackIA
2. **Paramètres → AI Backends**
3. Activez **MLX Backend**
4. Sélectionnez le chemin des modèles : `~/mlx-models/`

### 3.3 Ollama Distant (optionnel)

Connectez-vous à une instance Ollama distante (sur un autre Mac ou serveur).

#### Configuration

1. **Paramètres → AI Local**
2. **URL Ollama** : `http://192.168.1.100:11434` (IP de la machine distante)
3. **Timeout** : Augmentez à 120s pour connexions lentes
4. Testez la connexion

#### Serveur Ollama distant

Sur la machine serveur :

```bash
# Lancer Ollama en écoutant sur toutes les interfaces
OLLAMA_HOST=0.0.0.0:11434 ollama serve

# Ou configurer dans un service systemd/launchd
```

---

## 4. Configuration Python pour RAG

### 4.1 Dépendances Python complètes

#### Fichier `requirements.txt` principal

**Emplacement** : `/apps/desktop/src/python/requirements.txt`

```txt
# ===== Text RAG (Sentence Transformers) =====
sentence-transformers>=2.2.2

# ===== Colette / ColPali for Vision RAG =====
colpali-engine>=0.3.12
torch>=2.7.0
torchvision>=0.22.0

# ===== MLX Framework (Apple Silicon - optionnel) =====
# Décommenter pour Apple Silicon :
# mlx==0.20.0
# mlx-lm==0.20.1
# mlx-vlm==0.0.13

# ===== Image Processing =====
Pillow>=11.3.0
pdf2image>=1.17.0

# ===== Vector Store =====
lancedb>=0.15.0
pyarrow>=17.0.0

# ===== Utilities =====
numpy>=1.26.4
python-dotenv>=1.0.1

# ===== Development (optionnel) =====
# pytest==8.3.0
# black==24.8.0
# mypy==1.11.0
```

### 4.2 Installation Text RAG

```bash
cd apps/desktop/src/python
source ../../../../venv/bin/activate

# Installer sentence-transformers
pip install sentence-transformers

# Télécharger un modèle par défaut (cache dans ~/.cache/huggingface/)
python3 << EOF
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Modèle téléchargé :", model)
EOF
```

### 4.3 Installation Vision RAG (Colette)

```bash
# Toujours dans l'environnement virtuel
pip install colpali-engine torch torchvision pdf2image Pillow

# Vérifier l'installation
python3 << EOF
import torch
print("PyTorch version:", torch.__version__)
print("CUDA available:", torch.cuda.is_available())
print("MPS available:", torch.backends.mps.is_available())

from colpali_engine.models import ColPali
print("ColPali importé avec succès")
EOF
```

#### Résolution de problèmes PyTorch

**Sur Apple Silicon (M1/M2/M3/M4)** :

```bash
# Si torch ne s'installe pas correctement
pip install --pre torch torchvision --index-url https://download.pytorch.org/whl/nightly/cpu

# Vérifier MPS (Metal Performance Shaders)
python3 -c "import torch; print(torch.backends.mps.is_available())"
# Devrait afficher : True
```

**Sur Intel Mac** :

```bash
# Version CPU standard
pip install torch torchvision
```

### 4.4 Installation LanceDB

```bash
pip install lancedb pyarrow

# Tester
python3 << EOF
import lancedb
print("LanceDB version:", lancedb.__version__)

# Créer une DB de test
db = lancedb.connect('/tmp/test_lancedb')
print("Connexion LanceDB réussie")
EOF
```

### 4.5 Script d'installation automatique Python

**Emplacement** : `/scripts/setup-python-venv.sh`

```bash
#!/bin/bash
# Script d'installation automatique de l'environnement Python

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON_DIR="$PROJECT_ROOT/apps/desktop/src/python"
VENV_DIR="$PROJECT_ROOT/venv"

echo "🐍 Configuration de l'environnement Python pour BlackIA"

# Vérifier Python 3.11+
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 non trouvé. Installez-le avec : brew install python@3.11"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
if (( $(echo "$PYTHON_VERSION < 3.11" | bc -l) )); then
    echo "❌ Python 3.11+ requis. Version actuelle : $PYTHON_VERSION"
    exit 1
fi

echo "✅ Python $PYTHON_VERSION détecté"

# Créer l'environnement virtuel
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Création de l'environnement virtuel..."
    python3 -m venv "$VENV_DIR"
fi

# Activer l'environnement
source "$VENV_DIR/bin/activate"

# Installer les dépendances
echo "📥 Installation des dépendances Python..."
pip install --upgrade pip
pip install -r "$PYTHON_DIR/requirements.txt"

# Télécharger les modèles par défaut
echo "📥 Téléchargement des modèles de base..."
python3 << EOF
from sentence_transformers import SentenceTransformer
print("Téléchargement de all-MiniLM-L6-v2...")
SentenceTransformer('all-MiniLM-L6-v2')
print("✅ Modèle téléchargé")
EOF

echo "✅ Configuration Python terminée !"
echo ""
echo "Pour activer l'environnement manuellement :"
echo "  source venv/bin/activate"
```

**Utilisation** :

```bash
chmod +x scripts/setup-python-venv.sh
./scripts/setup-python-venv.sh
```

---

## 5. Vérification de l'installation

### 5.1 Script de vérification

**Emplacement** : `/scripts/verify-setup.sh` (déjà couvert dans le manuel d'exploitation)

```bash
# Lancer la vérification complète
pnpm verify

# Ou directement
./scripts/verify-setup.sh
```

### 5.2 Vérifications manuelles

#### Vérifier Node.js et pnpm

```bash
node --version    # v20.11.0 ou supérieur
pnpm --version    # 8.15.0 ou supérieur
```

#### Vérifier Python et dépendances

```bash
python3 --version                     # 3.11.0 ou supérieur
python3 -c "import torch; print(torch.__version__)"
python3 -c "import sentence_transformers"
python3 -c "import lancedb"
python3 -c "import colpali_engine"
```

#### Vérifier Ollama

```bash
ollama list                           # Liste des modèles
curl http://localhost:11434/api/tags  # API fonctionnelle
```

#### Vérifier la compilation TypeScript

```bash
cd apps/desktop
pnpm exec tsc -p tsconfig.main.json --noEmit
# Aucune erreur = succès
```

#### Vérifier better-sqlite3

```bash
cd apps/desktop
node -e "const db = require('better-sqlite3')(':memory:'); console.log('SQLite OK');"
```

### 5.3 Tests automatisés

```bash
# Tests unitaires
pnpm test

# Tests avec couverture
pnpm test:coverage

# Tests UI interactifs
pnpm test:ui
```

---

## 6. Scripts d'installation

### 6.1 Script de développement : `dev.sh`

**Emplacement** : `/scripts/dev.sh`

**Usage** :

```bash
./scripts/dev.sh [OPTIONS]

Options :
  --help          Affiche l'aide
  --fresh         Nettoie et rebuild tout
  --no-build      Skip le build initial (plus rapide)
  --clean         Nettoie les artéfacts de build
  --build         Build les packages workspace seulement
```

**Fonctionnalités** :
- Vérifie Node.js et pnpm
- Installe les dépendances si manquantes
- Compile les packages workspace
- Lance Vite + TypeScript watch + Electron

### 6.2 Script de build DMG : `build-dmg.sh`

**Emplacement** : `/scripts/build-dmg.sh`

**Usage** :

```bash
./scripts/build-dmg.sh [OPTIONS]

Options :
  --clean         Nettoie les builds précédents
  --skip-deps     Skip l'installation des dépendances
  --sign          Active la signature du DMG
  --arch ARCH     Architecture (arm64, x64, universal)
```

**Exemple** :

```bash
# Build arm64 standard
./scripts/build-dmg.sh

# Build universal avec signature
./scripts/build-dmg.sh --arch universal --sign

# Build propre (nettoyage avant)
./scripts/build-dmg.sh --clean
```

### 6.3 Script de vérification : `verify-setup.sh`

Déjà documenté ci-dessus et dans le manuel d'exploitation.

### 6.4 Script de nettoyage : `clean-reinstall.sh`

**Emplacement** : `/scripts/clean-reinstall.sh`

```bash
#!/bin/bash
# Nettoyage complet et réinstallation

set -e

echo "🧹 Nettoyage complet de BlackIA..."

# Supprimer tous les node_modules
find . -name "node_modules" -type d -prune -exec rm -rf {} \;

# Supprimer les builds
rm -rf apps/desktop/dist
rm -rf apps/desktop/release
rm -rf packages/*/dist

# Supprimer les caches
rm -rf .turbo
rm -rf node_modules/.cache

# Réinstaller
echo "📦 Réinstallation des dépendances..."
pnpm install

# Vérifier
echo "✅ Nettoyage terminé. Lancement de la vérification..."
pnpm verify
```

**Usage** :

```bash
chmod +x scripts/clean-reinstall.sh
./scripts/clean-reinstall.sh
```

### 6.5 Script de génération d'icônes : `generate-icons.sh`

**Emplacement** : `/scripts/generate-icons.sh`

Génère les icônes `.icns` depuis un SVG pour macOS.

```bash
./scripts/generate-icons.sh

# Nécessite :
# - Un fichier icon.svg dans apps/desktop/resources/
# - ImageMagick : brew install imagemagick
# - iconutil (inclus dans macOS)
```

---

## 7. Dépendances complètes

### 7.1 Dépendances Node.js (package.json root)

```json
{
  "devDependencies": {
    "@types/node": "^20.10.5",
    "@typescript-eslint/eslint-plugin": "^6.15.0",
    "@typescript-eslint/parser": "^6.15.0",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "prettier": "^3.1.1",
    "turbo": "^1.11.2",
    "typescript": "^5.3.3",
    "vitest": "^1.0.4"
  }
}
```

### 7.2 Dépendances Desktop (apps/desktop/package.json)

```json
{
  "dependencies": {
    "@blackia/shared": "workspace:*",
    "@blackia/ui": "workspace:*",
    "@blackia/ollama": "workspace:*",
    "electron-trpc": "^0.5.2",
    "@trpc/client": "^10.45.0",
    "@trpc/server": "^10.45.0",
    "zod": "^3.22.4",
    "zustand": "^4.4.7",
    "@tanstack/react-query": "^5.17.0",
    "react-router-dom": "^6.21.0",
    "lucide-react": "^0.303.0",
    "better-sqlite3": "^11.7.0",
    "drizzle-orm": "^0.29.1",
    "react-markdown": "^9.0.1",
    "remark-gfm": "^4.0.0",
    "rehype-highlight": "^7.0.0",
    "axios": "^1.6.0",
    "pdf-parse": "^1.1.1",
    "sharp": "^0.33.5",
    "vectordb": "^0.4.14",
    "python-shell": "^5.0.0"
  },
  "devDependencies": {
    "@electron/rebuild": "^3.7.0",
    "@types/better-sqlite3": "^7.6.8",
    "@vitejs/plugin-react": "^4.2.1",
    "electron": "^33.2.0",
    "electron-builder": "^25.1.8",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.4.0",
    "vite": "^5.0.10"
  }
}
```

### 7.3 Dépendances Python (requirements.txt)

Déjà documenté dans la section 4.1.

---

## 8. Désinstallation

### 8.1 Désinstaller l'application

```bash
# Supprimer l'application
rm -rf /Applications/BlackIA.app

# Supprimer les données utilisateur (⚠️ supprime vos conversations !)
rm -rf ~/Library/Application\ Support/BlackIA

# Supprimer les logs
rm -rf ~/Library/Logs/BlackIA

# Supprimer le cache
rm -rf ~/Library/Caches/com.blackroom.blackia
```

### 8.2 Désinstaller Ollama

```bash
# Si installé via Homebrew
brew uninstall ollama
brew services stop ollama

# Supprimer les modèles
rm -rf ~/.ollama
```

### 8.3 Désinstaller l'environnement de développement

```bash
cd /path/to/BlackIA

# Supprimer les dépendances Node
rm -rf node_modules
find . -name "node_modules" -type d -prune -exec rm -rf {} \;

# Supprimer l'environnement Python
rm -rf venv

# Supprimer les builds
rm -rf apps/desktop/dist
rm -rf apps/desktop/release

# Supprimer les caches
rm -rf .turbo
rm -rf node_modules/.cache
```

---

## 9. Problèmes courants

### 9.1 Erreur "better-sqlite3 not found"

**Symptôme** : L'app crash au démarrage avec une erreur SQLite

**Solution** :

```bash
cd apps/desktop
pnpm exec electron-rebuild -f -w better-sqlite3

# Si ça ne fonctionne pas
rm -rf node_modules/better-sqlite3
pnpm install better-sqlite3
pnpm postinstall
```

### 9.2 Python ne trouve pas les modules

**Symptôme** : Erreurs "ModuleNotFoundError" lors de l'utilisation du RAG

**Solution** :

```bash
# Vérifier l'environnement Python
which python3
python3 -m pip list

# Réinstaller les dépendances
cd apps/desktop/src/python
pip install -r requirements.txt --upgrade --force-reinstall
```

### 9.3 Ollama ne se connecte pas

**Symptôme** : "Backend Ollama unavailable"

**Solution** :

```bash
# Vérifier qu'Ollama tourne
ollama list

# Si pas lancé
ollama serve

# Ou avec Homebrew
brew services start ollama

# Vérifier le port
curl http://localhost:11434/api/tags

# Dans BlackIA : Paramètres → AI Local → Vérifier l'URL
```

### 9.4 Build DMG échoue

**Symptôme** : Erreur pendant `electron-builder`

**Solution** :

```bash
# Nettoyer et rebuilder
./scripts/build-dmg.sh --clean

# Vérifier les permissions
chmod -R 755 apps/desktop/dist
chmod -R 755 apps/desktop/release

# Désactiver la signature pour test
export CSC_IDENTITY_AUTO_DISCOVERY=false
./scripts/build-dmg.sh
```

### 9.5 Hot reload ne fonctionne pas

**Symptôme** : Modifications non prises en compte en dev

**Solution** :

```bash
# Vérifier que Vite tourne
lsof -i :5173

# Redémarrer en mode fresh
./scripts/dev.sh --fresh

# Vérifier les watchers
# Sur macOS, augmenter la limite si nécessaire
ulimit -n 4096
```

### 9.6 Erreur de permissions macOS

**Symptôme** : "App can't be opened because it is from an unidentified developer"

**Solution** :

```bash
# Méthode 1 : Via Préférences Système
# Préférences Système → Confidentialité et sécurité → Ouvrir quand même

# Méthode 2 : Via Terminal
xattr -cr /Applications/BlackIA.app

# Méthode 3 : Signature ad-hoc
codesign --force --deep --sign - /Applications/BlackIA.app
```

---

**Fin du Manuel d'Installation**

*Pour plus d'informations :*
- **Manuel d'exploitation** : `documentation/01_MANUEL_EXPLOITATION.md`
- **Manuel utilisateur** : `documentation/03_MANUEL_UTILISATEUR.md`
- **Manuel codeur** : `documentation/02_MANUEL_CODEUR_PARTIE1_ARCHITECTURE.md`

*Dernière mise à jour : Novembre 2025*
*Version du document : 1.0*
