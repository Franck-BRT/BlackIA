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

# Détecter l'architecture
ARCH=$(uname -m)
echo "Detected architecture: $ARCH"
echo ""

# Installer les dépendances
echo "Installing Python dependencies..."
echo "This may take several minutes (PyTorch is large)..."
echo ""

# Installation depuis requirements.txt
if [ -f "$PYTHON_DIR/requirements.txt" ]; then
    echo "Installing from requirements.txt..."
    pip install -r "$PYTHON_DIR/requirements.txt"
else
    echo "Installing core dependencies..."
    pip install transformers>=4.47.0 accelerate>=0.34.0 colpali-engine torch torchvision pdf2image pillow sentence-transformers lancedb pyarrow numpy python-dotenv
fi

# Installer MLX si on est sur Apple Silicon
if [ "$ARCH" = "arm64" ]; then
    echo ""
    echo "📦 Apple Silicon detected - Installing MLX for Vision RAG..."
    pip install mlx==0.20.0 mlx-lm==0.20.1 mlx-vlm==0.0.13
    echo "✓ MLX installed successfully"
fi

# Vérifier l'installation
echo ""
echo "Verifying installation..."
python3 -c "
import colpali_engine
import torch
import torchvision
import pdf2image
import PIL
import transformers
import accelerate
print('✓ All core dependencies installed successfully')
print(f'✓ PyTorch version: {torch.__version__}')
print(f'✓ Transformers version: {transformers.__version__}')
device_type = 'CUDA' if torch.cuda.is_available() else 'MPS' if torch.backends.mps.is_available() else 'CPU'
print(f'✓ Device available: {device_type}')

# Vérifier MLX si sur Apple Silicon
import platform
if platform.machine() == 'arm64':
    try:
        import mlx.core as mx
        print('✓ MLX installed (Apple Silicon optimized)')
    except ImportError:
        print('⚠️  MLX not installed (optional for Apple Silicon)')
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
