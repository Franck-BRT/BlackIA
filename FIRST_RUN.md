# 🚀 Premier Lancement de BlackIA

## ⚠️ Important

L'installation des dépendances **ne peut pas** se faire dans l'environnement Claude Code à cause de restrictions réseau. Vous devez suivre ces étapes **sur votre Mac**.

---

## 📋 Prérequis

Vérifiez que vous avez :

```bash
# Node.js 20+
node --version
# Devrait afficher v20.x.x ou supérieur

# pnpm 8+
pnpm --version
# Devrait afficher 8.x.x ou supérieur

# Si pnpm n'est pas installé :
npm install -g pnpm
```

---

## 🔧 Installation (Sur Votre Mac)

### Étape 1 : Cloner et Naviguer

```bash
# Si ce n'est pas déjà fait
cd /chemin/vers/BlackIA
```

### Étape 2 : Installer les Dépendances

```bash
# Installer toutes les dépendances du monorepo
pnpm install

# Cela prendra 2-3 minutes
# Vous devriez voir :
# - Installation des packages root
# - Installation de @blackia/desktop
# - Installation de @blackia/shared
# - Installation de @blackia/ui
```

**Attendez-vous à télécharger ~300MB** de dépendances.

### Étape 3 : Vérification Post-Installation

```bash
# Vérifier que tout est bien installé
ls -la node_modules/
ls -la apps/desktop/node_modules/
ls -la packages/shared/node_modules/
ls -la packages/ui/node_modules/

# Vous devriez voir des dossiers dans chaque node_modules
```

---

## ✅ Tests de Vérification

### Test 1 : Type Checking

```bash
# Vérifier que TypeScript compile sans erreurs
pnpm type-check

# ✅ Succès attendu : "No errors found"
# ❌ Si erreurs : Notez-les et corrigez (voir section Dépannage)
```

### Test 2 : Linting

```bash
# Vérifier la qualité du code
pnpm lint

# ✅ Succès attendu : Pas d'erreurs, peut-être quelques warnings
# ⚠️ Warnings acceptables : unused variables dans les placeholders
```

### Test 3 : Build du Main Process

```bash
# Compiler le main process Electron
cd apps/desktop
pnpm exec tsc -p tsconfig.main.json

# ✅ Succès attendu : Dossier dist/main/ créé
# Vérifier :
ls -la dist/main/
# Vous devriez voir : index.js, preload/index.js
```

### Test 4 : Build Vite (Renderer)

```bash
# Toujours dans apps/desktop
pnpm exec vite build

# ✅ Succès attendu : Dossier dist/renderer/ créé avec les assets
# Vérifier :
ls -la dist/renderer/
# Vous devriez voir : index.html, assets/
```

---

## 🎯 Test Principal : Lancer l'Application !

### Méthode 1 : Mode Développement (Recommandé)

```bash
# Depuis la racine du projet
pnpm desktop:dev

# Ou depuis apps/desktop :
cd apps/desktop
pnpm dev
```

**Ce qui devrait se passer :**

1. **Vite démarre** sur http://localhost:5173
   ```
   VITE v5.x.x  ready in XXX ms
   ➜  Local:   http://localhost:5173/
   ```

2. **Electron s'ouvre** (après 2-3 secondes)
   - Une fenêtre devrait apparaître
   - Taille : 1400x900px
   - DevTools ouvertes automatiquement

3. **L'interface apparaît** :
   - Fond dégradé noir animé avec bulles de couleur
   - Sidebar gauche avec effet glassmorphism
   - Logo "BlackIA" en haut
   - Navigation avec 8 items
   - Page d'accueil avec cards glassmorphism

### Méthode 2 : Build de Production

```bash
# Build complet (plus long, ~30 secondes)
pnpm --filter @blackia/desktop build:dir

# Lancer l'app buildée
open apps/desktop/release/mac/BlackIA.app
```

---

## 🎨 Ce Que Vous Devriez Voir

### Page d'Accueil

```
┌────────────────────────────────────────────┐
│  Sidebar          │  Main Content          │
│  (Glass)          │                        │
│                   │  Bienvenue sur BlackIA │
│  ✨ BlackIA       │                        │
│  AI Assistant     │  [6 feature cards]     │
│                   │  - Chat IA             │
│  🏠 Accueil ✓     │  - Workflows           │
│  💬 Chat          │  - Prompts             │
│  🔄 Workflows     │  - Personas            │
│  📝 Prompts       │  - Projets             │
│  🎭 Personas      │  - Plus à venir        │
│  📊 Projets       │                        │
│  📜 Logs          │  [3 status cards]      │
│                   │  Système ✅            │
│  ⚙️ Paramètres    │  Ollama ⚠️            │
│                   │  MLX ⚠️                │
│  v0.1.0           │                        │
└────────────────────────────────────────────┘
```

### Effets Visuels

