# TODO - Fonctionnalités à implémenter

## Paramètres de l'application

### Gestion des dossiers
- [ ] Interface de gestion des dossiers dans les paramètres
  - [ ] Liste de tous les dossiers existants
  - [ ] Possibilité de renommer un dossier
  - [ ] Possibilité de changer la couleur d'un dossier
  - [ ] **Possibilité de supprimer un dossier** (les conversations restent)
  - [ ] Statistiques par dossier (nombre de conversations)

### Gestion des tags
- [ ] Interface de gestion des tags dans les paramètres
  - [ ] Liste de tous les tags existants
  - [ ] Possibilité de modifier un tag (nom, couleur, icône)
  - [ ] **Possibilité de supprimer un tag** (retiré de toutes les conversations)
  - [ ] Statistiques par tag (nombre de conversations)
  - [ ] Fusion de tags (fusionner plusieurs tags en un seul)

## Autres fonctionnalités optionnelles

### Système de favoris
- [x] Marquer des conversations comme favorites
- [x] Section "Favoris" dans la sidebar
- [x] Filtre pour afficher uniquement les favoris

### Support d'images
- [ ] Envoi d'images dans les messages
- [ ] Prévisualisation des images
- [ ] Support des modèles vision (llama-vision, etc.)

### Coloration syntaxique avancée
- [x] Plus de langages supportés (15+ langages)
- [x] Thèmes de couleurs personnalisables (5 thèmes)
- [x] Numérotation des lignes optionnelle

### Raccourcis clavier globaux
- [x] Configuration des raccourcis personnalisés
- [x] Raccourcis pour actions fréquentes
- [x] Aide contextuelle des raccourcis (Ctrl+?)

### Fonctionnalités avancées
- [x] Statistiques d'utilisation
  - [x] Nombre de messages par jour/semaine/mois
  - [x] Modèles les plus utilisés
  - [x] Moyennes et ratios (messages/conv, conv/jour)
  - [x] Activité des 7 derniers jours
  - [x] Interface visuelle avec graphiques
- [x] Export PDF des conversations
- [x] Import/Export de conversations (avec backup complet)
  - [x] Export backup complet (conversations + dossiers + tags)
  - [x] Import conversation unique
  - [x] Import backup avec mode fusion/remplacement
- [ ] Synchronisation cloud (optionnel)
- [ ] Mode sombre/clair/auto
- [ ] Personnalisation des couleurs de l'interface

## Notes

- Les fonctionnalités en **gras** sont prioritaires
- Maintenir la cohérence UX (modals plein écran pour les paramètres)
- Toujours confirmer avant les actions destructives
