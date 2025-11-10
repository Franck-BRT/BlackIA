# Guide de Tests Beta - BlackIA v1.0

**Version** : 1.0.0
**Date** : 2025-11-09
**Pour** : Beta-testeurs

---

## 🎯 Objectif

Valider le bon fonctionnement du module Workflows avant le release v1.0, en particulier les fonctionnalités avancées :
- Templates de workflow
- Contrôle de version (Git-like)
- Variables globales

---

## 🔧 Prérequis

### Configuration Minimale

- **OS** : macOS (Apple Silicon recommandé) ou Linux
- **Node.js** : v20+
- **pnpm** : v8+
- **RAM** : 8 GB minimum
- **Espace disque** : 2 GB

### Installation

```bash
# 1. Cloner le repository
git clone https://github.com/Franck-BRT/BlackIA.git
cd BlackIA

# 2. Installer les dépendances
pnpm install

# 3. Lancer l'application
pnpm desktop:dev
```

**Temps estimé** : 5-10 minutes

---

## 📝 Scénarios de Test

### Scénario 1 : Templates de Workflow ⭐ CRITIQUE

**Objectif** : Vérifier que les templates fonctionnent correctement

#### Étape 1.1 : Créer un template

1. **Ouvrir l'application** BlackIA
2. **Aller dans Workflows** (sidebar gauche)
3. **Créer un nouveau workflow** simple :
   - Ajouter 2-3 nœuds (ex: Input, AI Chat, Output)
   - Connecter les nœuds
4. **Cliquer sur l'icône Template** (📋) en haut
5. **Cliquer sur "Créer Template"**
6. **Remplir le formulaire** :
   ```
   Nom: Mon premier template
   Description: Template de test pour beta
   Catégorie: test
   ```
7. **Cliquer sur "Créer"**

**✅ Résultat attendu** :
- Message de succès "Template créé"
- Template apparaît dans la liste
- Compteur d'utilisation = 0

**❌ Si ça échoue** :
- Capturer l'erreur (screenshot)
- Noter les étapes exactes
- Vérifier la console (F12 → Console)

#### Étape 1.2 : Utiliser un template

1. **Créer un nouveau workflow vide**
2. **Ouvrir le gestionnaire de templates** (icône 📋)
3. **Trouver votre template** "Mon premier template"
4. **Cliquer sur "Utiliser"**

**✅ Résultat attendu** :
- Canvas se remplit avec les nœuds du template
- Connexions sont correctes
- Compteur d'utilisation = 1

**❌ Si ça échoue** :
- Noter si le canvas reste vide
- Vérifier s'il y a des nœuds mais pas de connexions
- Capturer screenshot

#### Étape 1.3 : Exporter/Importer un template

1. **Dans le gestionnaire de templates**
2. **Cliquer sur l'icône Download** (⬇️) de votre template
3. **Sauvegarder le fichier JSON**
4. **Supprimer le template** (icône X rouge)
5. **Cliquer sur Upload** (⬆️)
6. **Sélectionner le fichier JSON** sauvegardé

**✅ Résultat attendu** :
- Template réapparaît identique
- Compteur d'utilisation remis à 0 (normal)

**❌ Si ça échoue** :
- Vérifier si le fichier JSON est valide (ouvrir dans éditeur texte)
- Capturer message d'erreur

---

### Scénario 2 : Contrôle de Version ⭐ CRITIQUE

**Objectif** : Vérifier le système de versioning

#### Étape 2.1 : Créer la version v1

1. **Créer un workflow** avec 2 nœuds
2. **Cliquer sur l'icône Version** (🕐)
3. **Cliquer sur "Commit"**
4. **Entrer un message** : "Version initiale avec 2 nœuds"
5. **Cliquer sur "Commit"**

**✅ Résultat attendu** :
- Version "v1" apparaît dans l'historique
- Message "Version initiale avec 2 nœuds"
- Date = maintenant

#### Étape 2.2 : Modifier et créer v2

1. **Ajouter 2 nœuds supplémentaires** (total = 4 nœuds)
2. **Ouvrir le gestionnaire de versions**
3. **Commit avec message** : "Ajout de 2 nouveaux nœuds"

**✅ Résultat attendu** :
- Version "v2" apparaît
- Historique montre : "v2 → v1 : +2 nœuds"

#### Étape 2.3 : Restaurer v1

1. **Dans l'historique**
2. **Cliquer sur l'icône Restaurer** (↩️) de v1
3. **Confirmer la restauration**

**✅ Résultat attendu** :
- Canvas revient à 2 nœuds (état de v1)
- Les 2 nœuds ajoutés en v2 ont disparu
- Historique reste intact (v1 et v2 existent toujours)

**❌ Si ça échoue** :
- Noter si le canvas ne change pas
- Vérifier s'il y a des nœuds manquants ou en trop
- Capturer l'état avant/après

#### Étape 2.4 : Créer v3 après restauration

