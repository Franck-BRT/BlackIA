# Scripts BlackIA

Ce dossier contient les scripts utilitaires pour le développement et la distribution de BlackIA.

## 📦 Build DMG

### Usage rapide

```bash
# Depuis la racine du projet
pnpm build:dmg

# Ou directement
./scripts/build-dmg.sh
```

### Options disponibles

```bash
# Build avec nettoyage préalable
./scripts/build-dmg.sh --clean
pnpm build:dmg:clean

# Build avec signature (nécessite un certificat Apple Developer)
./scripts/build-dmg.sh --sign
pnpm build:dmg:sign

# Build pour une architecture spécifique
./scripts/build-dmg.sh --arch arm64        # Apple Silicon (défaut)
./scripts/build-dmg.sh --arch x64          # Intel
./scripts/build-dmg.sh --arch universal    # Universal (ARM + Intel)

# Combiner plusieurs options
./scripts/build-dmg.sh --clean --arch universal

# Afficher l'aide
./scripts/build-dmg.sh --help
```

### Sortie

Le script génère un fichier DMG dans `apps/desktop/release/` :
- `BlackIA-0.1.0-arm64.dmg` (pour Apple Silicon)
- `BlackIA-0.1.0-x64.dmg` (pour Intel)
- `BlackIA-0.1.0-universal.dmg` (pour les deux)

## 🎨 Génération d'icônes

### Prérequis (macOS uniquement)

Le script installera automatiquement `librsvg` via Homebrew si nécessaire.

### Usage

```bash
# Depuis la racine du projet
pnpm generate:icons

# Ou directement
./scripts/generate-icons.sh
```

Ce script :
1. Prend le fichier SVG dans `apps/desktop/resources/icon.svg`
2. Génère toutes les tailles PNG requises pour un `.icns`
3. Crée le fichier `apps/desktop/resources/icon.icns`

### Personnalisation

Pour utiliser votre propre icône :
1. Remplacez `apps/desktop/resources/icon.svg` par votre SVG (1024x1024)
2. Exécutez `./scripts/generate-icons.sh`
3. Le fichier `.icns` sera généré automatiquement

## 🔄 Workflow complet

Pour créer une distribution complète de zéro :

```bash
# 1. Générer les icônes (première fois ou après modification)
pnpm generate:icons

# 2. Build le DMG
pnpm build:dmg:clean

# 3. Le DMG est prêt dans apps/desktop/release/
```

## 📋 Scripts disponibles (package.json)

### Depuis la racine du projet

```bash
pnpm build:dmg              # Build DMG basique (ARM64, non signé)
pnpm build:dmg:clean        # Build DMG avec nettoyage
pnpm build:dmg:sign         # Build DMG avec signature
pnpm generate:icons         # Générer l'icône .icns
```

### Depuis apps/desktop/

```bash
pnpm build:dmg              # Build DMG ARM64 + x64
pnpm build:dmg:arm64        # Build DMG ARM64 uniquement
pnpm build:dmg:x64          # Build DMG Intel uniquement
pnpm build:dmg:universal    # Build DMG Universal
```

## 🚀 Première utilisation

1. **Générer l'icône** (macOS uniquement)
   ```bash
   pnpm generate:icons
   ```

2. **Builder le DMG**
   ```bash
   pnpm build:dmg
   ```

3. **Installer l'app**
   - Double-cliquer sur le DMG dans `apps/desktop/release/`
   - Glisser BlackIA dans Applications
   - Lancer depuis `/Applications/BlackIA.app`

4. **Autoriser l'application** (DMG non signé)
   - Aller dans `Préférences Système > Confidentialité et sécurité`
   - Cliquer sur "Ouvrir quand même" pour BlackIA

## 🔐 Signature et Notarisation (Production)

Pour distribuer publiquement l'application :

1. **Obtenir un certificat Apple Developer**
   - Inscription au [Apple Developer Program](https://developer.apple.com/programs/)
   - Télécharger le certificat de signature

2. **Configurer les credentials**
   ```bash
   export CSC_LINK=/path/to/certificate.p12
   export CSC_KEY_PASSWORD=your-certificate-password
   ```

3. **Activer la signature**
   ```bash
   pnpm build:dmg:sign
   ```

4. **Notarisation** (optionnel mais recommandé)
   - Décommenter `afterSign: scripts/notarize.js` dans `electron-builder.yml`
   - Créer le script `scripts/notarize.js` avec vos credentials Apple

## 🛠️ Troubleshooting

### L'icône n'apparaît pas

```bash
# Re-générer l'icône
pnpm generate:icons

# Builder avec nettoyage
pnpm build:dmg:clean
```

### Erreur "code signing identity not found"

C'est normal pour les builds de test. Le script utilise automatiquement `CSC_IDENTITY_AUTO_DISCOVERY=false` pour bypasser la signature.

### Build échoue

```bash
# Nettoyer complètement et reconstruire
rm -rf apps/desktop/dist apps/desktop/release
pnpm install
pnpm build:dmg:clean
```

## 📚 Documentation

- [electron-builder](https://www.electron.build/) - Documentation officielle
- [Apple Code Signing](https://developer.apple.com/support/code-signing/) - Guide Apple
- [Notarization](https://developer.apple.com/documentation/security/notarizing_macos_software_before_distribution) - Guide de notarisation
