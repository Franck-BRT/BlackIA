# Plan de développement - Module Workflow BlackIA

## 📊 État actuel (Stable - Prêt pour merge)

### ✅ Phases complétées

| Phase | Description | Status | Commit |
|-------|-------------|--------|--------|
| **Phase 1** | Visual Rendering | ✅ Complet | Multiple commits |
| **Phase 2** | Interactivité complète | ✅ Complet | Multiple commits |
| **Phase 3** | Moteur d'exécution réel | ✅ Complet | Multiple commits |
| **Phase 4.1** | Schema DB & Migration | ✅ Complet | `652e3fb` |
| **Phase 4.2** | Backend Integration | ✅ Complet | `ef9f1e6`, `6c64510` |
| **Phase 5** | Tests & Documentation | ✅ Complet | `6405a43` |

### 📦 Fonctionnalités livrées

#### 1. Templates de workflow (📋)
- [x] Création de templates depuis workflow actuel
- [x] Bibliothèque de templates avec catégories
- [x] Recherche et filtrage de templates
- [x] Export/Import de templates (JSON)
- [x] Compteur d'utilisation auto-incrémenté
- [x] Stockage SQLite avec Drizzle ORM

#### 2. Contrôle de version (🕐)
- [x] Système de commits Git-like (v1, v2, v3...)
- [x] Historique complet avec métadonnées
- [x] Calcul de diff entre versions
- [x] Restauration de versions antérieures
- [x] Support des groupes et annotations dans versions
- [x] Stockage avec foreign keys CASCADE

#### 3. Variables globales (🔧)
- [x] 3 scopes : workflow, global, environment
- [x] 5 types : string, number, boolean, object, array
- [x] Chiffrement pour données sensibles
- [x] Interpolation `{{variable}}` dans nœuds
- [x] Recherche et filtrage par scope
- [x] Gestion du workflowId pour scope workflow

#### 4. Groupes de nœuds (📦)
- [x] Création de groupes visuels
- [x] Couleurs et nommage personnalisés
- [x] Sauvegardés avec workflows et versions

#### 5. Annotations (📝)
- [x] Notes textuelles sur canvas
- [x] Support Markdown
- [x] Sauvegardées avec workflows et versions

#### 6. Mode Debug (🐛)
- [x] Points d'arrêt (breakpoints)
- [x] Inspection de données
- [x] Indicateurs visuels

### 🏗️ Infrastructure

#### Backend
- [x] `workflow-db-service.ts` : 4 services (Template, Version, Variable, Update)
- [x] `workflow-handlers.ts` : 30+ IPC handlers
- [x] Schema SQLite avec 3 nouvelles tables
- [x] Migration `0002_add_workflow_advanced_features.sql`
- [x] Index optimisés pour performances

#### Frontend
- [x] `TemplateManager.tsx` : Interface complète templates
- [x] `VersionManager.tsx` : Interface Git-like versions
- [x] `VariablesManager.tsx` : Interface gestion variables
- [x] Migration localStorage → IPC complète

#### Tests
- [x] 40+ tests unitaires (Vitest)
- [x] 4 scénarios E2E documentés
- [x] Configuration Vitest + scripts npm
- [x] Guide de test manuel

#### Documentation
- [x] `WORKFLOW_ADVANCED_FEATURES.md` (500+ lignes)
- [x] Guide utilisateur complet
- [x] 3 cas d'usage pratiques
- [x] FAQ avec 15+ questions

---

## 🔥 Priorité HAUTE (À faire AVANT production)

### 1. Tests de non-régression
**Objectif** : S'assurer que tout fonctionne avant le déploiement

- [ ] **Installer dépendances de test**
  ```bash
  cd apps/desktop
  pnpm install
  ```

- [ ] **Vérifier compilation**
  ```bash
  pnpm build:dmg:clean
  ```

- [ ] **Tests manuels critiques**
  - [ ] Créer un template → Appliquer → Vérifier structure
  - [ ] Créer version v1 → Modifier → v2 → Restaurer v1 → Vérifier état
  - [ ] Créer variable → Utiliser `{{var}}` dans nœud → Vérifier interpolation
  - [ ] Ouvrir/fermer managers multiples fois (pas de crash)
  - [ ] Sauvegarder workflow → Fermer app → Rouvrir → Tout est là

