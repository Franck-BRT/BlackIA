#!/bin/bash
#
# Script d'initialisation de l'environnement Python pour Colette Vision RAG
# Usage: bash scripts/setup-python-venv.sh
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PYTHON_DIR="$PROJECT_ROOT/apps/desktop/src/python"
VENV_DIR="$PYTHON_DIR/venv"

echo "=========================================="
echo "  BlackIA - Python Environment Setup"
echo "=========================================="
echo ""

# Vérifier si Python 3 est installé
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 is not installed"
    echo "Please install Python 3.11+ first:"
    echo "  - macOS: brew install python@3.11"
    echo "  - Linux: sudo apt install python3.11"
    exit 1
fi

PYTHON_VERSION=$(python3 --version)
echo "✓ Found Python: $PYTHON_VERSION"
echo ""

# Créer le répertoire Python si nécessaire
if [ ! -d "$PYTHON_DIR" ]; then
    echo "Creating Python directory: $PYTHON_DIR"
    mkdir -p "$PYTHON_DIR"
fi

# Vérifier si le venv existe déjà
if [ -d "$VENV_DIR" ]; then
    echo "⚠️  Virtual environment already exists at: $VENV_DIR"
    read -p "Do you want to recreate it? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Removing existing venv..."
        rm -rf "$VENV_DIR"
    else
        echo "Keeping existing venv. Exiting."
        exit 0
    fi
fi

# Créer le venv
echo "Creating virtual environment..."
cd "$PYTHON_DIR"
python3 -m venv venv

# Activer le venv
echo "Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Mettre à jour pip
echo "Upgrading pip..."
pip install --upgrade pip

# Installer les dépendances
echo ""
echo "Installing Python dependencies..."
echo "This may take several minutes (PyTorch is large)..."
echo ""
pip install colpali-engine torch torchvision pdf2image pillow

# Vérifier l'installation
echo ""
echo "Verifying installation..."
python3 -c "
import colpali_engine
import torch
import torchvision
import pdf2image
import PIL
print('✓ All dependencies installed successfully')
print(f'✓ PyTorch version: {torch.__version__}')
print(f'✓ Device available: {\"CUDA\" if torch.cuda.is_available() else \"MPS\" if torch.backends.mps.is_available() else \"CPU\"}')
"

echo ""
echo "=========================================="
echo "  ✅ Python Environment Ready!"
echo "=========================================="
echo ""
echo "Virtual environment location: $VENV_DIR"
echo ""
echo "To use this environment:"
echo "  source apps/desktop/src/python/venv/bin/activate"
echo ""
echo "BlackIA will automatically detect and use this venv."
echo ""
