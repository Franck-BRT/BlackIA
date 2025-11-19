# Python Virtual Environment Bundling

## Overview

BlackIA bundles a Python virtual environment with the application to ensure all Vision RAG dependencies are available without requiring users to install Python packages manually.

## How It Works

### 1. Build Time

During the build process (`npm run build:dmg:arm64`):

1. **Setup Script Runs** (`scripts/setup-python-venv.sh`):
   - Creates a fresh virtual environment in `src/python/venv/`
   - Installs all dependencies from `src/python/requirements.txt`
   - Verifies the installation

2. **Electron Builder**:
   - Copies the venv to the app bundle via `extraResources`
   - Final location: `/Applications/BlackIA.app/Contents/Resources/python/venv/`

### 2. Runtime

When the application launches:

1. **Development Mode**:
   - Looks for venv at: `apps/desktop/src/python/venv/bin/python3`
   - Falls back to system Python if not found

2. **Production Mode**:
   - Looks for bundled venv at: `Resources/python/venv/bin/python3`
   - Falls back to system Python if not found
   - Logs warning if venv not found

## Dependencies

All Python dependencies are defined in `src/python/requirements.txt`:

- **Core ML**: torch, torchvision, transformers
- **Vision RAG**: colpali-engine (for visual document understanding)
- **Image Processing**: pillow, pdf2image
- **Vector Store**: lancedb, pyarrow
- **Text Embeddings**: sentence-transformers
- **Utilities**: numpy, python-dotenv

## Manual Setup

If you need to manually setup or rebuild the venv:

```bash
cd apps/desktop
npm run setup:python:venv
```

This will:
- Remove any existing venv
- Create a fresh virtual environment
- Install all dependencies
- Verify the installation

## Troubleshooting

### Venv Not Found After Build

Check the build output for:
```
[Colette] Using bundled venv Python: /Applications/BlackIA.app/Contents/Resources/python/venv/bin/python3
```

If you see:
```
[Colette] Bundled venv not found, using system Python
```

Then the venv wasn't included. Try:
1. Delete `src/python/venv/`
2. Run `npm run setup:python:venv`
3. Rebuild: `npm run build:dmg:arm64`

### Dependencies Missing

If you see errors like "No module named 'PIL'":

1. The bundled venv is missing or incomplete
2. Rebuild the venv: `npm run setup:python:venv`
3. Rebuild the app: `npm run build:dmg:arm64`

### Large App Size

The bundled venv adds ~500MB-1GB to the app size due to PyTorch and other ML libraries. This is expected and necessary for Vision RAG functionality.

## Development

During development, you can:

1. **Use the bundled venv** (recommended):
   ```bash
   npm run setup:python:venv
   npm run dev
   ```

2. **Use system Python** (if dependencies installed globally):
   ```bash
   pip3 install -r src/python/requirements.txt
   npm run dev
   ```

## Build Scripts

- `npm run setup:python:venv` - Setup/rebuild the virtual environment
- `npm run build:dmg:arm64` - Build DMG with bundled Python (ARM64)
- `npm run build:dmg:x64` - Build DMG with bundled Python (x64)
- `npm run build:dmg:universal` - Build universal DMG with bundled Python

All build scripts now automatically setup the venv before building.

## Files

- `scripts/setup-python-venv.sh` - Venv setup script
- `src/python/requirements.txt` - Python dependencies
- `src/python/venv/` - Virtual environment (gitignored)
- `electron-builder.yml` - Includes venv in app bundle via `extraResources`
