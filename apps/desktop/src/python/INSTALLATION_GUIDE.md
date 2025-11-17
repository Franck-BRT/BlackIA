# 🐍 Guide d'Installation - Dépendances Python Vision RAG

**Date** : 2025-11-13
**Environnement** : Python 3.11+
**Objectif** : Installer les dépendances pour le Vision RAG (Colette/ColPali)

---

## ⚠️ Problème Réseau Détecté

L'environnement actuel **n'a pas d'accès direct à internet** (DNS resolution failure).
L'installation des dépendances Python via `pip install` n'est pas possible dans cet environnement.

**Erreurs observées** :
```
[Errno -3] Temporary failure in name resolution
ProxyError: Cannot connect to proxy (403 Forbidden)
```

---

## 🎯 Solutions Disponibles

### Solution 1 : Installation sur Votre Machine Locale (RECOMMANDÉ)

**Sur votre machine de développement avec accès internet :**

```bash
# 1. Aller dans le répertoire Python
cd /path/to/BlackIA/apps/desktop/src/python

# 2. Créer le venv (si pas déjà fait)
python3 -m venv venv

# 3. Activer le venv
source venv/bin/activate  # Linux/macOS
# ou
venv\Scripts\activate     # Windows

# 4. Installer les dépendances
pip install --upgrade pip
pip install -r requirements.txt

# 5. Vérifier l'installation
python -c "import colpali_engine; import torch; print('✓ Colette OK')"
python -c "import sentence_transformers; print('✓ Sentence Transformers OK')"
python -c "import lancedb; print('✓ LanceDB OK')"
```

---

### Solution 2 : Installation Offline (Wheels Pré-téléchargés)

**Étape 1** - Sur une machine avec internet, télécharger les wheels :

```bash
mkdir python-wheels
cd python-wheels

# Télécharger tous les packages requis
pip download \
  sentence-transformers \
  colpali-engine \
  torch \
  torchvision \
  Pillow \
  pdf2image \
  lancedb \
  pyarrow \
  numpy \
  python-dotenv
```

**Étape 2** - Copier le dossier `python-wheels/` sur le serveur :

```bash
# Sur votre machine locale
scp -r python-wheels/ user@server:/path/to/BlackIA/apps/desktop/src/python/

# Ou via clé USB, rsync, etc.
```

**Étape 3** - Sur le serveur, installer depuis les wheels :

```bash
cd /path/to/BlackIA/apps/desktop/src/python
source venv/bin/activate
pip install --no-index --find-links=python-wheels/ -r requirements.txt
```

---

### Solution 3 : Utiliser Conda/Mamba (Alternative)

**Si pip ne fonctionne pas, Conda peut contourner certains proxies :**

```bash
# Installer Miniconda si pas déjà installé
wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh
bash Miniconda3-latest-Linux-x86_64.sh

# Créer un environnement conda
conda create -n blackia-vision python=3.11
conda activate blackia-vision

# Installer via conda (quand disponible)
conda install -c conda-forge pytorch torchvision
conda install -c conda-forge pillow numpy

# Puis pip pour les packages spécifiques
pip install colpali-engine sentence-transformers lancedb
```

---

### Solution 4 : Mirror PyPI (Si proxy autorise certains mirrors)

**Essayer différents mirrors PyPI :**

```bash
source venv/bin/activate

# Mirror Aliyun (Chine)
pip install -i https://mirrors.aliyun.com/pypi/simple/ -r requirements.txt

# Mirror Tencent
pip install -i https://mirrors.cloud.tencent.com/pypi/simple/ -r requirements.txt

# Mirror Tsinghua
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple/ -r requirements.txt

# Mirror Douban
pip install -i https://pypi.douban.com/simple/ -r requirements.txt
```

---

## 📦 Dépendances Requises

### Core Vision RAG (Colette/ColPali)
```
colpali-engine>=0.3.12   # ColPali pour Vision RAG
torch>=2.7.0             # PyTorch (backend IA)
torchvision>=0.22.0      # Vision transforms
```

### Text RAG
```
sentence-transformers>=2.2.2  # Text embeddings
```

### Image Processing
```
Pillow>=11.3.0          # Image manipulation
pdf2image>=1.17.0       # PDF → Images conversion
```

### Vector Store
```
lancedb>=0.15.0         # Vector database
pyarrow>=17.0.0         # LanceDB backend
```

### Utilities
```
numpy>=1.26.4           # Calculs vectoriels
python-dotenv>=1.0.1    # Configuration
```

---

## 🔧 Dépendances Système

### PDF Conversion (poppler-utils)

**Requis pour `pdf2image`** :

```bash
# Debian/Ubuntu
sudo apt-get update
sudo apt-get install poppler-utils

# macOS
brew install poppler

# Vérifier l'installation
pdftoppm -v
```

### GPU Acceleration (optionnel)

**CUDA (NVIDIA)** :
```bash
# Vérifier si CUDA est disponible
nvidia-smi

# Installer PyTorch avec CUDA
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

**MPS (Apple Silicon M1/M2/M3)** :
```bash
# PyTorch détecte automatiquement MPS
# Aucune installation supplémentaire requise
```

---

## ✅ Vérification de l'Installation

### Test 1 : Imports Python

```bash
source venv/bin/activate

# Test Colette/ColPali
python -c "import colpali_engine; print('✓ ColPali OK')"

# Test PyTorch
python -c "import torch; print(f'PyTorch {torch.__version__}'); print(f'CUDA: {torch.cuda.is_available()}'); print(f'MPS: {torch.backends.mps.is_available()}')"

