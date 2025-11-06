# Resources BlackIA

Ce dossier contient les ressources nécessaires pour le build de l'application desktop.

## Génération de l'icône

Pour générer l'icône `.icns` à partir du fichier SVG :

```bash
# Depuis la racine du projet (sur macOS uniquement)
./scripts/generate-icons.sh
```

### Prérequis (macOS)

Le script installera automatiquement les dépendances nécessaires via Homebrew :
- `librsvg` (pour rsvg-convert)

### Alternative manuelle

Si vous avez votre propre icône :

1. Placez votre PNG 1024x1024 dans ce dossier
2. Utilisez l'outil `iconutil` de macOS pour créer le .icns :

```bash
# Créer un iconset
mkdir icon.iconset

# Générer les différentes tailles (utilisez un outil comme sips)
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png

# Créer le .icns
iconutil -c icns icon.iconset

# Nettoyer
rm -rf icon.iconset
```

## Note

Si l'icône n'est pas générée, electron-builder utilisera une icône par défaut pour le build de test.
