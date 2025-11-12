# Plan de Tests - Module Bibliothèque

Ce document contient tous les tests à effectuer pour valider le module de bibliothèque de documents.

---

## 1. Tests Backend

### 1.1 Services - LibraryService

**Objectif** : Vérifier les opérations CRUD sur les bibliothèques

#### Test 1.1.1 : Création d'une bibliothèque
- [ ] Ouvrir l'app et naviguer vers `/library`
- [ ] Cliquer sur "+ Nouvelle" bibliothèque
- [ ] Remplir le formulaire :
  - Nom : "Test Library"
  - Description : "Bibliothèque de test"
  - Icône : 📚
  - Couleur : Bleu
  - Auto-index : Activé
  - Text RAG : Activé
  - Chunk size : 512
  - Overlap : 10%
- [ ] Cliquer sur "Créer"
- [ ] **Attendu** : La bibliothèque apparaît dans la liste de gauche
- [ ] **Attendu** : Les stats affichent "0 docs, 0 chunks"
- [ ] **Attendu** : La bibliothèque est automatiquement sélectionnée

#### Test 1.1.2 : Liste des bibliothèques
- [ ] Créer 3 bibliothèques différentes
- [ ] **Attendu** : Les 3 bibliothèques apparaissent dans la sidebar
- [ ] **Attendu** : Chaque bibliothèque affiche son icône et son nom
- [ ] **Attendu** : Les stats sont correctes pour chacune

#### Test 1.1.3 : Recherche de bibliothèques
- [ ] Dans la barre de recherche, taper "Test"
- [ ] **Attendu** : Seules les bibliothèques contenant "Test" sont affichées
- [ ] Effacer la recherche
- [ ] **Attendu** : Toutes les bibliothèques réapparaissent

#### Test 1.1.4 : Sélection d'une bibliothèque
- [ ] Cliquer sur une bibliothèque dans la liste
- [ ] **Attendu** : La bibliothèque est mise en surbrillance (fond bleu)
- [ ] **Attendu** : Le panneau de droite affiche les détails de la bibliothèque
- [ ] **Attendu** : Le header affiche l'icône, le nom et la description

#### Test 1.1.5 : Statistiques de bibliothèque
- [ ] Sélectionner une bibliothèque
- [ ] **Attendu** : Les stats affichent :
  - Nombre de documents
  - Taille totale (formatée en B/KB/MB/GB)
  - Nombre de chunks
  - Nombre de patches vision

---

### 1.2 Services - LibraryDocumentService

**Objectif** : Vérifier la gestion des documents

#### Test 1.2.1 : Upload d'un document simple (TXT)
- [ ] Sélectionner une bibliothèque
- [ ] Cliquer sur "+ Ajouter document"
- [ ] Glisser-déposer un fichier .txt (ou cliquer "Parcourir")
- [ ] **Attendu** : Le fichier apparaît dans la liste des fichiers sélectionnés
- [ ] **Attendu** : La taille du fichier est affichée
- [ ] Ajouter un tag "test"
- [ ] Cliquer sur "Ajouter X fichier(s)"
- [ ] **Attendu** : Le modal se ferme
- [ ] **Attendu** : Le document apparaît dans la grille de documents
- [ ] **Attendu** : Les stats de la bibliothèque sont mises à jour

#### Test 1.2.2 : Upload multiple de documents
- [ ] Cliquer sur "+ Ajouter document"
- [ ] Sélectionner 3 fichiers différents (PDF, TXT, MD)
- [ ] **Attendu** : Les 3 fichiers apparaissent dans la liste
- [ ] Ajouter des tags "batch", "test"
- [ ] Cliquer sur "Ajouter 3 fichier(s)"
- [ ] **Attendu** : Les 3 documents apparaissent dans la grille
- [ ] **Attendu** : Tous ont les tags "batch" et "test"

#### Test 1.2.3 : Drag & Drop de documents
- [ ] Cliquer sur "+ Ajouter document"
- [ ] Depuis l'explorateur de fichiers, glisser un fichier sur la zone de drop
- [ ] **Attendu** : La zone devient bleue pendant le survol
- [ ] **Attendu** : Le fichier est ajouté après le drop
- [ ] Tester avec plusieurs fichiers en même temps
- [ ] **Attendu** : Tous les fichiers sont ajoutés

