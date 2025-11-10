# Installation de la Documentation Intégrée

## Packages à installer

Pour activer le module de documentation intégrée, installer les packages suivants:

```bash
# Depuis la racine du projet
pnpm add --filter @blackia/desktop \
  react-markdown \
  remark-gfm \
  rehype-highlight \
  rehype-slug \
  rehype-autolink-headings \
  highlight.js

# Ou depuis apps/desktop
cd apps/desktop
pnpm add react-markdown remark-gfm rehype-highlight rehype-slug rehype-autolink-headings highlight.js
```

## Description des packages

| Package | Version | Utilité |
|---------|---------|---------|
| `react-markdown` | ^9.0.0 | Rendu markdown sécurisé en React |
| `remark-gfm` | ^4.0.0 | Support GitHub Flavored Markdown (tables, checkboxes) |
| `rehype-highlight` | ^7.0.0 | Coloration syntaxique du code |
| `rehype-slug` | ^6.0.0 | Génération d'IDs pour les headings |
| `rehype-autolink-headings` | ^7.0.0 | Liens automatiques sur les headings |
| `highlight.js` | ^11.9.0 | Bibliothèque de coloration syntaxique |

## Tailwind Typography

Le plugin `@tailwindcss/typography` est déjà installé dans le projet.

## Vérification de l'installation

Après installation, vérifier que les types sont disponibles:

```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css'; // Theme pour highlight.js
```

## Structure créée

```
apps/desktop/src/
├── main/
│   ├── database/
│   │   └── schema.ts (+ table documentation)
│   ├── services/
│   │   └── documentation-db-service.ts (nouveau)
│   ├── handlers/
│   │   └── documentation-handlers.ts (nouveau)
│   └── index.ts (+ init FTS5 + handlers)
├── preload/
│   └── index.ts (+ API documentation)
└── renderer/src/
    └── components/
        └── documentation/ (à créer)
            ├── DocumentationView.tsx
            ├── DocumentationSidebar.tsx
            ├── DocumentationViewer.tsx
            ├── DocumentationSearch.tsx
            ├── DocumentationTOC.tsx
            └── DocumentationBreadcrumbs.tsx
```

## Fonctionnalités implémentées

### Backend (✅ Complet)
- [x] Schema DB avec table `documentation`
- [x] Table virtuelle FTS5 pour recherche full-text
- [x] Service CRUD complet
- [x] Recherche avec snippets et ranking
- [x] Navigation hiérarchique (tree + breadcrumbs)
- [x] IPC handlers exposés
- [x] API preload configurée

### Frontend (🚧 En cours)
- [ ] Composants UI React
- [ ] Intégration dans sidebar principale
- [ ] Script d'import markdown → SQLite
- [ ] Import des docs existants

## Prochaines étapes

1. Installer les packages (commande ci-dessus)
2. Créer les composants UI
3. Importer les documents existants (V1_CONSOLIDATION_PLAN.md, BETA_TEST_GUIDE.md, etc.)
4. Ajouter l'icône 📚 dans la sidebar principale
5. Tester la recherche et la navigation
