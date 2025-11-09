# Packages manquants pour la Documentation

## À installer

```bash
cd apps/desktop
pnpm add react-syntax-highlighter @types/react-syntax-highlighter
```

## Packages déjà installés

- ✅ react-markdown
- ✅ remark-gfm
- ✅ rehype-highlight (ou utiliser react-syntax-highlighter à la place)
- ✅ rehype-slug
- ✅ rehype-autolink-headings
- ✅ highlight.js

## Note

Le composant `DocumentationViewer.tsx` utilise actuellement `react-syntax-highlighter` pour la coloration syntaxique des blocs de code. Si ce package n'est pas installé, il y aura une erreur d'import.

**Alternative**: On peut aussi utiliser `rehype-highlight` + `highlight.js` qui sont déjà installés, mais `react-syntax-highlighter` offre une meilleure intégration avec React.
