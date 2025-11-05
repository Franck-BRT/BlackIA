# 🧪 Guide de Test - Module Chat

**Date**: 2025-11-05
**Module**: Chat avec intégration Ollama
**Version**: 0.1.0

---

## 📋 Prérequis

Avant de tester le module Chat, assurez-vous que :

1. ✅ **Ollama est installé et démarré**
   ```bash
   # Installer Ollama (si ce n'est pas déjà fait)
   # Mac: https://ollama.ai/download

   # Vérifier qu'Ollama est démarré
   curl http://localhost:11434/api/version
   ```

2. ✅ **Au moins un modèle est téléchargé**
   ```bash
   # Télécharger un modèle rapide pour les tests
   ollama pull llama3.2:1b

   # Ou un modèle plus performant
   ollama pull llama3.2:3b
   ollama pull mistral

   # Lister les modèles disponibles
   ollama list
   ```

3. ✅ **L'application BlackIA est lancée**
   ```bash
   cd /path/to/BlackIA
   pnpm desktop:dev
   ```

---

## 🎯 Tests à Effectuer

### Test 1: Vérification de la Connexion Ollama

**Objectif**: Vérifier que l'application détecte correctement Ollama

**Étapes**:
1. Lancer l'application
2. Cliquer sur "Chat" dans la sidebar
3. Observer le sélecteur de modèle en haut à gauche

**Résultat attendu**:
- ✅ Une liste de modèles apparaît dans le sélecteur
- ✅ Un point vert animé indique que la connexion est active
- ✅ Les modèles affichent leur nom et leur taille (ex: "llama3.2:1b • 1.3 GB")

**Résultat en cas d'erreur**:
- ❌ Message: "Ollama n'est pas accessible"
- Solution: Vérifier qu'Ollama tourne sur http://localhost:11434

---

### Test 2: Sélection de Modèle

**Objectif**: Vérifier la sélection et le changement de modèle

**Étapes**:
1. Cliquer sur le sélecteur de modèle
2. Observer le dropdown qui s'affiche
3. Cliquer sur un modèle différent
4. Vérifier que le modèle sélectionné est affiché avec une coche verte

**Résultat attendu**:
- ✅ Le dropdown s'ouvre avec effet glassmorphism
- ✅ Chaque modèle affiche: nom, taille, nombre de paramètres
- ✅ Le modèle sélectionné a une coche verte
- ✅ Le dropdown se ferme après sélection

---

### Test 3: Envoi d'un Message Simple

**Objectif**: Tester l'envoi d'un message et la réception d'une réponse

**Étapes**:
1. Sélectionner un modèle
2. Taper "Bonjour, qui es-tu ?" dans l'input
3. Appuyer sur Entrée ou cliquer sur le bouton Envoyer
4. Observer la réponse

**Résultat attendu**:
- ✅ Le message de l'utilisateur apparaît à droite avec avatar bleu
- ✅ Un message "assistant" apparaît à gauche avec avatar violet
- ✅ Le texte s'affiche progressivement (streaming)
- ✅ Un curseur clignotant indique que le texte est en cours de génération
- ✅ La page scroll automatiquement vers le bas

**Timing**:
- Avec llama3.2:1b: ~1-2 secondes
- Avec llama3.2:3b: ~3-5 secondes
- Avec mistral: ~5-10 secondes

---

### Test 4: Streaming en Temps Réel

**Objectif**: Vérifier que le streaming fonctionne correctement

**Étapes**:
1. Envoyer une question qui nécessite une réponse longue
   ```
   "Explique-moi en détail le fonctionnement d'Electron et React"
   ```
2. Observer l'affichage du texte

**Résultat attendu**:
- ✅ Le texte apparaît mot par mot (ou par groupes de mots)
- ✅ Le curseur bleu clignote à la fin du texte
- ✅ L'auto-scroll suit le texte en temps réel
- ✅ Pas de freeze de l'interface pendant la génération

---

### Test 5: Conversation Multi-tours

**Objectif**: Tester le maintien du contexte de conversation

**Étapes**:
1. Envoyer: "Mon nom est Franck"
2. Attendre la réponse
3. Envoyer: "Quel est mon nom ?"
4. Vérifier que l'IA se souvient

**Résultat attendu**:
- ✅ L'IA répond correctement au deuxième message
- ✅ Le contexte est préservé entre les messages
- ✅ L'historique complet est visible dans l'interface

---

### Test 6: Messages Multilignes

**Objectif**: Tester l'input multiligne avec Shift+Enter

**Étapes**:
1. Dans l'input, taper:
   ```
   Ligne 1
   [Shift+Enter]
   Ligne 2
   [Shift+Enter]
   Ligne 3
   ```
2. Appuyer sur Entrée (sans Shift)
3. Vérifier l'affichage du message

**Résultat attendu**:
- ✅ Shift+Enter ajoute une nouvelle ligne dans l'input
- ✅ L'input s'agrandit automatiquement (max 4 lignes)
- ✅ Le message affiché conserve les retours à la ligne
- ✅ Entrée seule envoie le message

---

### Test 7: Interruption de Génération

**Objectif**: Tester l'arrêt d'une génération en cours

**Étapes**:
1. Envoyer une question longue: "Raconte-moi une histoire de 500 mots"
2. Pendant la génération, cliquer sur le bouton carré rouge (Stop)
3. Observer le comportement

