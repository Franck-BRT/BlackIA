#!/bin/bash

# Script de build DMG pour BlackIA
# Génère un fichier .dmg prêt à être distribué sur macOS

set -e  # Arrêter en cas d'erreur

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DESKTOP_DIR="$PROJECT_ROOT/apps/desktop"
RELEASE_DIR="$DESKTOP_DIR/release"

# Options par défaut
CLEAN=false
SKIP_DEPS=false
SIGN=false
ARCH="arm64"

# Fonction d'aide
show_help() {
    cat << EOF
${BLUE}BlackIA - Script de build DMG${NC}

Usage: ./scripts/build-dmg.sh [OPTIONS]

Options:
    --clean         Nettoie les builds précédents avant de builder
    --skip-deps     Skip la vérification/installation des dépendances
    --sign          Active la signature du DMG (nécessite un certificat Apple)
    --arch ARCH     Architecture cible (arm64, x64, ou universal) [défaut: arm64]
    --help          Affiche cette aide

Exemples:
    ./scripts/build-dmg.sh
    ./scripts/build-dmg.sh --clean
    ./scripts/build-dmg.sh --arch universal --sign

EOF
}

# Parser les arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN=true
            shift
            ;;
        --skip-deps)
            SKIP_DEPS=true
            shift
            ;;
        --sign)
            SIGN=true
            shift
            ;;
        --arch)
            ARCH="$2"
            shift 2
            ;;
        --help|-h)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Option inconnue: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Fonction de log
log() {
    echo -e "${BLUE}▶${NC} $1"
}

success() {
    echo -e "${GREEN}✅${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️${NC}  $1"
}

error() {
    echo -e "${RED}❌${NC} $1"
    exit 1
}

# Vérifier qu'on est sur macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    error "Ce script doit être exécuté sur macOS"
fi

# Header
echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║${NC}  BlackIA - Build DMG                 ${BLUE}║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo ""

# Vérifier les prérequis
log "Vérification des prérequis..."

if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé"
fi

if ! command -v pnpm &> /dev/null; then
    error "pnpm n'est pas installé. Installez-le avec: npm install -g pnpm"
fi

success "Node.js $(node --version) et pnpm $(pnpm --version) détectés"

# Nettoyer si demandé (AVANT de vérifier les dépendances)
if [ "$CLEAN" = true ]; then
    log "Nettoyage des builds précédents..."

    # Supprimer avec permissions forcées et ignorer les erreurs
    if [ -d "$DESKTOP_DIR/dist" ]; then
        chmod -R 755 "$DESKTOP_DIR/dist" 2>/dev/null || true
        rm -rf "$DESKTOP_DIR/dist" 2>/dev/null || true
    fi

    if [ -d "$RELEASE_DIR" ]; then
        chmod -R 755 "$RELEASE_DIR" 2>/dev/null || true
        rm -rf "$RELEASE_DIR" 2>/dev/null || true
    fi

    # Nettoyer aussi les node_modules pour une réinstallation propre
    log "Nettoyage des node_modules pour réinstallation propre..."
    rm -rf "$PROJECT_ROOT/node_modules"
    rm -rf "$PROJECT_ROOT/packages/*/node_modules"
    rm -rf "$PROJECT_ROOT/apps/*/node_modules"

    # Nettoyer le venv Python pour forcer la réinstallation des dépendances
    log "Nettoyage du venv Python pour réinstallation propre..."
    if [ -d "$DESKTOP_DIR/src/python/venv" ]; then
        rm -rf "$DESKTOP_DIR/src/python/venv"
        success "Venv Python supprimé"
    fi

    success "Nettoyage terminé"
fi

# Vérifier/installer les dépendances
if [ "$SKIP_DEPS" = false ]; then
    log "Vérification des dépendances npm..."
    cd "$PROJECT_ROOT"

    if [ ! -d "node_modules" ]; then
        log "Installation des dépendances..."
        pnpm install
    else
        log "Mise à jour des dépendances si nécessaire..."
        pnpm install --frozen-lockfile
    fi

    success "Dépendances prêtes"
fi

# Vérifier si l'icône existe, sinon proposer de la générer
ICON_FILE="$DESKTOP_DIR/resources/icon.icns"
if [ ! -f "$ICON_FILE" ]; then
    warning "L'icône .icns n'existe pas encore"

    if [ -f "$DESKTOP_DIR/resources/icon.svg" ]; then
        echo -e "${YELLOW}Voulez-vous générer l'icône maintenant ? (o/N)${NC}"
        read -r response
        if [[ "$response" =~ ^[Oo]$ ]]; then
            log "Génération de l'icône..."
            "$SCRIPT_DIR/generate-icons.sh"
            success "Icône générée"
        else
            warning "L'icône par défaut d'Electron sera utilisée"
        fi
    else
        warning "Fichier icon.svg introuvable. L'icône par défaut sera utilisée"
    fi
