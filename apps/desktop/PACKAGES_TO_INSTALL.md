# Packages pour la Documentation

## Statut

✅ **Auto-import implémenté** - La documentation sera importée automatiquement au premier lancement de l'application.

## Packages requis

Les packages suivants doivent être installés pour le système de documentation:

```bash
cd apps/desktop
pnpm install
```

### Packages clés
- ✅ react-markdown
- ✅ remark-gfm
- ✅ rehype-highlight
- ✅ rehype-slug
- ✅ rehype-autolink-headings
- ✅ highlight.js
- ⚠️ react-syntax-highlighter (à installer)
- ⚠️ @types/react-syntax-highlighter (à installer)

## Note

Le composant `DocumentationViewer.tsx` utilise `react-syntax-highlighter` pour la coloration syntaxique des blocs de code.

## Auto-import

L'import de la documentation se fait automatiquement au démarrage de l'app:
- Détecte si la documentation existe déjà
- Importe tous les fichiers .md du projet
- Crée une page d'accueil
- Peuple la base SQLite avec FTS5

**Script manuel disponible** (optionnel):
```bash
pnpm docs:import
```
