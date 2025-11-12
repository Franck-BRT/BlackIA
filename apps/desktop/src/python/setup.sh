#!/bin/bash
# Setup script for BlackIA Python environment
# Requires Python 3.11+ and Apple Silicon (M1/M2/M3/M4)

set -e

echo "🐍 BlackIA Python Environment Setup"
echo "===================================="
echo ""

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $python_version"

# Check if on Apple Silicon
arch=$(uname -m)
if [ "$arch" != "arm64" ]; then
    echo "⚠️  WARNING: MLX requires Apple Silicon (arm64)"
    echo "   Current architecture: $arch"
    echo "   Vision RAG will not work on this platform"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create virtual environment if not exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "✓ Virtual environment already exists"
fi

# Activate venv
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "📦 Upgrading pip..."
pip install --upgrade pip setuptools wheel

# Install dependencies
echo "📦 Installing dependencies from requirements.txt..."
pip install -r requirements.txt

echo ""
echo "✅ Python environment setup complete!"
echo ""
echo "To activate the environment:"
echo "  source venv/bin/activate"
echo ""
echo "To test MLX installation:"
echo "  python -c 'import mlx.core as mx; print(mx.ones((2,2)))'"
echo ""
echo "To test MLX-VLM:"
echo "  python -c 'import mlx_vlm; print(\"MLX-VLM OK\")'"
echo ""
