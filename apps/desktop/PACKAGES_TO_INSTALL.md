# Système de Documentation - Configuration Complète

## ✅ Statut: Prêt à l'emploi

Tous les packages de documentation sont maintenant inclus dans `package.json`. Un simple `pnpm install` suffit.

## 📦 Packages Installés

Tous les packages suivants sont maintenant dans le `package.json`:

### Dependencies
- ✅ `react-markdown` ^9.0.1
- ✅ `remark-gfm` ^4.0.0
- ✅ `rehype-highlight` ^7.0.0
- ✅ `rehype-slug` ^6.0.0
- ✅ `rehype-autolink-headings` ^7.1.0
- ✅ `react-syntax-highlighter` ^15.5.0
- ✅ `highlight.js` ^11.9.0

### DevDependencies
- ✅ `@types/react-syntax-highlighter` ^15.5.11
- ✅ `tsx` ^4.7.0 (pour le script d'import)

## 🚀 Installation

Depuis la racine du projet:

```bash
pnpm install
```

Ou depuis le dossier desktop:

```bash
cd apps/desktop
pnpm install
```

## 📚 Auto-import

L'import de la documentation se fait **automatiquement** au premier lancement de l'application:
- Détecte si la documentation existe déjà
- Importe tous les fichiers .md du projet (README, guides, roadmap, etc.)
- Crée une page d'accueil avec vue d'ensemble
- Peuple la base SQLite avec FTS5 pour la recherche full-text

## 🛠️ Script Manuel (optionnel)

Pour réimporter manuellement la documentation:

```bash
cd apps/desktop
pnpm docs:import
```

**Note**: Ce script nécessite que l'application ait été lancée au moins une fois pour créer la base de données.
