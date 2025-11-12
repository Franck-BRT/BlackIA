# Dependencies à installer (en attente d'accès réseau)

## Phase 1: Vector Store
```bash
cd apps/desktop
pnpm add vectordb apache-arrow
```

## Phase 2: Text RAG
```bash
cd apps/desktop
pnpm add pdf-parse  # Extraction de texte depuis PDF
```

## Phase 3: Vision RAG
```bash
cd apps/desktop
pnpm add sharp  # Génération de thumbnails
pnpm add python-shell  # Bridge Node.js <-> Python
pnpm add @types/python-shell --save-dev  # Types pour python-shell
```

## Notes
- Les installations échouent actuellement avec `ERR_PNPM_FETCH_403`
- Restriction réseau/firewall bloquant l'accès au registry npm
- Le code est prêt, il suffit d'installer ces dépendances quand l'accès réseau sera rétabli
- Après installation, exécuter `pnpm install` à la racine du monorepo

## Installation Python (déjà documentée)
```bash
cd apps/desktop/src/python
./setup.sh
```