#### Test 1.2.4 : Retrait d'un fichier avant upload
- [ ] Ajouter 3 fichiers
- [ ] Cliquer sur la croix du 2ème fichier
- [ ] **Attendu** : Le fichier est retiré de la liste
- [ ] **Attendu** : Les 2 autres restent
- [ ] Valider l'upload
- [ ] **Attendu** : Seulement 2 documents sont créés

#### Test 1.2.5 : Affichage des documents
- [ ] Sélectionner une bibliothèque avec des documents
- [ ] **Attendu** : Les documents sont affichés en grille (3 colonnes sur grand écran)
- [ ] **Attendu** : Chaque carte affiche :
  - Nom du fichier
  - Taille (formatée)
  - Type MIME
  - Badges RAG (Text RAG / Vision RAG si indexé)
  - Badge de statut de validation

#### Test 1.2.6 : Badges de statut RAG
- [ ] Vérifier qu'un document non indexé n'a pas de badge RAG
- [ ] Indexer un document (voir test 1.2.7)
- [ ] **Attendu** : Le badge "Text RAG" apparaît en vert
- [ ] **Attendu** : Le nombre de chunks est affiché dans les détails

#### Test 1.2.7 : Indexation d'un document
- [ ] Cliquer sur un document pour ouvrir le viewer
- [ ] Cliquer sur "Réindexer"
- [ ] **Attendu** : Un loader apparaît pendant l'indexation
- [ ] **Attendu** : Après indexation, les chunks apparaissent dans le panneau de droite
- [ ] Fermer le viewer
- [ ] **Attendu** : Le badge "Text RAG" apparaît sur la carte du document
- [ ] **Attendu** : Les stats de la bibliothèque sont mises à jour (chunks++)

---

### 1.3 Services - ChunkEditorService

**Objectif** : Vérifier l'édition des chunks

