# Tests des Services Workflow

## Vue d'ensemble

Ce dossier contient les tests unitaires pour les services de gestion avancée des workflows :

- `workflow-db-service.test.ts` : Tests unitaires pour WorkflowTemplateService, WorkflowVersionService, WorkflowVariableService et WorkflowUpdateService

## Lancer les tests

```bash
# Depuis la racine du projet desktop
pnpm test

# Avec coverage
pnpm test:coverage

# Mode watch (développement)
pnpm test:watch

# Tests spécifiques
pnpm test workflow-db-service
```

## Structure des tests

### Tests unitaires

Chaque service a ses propres tests organisés par méthode :

**WorkflowTemplateService**
- `getAll()` : Récupération de tous les templates
- `create()` : Création d'un nouveau template
- `incrementUsage()` : Incrémentation du compteur d'utilisation
- `search()` : Recherche de templates

**WorkflowVersionService**
- `commit()` : Création d'une nouvelle version
- `getHistory()` : Récupération de l'historique avec diff

**WorkflowVariableService**
- `create()` : Création de variables avec différents scopes
- `getByScope()` : Filtrage par scope
- `getByNameAndScope()` : Recherche par nom et scope
- `search()` : Recherche de variables

**WorkflowUpdateService**
- `updateGroups()` : Mise à jour des groupes
- `updateAnnotations()` : Mise à jour des annotations
- `updateFull()` : Mise à jour complète

### Tests d'intégration

Les tests d'intégration (commentés) simulent des flux complets :
- Template → Workflow Creation
- Version Control Flow
- Variable Scope Management

## Configuration

- **Framework** : Vitest
- **Environment** : Node.js
- **Mocking** : vi.mock() pour isoler les dépendances
- **Coverage** : v8 provider

## Écrire de nouveaux tests

### Template de test

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MyService } from '../my-service';

describe('MyService', () => {
  beforeEach(() => {
    // Setup avant chaque test
  });

  describe('myMethod', () => {
    it('should do something', async () => {
      // Arrange
      const input = 'test';

      // Act
      const result = await MyService.myMethod(input);

      // Assert
      expect(result).toBeDefined();
    });
  });
});
```

### Bonnes pratiques

1. **Isolation** : Chaque test doit être indépendant
2. **AAA Pattern** : Arrange, Act, Assert
3. **Nommage clair** : `should [expected behavior] when [condition]`
4. **Mocking** : Mocker les dépendances externes (DB, API)
5. **Coverage** : Viser >80% de couverture

## Debugging des tests

### Afficher les logs

```typescript
it('should log something', () => {
  console.log('Debug info');
  // Les logs apparaissent dans la console
});
```

### Debugger dans VS Code

1. Ajouter un breakpoint dans le code de test
2. Lancer avec le debugger VS Code
3. F5 pour démarrer le debugging

### Tests en isolation

```bash
# Un seul fichier
pnpm test workflow-db-service.test.ts

# Une seule suite
pnpm test -t "WorkflowTemplateService"

# Un seul test
pnpm test -t "should create a new template"
```

## CI/CD

Les tests s'exécutent automatiquement sur GitHub Actions :

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: pnpm test:coverage
- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Notes importantes

⚠️ **Mocks de base de données**

Les tests utilisent des mocks pour la base de données. Pour des tests d'intégration réels, il faudrait :
1. Utiliser une base de données en mémoire (SQLite :memory:)
2. Initialiser le schéma avant les tests
3. Nettoyer après chaque test

⚠️ **Tests asynchrones**

Tous les services sont asynchrones. N'oubliez pas :
- Utiliser `async/await` dans les tests
- Attendre les résultats avec `await`
- Gérer les erreurs avec `try/catch` ou `.rejects`

## Métriques de couverture

Objectifs de couverture :

| Métrique | Objectif | Actuel |
|----------|----------|--------|
| Statements | >80% | - |
| Branches | >80% | - |
| Functions | >90% | - |
| Lines | >80% | - |

Lancer `pnpm test:coverage` pour voir les métriques actuelles.
