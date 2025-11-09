# Guide des fonctionnalités avancées - Workflows BlackIA

## Table des matières

1. [Introduction](#introduction)
2. [Templates de Workflow](#templates-de-workflow)
3. [Contrôle de version](#contrôle-de-version)
4. [Gestion des variables](#gestion-des-variables)
5. [Groupes de nœuds](#groupes-de-nœuds)
6. [Annotations](#annotations)
7. [Mode Debug](#mode-debug)
8. [Cas d'usage pratiques](#cas-dusage-pratiques)
9. [FAQ](#faq)

---

## Introduction

Les workflows BlackIA offrent 6 fonctionnalités avancées pour créer, organiser et gérer vos automatisations IA de manière professionnelle.

### Fonctionnalités disponibles

| Fonctionnalité | Description | Icône |
|----------------|-------------|-------|
| **Templates** | Bibliothèque de workflows réutilisables | 📋 |
| **Versions** | Historique et contrôle de version Git-like | 🕐 |
| **Variables** | Gestion centralisée des variables globales/locales | 🔧 |
| **Groupes** | Organisation visuelle des nœuds | 📦 |
| **Annotations** | Notes et documentation dans le canvas | 📝 |
| **Debug** | Points d'arrêt et inspection des données | 🐛 |

---

## Templates de Workflow

### Qu'est-ce qu'un template ?

Un template est un workflow pré-configuré que vous pouvez réutiliser pour créer rapidement de nouveaux workflows similaires.

### Créer un template

1. **Ouvrez votre workflow** dans l'éditeur
2. **Cliquez sur l'icône Template** (📋) dans la barre d'outils supérieure
3. **Cliquez sur "Créer Template"**
4. **Remplissez le formulaire** :
   - **Nom** : Nom descriptif de votre template (ex: "AI Chat avec historique")
   - **Description** : Expliquez à quoi sert ce template
   - **Catégorie** : Classez le template (général, automation, data, ai, etc.)
5. **Cliquez sur "Créer"**

Votre workflow actuel (nœuds, connexions, groupes, annotations) est maintenant sauvegardé comme template.

### Utiliser un template

1. **Créez un nouveau workflow** ou ouvrez un workflow vide
2. **Ouvrez le gestionnaire de templates** (icône 📋)
3. **Parcourez les templates** disponibles
4. **Utilisez les filtres** :
   - **Recherche** : Tapez un mot-clé pour filtrer
   - **Catégorie** : Sélectionnez une catégorie spécifique
5. **Cliquez sur "Utiliser"** sur le template choisi

Le template est appliqué instantanément au canvas, avec tous ses nœuds et connexions.

### Gérer vos templates

#### Exporter un template

Utile pour partager avec d'autres utilisateurs ou sauvegarder localement.

1. **Ouvrez le gestionnaire de templates**
2. **Trouvez votre template**
3. **Cliquez sur l'icône Download** (⬇️)
4. **Choisissez l'emplacement** de sauvegarde

Un fichier JSON est créé avec toute la configuration du template.

#### Importer un template

1. **Ouvrez le gestionnaire de templates**
2. **Cliquez sur l'icône Upload** (⬆️) en haut
3. **Sélectionnez le fichier JSON** du template
4. **Le template apparaît** dans votre bibliothèque

#### Supprimer un template

1. **Ouvrez le gestionnaire de templates**
2. **Trouvez le template à supprimer**
3. **Cliquez sur l'icône X** (rouge)
4. **Confirmez la suppression**

⚠️ **Attention** : La suppression est définitive et ne peut pas être annulée.

### Statistiques d'utilisation

Chaque template affiche un compteur d'utilisation (⭐) qui s'incrémente automatiquement à chaque utilisation. Cela vous aide à identifier vos templates les plus populaires.

---

## Contrôle de version

### Concept

Le système de versions fonctionne comme Git : vous créez des "commits" (versions) de votre workflow à différents moments, et vous pouvez revenir à n'importe quelle version antérieure.

### Créer une version (Commit)

1. **Ouvrez votre workflow** dans l'éditeur
2. **Effectuez vos modifications** (ajout/suppression de nœuds, etc.)
3. **Cliquez sur l'icône Version** (🕐) dans la barre d'outils
4. **Cliquez sur "Commit"** en haut
5. **Entrez un message** descriptif (ex: "Ajout du nœud de validation")
6. **Cliquez sur "Commit"**

Une nouvelle version est créée avec un numéro incrémental (v1, v2, v3, etc.).

### Visualiser l'historique

L'historique des versions affiche :

- **Numéro de version** : v1, v2, v3...
- **Message de commit** : Votre description
- **Auteur** : Nom de l'utilisateur (si configuré)
- **Date** : Temps relatif (il y a 2 heures, il y a 3 jours, etc.)
- **Changements** : Nombre de nœuds et connexions modifiés

### Comparer deux versions

L'historique calcule automatiquement les différences entre versions consécutives :

```
v3 (actuelle) → v2 : +2 nœuds, +1 connexion
v2 → v1 : -1 nœud, 0 connexions
```

### Restaurer une version

1. **Ouvrez le gestionnaire de versions**
2. **Trouvez la version** à restaurer
3. **Cliquez sur l'icône Restaurer** (↩️)
4. **Confirmez l'action**

⚠️ **Important** : La restauration remplace complètement le workflow actuel. Pensez à créer une version avant de restaurer si vous voulez conserver l'état actuel.

### Bonnes pratiques

- ✅ **Créez une version avant des modifications majeures**
- ✅ **Utilisez des messages clairs** : "Ajout validation email" plutôt que "modifs"
- ✅ **Créez des versions régulièrement** pour ne pas perdre votre travail
- ✅ **Documentez les changements importants** dans le message

---

## Gestion des variables

### Types de variables

BlackIA supporte **3 scopes de variables** :

| Scope | Portée | Utilisation |
|-------|--------|-------------|
| **Workflow** | Un seul workflow | Variables spécifiques (ID de workflow, config locale) |
| **Global** | Tous les workflows | Configurations partagées (URL d'API, clés) |
| **Environment** | Environnement système | Variables d'environnement (DEV, PROD) |

### Types de données

- `string` : Texte simple
- `number` : Nombres (entiers ou décimaux)
- `boolean` : true/false
- `object` : Objets JSON
- `array` : Tableaux JSON

### Créer une variable

1. **Ouvrez le gestionnaire de variables** (icône 🔧)
2. **Cliquez sur "Créer Variable"**
3. **Remplissez le formulaire** :
   - **Nom** : Nom de la variable (ex: `api_key`, `base_url`)
   - **Valeur** : Valeur de la variable
   - **Type** : Sélectionnez le type de données
   - **Scope** : workflow, global ou environment
   - **Description** (optionnelle) : Expliquez l'usage
   - **Chiffrement** : Cochez pour les données sensibles
4. **Cliquez sur "Créer"**

### Utiliser une variable

Dans n'importe quel champ de texte d'un nœud, utilisez la syntaxe :

```
{{nom_de_variable}}
```

**Exemples** :

```javascript
// Dans un nœud HTTP Request
URL: {{base_url}}/api/chat
Headers: {
  "Authorization": "Bearer {{api_key}}"
}

// Dans un nœud AI Chat
Model: {{default_model}}
Temperature: {{temperature}}

// Dans un nœud Text
Message: "Bonjour {{user_name}}, votre code est {{verification_code}}"
```

### Variables chiffrées

Pour les données sensibles (clés API, mots de passe), activez le chiffrement :

1. Lors de la création, **cochez "Chiffrement"**
2. La valeur est **stockée chiffrée** en base de données
3. Elle est **déchiffrée à l'exécution** uniquement

L'icône 🔒 indique qu'une variable est chiffrée.

### Filtrer et rechercher

Le gestionnaire de variables offre :

- **Filtre par scope** : Afficher seulement workflow/global/environment
- **Recherche** : Chercher par nom ou description
- **Tri** : Par nom, date de création, scope

### Modifier une variable

1. **Ouvrez le gestionnaire de variables**
2. **Cliquez sur l'icône Edit** (✏️) à côté de la variable
3. **Modifiez les champs** souhaités
4. **Cliquez sur "Sauvegarder"**

⚠️ **Attention** : Modifier une variable global affecte **tous les workflows** qui l'utilisent.

### Supprimer une variable

1. **Ouvrez le gestionnaire de variables**
2. **Cliquez sur l'icône X** à côté de la variable
3. **Confirmez la suppression**

⚠️ Les nœuds utilisant cette variable afficheront une erreur `{{undefined}}`.

---

## Groupes de nœuds

### Qu'est-ce qu'un groupe ?

Un groupe permet de **rassembler visuellement** plusieurs nœuds connexes dans une boîte avec un titre et une couleur.

### Créer un groupe

**Méthode 1 : Sélection multiple**

1. **Maintenez Shift** et cliquez sur plusieurs nœuds
2. **Clic droit** sur un des nœuds sélectionnés
3. **Sélectionnez "Créer un groupe"**
4. **Entrez un nom** pour le groupe
5. **Choisissez une couleur**

**Méthode 2 : Glisser-déposer**

1. **Cliquez sur l'icône Groupe** (📦) dans la barre d'outils
2. **Dessinez un rectangle** autour des nœuds
3. **Entrez un nom et une couleur**

### Personnaliser un groupe

Double-cliquez sur un groupe pour :

- **Renommer** le groupe
- **Changer la couleur** de fond
- **Ajuster la taille** en déplaçant les coins
- **Ajouter/retirer des nœuds** en les déplaçant

### Couleurs de groupe

Utilisez des couleurs pour catégoriser visuellement :

- 🟦 **Bleu** : Traitement de données
- 🟩 **Vert** : Validation et contrôles
- 🟥 **Rouge** : Erreurs et exceptions
- 🟨 **Jaune** : Avertissements
- 🟪 **Violet** : Intégrations externes

### Supprimer un groupe

1. **Cliquez sur le groupe** pour le sélectionner
2. **Appuyez sur Delete** ou **clic droit > Supprimer**

Les nœuds restent intacts, seul le groupe visuel est supprimé.

---

## Annotations

### Qu'est-ce qu'une annotation ?

Une annotation est une **note textuelle** placée directement sur le canvas pour documenter, expliquer ou commenter certaines parties du workflow.

### Créer une annotation

1. **Cliquez sur l'icône Annotation** (📝) dans la barre d'outils
2. **Cliquez sur le canvas** à l'endroit désiré
3. **Tapez votre texte** dans la zone
4. **Cliquez en dehors** pour valider

Ou :

1. **Double-cliquez sur un espace vide** du canvas
2. Une annotation vide apparaît

### Modifier une annotation

1. **Double-cliquez sur l'annotation**
2. **Modifiez le texte**
3. **Cliquez en dehors** pour sauvegarder

### Déplacer une annotation

1. **Cliquez et maintenez** sur l'annotation
2. **Déplacez** à l'endroit souhaité
3. **Relâchez** pour fixer

### Formater le texte

Les annotations supportent le **Markdown** :

```markdown
# Titre principal
## Sous-titre

**Texte en gras**
*Texte en italique*

- Liste à puces
- Item 2

1. Liste numérotée
2. Item 2

`code inline`

> Citation

[Lien](https://example.com)
```

### Supprimer une annotation

1. **Sélectionnez l'annotation** (clic simple)
2. **Appuyez sur Delete** ou **clic droit > Supprimer**

### Cas d'usage

- **Documentation** : Expliquer la logique d'une section
- **TODOs** : Marquer les améliorations à faire
- **Warnings** : Alerter sur des comportements spéciaux
- **Instructions** : Guider les utilisateurs du workflow

---

## Mode Debug

### Activer le mode debug

1. **Cliquez sur l'icône Debug** (🐛) dans la barre d'outils
2. Le mode debug est activé (icône en surbrillance)

### Points d'arrêt (Breakpoints)

#### Ajouter un breakpoint

1. **Cliquez sur un nœud** pour le sélectionner
2. **Cliquez sur l'icône de breakpoint** (●) dans les options du nœud
3. Un **point rouge** apparaît sur le nœud

#### Comportement

Lors de l'exécution du workflow :

- L'exécution **s'arrête** avant le nœud avec breakpoint
- Vous pouvez **inspecter les données** en transit
- Vous pouvez **continuer** l'exécution ou **arrêter**

#### Retirer un breakpoint

1. **Cliquez à nouveau** sur l'icône de breakpoint du nœud
2. Le point rouge disparaît

### Inspecter les données

Pendant l'exécution en mode debug :

1. **L'exécution s'arrête** à un breakpoint
2. **Un panneau s'affiche** avec :
   - **Input** : Données entrantes dans le nœud
   - **State** : État actuel du workflow
   - **Variables** : Valeurs des variables
3. **Explorez les données** au format JSON
4. **Cliquez sur "Continuer"** pour reprendre

### Exécution pas-à-pas

Avec le mode debug activé :

1. **Activez plusieurs breakpoints** sur la séquence
2. **Lancez l'exécution**
3. À chaque breakpoint, **inspectez** puis **continuez**
4. Suivez le **flux de données** nœud par nœud

### Désactiver le mode debug

1. **Cliquez à nouveau** sur l'icône Debug (🐛)
2. Tous les breakpoints restent mais sont **inactifs**

---

## Cas d'usage pratiques

### Cas 1 : Workflow d'analyse de données réutilisable

**Objectif** : Créer un template pour analyser des fichiers CSV avec IA.

**Étapes** :

1. **Créer le workflow** :
   - Nœud Input File (CSV)
   - Nœud Transform Data (parsing)
   - Nœud AI Analysis (ChatGPT)
   - Nœud Output (résultats)

2. **Créer des variables** :
   - `csv_delimiter` (global) : ","
   - `ai_model` (global) : "gpt-4"
   - `ai_prompt` (workflow) : "Analyse ces données et trouve les tendances"

3. **Utiliser les variables** :
   - Transform Data : Delimiter = `{{csv_delimiter}}`
   - AI Analysis : Model = `{{ai_model}}`, Prompt = `{{ai_prompt}}`

4. **Ajouter des annotations** :
   - Sur Transform : "Supporte CSV, TSV et Excel"
   - Sur AI Analysis : "Utilise 4K tokens max"

5. **Créer des groupes** :
   - Groupe "Import" (bleu) : Input + Transform
   - Groupe "AI Processing" (violet) : AI Analysis
   - Groupe "Export" (vert) : Output

6. **Sauvegarder comme template** :
   - Nom : "CSV AI Analysis"
   - Catégorie : "data"

7. **Créer la première version** :
   - Message : "Template initial pour analyse CSV"

**Résultat** : Un template réutilisable pour analyser n'importe quel CSV avec l'IA.

### Cas 2 : Workflow avec évolution et rollback

**Objectif** : Développer un workflow complexe en créant des checkpoints.

**Étapes** :

1. **Version v1 : Base** :
   - Créer un workflow simple avec 2-3 nœuds
   - Commit : "Workflow de base fonctionnel"

2. **Version v2 : Amélioration** :
   - Ajouter validation des données
   - Ajouter gestion d'erreurs
   - Commit : "Ajout validation et error handling"

3. **Version v3 : Optimisation** :
   - Ajouter cache pour les requêtes
   - Commit : "Optimisation avec cache"

4. **Problème détecté** :
   - Le cache cause des bugs
   - Restaurer v2 : Retour à la version stable
   - Commit v4 : "Rollback du cache, reprise depuis v2"

5. **Version v5 : Solution** :
   - Implémenter un cache différent
   - Commit : "Nouveau système de cache (Redis)"

**Résultat** : Historique complet permettant de revenir à tout moment à une version stable.

### Cas 3 : Variables d'environnement pour DEV/PROD

**Objectif** : Gérer des configurations différentes selon l'environnement.

**Variables globales** :

```javascript
// Développement
api_url_dev = "http://localhost:3000"
api_key_dev = "dev_key_123" (chiffrée)
db_connection_dev = "localhost:5432"

// Production
api_url_prod = "https://api.myapp.com"
api_key_prod = "prod_key_xyz" (chiffrée)
db_connection_prod = "prod-db.myapp.com:5432"

// Variable d'environnement
environment = "dev" (à changer en "prod" pour basculer)
```

**Dans les nœuds** :

```javascript
// Utilisation conditionnelle
URL: {{environment === 'dev' ? api_url_dev : api_url_prod}}
API Key: {{environment === 'dev' ? api_key_dev : api_key_prod}}
```

Ou créer **deux workflows** avec des variables différentes :

- Workflow Dev : utilise les variables `*_dev`
- Workflow Prod : utilise les variables `*_prod`

---

## FAQ

### Questions générales

**Q : Les templates incluent-ils les variables ?**

R : Non, les templates sauvegardent uniquement la structure (nœuds, connexions, groupes, annotations). Les **références** aux variables (ex: `{{api_key}}`) sont sauvegardées, mais pas les valeurs. Vous devez créer les variables séparément.

**Q : Combien de versions puis-je créer ?**

R : Illimité. Chaque version est sauvegardée en base de données SQLite.

**Q : Les versions sont-elles sauvegardées automatiquement ?**

R : Non, vous devez créer manuellement un commit. Pensez à créer des versions régulièrement.

**Q : Puis-je partager mes templates avec d'autres utilisateurs ?**

R : Oui, en utilisant la fonction Export/Import. Exportez le template en JSON et envoyez le fichier.

**Q : Les variables chiffrées sont-elles vraiment sécurisées ?**

R : Oui, elles sont chiffrées avec AES-256 et la clé de chiffrement est stockée en sécurité dans le système. Cependant, ne stockez jamais de secrets ultra-sensibles (tokens bancaires) dans l'application.

### Problèmes courants

**Q : "Variable {{xxx}} is undefined" dans un nœud**

R : La variable n'existe pas ou a été supprimée. Vérifiez dans le gestionnaire de variables.

**Q : Mon template ne se charge pas**

R : Le fichier JSON est peut-être corrompu. Vérifiez que c'est bien un fichier exporté depuis BlackIA.

**Q : Je ne peux pas restaurer une version**

R : Vérifiez que la version existe toujours dans l'historique. Si la base de données a été réinitialisée, les versions sont perdues.

**Q : Les groupes ne s'affichent pas correctement**

R : Rafraîchissez le canvas (F5) ou rouvrez le workflow.

**Q : Comment supprimer tous les breakpoints en une fois ?**

R : Désactivez le mode debug (icône 🐛), les breakpoints restent mais ne sont plus actifs.

### Performances

**Q : Combien de templates puis-je avoir ?**

R : Des milliers. La recherche et le chargement sont optimisés avec des index en base de données.

**Q : Les versions ralentissent-elles l'application ?**

R : Non, les versions sont chargées à la demande. Même avec 100+ versions, il n'y a pas d'impact sur les performances.

**Q : Les variables sont-elles mises en cache ?**

R : Oui, les variables sont chargées en mémoire au démarrage de l'application pour un accès rapide.

---

## Support

Pour toute question ou problème :

- **Documentation technique** : `docs/TECHNICAL.md`
- **Guide de contribution** : `CONTRIBUTING.md`
- **Issues GitHub** : [github.com/blackia/issues](https://github.com)

---

**Version du document** : 1.0.0
**Dernière mise à jour** : 2025-01-09
**Auteur** : Black Room Technologies