#### Test 1.3.1 : Affichage des chunks
- [ ] Ouvrir un document indexé dans le viewer
- [ ] Passer en vue "Chunks" ou "Split"
- [ ] **Attendu** : Les chunks sont listés avec :
  - Numéro (#1, #2, etc.)
  - Texte du chunk
  - Nombre de tokens
  - Boutons d'actions (Edit, Split, Merge, Delete)

#### Test 1.3.2 : Édition d'un chunk
- [ ] Cliquer sur le bouton "Edit" d'un chunk
- [ ] **Attendu** : Le chunk passe en mode édition avec un textarea
- [ ] Modifier le texte du chunk
- [ ] Ajouter une raison : "Correction de faute"
- [ ] Cliquer sur "Enregistrer"
- [ ] **Attendu** : Le chunk est mis à jour
- [ ] **Attendu** : Un badge jaune "Modifié" apparaît
- [ ] **Attendu** : Les infos de modification sont affichées :
  - Raison : "Correction de faute"
  - Date de modification

#### Test 1.3.3 : Annulation d'édition
- [ ] Cliquer sur "Edit" d'un chunk
- [ ] Modifier le texte
- [ ] Cliquer sur "Annuler"
- [ ] **Attendu** : Le chunk revient à son état initial
- [ ] **Attendu** : Aucune modification n'est enregistrée

#### Test 1.3.4 : Fusion de chunks
- [ ] Localiser deux chunks consécutifs
- [ ] Cliquer sur le bouton "Merge" du premier chunk
- [ ] **Attendu** : Les deux chunks sont fusionnés en un seul
- [ ] **Attendu** : Le nouveau chunk contient le texte des deux chunks
- [ ] **Attendu** : Le nombre total de chunks diminue de 1
- [ ] **Attendu** : Un badge "Modifié" apparaît sur le chunk fusionné

#### Test 1.3.5 : Suppression d'un chunk
- [ ] Cliquer sur le bouton "Delete" d'un chunk
- [ ] **Attendu** : Une confirmation apparaît
- [ ] Confirmer la suppression
- [ ] **Attendu** : Le chunk disparaît de la liste
- [ ] **Attendu** : Le nombre total de chunks diminue de 1

#### Test 1.3.6 : Badge de modification manuelle
- [ ] Éditer un chunk
- [ ] **Attendu** : Badge jaune "Modifié" visible
- [ ] **Attendu** : Bordure jaune autour du chunk
- [ ] **Attendu** : Section des infos de modification affichée :
  - Raison
  - Modifié par
  - Date/heure

---

## 2. Tests Frontend

### 2.1 Hooks - useLibraries

#### Test 2.1.1 : Chargement initial
- [ ] Ouvrir l'app et aller sur `/library`
- [ ] **Attendu** : Loader visible pendant le chargement
- [ ] **Attendu** : Une fois chargé, le loader disparaît
- [ ] **Attendu** : Les bibliothèques sont affichées

#### Test 2.1.2 : Gestion des erreurs
- [ ] Simuler une erreur backend (couper Ollama ou autre dépendance)
- [ ] Rafraîchir la page
- [ ] **Attendu** : Un message d'erreur s'affiche
- [ ] **Attendu** : L'erreur est claire et compréhensible

#### Test 2.1.3 : Refresh automatique après création
- [ ] Créer une nouvelle bibliothèque
- [ ] **Attendu** : La liste est automatiquement rafraîchie
- [ ] **Attendu** : La nouvelle bibliothèque apparaît immédiatement

---

### 2.2 Composants - CreateLibraryModal

#### Test 2.2.1 : Ouverture/Fermeture
- [ ] Cliquer sur "+ Nouvelle"
- [ ] **Attendu** : Le modal s'ouvre avec une animation
- [ ] Cliquer sur la croix (X)
- [ ] **Attendu** : Le modal se ferme
- [ ] Rouvrir le modal
- [ ] Cliquer en dehors du modal
- [ ] **Attendu** : Le modal reste ouvert (pas de fermeture accidentelle)

#### Test 2.2.2 : Validation du formulaire
- [ ] Ouvrir le modal
- [ ] Laisser le champ "Nom" vide
- [ ] Cliquer sur "Créer"
- [ ] **Attendu** : Message d'erreur "Le nom est requis"
- [ ] **Attendu** : Le modal reste ouvert
- [ ] Remplir le nom
- [ ] **Attendu** : Le bouton "Créer" devient actif

#### Test 2.2.3 : Sélection d'icône
- [ ] Tester la sélection de chaque icône
- [ ] **Attendu** : L'icône sélectionnée a un fond bleu et un ring
- [ ] **Attendu** : Les autres icônes sont grises
- [ ] Changer d'icône
- [ ] **Attendu** : Seulement la nouvelle icône est sélectionnée

#### Test 2.2.4 : Sélection de couleur
- [ ] Tester chaque couleur (bleu, violet, vert, rouge, etc.)
- [ ] **Attendu** : La couleur sélectionnée est mise en surbrillance
- [ ] **Attendu** : Le texte et le fond changent selon la couleur

#### Test 2.2.5 : Configuration RAG
- [ ] Décocher "Auto-index"
- [ ] **Attendu** : La case est décochée
- [ ] Réactiver "Auto-index"
- [ ] Décocher "Text RAG"
- [ ] **Attendu** : La section de configuration Text RAG disparaît
- [ ] Réactiver "Text RAG"
- [ ] **Attendu** : La section réapparaît

#### Test 2.2.6 : Chunk Size et Overlap
- [ ] Changer la taille des chunks à 1024
- [ ] **Attendu** : La valeur est acceptée (entre 128 et 4096)
- [ ] Essayer de mettre 50
- [ ] **Attendu** : La validation empêche la valeur < 128
- [ ] Changer l'overlap à 25%
- [ ] **Attendu** : La valeur est acceptée (entre 0 et 50)

#### Test 2.2.7 : État de chargement
- [ ] Remplir le formulaire et cliquer "Créer"
- [ ] **Attendu** : Le bouton affiche "Création..."
- [ ] **Attendu** : Tous les champs sont désactivés pendant la création
- [ ] **Attendu** : Le modal se ferme après création réussie

---

### 2.3 Composants - DocumentUploadModal

#### Test 2.3.1 : Zone de drag & drop visuelle
- [ ] Ouvrir le modal d'upload
- [ ] Glisser un fichier au-dessus de la zone
- [ ] **Attendu** : La zone devient bleue avec bordure bleue
- [ ] **Attendu** : L'icône d'upload change de couleur
- [ ] Sortir le fichier sans le déposer
- [ ] **Attendu** : La zone revient à la normale

#### Test 2.3.2 : Parcourir les fichiers
- [ ] Cliquer sur "Parcourir"
- [ ] **Attendu** : La fenêtre de sélection de fichiers s'ouvre
- [ ] Sélectionner plusieurs fichiers (multiselect)
- [ ] **Attendu** : Tous les fichiers sélectionnés sont ajoutés

#### Test 2.3.3 : Affichage des fichiers sélectionnés
- [ ] Ajouter 5 fichiers
- [ ] **Attendu** : Tous sont listés avec :
  - Icône de fichier
  - Nom du fichier (tronqué si trop long)
  - Taille formatée
  - Bouton de suppression (X)
- [ ] **Attendu** : Le compteur affiche "5 fichiers sélectionnés"

#### Test 2.3.4 : Gestion des tags
- [ ] Taper un tag "test" et appuyer sur Entrée
- [ ] **Attendu** : Le tag apparaît comme une pill bleue
- [ ] **Attendu** : Le champ de saisie est vidé
- [ ] Ajouter plusieurs tags
- [ ] **Attendu** : Tous les tags sont affichés
- [ ] Cliquer sur la croix d'un tag
- [ ] **Attendu** : Le tag est supprimé
- [ ] Essayer d'ajouter un tag en double
- [ ] **Attendu** : Le tag n'est pas ajouté deux fois

#### Test 2.3.5 : Validation du formulaire
- [ ] Cliquer sur "Ajouter" sans fichier
- [ ] **Attendu** : Message d'erreur "Veuillez sélectionner au moins un fichier"
- [ ] Ajouter un fichier
- [ ] **Attendu** : Le bouton affiche "Ajouter 1 fichier(s)"
- [ ] Ajouter 2 autres fichiers
- [ ] **Attendu** : Le bouton affiche "Ajouter 3 fichier(s)"

#### Test 2.3.6 : Upload progressif
- [ ] Ajouter plusieurs gros fichiers (plusieurs MB)
- [ ] Cliquer sur "Ajouter"
- [ ] **Attendu** : Loader visible avec "Upload en cours..."
- [ ] **Attendu** : Le bouton est désactivé pendant l'upload
- [ ] **Attendu** : Le modal se ferme après upload complet

---

### 2.4 Composants - DocumentViewer

#### Test 2.4.1 : Ouverture du viewer
- [ ] Cliquer sur une carte de document
- [ ] **Attendu** : Le viewer s'ouvre en plein écran
- [ ] **Attendu** : Le header affiche :
  - Nom du fichier
  - Taille
  - Type MIME
  - Nombre de chunks (si indexé)

#### Test 2.4.2 : Modes de vue (View Modes)
- [ ] Cliquer sur l'icône "Document" (première icône)
- [ ] **Attendu** : Vue "Source only" - tout l'écran pour le document
- [ ] Cliquer sur l'icône "Grid" (deuxième icône)
- [ ] **Attendu** : Vue "Split" - 50% source, 50% chunks
- [ ] Cliquer sur le bouton "Chunks"
- [ ] **Attendu** : Vue "Chunks only" - tout l'écran pour les chunks

#### Test 2.4.3 : Zoom sur le document
- [ ] Passer en vue "Source" ou "Split"
- [ ] Cliquer sur le bouton "+"
- [ ] **Attendu** : Le texte grossit (110%, 120%, etc.)
- [ ] **Attendu** : Le label affiche le nouveau zoom
- [ ] Cliquer sur le bouton "-"
- [ ] **Attendu** : Le texte rétrécit
- [ ] **Attendu** : Le zoom ne descend pas en dessous de 50%
- [ ] **Attendu** : Le zoom ne monte pas au-dessus de 200%

#### Test 2.4.4 : Affichage du texte source
- [ ] En vue "Source" ou "Split"
- [ ] **Attendu** : Le texte extrait est affiché en police monospace
- [ ] **Attendu** : Les retours à la ligne sont préservés
- [ ] **Attendu** : Si pas de texte, message "Pas de texte extrait" avec icône

#### Test 2.4.5 : Affichage des chunks
- [ ] En vue "Chunks" ou "Split"
- [ ] **Attendu** : Header affiche "Chunks générés (X)"
- [ ] **Attendu** : Le composant ChunkList est visible
- [ ] **Attendu** : Si pas de chunks, message "Aucun chunk généré"

#### Test 2.4.6 : Bouton Réindexer
- [ ] Cliquer sur "Réindexer"
- [ ] **Attendu** : Un loader apparaît
- [ ] **Attendu** : Les chunks sont rechargés après l'indexation
- [ ] **Attendu** : Le compteur de chunks est mis à jour

#### Test 2.4.7 : Panel de validation
- [ ] Cliquer sur "Valider"
- [ ] **Attendu** : Un panneau apparaît en bas de l'écran
- [ ] **Attendu** : Textarea pour les notes
- [ ] **Attendu** : 4 boutons : Annuler, Rejeter, À revoir, Valider
- [ ] Taper des notes
- [ ] Cliquer sur "Valider"
- [ ] **Attendu** : Le panneau se ferme
- [ ] **Attendu** : Le statut du document est mis à jour
- [ ] Rouvrir le document
- [ ] **Attendu** : Le badge affiche "Validé" en vert

#### Test 2.4.8 : Statuts de validation
- [ ] Tester "Rejeter"
- [ ] **Attendu** : Badge rouge "Rejeté"
- [ ] Tester "À revoir"
- [ ] **Attendu** : Badge jaune "À revoir"
- [ ] Tester "Valider"
- [ ] **Attendu** : Badge vert "Validé"

#### Test 2.4.9 : Fermeture du viewer
- [ ] Cliquer sur la croix (X)
- [ ] **Attendu** : Le viewer se ferme
- [ ] **Attendu** : Retour à la liste des documents
- [ ] Rouvrir le même document
- [ ] **Attendu** : Le viewer se rouvre avec les bonnes données

---

### 2.5 Composants - ChunkList

#### Test 2.5.1 : Affichage de la liste vide
- [ ] Ouvrir un document non indexé
- [ ] **Attendu** : Icône d'alerte avec message "Aucun chunk généré"
- [ ] **Attendu** : Message "Indexez le document pour générer des chunks"

#### Test 2.5.2 : Sélection d'un chunk
- [ ] Cliquer sur un chunk
- [ ] **Attendu** : Le chunk est surligné avec bordure bleue et fond bleu/10
- [ ] Cliquer sur un autre chunk
- [ ] **Attendu** : Seul le nouveau chunk est sélectionné
- [ ] Cliquer sur le chunk sélectionné
- [ ] **Attendu** : Le chunk est désélectionné

#### Test 2.5.3 : Actions sur les chunks
- [ ] Survol d'un chunk
- [ ] **Attendu** : Les 4 boutons d'action sont visibles :
  - Edit (crayon)
  - Split (diviseur)
  - Merge (fusion) - seulement si pas le dernier
  - Delete (poubelle)

#### Test 2.5.4 : Scroll dans la liste
- [ ] Ouvrir un document avec beaucoup de chunks (>20)
- [ ] **Attendu** : La liste est scrollable
- [ ] **Attendu** : Smooth scrolling
- [ ] **Attendu** : Tous les chunks sont accessibles

#### Test 2.5.5 : Bouton "Ajouter un chunk"
- [ ] Scroller jusqu'en bas de la liste
- [ ] **Attendu** : Bouton avec bordure pointillée "Ajouter un chunk"
- [ ] Cliquer dessus
- [ ] **Attendu** : (TODO dans le code - vérifier si implémenté)

---

## 3. Tests d'Intégration

### 3.1 Workflow complet : Création → Upload → Indexation → Validation

#### Test 3.1.1 : Workflow end-to-end
- [ ] **Étape 1** : Créer une nouvelle bibliothèque "Documentation Projet"
- [ ] **Attendu** : Bibliothèque créée et visible
- [ ] **Étape 2** : Uploader 3 fichiers (README.md, GUIDE.md, API.md)
- [ ] **Attendu** : 3 documents visibles dans la grille
- [ ] **Étape 3** : Ouvrir le premier document (README.md)
- [ ] **Attendu** : Viewer ouvert
- [ ] **Étape 4** : Cliquer sur "Réindexer"
- [ ] **Attendu** : Chunks générés et visibles
- [ ] **Étape 5** : Éditer un chunk pour corriger une faute
- [ ] **Attendu** : Chunk modifié avec badge "Modifié"
- [ ] **Étape 6** : Valider le document avec statut "Validé"
- [ ] **Attendu** : Document marqué comme validé
- [ ] **Étape 7** : Fermer le viewer
- [ ] **Attendu** : Badge vert "Validé" visible sur la carte
- [ ] **Étape 8** : Vérifier les stats de la bibliothèque
- [ ] **Attendu** : Stats affichent 3 docs, taille totale, nombre de chunks

---

### 3.2 Gestion multi-bibliothèques

#### Test 3.2.1 : Création de plusieurs bibliothèques
- [ ] Créer 3 bibliothèques :
  - "Documentation" (icône 📚, couleur bleue)
  - "Articles" (icône 📝, couleur verte)
  - "Recherche" (icône 🔬, couleur violette)
- [ ] **Attendu** : Les 3 apparaissent dans la liste
- [ ] **Attendu** : Chacune a sa couleur et son icône distinctes

#### Test 3.2.2 : Navigation entre bibliothèques
- [ ] Cliquer sur "Documentation"
- [ ] Uploader un fichier
- [ ] Cliquer sur "Articles"
- [ ] **Attendu** : Le panneau de droite change pour afficher Articles
- [ ] **Attendu** : Aucun document dans Articles
- [ ] Revenir à "Documentation"
- [ ] **Attendu** : Le document précédent est toujours là

#### Test 3.2.3 : Isolation des documents
- [ ] Uploader un document dans "Documentation"
- [ ] Passer à "Articles"
- [ ] **Attendu** : Le document n'apparaît pas dans Articles
- [ ] Uploader un autre document dans "Articles"
- [ ] **Attendu** : Seul le nouveau document apparaît dans Articles
- [ ] Revenir à "Documentation"
- [ ] **Attendu** : Seul le premier document apparaît

---

### 3.3 Performance et robustesse

#### Test 3.3.1 : Upload de gros fichiers
- [ ] Uploader un fichier de plusieurs MB (5-10 MB)
- [ ] **Attendu** : L'upload fonctionne sans erreur
- [ ] **Attendu** : Le temps de traitement est raisonnable
- [ ] **Attendu** : Le texte est extrait correctement

#### Test 3.3.2 : Gestion de nombreux chunks
- [ ] Indexer un document qui génère >100 chunks
- [ ] Ouvrir le viewer
- [ ] **Attendu** : Tous les chunks sont chargés
- [ ] **Attendu** : Le scroll est fluide
- [ ] **Attendu** : Les actions (edit, delete) fonctionnent

#### Test 3.3.3 : Types de fichiers supportés
- [ ] Tester l'upload avec différents types :
  - [ ] .txt (texte brut)
  - [ ] .md (markdown)
  - [ ] .pdf (PDF)
  - [ ] .docx (Word)
  - [ ] .jpg, .png (images)
- [ ] **Attendu** : Chaque type est accepté
- [ ] **Attendu** : L'extraction de texte fonctionne (sauf images)
- [ ] **Attendu** : Le type MIME est correct

#### Test 3.3.4 : Gestion des erreurs
- [ ] Essayer d'uploader un fichier corrompu
- [ ] **Attendu** : Message d'erreur clair
- [ ] **Attendu** : L'app ne plante pas
- [ ] Essayer d'indexer un document sans texte
- [ ] **Attendu** : Message approprié
- [ ] **Attendu** : Pas de chunks générés

---

## 4. Tests UI/UX

### 4.1 Responsive Design

#### Test 4.1.1 : Taille d'écran standard (1920x1080)
- [ ] **Attendu** : Grille à 3 colonnes pour les documents
- [ ] **Attendu** : Sidebar de 320px
- [ ] **Attendu** : Tout est lisible et bien espacé

#### Test 4.1.2 : Taille moyenne (1366x768)
- [ ] **Attendu** : Grille à 2 colonnes
- [ ] **Attendu** : Sidebar toujours visible
- [ ] **Attendu** : Pas de scroll horizontal

#### Test 4.1.3 : Petite taille (1024x768)
- [ ] **Attendu** : Grille à 1 colonne
- [ ] **Attendu** : Sidebar compacte possible
- [ ] **Attendu** : Modal prend toute la largeur

---

### 4.2 Transitions et animations

#### Test 4.2.1 : Ouverture de modals
- [ ] **Attendu** : Fade-in du backdrop
- [ ] **Attendu** : Scale-up du modal
- [ ] **Attendu** : Durée d'animation ~200-300ms

#### Test 4.2.2 : Hover states
- [ ] Survoler les cartes de bibliothèque
- [ ] **Attendu** : Changement de couleur de fond smooth
- [ ] Survoler les cartes de document
- [ ] **Attendu** : Bordure change de couleur

#### Test 4.2.3 : États de chargement
- [ ] **Attendu** : Spinners visibles pendant les opérations
- [ ] **Attendu** : Texte explicatif ("Chargement...", "Upload en cours...")
- [ ] **Attendu** : Éléments désactivés pendant le chargement

---

### 4.3 Accessibilité

#### Test 4.3.1 : Navigation au clavier
- [ ] Utiliser Tab pour naviguer
- [ ] **Attendu** : Focus visible sur tous les éléments interactifs
- [ ] **Attendu** : Ordre de tabulation logique
- [ ] Utiliser Entrée pour activer les boutons
- [ ] **Attendu** : Les actions se déclenchent

#### Test 4.3.2 : Tooltips et labels
- [ ] Survoler les boutons d'icônes
- [ ] **Attendu** : Tooltips explicatifs (si implémenté)
- [ ] **Attendu** : Les labels sont clairs et en français

---

## 5. Checklist de fonctionnalités

### Bibliothèques
- [ ] ✅ Créer une bibliothèque
- [ ] ✅ Lister les bibliothèques
- [ ] ✅ Rechercher des bibliothèques
- [ ] ✅ Sélectionner une bibliothèque
- [ ] ✅ Afficher les statistiques
- [ ] ❌ Modifier une bibliothèque (TODO)
- [ ] ❌ Supprimer une bibliothèque (TODO)
- [ ] ❌ Mettre en favori (TODO)

### Documents
- [ ] ✅ Upload simple
- [ ] ✅ Upload multiple
- [ ] ✅ Drag & drop
- [ ] ✅ Tags
- [ ] ✅ Affichage en grille
- [ ] ✅ Badges de statut
- [ ] ✅ Indexation RAG
- [ ] ❌ Supprimer un document (TODO)
- [ ] ❌ Modifier les tags (TODO)
- [ ] ❌ Filtrer par tags (TODO)
- [ ] ❌ Recherche dans les documents (TODO)

### Viewer
- [ ] ✅ 3 modes de vue
- [ ] ✅ Zoom
- [ ] ✅ Affichage source
- [ ] ✅ Affichage chunks
- [ ] ✅ Réindexation
- [ ] ✅ Validation (4 statuts)
- [ ] ✅ Notes de validation

### Chunks
- [ ] ✅ Affichage de la liste
- [ ] ✅ Sélection
- [ ] ✅ Édition inline
- [ ] ✅ Fusion
- [ ] ✅ Suppression
- [ ] ✅ Badge "Modifié"
- [ ] ✅ Infos de modification
- [ ] ❌ Division (Split) - TODO
- [ ] ❌ Insertion - TODO
- [ ] ❌ Synchronisation avec texte source - TODO

---

## 6. Bugs connus et limitations

### À vérifier pendant les tests

#### Potentiels bugs
- [ ] **Upload de fichiers** : Le `file.path` peut être undefined en mode web (Electron uniquement)
- [ ] **Couleurs dynamiques** : Les classes Tailwind `bg-${color}-600` peuvent ne pas être générées si pas utilisées ailleurs
- [ ] **Validation** : Pas de feedback visuel immédiat après validation
- [ ] **Chunks** : Le bouton "Split" et "Insert" ne sont pas implémentés
- [ ] **Statistiques** : Peuvent ne pas se mettre à jour immédiatement

#### Limitations actuelles
- [ ] Pas de pagination pour les documents (toute la liste chargée)
- [ ] Pas de filtrage avancé (par date, taille, type)
- [ ] Pas d'aperçu de document (preview) avant upload
- [ ] Pas de drag & drop pour réorganiser les chunks
- [ ] Pas de highlight dans le texte source lors de la sélection d'un chunk
- [ ] Vision RAG pas encore implémenté
- [ ] Pas d'export/import de bibliothèques

---

## 7. Prochaines étapes après validation

### Améliorations prioritaires
1. Implémenter Split et Insert chunk
2. Ajouter la suppression de documents
3. Ajouter l'édition de bibliothèques
4. Ajouter les filtres avancés
5. Implémenter la recherche dans les documents
6. Ajouter Vision RAG
7. Ajouter les statistiques détaillées (graphiques)
8. Implémenter l'export/import

### Optimisations
1. Pagination pour les grandes listes
2. Virtual scrolling pour les chunks
3. Lazy loading des documents
4. Cache des données
5. Prévisualisation des documents

---

## Notes de test

**Environnement de test** :
- OS : _____________
- Version Node : _____________
- Version Electron : _____________
- Résolution écran : _____________

**Testeur** : _____________
**Date** : _____________

**Remarques générales** :
```
(Espace pour notes libres)
```

---

**Résultat global** : ⬜ Tous les tests passent | ⬜ Quelques bugs mineurs | ⬜ Bugs majeurs