**Résultat attendu**:
- ✅ La génération s'arrête immédiatement
- ✅ Le texte généré jusqu'à l'arrêt est conservé avec mention "[interrompu]"
- ✅ L'input redevient actif
- ✅ On peut envoyer un nouveau message

---

### Test 8: Effacement de Conversation

**Objectif**: Tester la suppression de l'historique

**Étapes**:
1. Créer une conversation avec 3-4 messages
2. Cliquer sur l'icône de corbeille en haut à droite
3. Confirmer dans le dialog
4. Observer l'interface

**Résultat attendu**:
- ✅ Un dialog de confirmation apparaît
- ✅ Après confirmation, tous les messages disparaissent
- ✅ L'écran d'accueil "Commencez une conversation" réapparaît
- ✅ Le contexte est réinitialisé

---

### Test 9: Gestion des Erreurs

**Objectif**: Tester la gestion des erreurs réseau

**Étapes**:
1. Arrêter Ollama: `pkill ollama` (ou fermer l'app)
2. Dans BlackIA, tenter d'envoyer un message
3. Observer le comportement
4. Redémarrer Ollama
5. Cliquer sur l'icône de rafraîchissement des modèles

**Résultat attendu**:
- ✅ Un message système rouge apparaît avec l'erreur
- ✅ L'interface ne crash pas
- ✅ Après redémarrage d'Ollama, le rafraîchissement fonctionne
- ✅ Les modèles réapparaissent

---

### Test 10: Interface Vide (État Initial)

**Objectif**: Vérifier l'interface avant le premier message

**Étapes**:
1. Accéder au Chat avec l'historique vide
2. Observer l'interface

**Résultat attendu**:
- ✅ Emoji 💬 centré
- ✅ Titre "Commencez une conversation"
- ✅ Texte d'instruction
- ✅ Si aucun modèle sélectionné: avertissement jaune
- ✅ Input disabled avec message "Sélectionnez d'abord un modèle..."

---

## 🎨 Tests Visuels

### Thème Glassmorphism

**Vérifications**:
- ✅ Messages avec effet de verre (backdrop-blur)
- ✅ Header semi-transparent
- ✅ Input avec effet glassmorphism
- ✅ Dropdown du sélecteur de modèle avec blur
- ✅ Hover effects sur les boutons
- ✅ Transitions fluides

### Responsive

**Vérifications**:
- ✅ Messages s'adaptent à la largeur (max 4xl)
- ✅ Scroll fonctionne correctement
- ✅ Input prend toute la largeur disponible
- ✅ Header reste fixe en haut

---

## ⚡ Tests de Performance

### Test 1: Charge Mémoire

**Étapes**:
1. Envoyer 20-30 messages
2. Observer l'utilisation mémoire dans Activity Monitor

**Résultat attendu**:
- ✅ Pas de fuite mémoire évidente
- ✅ L'app reste fluide

### Test 2: Streaming Longue Durée

**Étapes**:
1. Demander une réponse de 2000+ mots
2. Observer la fluidité pendant tout le streaming

**Résultat attendu**:
- ✅ Pas de freeze
- ✅ Scroll reste smooth
- ✅ Texte s'affiche progressivement sans lag

---

## 🐛 Bugs Connus

### À Surveiller

1. **Streaming incomplet**: Si Ollama crash pendant la génération
   - Workaround: Message système apparaît avec l'erreur

2. **Double streaming**: Si on envoie un message pendant qu'un autre est en cours
   - État: Non testé, pourrait causer des problèmes
   - À implémenter: Désactiver l'input pendant la génération

3. **Nettoyage des listeners**: Vérifier qu'il n'y a pas de listeners qui s'accumulent
   - État: Cleanup implémenté dans useEffect

---

## 📊 Résultats Attendus

### Checklist Complète

Après tous les tests, vous devriez avoir:

- ✅ Connexion Ollama fonctionnelle
- ✅ Sélection de modèle opérationnelle
- ✅ Envoi de messages réussi
- ✅ Streaming en temps réel confirmé
- ✅ Contexte de conversation maintenu
- ✅ Multilignes supporté
- ✅ Interruption de génération testée
- ✅ Effacement de conversation vérifié
- ✅ Gestion d'erreurs robuste
- ✅ Interface vide correcte
- ✅ Thème glassmorphism validé
- ✅ Performance acceptable

---

## 🚀 Prochaines Étapes (Améliorations)

Après validation des tests de base:

1. **Persistance**: Sauvegarder les conversations dans SQLite
2. **Export**: Exporter les conversations en markdown
3. **Paramètres**: Panel de configuration (température, max tokens, etc.)
4. **Prompts**: Intégrer la bibliothèque de prompts
5. **Personas**: Support des personas dans le chat
6. **Images**: Support des images (multimodal)
7. **Historique**: Liste des conversations passées
8. **Recherche**: Rechercher dans les messages

---

## 📞 Rapport de Bugs

Si vous rencontrez un problème:

1. Noter le comportement observé
2. Copier les logs de la console DevTools
3. Vérifier l'état d'Ollama: `curl http://localhost:11434/api/version`
4. Partager:
   - Le modèle utilisé
   - Le message qui a causé l'erreur
   - Les étapes pour reproduire

---

**Bon test ! 🎉**

Si tous les tests passent, le module Chat est prêt pour utilisation. Passez ensuite au développement des modules Workflows et Prompts.
