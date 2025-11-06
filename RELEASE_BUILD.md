# Guide de Build et Distribution - BlackIA

Ce guide explique comment créer un fichier DMG pour distribuer BlackIA sur macOS.

## 🎯 Quick Start

```bash
# 1. Générer l'icône (première fois, macOS uniquement)
pnpm generate:icons

# 2. Builder le DMG
pnpm build:dmg

# 3. Le DMG est créé dans apps/desktop/release/
```

## 📋 Prérequis

- macOS (pour le build final)
- Node.js 20+
- pnpm 8+
- Homebrew (pour la génération d'icônes)

## 🔧 Configuration

### Structure des fichiers

```
apps/desktop/
├── resources/
│   ├── icon.svg                    # Icône source (SVG)
│   ├── icon.icns                   # Icône compilée (généré)
│   ├── entitlements.mac.plist      # Permissions macOS
│   └── README.md                   # Documentation des ressources
├── electron-builder.yml            # Configuration du build
└── package.json                    # Scripts npm

scripts/
├── build-dmg.sh                    # Script principal de build DMG
├── generate-icons.sh               # Script de génération d'icônes
└── README.md                       # Documentation des scripts
```

### Fichiers créés

Tous les fichiers nécessaires ont été créés et configurés :

- ✅ `apps/desktop/resources/icon.svg` - Icône SVG BlackIA
- ✅ `apps/desktop/resources/entitlements.mac.plist` - Permissions macOS
- ✅ `scripts/build-dmg.sh` - Script de build DMG réutilisable
- ✅ `scripts/generate-icons.sh` - Générateur d'icônes
- ✅ Configuration mise à jour dans `electron-builder.yml`
- ✅ Scripts npm ajoutés pour faciliter l'utilisation

## 🚀 Processus de Build

### 1. Génération de l'icône (première fois)

```bash
# Sur macOS uniquement
pnpm generate:icons
```

Cette commande :
- Convertit `icon.svg` en différentes tailles PNG
- Crée le fichier `icon.icns` pour macOS
- Installe automatiquement `librsvg` si nécessaire (via Homebrew)

**Note :** Si vous n'avez pas macOS, vous pouvez skip cette étape. Electron utilisera une icône par défaut.

### 2. Build du DMG

```bash
# Build standard (ARM64, non signé)
pnpm build:dmg

# Build avec nettoyage
pnpm build:dmg:clean

# Build avec signature (nécessite certificat Apple)
pnpm build:dmg:sign
```

Le script `build-dmg.sh` effectue automatiquement :
1. ✅ Vérification des prérequis (Node, pnpm)
2. ✅ Installation/mise à jour des dépendances
3. ✅ Compilation TypeScript (main process)
4. ✅ Build Vite (renderer process)
5. ✅ Création du DMG avec electron-builder
6. ✅ Affichage du chemin du DMG créé

### 3. Options avancées

```bash
# Build pour Intel
./scripts/build-dmg.sh --arch x64

# Build Universal (ARM + Intel)
./scripts/build-dmg.sh --arch universal

# Build propre avec architecture spécifique
./scripts/build-dmg.sh --clean --arch universal

# Voir toutes les options
./scripts/build-dmg.sh --help
```

## 📦 Résultat

Après le build, vous trouverez dans `apps/desktop/release/` :

```
release/
├── BlackIA-0.1.0-arm64.dmg        # DMG pour Apple Silicon
├── BlackIA-0.1.0-arm64-mac.zip    # Version ZIP
└── mac-arm64/                      # Dossier de build (non packagé)
```

### Tailles approximatives

- DMG : ~150-200 MB (varie selon le contenu)
- Application installée : ~300-400 MB

## 🔐 Signature et Distribution

### Build de test (local, non signé)

Par défaut, le script crée un DMG **non signé** pour les tests locaux :
- ✅ Rapide à générer
- ✅ Pas besoin de certificat Apple
- ⚠️ Nécessite d'autoriser manuellement dans les Préférences Système

### Build de production (signé et notarisé)

Pour une distribution publique, vous devrez :

1. **Obtenir un certificat Apple Developer**
   - Inscription : $99/an sur [developer.apple.com](https://developer.apple.com/programs/)
   - Télécharger le certificat de signature

2. **Configurer les variables d'environnement**
   ```bash
   export CSC_LINK=/path/to/certificate.p12
   export CSC_KEY_PASSWORD=your-password
   export APPLE_ID=your-apple-id@email.com
   export APPLE_ID_PASSWORD=app-specific-password
   ```

3. **Builder avec signature**
   ```bash
   pnpm build:dmg:sign
   ```

4. **Notarisation** (optionnel)
   - Décommenter `afterSign: scripts/notarize.js` dans `electron-builder.yml`
   - Créer un script de notarisation avec vos credentials

## 🧪 Installation et Test

### Installation

1. Double-cliquer sur le fichier `.dmg`
2. Glisser `BlackIA` dans le dossier `Applications`
3. Fermer la fenêtre DMG
4. Éjecter le volume DMG

### Premier lancement (DMG non signé)

macOS bloquera l'application car elle n'est pas signée :

1. Aller dans `Préférences Système` (ou `Réglages Système` sur macOS 13+)
2. `Confidentialité et sécurité`
3. Faire défiler jusqu'à la section "Sécurité"
4. Cliquer sur `Ouvrir quand même` à côté de BlackIA
5. Confirmer l'ouverture

**Note :** Cette étape n'est nécessaire que pour les DMG non signés. Les DMG signés et notarisés s'ouvrent directement.

## 🛠️ Personnalisation

### Changer l'icône

1. Remplacer `apps/desktop/resources/icon.svg` par votre SVG
2. Régénérer l'icône :
   ```bash
   pnpm generate:icons
   ```
3. Rebuilder le DMG :
   ```bash
   pnpm build:dmg:clean
   ```

### Modifier la configuration DMG

Éditez `apps/desktop/electron-builder.yml` :

```yaml
dmg:
  sign: false                    # true pour signer le DMG
  title: "${productName} ${version}"
  background: null               # Chemin vers une image de fond
  window:
    width: 540
    height: 380
  contents:
    - x: 130
      y: 150
      type: file
    - x: 410
      y: 150
      type: link
      path: /Applications
```

### Changer la version

Modifier `apps/desktop/package.json` :
```json
{
  "version": "0.2.0"
}
```

Le DMG généré sera : `BlackIA-0.2.0-arm64.dmg`

## 📚 Scripts disponibles

### Depuis la racine (`/`)

```bash
pnpm build:dmg              # Build DMG standard
pnpm build:dmg:clean        # Build avec nettoyage
pnpm build:dmg:sign         # Build signé
pnpm generate:icons         # Générer icônes
```

### Depuis `apps/desktop/`

```bash
pnpm build:dmg              # Build DMG (ARM64 + x64)
pnpm build:dmg:arm64        # Build ARM64 uniquement
pnpm build:dmg:x64          # Build Intel uniquement
pnpm build:dmg:universal    # Build Universal
```

### Script shell directement

```bash
./scripts/build-dmg.sh [OPTIONS]

Options:
  --clean       Nettoyer avant build
  --sign        Signer le DMG
  --arch ARCH   arm64 | x64 | universal
  --skip-deps   Skip l'installation des dépendances
  --help        Afficher l'aide
```

## 🐛 Troubleshooting

### Erreur : "icon.icns not found"

```bash
# Générer l'icône (macOS uniquement)
pnpm generate:icons

# Ou builder sans icône (utilisera l'icône par défaut)
pnpm build:dmg
```

### Erreur : "code signing identity not found"

C'est normal pour les builds de test. Le script utilise `CSC_IDENTITY_AUTO_DISCOVERY=false` automatiquement.

Si vous voulez vraiment signer :
```bash
pnpm build:dmg:sign
```

### Le build échoue

```bash
# Nettoyage complet
rm -rf apps/desktop/dist apps/desktop/release
rm -rf node_modules
pnpm install

# Rebuild
pnpm build:dmg:clean
```

### L'application ne se lance pas

1. Vérifier les logs Console (app Console.app sur macOS)
2. Vérifier les permissions dans `Confidentialité et sécurité`
3. Essayer de lancer depuis le Terminal :
   ```bash
   /Applications/BlackIA.app/Contents/MacOS/BlackIA
   ```

### "damaged and can't be opened"

Cela arrive avec les DMG non signés téléchargés depuis Internet. Si c'est votre propre build :

```bash
# Supprimer la quarantaine
xattr -cr /Applications/BlackIA.app
```

## 📈 Checklist avant release

- [ ] Version mise à jour dans `package.json`
- [ ] CHANGELOG mis à jour
- [ ] Tests effectués
- [ ] Icône générée (`pnpm generate:icons`)
- [ ] Build clean réussi (`pnpm build:dmg:clean`)
- [ ] DMG testé sur macOS cible
- [ ] Application signée (production)
- [ ] Application notarisée (production)
- [ ] Release notes préparées
- [ ] Tag git créé

## 🔗 Ressources

- [electron-builder Documentation](https://www.electron.build/)
- [Apple Developer Program](https://developer.apple.com/programs/)
- [Code Signing Guide](https://developer.apple.com/support/code-signing/)
- [Notarization Guide](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution)

---

**Besoin d'aide ?** Consultez le fichier `scripts/README.md` pour plus de détails sur les scripts individuels.