# Test Sentence Transformers
python -c "import sentence_transformers; print('✓ Sentence Transformers OK')"

# Test LanceDB
python -c "import lancedb; print('✓ LanceDB OK')"

# Test Image Processing
python -c "from PIL import Image; import pdf2image; print('✓ Image Processing OK')"
```

### Test 2 : Module Colette

```bash
cd /path/to/BlackIA/apps/desktop/src/python

# Test génération d'embeddings
python vision_rag/colette_embedder.py \
  --input '{"image_paths": ["/path/to/test.png"]}' \
  --mode embed_images \
  --model vidore/colpali \
  --device auto
```

**Sortie attendue** :
```json
{
  "success": true,
  "embeddings": [...],
  "metadata": {
    "model": "vidore/colpali",
    "device": "cuda",
    "num_images": 1,
    "num_patches_per_image": 1024,
    "embedding_dim": 128
  }
}
```

### Test 3 : Conversion PDF

```bash
# Test conversion PDF → Images
python vision_rag/document_processor.py \
  /path/to/test.pdf \
  /tmp/output/ \
  --dpi 200 \
  --format PNG \
  --verbose
```

**Sortie attendue** :
```json
{
  "success": true,
  "imagePaths": ["/tmp/output/test_page_001.png", ...],
  "pageCount": 5,
  "metadata": {...}
}
```

---

## 🎯 Tailles des Téléchargements

**Estimation de l'espace disque requis** :

| Package | Taille | Description |
|---------|--------|-------------|
| PyTorch | ~2.5 GB | Framework deep learning |
| torchvision | ~500 MB | Vision transforms |
| colpali-engine | ~50 MB | ColPali + dépendances |
| sentence-transformers | ~200 MB | Text embeddings |
| lancedb | ~100 MB | Vector database |
| Autres | ~200 MB | Pillow, numpy, etc. |
| **TOTAL** | **~3.5 GB** | Espace disque total |

**Temps d'installation estimé** :
- Connexion rapide (50 Mbps) : ~10-15 minutes
- Connexion moyenne (10 Mbps) : ~30-45 minutes
- Installation offline (wheels) : ~5 minutes

---

## 🚀 Post-Installation

### 1. Configurer le Device par Défaut

```bash
# Vérifier quel device est disponible
python -c "
import torch
print('CUDA disponible:', torch.cuda.is_available())
print('MPS disponible:', torch.backends.mps.is_available())
print('Device recommandé:', 'cuda' if torch.cuda.is_available() else ('mps' if torch.backends.mps.is_available() else 'cpu'))
"
```

### 2. Télécharger les Modèles (première utilisation)

Les modèles seront automatiquement téléchargés lors de la première utilisation :

**ColPali** (`vidore/colpali`) :
- Taille : ~1 GB
- Téléchargé dans : `~/.cache/huggingface/hub/`

**Sentence Transformers** :
- Taille : ~400 MB
- Téléchargé dans : `~/.cache/torch/sentence_transformers/`

### 3. Lancer l'Application

```bash
cd /path/to/BlackIA
pnpm dev
```

**Premier test dans l'UI** :
1. Ouvrir la page "Library" (Bibliothèque)
2. Créer une nouvelle bibliothèque
3. Activer Vision RAG dans les paramètres
4. Uploader un PDF
5. Cliquer sur "Réindexer"
6. Vérifier le badge "Vision RAG" ✅

---

## 🐛 Troubleshooting

### Erreur : "ModuleNotFoundError: No module named 'colpali_engine'"

**Solution** :
```bash
source venv/bin/activate
pip install colpali-engine
```

### Erreur : "OSError: libpoppler not found"

**Solution** : Installer poppler-utils
```bash
sudo apt-get install poppler-utils  # Linux
brew install poppler                # macOS
```

### Erreur : "CUDA out of memory"

**Solutions** :
1. Utiliser un modèle plus petit
2. Réduire le batch size
3. Utiliser CPU au lieu de GPU :
   ```bash
   export CUDA_VISIBLE_DEVICES=""
   ```

### Erreur : "torch.cuda.is_available() returns False"

**Vérifications** :
```bash
# Vérifier drivers NVIDIA
nvidia-smi

# Réinstaller PyTorch avec CUDA
pip uninstall torch torchvision
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

---

## 📚 Ressources

### Documentation
- **ColPali** : https://github.com/illuin-tech/colpali
- **Colette (JoliBrain)** : https://github.com/jolibrain/colette
- **LanceDB** : https://lancedb.github.io/lancedb/
- **Sentence Transformers** : https://www.sbert.net/

### Modèles Recommandés
- **vidore/colpali** - Modèle principal (multi-plateforme)
- **vidore/colqwen2** - Plus lent mais meilleure qualité
- **sentence-transformers/all-mpnet-base-v2** - Text embeddings

---

## ✅ Checklist Finale

Avant de considérer l'installation complète :

- [ ] Python 3.11+ installé
- [ ] Virtual environment créé et activé
- [ ] Toutes les dépendances pip installées
- [ ] poppler-utils installé (pour PDF)
- [ ] Tests d'import Python réussis
- [ ] Test Colette embedder réussi
- [ ] Test conversion PDF réussi
- [ ] Application Electron démarre sans erreur
- [ ] Upload + indexation d'un PDF réussi
- [ ] Badge "Vision RAG" visible sur le document

---

**Document créé le** : 2025-11-13
**Maintenu par** : BlackIA Team
**Version** : 1.0
