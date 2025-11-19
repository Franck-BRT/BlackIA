#!/bin/bash
# Installation automatique des dépendances Python pour Vision RAG
# Usage: ./install-dependencies.sh [--offline /path/to/wheels]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/venv"
WHEELS_DIR=""
OFFLINE_MODE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --offline)
      OFFLINE_MODE=true
      WHEELS_DIR="$2"
      shift 2
      ;;
    --help)
      echo "Usage: $0 [--offline /path/to/wheels]"
      echo ""
      echo "Options:"
      echo "  --offline PATH  Install from pre-downloaded wheels directory"
      echo "  --help          Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Use --help for usage information"
      exit 1
      ;;
  esac
done

echo "🐍 BlackIA - Installation des Dépendances Python Vision RAG"
echo "============================================================"
echo ""

# Check Python version
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 n'est pas installé"
    echo "   Installez Python 3.11+ et réessayez"
    exit 1
fi

python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $python_version"

# Check architecture
arch=$(uname -m)
echo "✓ Architecture: $arch"

if [ "$arch" = "arm64" ] || [ "$arch" = "aarch64" ]; then
    echo "  (Apple Silicon / ARM64 détecté - MPS acceleration disponible)"
else
    echo "  (x86_64 - CUDA ou CPU)"
fi
echo ""

# Create venv if not exists
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Création du virtual environment..."
    python3 -m venv "$VENV_DIR"
    echo "✓ Virtual environment créé"
else
    echo "✓ Virtual environment existe déjà"
fi

# Activate venv
echo "📦 Activation du virtual environment..."
source "$VENV_DIR/bin/activate"

# Upgrade pip
echo "📦 Mise à jour de pip..."
pip install --upgrade pip setuptools wheel --quiet

echo ""

# Install dependencies
if [ "$OFFLINE_MODE" = true ]; then
    echo "📦 Installation OFFLINE depuis: $WHEELS_DIR"
    echo ""

    if [ ! -d "$WHEELS_DIR" ]; then
        echo "❌ Le répertoire $WHEELS_DIR n'existe pas"
        exit 1
    fi

    echo "Installation des packages depuis les wheels..."
    pip install --no-index --find-links="$WHEELS_DIR" -r "$SCRIPT_DIR/requirements.txt"
else
    echo "📦 Installation ONLINE depuis PyPI..."
    echo ""

    # Try different strategies
    install_success=false

    # Strategy 1: Direct installation
    echo "Tentative 1/4: Installation directe depuis PyPI..."
    if pip install -r "$SCRIPT_DIR/requirements.txt" --timeout 60 2>/dev/null; then
        install_success=true
    else
        echo "❌ Échec - Tentative avec mirror PyPI..."

        # Strategy 2: Try Aliyun mirror
        echo "Tentative 2/4: Mirror Aliyun (Chine)..."
        if pip install -i https://mirrors.aliyun.com/pypi/simple/ -r "$SCRIPT_DIR/requirements.txt" --timeout 60 2>/dev/null; then
            install_success=true
        else
            echo "❌ Échec - Tentative avec mirror Tsinghua..."

            # Strategy 3: Try Tsinghua mirror
            echo "Tentative 3/4: Mirror Tsinghua..."
            if pip install -i https://pypi.tuna.tsinghua.edu.cn/simple/ -r "$SCRIPT_DIR/requirements.txt" --timeout 60 2>/dev/null; then
                install_success=true
            else
                echo "❌ Échec - Tentative installation package par package..."

                # Strategy 4: Install one by one
                echo "Tentative 4/4: Installation package par package..."
                packages=(
                    "sentence-transformers>=2.2.2"
                    "numpy>=1.26.4"
                    "Pillow>=11.3.0"
                    "lancedb>=0.15.0"
                    "pyarrow>=17.0.0"
                    "pdf2image>=1.17.0"
                    "python-dotenv>=1.0.1"
                )

                # Install PyTorch separately (often the culprit)
                echo "  Installation de PyTorch..."
                if pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu --timeout 120; then
                    echo "  ✓ PyTorch installé (CPU version)"
                else
                    echo "  ⚠️  PyTorch échoué - Vision RAG ne fonctionnera pas"
                fi

                # Install ColPali
                echo "  Installation de ColPali..."
                if pip install colpali-engine --timeout 120; then
                    echo "  ✓ ColPali installé"
                else
                    echo "  ⚠️  ColPali échoué - Vision RAG ne fonctionnera pas"
                fi

                # Install other packages
                for pkg in "${packages[@]}"; do
                    pkg_name=$(echo "$pkg" | cut -d'>' -f1)
                    echo "  Installation de $pkg_name..."
                    pip install "$pkg" --timeout 60 --quiet || echo "  ⚠️  $pkg_name échoué"
                done

                install_success=true  # Consider partial success
            fi
        fi
    fi
fi