- ✅ **Background** : Dégradé noir avec animation douce
- ✅ **Bulles colorées** : Violet et bleu en arrière-plan (floutées)
- ✅ **Sidebar** : Effet verre avec blur et transparence
- ✅ **Cards** : Glassmorphism avec bordures lumineuses
- ✅ **Hover** : Effet de surbrillance sur les boutons
- ✅ **Navigation** : Active link surligné
- ✅ **Icônes** : Lucide React, colorées selon le module

### Navigation

Testez la navigation en cliquant sur :
- 🏠 Accueil → Page d'accueil
- 💬 Chat → Placeholder "Module Chat"
- 🔄 Workflows → Placeholder "Module Workflows"
- Etc.

Chaque page devrait afficher un placeholder avec l'icône correspondante.

---

## 🐛 Dépannage

### Problème : "Cannot find module"

```bash
# Solution : Réinstaller les dépendances
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

### Problème : "Port 5173 already in use"

```bash
# Solution : Tuer le process sur ce port
lsof -ti:5173 | xargs kill -9
# Puis relancer
pnpm desktop:dev
```

### Problème : Electron ne démarre pas

```bash
# Vérifier que le main process est compilé
ls -la apps/desktop/dist/main/index.js

# Si le fichier n'existe pas :
cd apps/desktop
pnpm exec tsc -p tsconfig.main.json
```

### Problème : Écran blanc

Ouvrez les DevTools (Cmd+Option+I) et vérifiez la console :

1. **Erreur "Failed to fetch"** → Vite n'est pas démarré
   - Vérifiez que Vite tourne sur localhost:5173
   - Regardez le terminal pour les erreurs Vite

2. **Erreur TypeScript** → Problème de compilation
   - Vérifiez `pnpm type-check`
   - Corrigez les erreurs

3. **Erreur de module** → Dépendances manquantes
   - Réinstallez : `pnpm install`

### Problème : Styles ne s'appliquent pas

```bash
# Vérifier que Tailwind est bien configuré
cd apps/desktop
ls -la tailwind.config.js postcss.config.js

# Vérifier l'import CSS dans main.tsx
grep "styles/index.css" src/renderer/src/main.tsx

# Devrait afficher : import './styles/index.css';
```

### Problème : IPC ne fonctionne pas

Dans les DevTools, testez :

```javascript
// Devrait retourner "pong"
await window.electronAPI.ping()

// Devrait retourner "0.1.0"
await window.electronAPI.getVersion()

// Devrait retourner "darwin"
await window.electronAPI.getPlatform()
```

Si erreur "electronAPI is not defined" :
- Le preload script n'est pas chargé
- Vérifiez la config Electron dans main/index.ts

---

## ✅ Checklist de Premier Lancement

- [ ] pnpm install terminé sans erreurs
- [ ] pnpm type-check → aucune erreur
- [ ] pnpm lint → aucune erreur bloquante
- [ ] pnpm desktop:dev lance Vite
- [ ] Electron s'ouvre avec fenêtre
- [ ] Sidebar visible avec effet glassmorphism
- [ ] Navigation fonctionne
- [ ] DevTools ouvertes
- [ ] window.electronAPI.ping() fonctionne
- [ ] Tous les effets visuels présents
- [ ] Pas d'erreurs dans la console

---

## 📸 Screenshots Attendus

### 1. Terminal - Démarrage Réussi

```
$ pnpm desktop:dev

> @blackia/desktop@0.1.0 dev
> concurrently "npm:dev:vite" "npm:dev:electron"

[vite] VITE v5.0.10  ready in 234 ms
[vite] ➜  Local:   http://localhost:5173/
[electron] BlackIA Desktop started
[electron] Development mode: true
[electron] App version: 0.1.0
```

### 2. Fenêtre Electron

- Titre : "BlackIA"
- Taille : 1400x900px
- Traffic lights macOS en haut à gauche
- Fond dégradé animé
- Sidebar glassmorphism à gauche
- Contenu principal à droite

### 3. DevTools Console

```
No errors
Network tab: All requests successful
Elements tab: Full DOM tree visible
```

---

## 🎉 Si Tout Fonctionne

**Félicitations !** 🚀 Votre environnement BlackIA est opérationnel !

**Prochaines étapes :**
1. ✅ Setup validé
2. ⏭️ Intégration Ollama
3. ⏭️ Intégration MLX
4. ⏭️ Développement module Chat

**Commandes utiles :**

```bash
# Développement
pnpm desktop:dev

# Build
pnpm desktop:build

# Tests (quand implémentés)
pnpm test

# Linting
pnpm lint

# Formatage
pnpm format
```

---

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifiez les logs** dans le terminal
2. **Vérifiez la console** DevTools (Cmd+Option+I)
3. **Consultez** DEVELOPMENT.md pour plus de détails
4. **Ouvrez une issue** sur GitHub avec :
   - Version de Node.js
   - Version de pnpm
   - OS et version
   - Logs d'erreur complets
   - Screenshots si pertinent

---

**Bonne chance et bon développement ! 💻✨**