fi

# Configuration de l'environnement pour le build
log "Configuration de l'environnement de build..."

# Désactiver la découverte automatique de certificats si pas de signature
if [ "$SIGN" = false ]; then
    export CSC_IDENTITY_AUTO_DISCOVERY=false
    log "Mode build sans signature (pour test)"
else
    log "Mode build avec signature"
fi

# Définir l'architecture
export BUILD_ARCH="$ARCH"

# Build des packages workspace d'abord
log "Build des packages workspace (ollama, shared, ui)..."
cd "$PROJECT_ROOT"

# Compiler le package ollama si il a un script build
if [ -d "packages/ollama" ]; then
    log "Compilation de @blackia/ollama..."
    pnpm --filter @blackia/ollama build 2>/dev/null || log "Ollama: pas de script build ou déjà compilé"
fi

# Compiler le package shared si il a un script build
if [ -d "packages/shared" ]; then
    log "Compilation de @blackia/shared..."
    pnpm --filter @blackia/shared build 2>/dev/null || log "Shared: pas de script build (utilise TS direct)"
fi

# Compiler le package ui si il a un script build
if [ -d "packages/ui" ]; then
    log "Compilation de @blackia/ui..."
    pnpm --filter @blackia/ui build 2>/dev/null || log "UI: pas de script build (utilise TS direct)"
fi

success "Packages workspace prêts"

# Setup Python virtual environment avant le build
log "Setup de l'environnement Python virtuel..."
cd "$DESKTOP_DIR"
bash scripts/setup-python-venv.sh
success "Python venv prêt"

# Build du projet desktop
log "Compilation du code TypeScript (main process)..."
cd "$DESKTOP_DIR"
pnpm exec tsc -p tsconfig.main.json
success "Main process compilé"

log "Copie des fichiers Python MLX..."
node scripts/copy-python-files.js
success "Fichiers Python copiés"

log "Build du frontend (Vite + React)..."
pnpm exec vite build
success "Frontend buildé"

# Build du DMG avec electron-builder
log "Création du DMG avec electron-builder..."
log "Architecture cible: $ARCH"

if [ "$ARCH" = "universal" ]; then
    pnpm exec electron-builder --mac --universal
elif [ "$ARCH" = "x64" ]; then
    pnpm exec electron-builder --mac --x64
else
    pnpm exec electron-builder --mac --arm64
fi

success "Build electron-builder terminé"

# Signature ad-hoc pour macOS Sequoia
if [ "$SIGN" = false ]; then
    log "Application de la signature ad-hoc pour macOS Sequoia..."
    APP_PATH="$RELEASE_DIR/mac-arm64/BlackIA.app"
    if [ -d "$APP_PATH" ]; then
        codesign --force --deep --sign - "$APP_PATH" 2>&1 | grep -v "replacing existing signature" || true
        success "Signature ad-hoc appliquée"
    else
        warning "Application non trouvée à $APP_PATH"
    fi
fi

# Trouver le DMG créé
echo ""
log "Recherche du DMG créé..."

DMG_FILES=("$RELEASE_DIR"/*.dmg)
if [ -e "${DMG_FILES[0]}" ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}  Build DMG réussi !                   ${GREEN}║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
    echo ""

    for dmg in "${DMG_FILES[@]}"; do
        if [ -f "$dmg" ]; then
            SIZE=$(du -h "$dmg" | cut -f1)
            echo -e "  ${GREEN}📦${NC} Fichier: ${BLUE}$(basename "$dmg")${NC}"
            echo -e "  ${GREEN}📏${NC} Taille: ${YELLOW}$SIZE${NC}"
            echo -e "  ${GREEN}📍${NC} Path:   ${BLUE}$dmg${NC}"
            echo ""
        fi
    done

    echo -e "${GREEN}Pour installer:${NC}"
    echo -e "  1. Double-cliquez sur le fichier .dmg"
    echo -e "  2. Glissez BlackIA dans Applications"
    echo -e "  3. Lancez depuis /Applications/BlackIA.app"
    echo ""

    if [ "$SIGN" = false ]; then
        echo -e "${YELLOW}⚠️  Note: Le DMG n'est pas signé.${NC}"
        echo -e "${YELLOW}   Vous devrez autoriser l'application dans:${NC}"
        echo -e "${YELLOW}   Préférences Système > Confidentialité et sécurité${NC}"
        echo ""
    fi
else
    error "Aucun fichier DMG trouvé dans $RELEASE_DIR"
fi

# Statistiques finales
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
success "Build terminé avec succès !"
echo ""
