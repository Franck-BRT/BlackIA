#!/bin/bash

# Script de démarrage intelligent pour BlackIA
# Gère la compilation des packages et le lancement de l'application

set -e  # Arrêter en cas d'erreur

# Couleurs pour les logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les logs
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Fonction pour compiler un package
build_package() {
    local package_name=$1
    local package_path=$2

    log_info "Compilation de ${package_name}..."
    cd "$package_path"

    # Nettoyer les anciens fichiers
    if [ -d "dist" ]; then
        rm -rf dist
        log_info "  → Nettoyage de dist/"
    fi

    # Nettoyer le cache TypeScript
    if [ -f "tsconfig.tsbuildinfo" ]; then
        rm -f tsconfig.tsbuildinfo
        log_info "  → Nettoyage du cache TypeScript"
    fi

    # Compiler
    if npx tsc -p tsconfig.json; then
        log_success "  → ${package_name} compilé avec succès"
    else
        log_error "  → Échec de la compilation de ${package_name}"
        exit 1
    fi

    cd - > /dev/null
}

# Fonction pour afficher l'aide
show_help() {
    cat << EOF
${GREEN}BlackIA - Script de démarrage${NC}

Usage: pnpm start [OPTIONS]

${YELLOW}Options:${NC}
  (aucune)    Lance l'app en mode dev avec compilation des packages
  --fresh     Nettoie tout et recompile depuis zéro
  --no-build  Lance l'app sans recompiler (plus rapide)
  --build     Compile uniquement les packages sans lancer l'app
  --clean     Nettoie tous les fichiers de build
  --help      Affiche cette aide

${YELLOW}Exemples:${NC}
  pnpm start              # Mode normal (recommandé après git pull)
  pnpm start --fresh      # Après des changements de config
  pnpm start --no-build   # Pour un redémarrage rapide
  pnpm start --build      # Juste compiler les packages

${YELLOW}Workflow recommandé:${NC}
  1. Après un git pull    → pnpm start
  2. Redémarrage rapide   → pnpm start --no-build
  3. Problème de build    → pnpm start --fresh

EOF
}

# Parser les arguments
MODE="normal"
while [[ $# -gt 0 ]]; do
    case $1 in
        --fresh)
            MODE="fresh"
            shift
            ;;
        --no-build)
            MODE="no-build"
            shift
            ;;
        --build)
            MODE="build-only"
            shift
            ;;
        --clean)
            MODE="clean"
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log_error "Option inconnue: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
done

# Afficher le mode
echo ""
log_info "${GREEN}BlackIA${NC} - Mode: ${YELLOW}${MODE}${NC}"
echo ""

# Revenir à la racine du projet
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

# Exécuter selon le mode
case $MODE in
    clean)
        log_info "Nettoyage de tous les fichiers de build..."

        # Nettoyer le package Ollama
        if [ -d "packages/ollama/dist" ]; then
            rm -rf packages/ollama/dist
            log_success "  → packages/ollama/dist supprimé"
        fi
        if [ -f "packages/ollama/tsconfig.tsbuildinfo" ]; then
            rm -f packages/ollama/tsconfig.tsbuildinfo
            log_success "  → packages/ollama/tsconfig.tsbuildinfo supprimé"
        fi

        # Nettoyer l'app desktop
        if [ -d "apps/desktop/dist" ]; then
            rm -rf apps/desktop/dist
            log_success "  → apps/desktop/dist supprimé"
        fi
        if [ -f "apps/desktop/tsconfig.tsbuildinfo" ]; then
            rm -f apps/desktop/tsconfig.tsbuildinfo
            log_success "  → apps/desktop/tsconfig.tsbuildinfo supprimé"
        fi
        if [ -f "apps/desktop/tsconfig.main.tsbuildinfo" ]; then
            rm -f apps/desktop/tsconfig.main.tsbuildinfo
            log_success "  → apps/desktop/tsconfig.main.tsbuildinfo supprimé"
        fi

        log_success "Nettoyage terminé !"
        echo ""
        log_info "Pour recompiler et lancer: ${YELLOW}pnpm start${NC}"
        ;;

    fresh)
        log_info "Mode FRESH: Nettoyage complet et recompilation"
        echo ""

        # Nettoyer d'abord
        bash "$0" --clean
        echo ""

        # Puis compiler
        log_info "Compilation des packages..."
        echo ""
        build_package "@blackia/ollama" "$PROJECT_ROOT/packages/ollama"
        echo ""

        # Lancer l'app (le main process sera compilé automatiquement par dev:main en mode watch)
        log_success "Compilation des packages terminée !"
        log_info "Le main process sera compilé automatiquement par TypeScript en mode watch"
        echo ""
        pnpm --filter @blackia/desktop dev
        ;;

    build-only)
        log_info "Compilation des packages uniquement"
        echo ""
        build_package "@blackia/ollama" "$PROJECT_ROOT/packages/ollama"

        log_info "Compilation du main process de l'app desktop..."
        cd "$PROJECT_ROOT/apps/desktop"
        if [ -f "tsconfig.main.json" ]; then
            # Nettoyer le cache
            if [ -f "tsconfig.tsbuildinfo" ]; then
                rm -f tsconfig.tsbuildinfo
                log_info "  → Nettoyage du cache TypeScript"
            fi

            # Compiler le main process (avec --skipLibCheck pour éviter les erreurs de types)
            if npx tsc -p tsconfig.main.json --skipLibCheck 2>&1 | grep -q "error TS"; then
                log_warning "  → Erreurs de compilation détectées (fichiers existants utilisés)"
            else
                log_success "  → Main process compilé avec succès"
            fi
        fi
        cd "$PROJECT_ROOT"
        echo ""
        log_success "Compilation terminée !"
        ;;

    no-build)
        log_warning "Mode NO-BUILD: Lancement sans recompilation"
        log_info "Utilise ce mode uniquement si tu n'as pas modifié les packages"
        echo ""
        pnpm --filter @blackia/desktop dev
        ;;

    normal)
        log_info "Compilation des packages avant le lancement..."
        echo ""

        # Compiler le package Ollama
        build_package "@blackia/ollama" "$PROJECT_ROOT/packages/ollama"
        echo ""

        # Lancer l'application (le main process sera compilé automatiquement par dev:main en mode watch)
        log_success "Compilation des packages terminée !"
        log_info "Le main process sera compilé automatiquement par TypeScript en mode watch"
        echo ""
        pnpm --filter @blackia/desktop dev
        ;;
esac
