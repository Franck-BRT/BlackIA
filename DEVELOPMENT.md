# Guide de Développement - BlackIA

## Prérequis

- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0
- **macOS** avec Apple Silicon (M1/M2/M3/M4) ou Intel
- **Python** 3.11+ (pour MLX, sera ajouté plus tard)

## Installation

```bash
# Cloner le repository
git clone https://github.com/Franck-BRT/BlackIA.git
cd BlackIA

# Installer les dépendances
pnpm install
```

## Scripts Disponibles

### Développement

```bash
# Lancer l'application desktop en mode dev
pnpm desktop:dev

# Ou utiliser turbo pour tout le workspace
pnpm dev
```

### Build

```bash
# Build de toute l'app
pnpm build

# Build de l'app desktop uniquement
pnpm desktop:build
```

### Qualité de Code

```bash
# Linter
pnpm lint

# Type checking
pnpm type-check

# Formatage
pnpm format

# Tests
pnpm test
```

### Nettoyage

```bash
# Nettoyer tous les node_modules et dist
pnpm clean
```

## Structure du Projet

```
BlackIA/
├── apps/
│   └── desktop/              # Application Electron
│       ├── src/
│       │   ├── main/        # Main process (Node.js)
│       │   ├── renderer/    # React app (UI)
│       │   └── preload/     # Preload scripts
│       └── package.json
├── packages/
│   ├── shared/              # Types et utils partagés
│   └── ui/                  # Composants UI réutilisables
├── docs/                    # Documentation
│   ├── CAHIER_DES_CHARGES.md
│   └── DECISIONS_TECHNIQUES.md
└── scripts/                 # Scripts utilitaires
```

## Architecture

### Main Process (Electron)

Le main process gère :
- Création et gestion des fenêtres
- IPC handlers (communication avec renderer)
- Accès au système de fichiers
- Intégration avec Ollama et MLX (à venir)

Fichier principal : `apps/desktop/src/main/index.ts`

### Renderer Process (React)

Le renderer est une application React qui gère :
- Interface utilisateur
- Routing (React Router)
- State management (Zustand)
- Communication avec main via IPC

Point d'entrée : `apps/desktop/src/renderer/src/main.tsx`

### Preload Script

Expose de manière sécurisée les APIs Electron au renderer.

Fichier : `apps/desktop/src/preload/index.ts`

## Thème et Design

BlackIA utilise un **thème glassmorphism** avec :
- Tailwind CSS pour le styling
- Classes utilitaires custom (`glass`, `glass-card`, etc.)
- Animations et transitions fluides
- Mode sombre par défaut

### Classes Glassmorphism

```tsx
// Card glassmorphism
<div className="glass-card rounded-2xl p-6">
  Content
</div>

// Hover effect
<button className="glass-hover">
  Hover me
</button>

// Sidebar
<aside className="glass-sidebar">
  Navigation
</aside>
```

## Ajout d'une Nouvelle Page

1. Créer le fichier dans `apps/desktop/src/renderer/src/pages/`
2. Ajouter la route dans `App.tsx`
3. Ajouter l'item de navigation dans `Sidebar.tsx`

Exemple :

```tsx
// pages/NewPage.tsx
export function NewPage() {
  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-6xl mx-auto">
        <div className="glass-card rounded-2xl p-12">
          <h1>New Page</h1>
        </div>
      </div>
    </div>
  );
}

// App.tsx
<Route path="/new" element={<NewPage />} />

// Sidebar.tsx
{ icon: Icon, label: 'New Page', path: '/new' }
```

## Ajout d'un Composant shadcn/ui

```bash
cd apps/desktop
npx shadcn-ui@latest add button
```

Les composants seront ajoutés dans `apps/desktop/src/renderer/src/components/ui/`

## Hot Reload

Le hot reload est activé par défaut en mode dev :
- **Vite** recharge automatiquement le renderer
- **Electron** redémarre si le main process change

## Debugging

### Renderer (React)

Les DevTools sont ouverts automatiquement en mode dev.

### Main Process

Ajouter `--inspect` dans le script de dev pour débugger avec Chrome DevTools.

## Tests

Structure des tests (à venir) :
- **Unitaires** : Vitest
- **Intégration** : Vitest + Electron
- **E2E** : Playwright

## Build de Production

```bash
# Build pour macOS (ARM64 + x64)
pnpm desktop:build

# Sortie dans apps/desktop/release/
```

### Code Signing (macOS)

Pour signer l'app (optionnel) :

```bash
export APPLE_ID="your@email.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="XXXXXXXXXX"

pnpm desktop:build
```

## Conventions de Code

### TypeScript

- Mode strict activé
- Pas de `any` (sauf justification)
- Typage explicite des fonctions publiques

### React

- Functional components uniquement
- Hooks pour la logique
- Props interfaces explicites

### Naming

- **Components** : PascalCase (`Button.tsx`)
- **Functions** : camelCase (`getUserData`)
- **Constants** : UPPER_SNAKE_CASE (`API_URL`)
- **Types/Interfaces** : PascalCase (`UserData`)

### Imports

```tsx
// 1. External libs
import React from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Internal packages
import { generateId } from '@blackia/shared';
import { cn } from '@blackia/ui';

// 3. Local imports
import { Sidebar } from './components/Sidebar';
import { useAuth } from './hooks/useAuth';
```

## Git Workflow

### Branches

- `main` : Production stable
- `develop` : Développement actif
- `feature/nom` : Nouvelles fonctionnalités
- `fix/nom` : Corrections de bugs
- `claude/xxx` : Branches générées par Claude

### Commits

Format : `type: description`

Types :
- `feat`: Nouvelle fonctionnalité
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatting, styling
- `refactor`: Refactoring
- `test`: Ajout de tests
- `chore`: Maintenance

Exemple :
```bash
git commit -m "feat: add chat message component"
```

## CI/CD

GitHub Actions configurées pour :
- ✅ Lint & Type check sur chaque push
- ✅ Tests automatiques
- ✅ Build macOS sur main/develop

## Troubleshooting

### "Cannot find module '@blackia/shared'"

```bash
# Réinstaller les dépendances
pnpm install
```

### "Port 5173 already in use"

```bash
# Tuer le process Vite
lsof -ti:5173 | xargs kill -9
```

### Electron ne démarre pas

```bash
# Rebuild des dépendances natives
cd apps/desktop
pnpm rebuild
```

## Ressources

- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Turbo Documentation](https://turbo.build/repo/docs)

## Support

Pour toute question :
- 📖 Consultez les [docs](./docs/)
- 🐛 Ouvrez une [issue](https://github.com/Franck-BRT/BlackIA/issues)
- 💬 Discussions GitHub

---

**Happy coding! 🚀**
