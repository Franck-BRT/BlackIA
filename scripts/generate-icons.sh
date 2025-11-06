#!/bin/bash

# Script de génération des icônes pour BlackIA
# Convertit icon.svg en icon.icns pour macOS

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RESOURCES_DIR="$PROJECT_ROOT/apps/desktop/resources"
SVG_FILE="$RESOURCES_DIR/icon.svg"
ICNS_FILE="$RESOURCES_DIR/icon.icns"

echo "🎨 Génération des icônes pour BlackIA..."

# Vérifier que le fichier SVG existe
if [ ! -f "$SVG_FILE" ]; then
    echo "❌ Erreur : Le fichier icon.svg n'existe pas dans $RESOURCES_DIR"
    exit 1
fi

# Vérifier si on est sur macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "⚠️  Ce script doit être exécuté sur macOS pour générer les icônes .icns"
    exit 1
fi

# Créer un dossier temporaire pour les icônes
TMP_ICONSET="$RESOURCES_DIR/icon.iconset"
rm -rf "$TMP_ICONSET"
mkdir -p "$TMP_ICONSET"

echo "📐 Conversion SVG → PNG (différentes tailles)..."

# Vérifier si rsvg-convert est installé (via Homebrew)
if ! command -v rsvg-convert &> /dev/null; then
    echo "⚠️  rsvg-convert n'est pas installé. Installation via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install librsvg
    else
        echo "❌ Homebrew n'est pas installé. Installez-le depuis https://brew.sh"
        exit 1
    fi
fi

# Générer toutes les tailles requises pour un .icns
# Format : icon_SIZExSIZE[@2x].png
declare -a SIZES=(
    "16:icon_16x16.png"
    "32:icon_16x16@2x.png"
    "32:icon_32x32.png"
    "64:icon_32x32@2x.png"
    "128:icon_128x128.png"
    "256:icon_128x128@2x.png"
    "256:icon_256x256.png"
    "512:icon_256x256@2x.png"
    "512:icon_512x512.png"
    "1024:icon_512x512@2x.png"
)

for size_info in "${SIZES[@]}"; do
    IFS=':' read -r size filename <<< "$size_info"
    echo "  → Génération $filename (${size}x${size})"
    rsvg-convert -w "$size" -h "$size" "$SVG_FILE" -o "$TMP_ICONSET/$filename"
done

echo "🔨 Création du fichier .icns..."
iconutil -c icns "$TMP_ICONSET" -o "$ICNS_FILE"

# Nettoyage
rm -rf "$TMP_ICONSET"

echo "✅ Icône générée avec succès : $ICNS_FILE"
echo ""
echo "📦 L'icône est prête pour le build DMG !"
