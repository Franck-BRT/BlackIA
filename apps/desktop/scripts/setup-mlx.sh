#!/bin/bash

# =============================================================================
# BlackIA - MLX Setup Script
# Installation automatique des dépendances Python pour MLX embeddings
# =============================================================================

set -e

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  BlackIA - MLX Setup                 ║"
echo "╔════════════════════════════════════════╗"
echo ""

# Couleurs pour les messages
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher un message de succès
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Fonction pour afficher un message d'avertissement
warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Fonction pour afficher un message d'erreur
error() {
    echo -e "${RED}❌ $1${NC}"
}

# Fonction pour afficher un message d'information
info() {
    echo -e "${BLUE}▶ $1${NC}"
}

# Vérifier que nous sommes sur macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    error "MLX nécessite macOS avec Apple Silicon (M1/M2/M3)"
    exit 1
fi

# Vérifier l'architecture
ARCH=$(uname -m)
if [[ "$ARCH" != "arm64" ]]; then
    error "MLX nécessite Apple Silicon (M1/M2/M3), détecté: $ARCH"
    exit 1
fi

success "macOS Apple Silicon détecté ($ARCH)"

# Vérifier Python
info "Vérification de Python..."
if ! command -v python3 &> /dev/null; then
    error "Python 3 n'est pas installé"
    echo ""
    echo "Installez Python avec Homebrew:"
    echo "  brew install python@3.11"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | awk '{print $2}')
success "Python $PYTHON_VERSION détecté"

# Vérifier pip
if ! command -v pip3 &> /dev/null; then
    error "pip3 n'est pas installé"
    exit 1
fi

success "pip3 détecté"

# Définir le chemin du virtualenv
VENV_PATH="$HOME/.blackia-env"

# Demander à l'utilisateur s'il veut utiliser un virtualenv
echo ""
info "Où voulez-vous installer les dépendances MLX ?"
echo "1) Environnement virtuel dédié (Recommandé): $VENV_PATH"
echo "2) Installation globale avec pip3"
echo ""
read -p "Choix (1 ou 2, défaut=1): " INSTALL_CHOICE
INSTALL_CHOICE=${INSTALL_CHOICE:-1}

if [[ "$INSTALL_CHOICE" == "1" ]]; then
    # Installation dans virtualenv
    info "Installation dans environnement virtuel: $VENV_PATH"

    # Créer le virtualenv s'il n'existe pas
    if [ ! -d "$VENV_PATH" ]; then
        info "Création de l'environnement virtuel..."
        python3 -m venv "$VENV_PATH"
        success "Environnement virtuel créé"
    else
        warning "Environnement virtuel existe déjà"
    fi

    # Activer le virtualenv
    source "$VENV_PATH/bin/activate"
    success "Environnement virtuel activé"

    # Mettre à jour pip
    info "Mise à jour de pip..."
    pip install --upgrade pip > /dev/null
    success "pip mis à jour"

    # Installer les dépendances
    info "Installation de sentence-transformers et torch..."
    echo "  (Cela peut prendre quelques minutes...)"
    pip install sentence-transformers torch > /dev/null 2>&1
    success "Dépendances installées"

    # Vérifier l'installation
    info "Vérification de l'installation..."
    if python -c "import sentence_transformers; print('OK')" &> /dev/null; then
        success "sentence-transformers installé correctement"
    else
        error "Échec de l'installation de sentence-transformers"
        exit 1
    fi

    # Test avec un modèle
    info "Test avec le modèle par défaut..."
    cat > /tmp/test_mlx.py << 'EOF'
from sentence_transformers import SentenceTransformer
import sys

try:
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    embedding = model.encode('Test BlackIA MLX')
    print(f'✅ Modèle chargé avec succès - Dimensions: {len(embedding)}')
    sys.exit(0)
except Exception as e:
    print(f'❌ Erreur: {e}')
    sys.exit(1)
EOF

    python /tmp/test_mlx.py
    rm /tmp/test_mlx.py

    echo ""
    success "Installation terminée avec succès !"
    echo ""
    info "Configuration pour BlackIA:"
    echo "  Python Path: $VENV_PATH/bin/python3"
    echo "  Modèle: sentence-transformers/all-MiniLM-L6-v2"
    echo ""
    info "Pour activer manuellement cet environnement:"
    echo "  source $VENV_PATH/bin/activate"

elif [[ "$INSTALL_CHOICE" == "2" ]]; then
    # Installation globale
    info "Installation globale avec pip3..."

    # Installer les dépendances
    info "Installation de sentence-transformers et torch..."
    echo "  (Cela peut prendre quelques minutes...)"
    pip3 install --upgrade sentence-transformers torch
    success "Dépendances installées"

    # Vérifier l'installation
    info "Vérification de l'installation..."
    if python3 -c "import sentence_transformers; print('OK')" &> /dev/null; then
        success "sentence-transformers installé correctement"
    else
        error "Échec de l'installation de sentence-transformers"
        exit 1
    fi

    # Test avec un modèle
    info "Test avec le modèle par défaut..."
    python3 -c "
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
embedding = model.encode('Test BlackIA MLX')
print(f'✅ Modèle chargé avec succès - Dimensions: {len(embedding)}')
"

    echo ""
    success "Installation terminée avec succès !"
    echo ""
    info "Configuration pour BlackIA:"
    echo "  Python Path: python3 (ou $(which python3))"
    echo "  Modèle: sentence-transformers/all-MiniLM-L6-v2"

else
    error "Choix invalide"
    exit 1
fi

echo ""
info "Prochaines étapes:"
echo "  1. Lancer BlackIA"
echo "  2. Le service MLX se configurera automatiquement"
echo "  3. Tester avec un document dans Library"
echo ""
info "Pour plus d'informations, consultez MLX_SETUP.md"
echo ""