1. **Après avoir restauré v1**
2. **Modifier légèrement** (changer la position d'un nœud)
3. **Commit** : "Modification après restauration de v1"

**✅ Résultat attendu** :
- Version "v3" créée
- Historique : v3, v2, v1

---

### Scénario 3 : Variables Globales ⭐ CRITIQUE

**Objectif** : Vérifier la gestion des variables

#### Étape 3.1 : Créer une variable workflow

1. **Dans un workflow**, **cliquer sur l'icône Variables** (🔧)
2. **Cliquer sur "Créer Variable"**
3. **Remplir** :
   ```
   Nom: test_var
   Valeur: "Hello World"
   Type: string
   Scope: workflow
   Description: Variable de test
   Chiffrement: Non
   ```
4. **Cliquer sur "Créer"**

**✅ Résultat attendu** :
- Variable apparaît dans la liste
- Icône 🔒 absente (pas chiffrée)

#### Étape 3.2 : Utiliser la variable dans un nœud

1. **Ajouter un nœud Text** au workflow
2. **Dans le champ de texte**, écrire :
   ```
   Message: {{test_var}}
   ```
3. **Sauvegarder le workflow**
4. **Vérifier** que `{{test_var}}` apparaît correctement

**✅ Résultat attendu** :
- La syntaxe `{{test_var}}` est acceptée
- Pas d'erreur affichée

**⚠️ Note** : L'interpolation réelle (remplacement par "Hello World") se fera à l'exécution du workflow

#### Étape 3.3 : Variable globale

1. **Créer une nouvelle variable** :
   ```
   Nom: global_api_key
   Valeur: "sk-test123456789"
   Type: string
   Scope: global
   Chiffrement: Oui ✓
   ```
2. **Créer un autre workflow**
3. **Ouvrir le gestionnaire de variables**

**✅ Résultat attendu** :
- La variable `global_api_key` est visible dans tous les workflows
- Icône 🔒 présente (chiffrée)
- Valeur masquée : `********`

#### Étape 3.4 : Recherche de variables

1. **Dans le gestionnaire de variables**
2. **Utiliser la barre de recherche** : taper "api"
3. **Filtrer par scope** : sélectionner "global"

**✅ Résultat attendu** :
- Seule `global_api_key` apparaît
- Les variables workflow ne sont pas affichées

---

### Scénario 4 : Tests de Non-Régression

**Objectif** : S'assurer que les anciens workflows fonctionnent toujours

#### Étape 4.1 : Workflow existant

1. **Si vous avez déjà des workflows** créés avant
2. **Ouvrir un ancien workflow**
3. **Vérifier** :
   - Nœuds affichés correctement
   - Connexions intactes
   - Pas de message d'erreur

**✅ Résultat attendu** :
- Tout fonctionne comme avant
- Aucune régression

**❌ Si ça échoue** :
- PRIORITÉ CRITIQUE : signaler immédiatement
- Capturer screenshot de l'ancien workflow

#### Étape 4.2 : Migration de données

1. **Fermer l'application**
2. **Rouvrir l'application**
3. **Vérifier** que :
   - Templates toujours présents
   - Versions toujours présentes
   - Variables toujours présentes

**✅ Résultat attendu** :
- Aucune perte de données
- Tout est persisté correctement

---

## 🐛 Signalement de Bugs

### Informations à fournir

Quand vous trouvez un bug, merci de fournir :

1. **Description claire** du problème
2. **Étapes pour reproduire** (exactes)
3. **Résultat attendu** vs **résultat obtenu**
4. **Screenshots** ou **vidéos** si possible
5. **Console logs** (F12 → Console → copier les erreurs)
6. **Environnement** :
   ```
   OS: macOS 14.1 (par exemple)
   Node: v20.10.0
   pnpm: v8.12.0
   Application version: 0.2.0
   ```

### Format de Bug Report

```markdown
## Bug: [Titre court]

**Sévérité**: Critique / Majeur / Mineur

**Description**:
[Description détaillée]

**Étapes**:
1. Ouvrir...
2. Cliquer sur...
3. ...

**Résultat attendu**:
[Ce qui devrait se passer]

**Résultat obtenu**:
[Ce qui s'est passé]

**Screenshots**:
[Ajouter screenshots]

**Console logs**:
```
[Copier logs ici]
```

**Environnement**:
- OS: [...]
- Node: [...]
- Version: [...]
```

---

## ✅ Checklist Complète

Avant de valider les tests, vérifier que :

### Templates
- [ ] Créer un template fonctionne
- [ ] Utiliser un template remplit le canvas
- [ ] Compteur d'utilisation s'incrémente
- [ ] Export JSON fonctionne
- [ ] Import JSON fonctionne
- [ ] Recherche de templates fonctionne
- [ ] Filtrage par catégorie fonctionne
- [ ] Supprimer un template fonctionne

### Versions
- [ ] Commit crée une version v1, v2, v3...
- [ ] Historique affiche les versions
- [ ] Diff entre versions est calculé
- [ ] Restaurer une version fonctionne
- [ ] Workflow revient à l'état correct après restore
- [ ] Versions persistent après redémarrage

### Variables
- [ ] Créer variable workflow fonctionne
- [ ] Créer variable global fonctionne
- [ ] Variables chiffrées sont masquées
- [ ] Syntaxe {{variable}} est acceptée
- [ ] Recherche de variables fonctionne
- [ ] Filtrage par scope fonctionne
- [ ] Variables persistent après redémarrage

### Non-régression
- [ ] Anciens workflows toujours accessibles
- [ ] Aucune perte de données
- [ ] Pas de crash au démarrage
- [ ] Pas d'erreur console au chargement

---

## 📞 Contact & Support

**Discord** : [Lien Discord du projet]
**Email** : beta@blackia.io
**GitHub Issues** : https://github.com/Franck-BRT/BlackIA/issues

**Merci pour votre aide précieuse ! 🙏**

---

**Version du document** : 1.0.0
**Dernière mise à jour** : 2025-11-09
