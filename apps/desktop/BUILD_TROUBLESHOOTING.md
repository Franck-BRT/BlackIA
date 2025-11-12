# Build Troubleshooting - Erreurs de Compilation

## Problème: Dépendances Manquantes pour RAG

### Symptômes
```
error TS2307: Cannot find module 'vectordb' or its corresponding type declarations.
error TS2307: Cannot find module 'python-shell' or its corresponding type declarations.
```

### Cause
Les modules `vectordb`, `apache-arrow`, `python-shell` et `@types/python-shell` ne sont pas installés.

### Solutions

#### Option 1: Contourner temporairement les restrictions réseau

Si vous avez des restrictions réseau (`ERR_PNPM_FETCH_403`), essayez:

1. **Utiliser un proxy npm** (si disponible):
```bash
npm config set proxy http://proxy.example.com:8080
npm config set https-proxy http://proxy.example.com:8080
```

2. **Utiliser un registre miroir**:
```bash
pnpm config set registry https://registry.npmmirror.com/
```

3. **Désactiver temporairement le pare-feu/VPN** et installer:
```bash
cd /home/user/BlackIA/apps/desktop
pnpm add vectordb apache-arrow python-shell
pnpm add @types/python-shell --save-dev
```

#### Option 2: Installer les dépendances sur une autre machine

1. Sur une machine avec accès réseau:
```bash
git clone <repo>
cd BlackIA/apps/desktop
pnpm install
pnpm add vectordb apache-arrow python-shell @types/python-shell
```

2. Copier le dossier `node_modules` et `pnpm-lock.yaml` vers la machine de build

3. Relancer le build

#### Option 3: Build sans RAG (temporaire)

Si vous voulez builder sans fonctionnalités RAG pour tester:

1. Commenter les imports RAG dans `src/main/index.ts`:
```typescript
// import { registerTextRAGHandlers } from './handlers/text-rag-handlers';
// import { registerVisionRAGHandlers } from './handlers/vision-rag-handlers';
// import { vectorStore } from './services/vector-store';
```

2. Commenter les initialisations:
```typescript
// await vectorStore.initialize();
// registerTextRAGHandlers();
// registerVisionRAGHandlers();
```

3. Build normalement

## Vérification Post-Installation

Une fois les dépendances installées, vérifier:

```bash
cd /home/user/BlackIA/apps/desktop

# Vérifier les packages
ls node_modules/vectordb
ls node_modules/python-shell

# Tester la compilation TypeScript
pnpm exec tsc -p tsconfig.main.json --noEmit

# Si succès, builder
pnpm build:dmg:clean
```

## Code Défensif Implémenté

Le code a été modifié pour gérer gracieusement l'absence des dépendances:

- **vector-store.ts**: Log un warning si `vectordb` n'est pas installé, mais ne crash pas l'app
- **vision-rag-service.ts**: Lance une erreur claire si `python-shell` n'est pas disponible lors de l'utilisation

Cela permet:
- ✅ La compilation TypeScript réussit même sans les dépendances
- ✅ L'app démarre correctement
- ⚠️ Les fonctionnalités RAG retournent des erreurs claires si utilisées

## Contact

Si le problème persiste, vérifier:
1. Les logs de pnpm: `~/.pnpm-debug.log`
2. La configuration réseau: `pnpm config list`
3. Le registre npm: `npm config get registry`