- [ ] **Lancer tests unitaires**
  ```bash
  pnpm test
  ```

- [ ] **Corriger bugs critiques** (s'il y en a)

**Estimation** : 1-2 heures
**Bloquant** : Oui

### 2. Vérification de la migration de données
**Objectif** : Gérer les utilisateurs existants

- [ ] **Vérifier comportement avec DB vide**
  - Première utilisation → Templates/versions/variables vides
  - Pas de crash au démarrage

- [ ] **Vérifier comportement avec DB existante**
  - Workflows existants toujours accessibles
  - Migration s'exécute correctement
  - Nouvelles colonnes (groups, annotations) initialisées

**Estimation** : 30 minutes
**Bloquant** : Oui

### 3. Gestion d'erreurs robuste
**Objectif** : Pas de crash, messages clairs

- [ ] **Tester cas d'erreur**
  - [ ] Créer template sans nom → Message clair
  - [ ] Restaurer version inexistante → Gestion gracieuse
  - [ ] Variable mal formée → Erreur explicite
  - [ ] DB corrompue → Fallback ou message

- [ ] **Ajouter try/catch manquants** (si nécessaire)

- [ ] **Améliorer messages d'erreur utilisateur**
  - Remplacer `alert()` par notifications toast
  - Messages en français clair

**Estimation** : 1 heure
**Bloquant** : Non (mais recommandé)

---

## 🚀 Priorité MOYENNE (Production v1.1)

### 1. Amélioration UX Templates

#### A. Prévisualisation de templates
**Problème** : On ne voit pas le template avant de l'appliquer

**Solution** :
```tsx
// TemplateManager.tsx
<TemplatePreviewModal
  template={selectedTemplate}
  onApply={() => applyTemplate(selectedTemplate)}
  onCancel={() => setSelectedTemplate(null)}
/>
```

- [ ] Afficher un mini-canvas avec les nœuds
- [ ] Afficher nombre de nœuds, connexions, groupes
- [ ] Afficher les variables requises
- [ ] Bouton "Appliquer" / "Annuler"

**Estimation** : 3 heures

#### B. Templates par défaut
**Problème** : Bibliothèque vide au départ

**Solution** :
```typescript
// Créer des templates par défaut utiles
const DEFAULT_TEMPLATES = [
  {
    name: "AI Chat Simple",
    description: "Un chatbot IA de base",
    category: "ai",
    nodes: [...],
    edges: [...]
  },
  {
    name: "Analyse de données CSV",
    description: "Import CSV → Traitement → AI Analysis → Export",
    category: "data",
    nodes: [...],
    edges: [...]
  },
  // ... 5-10 templates utiles
];
```

- [ ] Créer 5-10 templates utiles
- [ ] Les insérer au premier lancement
- [ ] Icône "template officiel" pour les distinguer

**Estimation** : 4 heures

#### C. Catégories prédéfinies
**Problème** : L'utilisateur doit inventer les catégories

**Solution** :
```typescript
const TEMPLATE_CATEGORIES = [
  { value: 'general', label: 'Général', icon: '📋' },
  { value: 'ai', label: 'Intelligence Artificielle', icon: '🤖' },
  { value: 'data', label: 'Traitement de données', icon: '📊' },
  { value: 'automation', label: 'Automatisation', icon: '⚡' },
  { value: 'integration', label: 'Intégrations', icon: '🔌' },
  { value: 'custom', label: 'Personnalisé', icon: '🎨' },
];
```

- [ ] Dropdown avec catégories + icônes
- [ ] Permettre quand même création de catégorie custom

**Estimation** : 1 heure

#### D. Miniatures de templates
**Problème** : Tous les templates se ressemblent visuellement

**Solution** :
```typescript
// Générer une miniature SVG du workflow
const generateThumbnail = (nodes: Node[], edges: Edge[]) => {
  // Créer un mini-canvas SVG
  // Positionner les nœuds simplifiés
  // Retourner data URL
  return 'data:image/svg+xml;base64,...';
};
```

- [ ] Générer miniature à la création du template
- [ ] Stocker dans `thumbnail` (TEXT column déjà existante)
- [ ] Afficher dans la grille de templates

**Estimation** : 4 heures

### 2. Amélioration UX Versions

#### A. Comparaison visuelle de versions
**Problème** : Le diff textuel n'est pas clair

**Solution** :
```tsx
<VersionCompareModal>
  <SplitView>
    <Canvas nodes={v1.nodes} edges={v1.edges} readonly />
    <Canvas nodes={v2.nodes} edges={v2.edges} readonly />
  </SplitView>
  <DiffSummary>
    + 2 nœuds ajoutés
    - 1 nœud supprimé
    ~ 1 nœud modifié
  </DiffSummary>
</VersionCompareModal>
```

- [ ] Mode comparaison côte-à-côte
- [ ] Highlight des différences
- [ ] Liste détaillée des changements

**Estimation** : 6 heures

#### B. Tags de versions
**Problème** : Difficile de retrouver une version importante

**Solution** :
```typescript
interface WorkflowVersion {
  // ... existing fields
  tags?: string[]; // ['stable', 'production', 'bug-fix']
}
```

- [ ] Ajouter colonne `tags` TEXT en DB
- [ ] UI pour ajouter/retirer tags
- [ ] Filtrage par tag dans l'historique
- [ ] Tags prédéfinis : stable, production, dev, experimental

**Estimation** : 3 heures

#### C. Branches de versions
**Problème** : On ne peut pas expérimenter sans casser l'historique principal

**Solution** :
```typescript
interface WorkflowVersion {
  // ... existing fields
  branch?: string; // 'main', 'experimental', 'feature-xyz'
}
```

- [ ] Concept de branches (comme Git)
- [ ] Créer une branche depuis une version
- [ ] Merger deux branches
- [ ] Visualisation graphique de l'arbre de versions

**Estimation** : 10 heures (complexe)
**Note** : Feature avancée, peut-être v2.0

### 3. Amélioration UX Variables

#### A. Autocomplétion de variables
**Problème** : Il faut se souvenir du nom exact

**Solution** :
```tsx
// Dans les champs de texte des nœuds
<VariableAutocomplete
  value={fieldValue}
  onChange={setFieldValue}
  availableVariables={allVariables}
/>
```

- [ ] Détection de `{{` → Afficher dropdown
- [ ] Liste des variables disponibles
- [ ] Aperçu de la valeur
- [ ] Insertion automatique

**Estimation** : 4 heures

#### B. Validation de variables
**Problème** : Variables utilisées mais non définies

**Solution** :
```typescript
// Analyser le workflow et détecter les variables
const usedVariables = extractVariables(workflow);
const undefinedVars = usedVariables.filter(v => !exists(v));

if (undefinedVars.length > 0) {
  showWarning(`Variables non définies: ${undefinedVars.join(', ')}`);
}
```

- [ ] Analyse du workflow au save/execute
- [ ] Warning si variable manquante
- [ ] Suggestion de créer la variable
- [ ] Highlight des nœuds avec variables manquantes

**Estimation** : 3 heures

#### C. Import/Export de variables
**Problème** : Partager des configs entre environnements

**Solution** :
```typescript
// Export
const exportVariables = (scope: 'all' | 'workflow' | 'global') => {
  const vars = getVariablesByScope(scope);
  downloadJSON(vars, `variables-${scope}.json`);
};

// Import
const importVariables = (file: File) => {
  const vars = parseJSON(file);
  vars.forEach(v => createVariable(v));
};
```

- [ ] Bouton Export (all/workflow/global)
- [ ] Bouton Import avec merge strategy
- [ ] Format JSON standard
- [ ] Gestion des conflits (même nom)

**Estimation** : 2 heures

#### D. Variables d'environnement système
**Problème** : Accès limité aux env vars

**Solution** :
```typescript
// Permettre d'utiliser les vraies env vars
const systemEnvVars = process.env;

// Synchroniser avec la DB
syncEnvVars(systemEnvVars);
```

- [ ] Lecture des env vars système au démarrage
- [ ] Synchronisation automatique
- [ ] UI pour voir/éditer env vars
- [ ] Protection des vars sensibles

**Estimation** : 2 heures

### 4. Performances

#### A. Lazy loading des templates
**Problème** : Charger 1000 templates d'un coup ralentit l'UI

**Solution** :
```typescript
// Pagination
const { data, hasMore, loadMore } = usePaginatedTemplates({
  pageSize: 20,
  orderBy: 'usageCount'
});

// Virtual scrolling
<VirtualList
  items={templates}
  itemHeight={120}
  renderItem={(template) => <TemplateCard {...template} />}
/>
```

- [ ] Pagination backend (limit/offset)
- [ ] Virtual scrolling pour la liste
- [ ] Infinite scroll
- [ ] Indicateur de chargement

**Estimation** : 4 heures

#### B. Cache des variables
**Problème** : Requête DB à chaque référence de variable

**Solution** :
```typescript
// Cache en mémoire
const variableCache = new Map<string, WorkflowVariable>();

// Invalidation intelligente
const invalidateCache = (scope: 'all' | 'workflow' | 'global') => {
  // Recharger seulement les variables modifiées
};
```

- [ ] Cache LRU pour variables
- [ ] Invalidation sur update/delete
- [ ] Preload des variables au démarrage
- [ ] Background refresh (toutes les 5min)

**Estimation** : 3 heures

#### C. Indexation full-text search
**Problème** : Recherche lente sur gros volumes

**Solution** :
```sql
-- Utiliser SQLite FTS5
CREATE VIRTUAL TABLE workflow_templates_fts USING fts5(
  name, description, category, tags
);

-- Trigger pour synchroniser
CREATE TRIGGER sync_fts AFTER INSERT ON workflow_templates BEGIN
  INSERT INTO workflow_templates_fts VALUES (new.name, new.description, ...);
END;
```

- [ ] Table FTS5 pour templates
- [ ] Table FTS5 pour variables
- [ ] Triggers de synchronisation
- [ ] Recherche ultra-rapide

**Estimation** : 3 heures

### 5. Export/Import avancé

#### A. Export workflow complet
**Problème** : On ne peut exporter que les templates

**Solution** :
```typescript
const exportWorkflowComplete = async (workflowId: string) => {
  const workflow = await getWorkflow(workflowId);
  const versions = await getVersions(workflowId);
  const variables = await getVariables(workflowId);

  const bundle = {
    workflow,
    versions,
    variables,
    metadata: {
      exportDate: new Date(),
      version: '1.0.0'
    }
  };

  downloadJSON(bundle, `workflow-${workflow.name}-complete.json`);
};
```

- [ ] Export avec versions + variables
- [ ] Import avec reconstruction complète
- [ ] Gestion des ID conflicts
- [ ] Preview avant import

**Estimation** : 4 heures

#### B. Export en tant que code
**Problème** : Workflow non versionnable dans Git

**Solution** :
```typescript
// Export as TypeScript
const exportAsCode = (workflow: Workflow) => {
  return `
export const ${workflow.name}Workflow = {
  nodes: [
    { id: 'node1', type: 'aiChat', config: {...} },
    // ...
  ],
  edges: [...]
};
  `;
};
```

- [ ] Export TypeScript/JavaScript
- [ ] Export YAML
- [ ] Import depuis code
- [ ] CI/CD friendly

**Estimation** : 6 heures

#### C. Import depuis URL
**Problème** : Partage difficile entre utilisateurs

**Solution** :
```typescript
const importFromURL = async (url: string) => {
  const response = await fetch(url);
  const template = await response.json();
  await importTemplate(template);
};
```

- [ ] Support GitHub Gist
- [ ] Support direct URL JSON
- [ ] Validation du schéma
- [ ] Warning de sécurité

**Estimation** : 2 heures

---

## 💡 Priorité BASSE (Nice-to-have)

### 1. Collaboration

#### A. Partage de templates communautaire
- [ ] Marketplace de templates
- [ ] Upvote/downvote
- [ ] Commentaires et reviews
- [ ] Vérification par l'équipe

**Estimation** : 20 heures (backend requis)

#### B. Collaboration temps réel
- [ ] Multi-utilisateurs sur même workflow
- [ ] Voir les curseurs des autres
- [ ] Chat intégré
- [ ] Résolution de conflits

**Estimation** : 40 heures (très complexe)

### 2. Intelligence artificielle

#### A. Suggestion de templates
```typescript
// Analyser le workflow actuel et suggérer des templates similaires
const suggestTemplates = (currentWorkflow: Workflow) => {
  // ML pour trouver patterns similaires
  return recommendedTemplates;
};
```

**Estimation** : 10 heures

#### B. Auto-génération de workflows
```typescript
// "Créer un workflow qui fait X"
const generateWorkflow = async (description: string) => {
  const response = await ai.generateWorkflow(description);
  return response.workflow;
};
```

**Estimation** : 15 heures

#### C. Optimisation automatique
- [ ] Analyser les workflows lents
- [ ] Suggérer des améliorations
- [ ] Auto-fix des anti-patterns

**Estimation** : 12 heures

### 3. Analytics

#### A. Statistiques d'utilisation
```typescript
interface WorkflowAnalytics {
  executionCount: number;
  averageExecutionTime: number;
  errorRate: number;
  popularNodes: NodeType[];
  peakUsageHours: number[];
}
```

- [ ] Tracking des exécutions
- [ ] Dashboard analytics
- [ ] Graphiques de performance
- [ ] Alertes sur anomalies

**Estimation** : 8 heures

#### B. A/B testing de workflows
- [ ] Comparer 2 versions
- [ ] Métriques de succès
- [ ] Routing automatique
- [ ] Analyse statistique

**Estimation** : 12 heures

### 4. Sécurité avancée

#### A. Permissions granulaires
```typescript
interface WorkflowPermissions {
  canExecute: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  canExport: boolean;
}
```

- [ ] Système de permissions
- [ ] Rôles (admin, editor, viewer)
- [ ] Partage avec restrictions

**Estimation** : 10 heures

#### B. Audit log
```typescript
interface AuditLog {
  action: 'create' | 'update' | 'delete' | 'execute';
  userId: string;
  workflowId: string;
  timestamp: Date;
  changes: object;
}
```

- [ ] Log de toutes les actions
- [ ] Qui a fait quoi et quand
- [ ] Rollback basé sur audit
- [ ] Export pour compliance

**Estimation** : 6 heures

#### C. Chiffrement renforcé
- [ ] Chiffrement AES-256-GCM (au lieu de simple AES)
- [ ] Key derivation avec PBKDF2
- [ ] Rotation automatique des clés
- [ ] Hardware security module support

**Estimation** : 8 heures

### 5. Intégrations

#### A. Git integration
```typescript
// Sauvegarder workflows dans Git
const pushToGit = async (workflow: Workflow) => {
  await git.add(`workflows/${workflow.name}.json`);
  await git.commit(`Update ${workflow.name}`);
  await git.push();
};
```

- [ ] Init repo Git
- [ ] Auto-commit sur version
- [ ] Push/pull depuis GitHub
- [ ] PR pour workflows

**Estimation** : 12 heures

#### B. CI/CD pipelines
- [ ] Tests automatiques de workflows
- [ ] Déploiement automatique
- [ ] Rollback automatique si erreur
- [ ] Notifications Slack/Discord

**Estimation** : 15 heures

---

## 🐛 Bugs connus / À surveiller

### Bugs potentiels à vérifier

1. **Variables avec caractères spéciaux**
   - [ ] Tester `{{ma-variable}}` vs `{{ma_variable}}`
   - [ ] Tester `{{variable.nested}}`
   - [ ] Tester `{{variableÉÀÇ}}`

2. **Restauration de version avec beaucoup de nœuds**
   - [ ] Tester avec workflow de 100+ nœuds
   - [ ] Vérifier les performances
   - [ ] Vérifier que tout est restauré correctement

3. **Gestion de la mémoire**
   - [ ] Vérifier pas de memory leak avec 100+ templates chargés
   - [ ] Vérifier pas de memory leak avec historique de 50+ versions

4. **Concurrence**
   - [ ] Que se passe-t-il si on modifie une variable pendant qu'un workflow s'exécute ?
   - [ ] Que se passe-t-il si on restaure une version pendant une exécution ?

5. **Edge cases**
   - [ ] Template vide (0 nœuds)
   - [ ] Variable avec valeur `null`
   - [ ] Version sans message de commit
   - [ ] Noms de variables en doublon

### Performance à surveiller

- [ ] Temps de chargement avec 1000+ templates
- [ ] Temps de recherche avec 1000+ variables
- [ ] Temps de restauration d'une vieille version (v1 parmi 100 versions)
- [ ] Taille de la base de données après 1 an d'utilisation

---

## 📋 Checklist avant merge production

### Tests fonctionnels
- [ ] Toutes les features templates fonctionnent
- [ ] Toutes les features versions fonctionnent
- [ ] Toutes les features variables fonctionnent
- [ ] Pas de regression sur features existantes
- [ ] Performance acceptable (<500ms pour actions courantes)

### Tests techniques
- [ ] Compilation sans erreur ni warning
- [ ] Tests unitaires passent (>80% coverage)
- [ ] Pas de console.error en développement
- [ ] Pas de memory leaks détectés

### Documentation
- [ ] README à jour
- [ ] CHANGELOG avec nouvelles features
- [ ] Documentation utilisateur complète
- [ ] Exemples de workflows fournis

### Qualité du code
- [ ] Pas de TODO/FIXME critiques
- [ ] Code commenté aux endroits complexes
- [ ] Types TypeScript complets
- [ ] Pas de `any` excessifs

### Sécurité
- [ ] Pas de secrets dans le code
- [ ] Validation des entrées utilisateur
- [ ] Sanitization des données
- [ ] Chiffrement des données sensibles fonctionnel

---

## 📈 Métriques de succès

### Adoption utilisateur
- **Objectif** : 70% des utilisateurs utilisent au moins 1 feature avancée
- **Mesure** : Analytics sur utilisation templates/versions/variables

### Performance
- **Objectif** : Temps de réponse <500ms pour 90% des opérations
- **Mesure** : Monitoring temps d'exécution IPC

### Qualité
- **Objectif** : <5 bugs critiques par mois
- **Mesure** : GitHub Issues tracking

### Satisfaction
- **Objectif** : NPS >50
- **Mesure** : Survey in-app après 1 semaine d'utilisation

---

## 🗓️ Timeline suggéré

### Sprint 1 (Avant prod) - 1 semaine
- Tests de non-régression (Priorité HAUTE)
- Corrections bugs critiques
- Merge et déploiement

### Sprint 2 (Post-prod) - 2 semaines
- Amélioration UX Templates (templates par défaut, catégories)
- Amélioration UX Variables (autocomplétion)
- Export/Import avancé

### Sprint 3 - 2 semaines
- Amélioration UX Versions (comparaison visuelle, tags)
- Performances (lazy loading, cache)
- Analytics de base

### Sprint 4 et + - Selon priorités
- Features avancées selon feedback utilisateurs
- Intégrations (Git, CI/CD)
- Collaboration (marketplace)

---

## 💬 Notes pour le futur

### Décisions d'architecture à documenter

1. **Pourquoi SQLite et pas PostgreSQL ?**
   - Application desktop, pas de serveur
   - Simplicité de déploiement
   - Performance suffisante pour usage local
   - Si besoin cloud → créer un service API séparé

2. **Pourquoi Drizzle et pas Prisma ?**
   - Plus léger pour Electron
   - Meilleur contrôle des requêtes SQL
   - Type-safety excellent
   - Migrations plus simples

3. **Pourquoi IPC et pas tRPC partout ?**
   - IPC est le standard Electron
   - Simplicité pour features simples
   - tRPC peut être ajouté si besoin de validations complexes

### Questions ouvertes

1. **Faut-il un backend cloud pour le partage de templates ?**
   - Pro : Marketplace centralisé, découverte facile
   - Con : Coûts serveur, modération nécessaire
   - **Décision** : À voir selon l'adoption

2. **Faut-il supporter des workflows très complexes (1000+ nœuds) ?**
   - Pro : Use cases avancés possibles
   - Con : Performance, UI complexe
   - **Décision** : Optimiser si demandé

3. **Faut-il un système de plugins pour étendre les features ?**
   - Pro : Communauté peut contribuer
   - Con : Sécurité, compatibilité
   - **Décision** : v2.0 peut-être

---

## 🎯 Vision long-terme

### BlackIA Workflow v2.0 (dans 6-12 mois)

**Thèmes principaux** :
1. **Collaboration** : Multi-user, temps réel, marketplace
2. **Intelligence** : AI-powered suggestions, auto-optimization
3. **Enterprise** : Permissions, audit, compliance
4. **Intégrations** : Git, CI/CD, monitoring tools

**Features phares** :
- Marketplace communautaire de templates
- Collaboration temps réel
- AI assistant pour création de workflows
- Analytics avancés et monitoring
- Multi-environnements (dev/staging/prod)
- API publique pour intégrations tierces

---

**Dernière mise à jour** : 2025-01-09
**Auteur** : Claude AI + Black Room Technologies
**Version** : 1.0.0