echo ""
echo "✅ Installation terminée!"
echo ""

# Verification
echo "🔍 Vérification de l'installation..."
echo ""

# Test imports
test_failed=false

echo -n "  - sentence-transformers: "
if python -c "import sentence_transformers" 2>/dev/null; then
    version=$(python -c "import sentence_transformers; print(sentence_transformers.__version__)" 2>/dev/null)
    echo "✓ OK (v$version)"
else
    echo "❌ ÉCHEC"
    test_failed=true
fi

echo -n "  - colpali-engine: "
if python -c "import colpali_engine" 2>/dev/null; then
    echo "✓ OK"
else
    echo "❌ ÉCHEC (Vision RAG ne fonctionnera pas)"
    test_failed=true
fi

echo -n "  - torch: "
if python -c "import torch" 2>/dev/null; then
    version=$(python -c "import torch; print(torch.__version__)" 2>/dev/null)
    echo "✓ OK (v$version)"
else
    echo "❌ ÉCHEC (Vision RAG ne fonctionnera pas)"
    test_failed=true
fi

echo -n "  - torchvision: "
if python -c "import torchvision" 2>/dev/null; then
    version=$(python -c "import torchvision; print(torchvision.__version__)" 2>/dev/null)
    echo "✓ OK (v$version)"
else
    echo "❌ ÉCHEC"
    test_failed=true
fi

echo -n "  - lancedb: "
if python -c "import lancedb" 2>/dev/null; then
    echo "✓ OK"
else
    echo "❌ ÉCHEC"
    test_failed=true
fi

echo -n "  - Pillow: "
if python -c "from PIL import Image" 2>/dev/null; then
    version=$(python -c "from PIL import Image; print(Image.__version__)" 2>/dev/null)
    echo "✓ OK (v$version)"
else
    echo "❌ ÉCHEC"
    test_failed=true
fi

echo -n "  - pdf2image: "
if python -c "import pdf2image" 2>/dev/null; then
    echo "✓ OK"
else
    echo "❌ ÉCHEC"
    test_failed=true
fi

echo ""

# Check GPU/Device
echo "🖥️  Détection du device..."
python -c "
import torch
print(f'  - CUDA disponible: {\"✓\" if torch.cuda.is_available() else \"✗\"} {\"(GPU NVIDIA détecté)\" if torch.cuda.is_available() else \"\"}')
print(f'  - MPS disponible: {\"✓\" if torch.backends.mps.is_available() else \"✗\"} {\"(Apple Silicon détecté)\" if torch.backends.mps.is_available() else \"\"}')
device = 'cuda' if torch.cuda.is_available() else ('mps' if torch.backends.mps.is_available() else 'cpu')
print(f'  - Device recommandé: {device.upper()}')
"

echo ""

# Check poppler (for PDF conversion)
echo "📄 Vérification de poppler-utils (requis pour PDF)..."
if command -v pdftoppm &> /dev/null; then
    version=$(pdftoppm -v 2>&1 | head -1)
    echo "  ✓ poppler-utils installé ($version)"
else
    echo "  ⚠️  poppler-utils NON installé"

    # Try to install poppler automatically on macOS
    if [[ "$OSTYPE" == "darwin"* ]] && command -v brew &> /dev/null; then
        echo "  📦 Tentative d'installation automatique via Homebrew..."
        if brew install poppler; then
            echo "  ✓ poppler installé avec succès via Homebrew!"
        else
            echo "  ❌ Échec de l'installation automatique"
            echo "     Essayez manuellement: brew install poppler"
        fi
    else
        echo "     Installation requise pour la conversion PDF:"
        echo "       - Debian/Ubuntu: sudo apt-get install poppler-utils"
        echo "       - macOS: brew install poppler"
        echo "       - Fedora/RHEL: sudo dnf install poppler-utils"
    fi
fi

echo ""

# Final status
if [ "$test_failed" = true ]; then
    echo "⚠️  Installation PARTIELLE - Certains packages ont échoué"
    echo "   Consultez INSTALLATION_GUIDE.md pour plus de détails"
    echo ""
    echo "Solutions:"
    echo "  1. Réessayez avec: ./install-dependencies.sh"
    echo "  2. Utilisez un mirror PyPI différent"
    echo "  3. Installation offline avec wheels pré-téléchargés"
    exit 1
else
    echo "✅ Installation COMPLÈTE - Tous les packages fonctionnent!"
    echo ""
    echo "Prochaines étapes:"
    echo "  1. Vérifiez que poppler-utils est installé (voir ci-dessus)"
    echo "  2. Testez le module Colette:"
    echo "     python vision_rag/colette_embedder.py --help"
    echo "  3. Lancez l'application BlackIA:"
    echo "     cd ../../../.. && pnpm dev"
    echo ""
    echo "Pour activer le venv manuellement:"
    echo "  source venv/bin/activate"
fi
