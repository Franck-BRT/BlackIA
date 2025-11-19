#!/bin/bash
set -e

echo "╔════════════════════════════════════════╗"
echo "║  Python Virtual Environment Setup      ║"
echo "╚════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VENV_DIR="$PROJECT_ROOT/src/python/venv"
REQUIREMENTS_FILE="$PROJECT_ROOT/src/python/requirements.txt"

echo "▶ Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed"
    echo "Please install Python 3.9 or higher"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "✅ Found Python $PYTHON_VERSION"

echo ""
echo "▶ Removing old virtual environment if exists..."
if [ -d "$VENV_DIR" ]; then
    rm -rf "$VENV_DIR"
    echo "✅ Old venv removed"
else
    echo "✅ No old venv found"
fi

echo ""
echo "▶ Creating new virtual environment..."
python3 -m venv "$VENV_DIR"
echo "✅ Virtual environment created at: $VENV_DIR"

echo ""
echo "▶ Activating virtual environment..."
source "$VENV_DIR/bin/activate"

echo ""
echo "▶ Upgrading pip..."
pip install --upgrade pip --quiet

# Detect architecture
ARCH=$(uname -m)
echo "▶ Detected architecture: $ARCH"

echo ""
echo "▶ Installing Python dependencies..."
echo "This may take several minutes (downloading PyTorch, etc.)..."
echo ""

# Install dependencies from requirements.txt
if [ -f "$REQUIREMENTS_FILE" ]; then
    pip install -r "$REQUIREMENTS_FILE"
else
    echo "⚠️  requirements.txt not found, installing packages manually..."

    # Core dependencies for Vision RAG with Colette
    pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
    pip install pillow
    pip install pdf2image
    pip install colpali-engine
    pip install transformers
    pip install huggingface-hub

    # Additional utilities
    pip install numpy
fi

# Install MLX on Apple Silicon
if [ "$ARCH" = "arm64" ]; then
    echo ""
    echo "▶ Installing MLX for Apple Silicon..."
    pip install mlx==0.20.0 mlx-lm==0.20.1 mlx-vlm==0.0.13
    echo "✅ MLX installed successfully"
fi

echo ""
echo "▶ Verifying installation..."
python -c "
import torch
import PIL
import pdf2image
import colpali_engine
print('✅ All core dependencies verified')
print(f'   PyTorch version: {torch.__version__}')

# Verify MLX on Apple Silicon
import platform
if platform.machine() == 'arm64':
    try:
        import mlx.core as mx
        print('✅ MLX installed (Apple Silicon optimized)')
    except ImportError:
        print('⚠️  MLX not installed (optional for Apple Silicon)')
"

echo ""
echo "▶ Deactivating virtual environment..."
deactivate

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  Virtual Environment Setup Complete!   ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Virtual environment location: $VENV_DIR"
echo "Python executable: $VENV_DIR/bin/python3"
echo ""
