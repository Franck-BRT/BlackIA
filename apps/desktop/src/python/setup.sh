#!/bin/bash
# Setup script for BlackIA Python environment
# Requires Python 3.11+
# Supports: Colette/ColPali (multi-platform) or MLX-VLM (Apple Silicon only)

set -e

echo "🐍 BlackIA Python Environment Setup"
echo "===================================="
echo ""

# Check Python version
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "✓ Python version: $python_version"

# Check architecture
arch=$(uname -m)
echo "✓ Architecture: $arch"
if [ "$arch" = "arm64" ]; then
    echo "  (Apple Silicon detected - Colette with MPS acceleration available)"
else
    echo "  (Colette will use CUDA or CPU)"
fi
echo ""

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
echo "To test Colette/ColPali installation:"
echo "  python -c 'import colpali_engine; import torch; print(\"✓ Colette dependencies OK\")'"
echo ""
echo "To test device acceleration:"
echo "  python -c 'import torch; print(f\"CUDA: {torch.cuda.is_available()}\"); print(f\"MPS: {torch.backends.mps.is_available()}\")'"
echo ""
