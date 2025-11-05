# 🚀 Guide de Démarrage BlackIA

Ce guide explique comment démarrer l'application BlackIA correctement, surtout après un `git pull`.

## 📋 Scripts Disponibles

### Mode Normal (Recommandé)
```bash
pnpm start
```
- ✅ Compile automatiquement tous les packages workspace
- ✅ Lance l'application en mode développement
- ✅ **À utiliser après chaque `git pull`**

### Mode Fresh (Nettoyage complet)
```bash
pnpm start:fresh
```
- 🧹 Nettoie tous les fichiers de build
- 🔄 Recompile tout depuis zéro
- ✅ Lance l'application
- ⚡ Utilise ce mode si tu as des problèmes de compilation

### Mode Quick (Redémarrage rapide)
```bash
pnpm start:quick
```
- ⚡ Lance l'app SANS recompiler
- ✅ Plus rapide pour les redémarrages
- ⚠️ **NE PAS utiliser après un `git pull`**
- ⚠️ Utilise seulement si tu n'as pas modifié les packages

### Compiler uniquement
```bash
pnpm build:packages
```
- 📦 Compile uniquement les packages workspace
- ❌ Ne lance pas l'application
- ✅ Utile pour vérifier la compilation

### Nettoyer
```bash
pnpm clean:build
```
- 🧹 Supprime tous les fichiers de build
- 🗑️ Supprime les caches TypeScript
- ❌ Ne compile rien, ne lance rien

### Aide
```bash
pnpm start:help
```
- 📖 Affiche l'aide complète avec tous les modes disponibles

---

## 🔄 Workflow Recommandé

### 1. Après un `git pull`
```bash
git pull
pnpm start
```
Cela garantit que tous les packages sont recompilés avec les dernières modifications.

### 2. Développement quotidien
```bash
# Premier lancement de la journée
pnpm start

# Redémarrages suivants (si pas de git pull)
pnpm start:quick
```

### 3. En cas de problème de compilation
```bash
pnpm start:fresh
```
Cela nettoie tout et repart de zéro.

### 4. Avant un commit
```bash
# Vérifier que tout compile
pnpm build:packages

# Lancer les tests (si disponibles)
pnpm test

# Vérifier le linting
pnpm lint
```

---

## 🎯 Résolution de Problèmes

### ❌ Erreur "Cannot find module '@blackia/ollama'"
**Solution:**
```bash
pnpm start:fresh
```

### ❌ Logs de debug qui n'apparaissent pas
**Cause:** Les packages ne sont pas recompilés après le `git pull`

**Solution:**
```bash
pnpm start
```

### ❌ L'application ne démarre pas
**Solution:**
```bash
# 1. Nettoyer complètement
pnpm start:fresh

# 2. Si ça ne fonctionne toujours pas, vérifier Ollama
ollama list  # Doit afficher tes modèles
```

### ❌ Changements de code non pris en compte
**Cause:** Tu utilises `start:quick` au lieu de `start`

**Solution:**
```bash
pnpm start
```

---

## 📦 Architecture des Packages

```
BlackIA/
├── packages/
│   └── ollama/          # Client Ollama (nécessite compilation)
│       ├── src/         # Code TypeScript source
│       └── dist/        # Code JavaScript compilé (généré)
├── apps/
│   └── desktop/         # Application Electron
│       ├── src/
│       │   ├── main/    # Process principal (nécessite compilation)
│       │   ├── preload/ # Script preload (nécessite compilation)
│       │   └── renderer/ # Interface React (compilée par Vite)
│       └── dist/        # Code compilé (généré)
└── scripts/
    └── dev.sh           # Script de démarrage intelligent
```

### 🔍 Pourquoi compiler ?

- **packages/ollama** : C'est un package TypeScript qui doit être compilé en JavaScript CommonJS
- **apps/desktop/main** : Le processus principal Electron utilise CommonJS et nécessite compilation
- **apps/desktop/renderer** : L'interface React est compilée à la volée par Vite (pas de problème)

### ⚡ Quand recompiler ?

| Situation | Commande | Pourquoi |
|-----------|----------|----------|
| Après `git pull` | `pnpm start` | Les fichiers source (.ts) ont changé |
| Modification dans `packages/` | `pnpm start` | Les dépendances workspace ont changé |
| Modification dans `apps/desktop/src/main/` | `pnpm start` | Le processus principal a changé |
| Modification dans `apps/desktop/src/renderer/` | `pnpm start:quick` | Vite recompile automatiquement |
| Redémarrage simple | `pnpm start:quick` | Rien n'a changé |

---

## 🛠️ Scripts Additionnels

### Développement
```bash
pnpm desktop:dev    # Lance juste l'app desktop (ancien mode)
pnpm dev            # Lance tous les projets avec Turbo
```

### Build
```bash
pnpm build          # Build tous les packages
pnpm desktop:build  # Build uniquement l'app desktop
```

### Qualité de code
```bash
pnpm lint           # Vérifie le code avec ESLint
pnpm format         # Formate le code avec Prettier
pnpm type-check     # Vérifie les types TypeScript
pnpm test           # Lance les tests
```

### Nettoyage
```bash
pnpm clean:build    # Nettoie les builds
pnpm clean          # Nettoie tout (y compris node_modules)
```

---

## 💡 Bonnes Pratiques

1. **Toujours utiliser `pnpm start` après un `git pull`**
2. **Utiliser `pnpm start:quick` pour les redémarrages rapides**
3. **Utiliser `pnpm start:fresh` en cas de doute**
4. **Ne jamais éditer les fichiers dans `dist/`** (ils sont générés automatiquement)
5. **Vérifier que Ollama est démarré** avant de lancer l'app

---

## 🔗 Ressources

- [Documentation Electron](https://www.electronjs.org/docs/latest/)
- [Documentation Ollama](https://github.com/ollama/ollama)
- [Documentation pnpm](https://pnpm.io/)
- [Documentation Vite](https://vitejs.dev/)

---

## 🆘 Support

Si tu rencontres des problèmes non couverts par ce guide :

1. Essaye d'abord `pnpm start:fresh`
2. Vérifie que Ollama est démarré : `ollama list`
3. Vérifie les logs dans le terminal
4. Ouvre une issue sur GitHub avec les logs complets
