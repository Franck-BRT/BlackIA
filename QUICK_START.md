# ⚡ Quick Start - BlackIA

## 🚨 Important

**L'installation DOIT se faire sur votre Mac**, pas dans l'environnement Claude Code (restrictions réseau).

---

## Installation en 4 Commandes

```bash
# 1. Installer les dépendances (2-3 min)
pnpm install

# 2. Vérifier l'installation
pnpm verify

# 3. Lancer l'application
pnpm desktop:dev
```

---

## 📖 Documentation Complète

Si vous avez des problèmes, consultez dans l'ordre :

1. **[FIRST_RUN.md](FIRST_RUN.md)** - Guide détaillé de premier lancement
2. **[DEVELOPMENT.md](DEVELOPMENT.md)** - Guide de développement complet
3. **[CAHIER_DES_CHARGES.md](CAHIER_DES_CHARGES.md)** - Vision produit
4. **[DECISIONS_TECHNIQUES.md](DECISIONS_TECHNIQUES.md)** - Architecture

---

## ✅ Résultat Attendu

Après `pnpm desktop:dev`, vous devriez voir :

```
✅ Vite démarre sur http://localhost:5173
✅ Electron s'ouvre (fenêtre 1400x900px)
✅ Interface BlackIA avec thème glassmorphism
✅ Sidebar avec navigation
✅ Page d'accueil avec 6 cards de features
✅ DevTools ouvertes automatiquement
```

---

## 🐛 Problème ?

```bash
# Réinstaller les dépendances
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install

# Vérifier à nouveau
pnpm verify

# Voir les logs détaillés
pnpm desktop:dev --verbose
```

---

## 📞 Support

- 📖 Lire [FIRST_RUN.md](FIRST_RUN.md) pour le troubleshooting détaillé
- 🐛 Ouvrir une issue sur GitHub avec les logs d'erreur
- 💬 Vérifier les discussions GitHub

---

**Bon lancement ! 🚀**
