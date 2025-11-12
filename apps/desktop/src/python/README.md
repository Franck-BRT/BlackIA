# BlackIA Python Services

Python backend pour le système RAG (Retrieval Augmented Generation) de BlackIA.

## 🎯 Fonctionnalités

- **Text RAG** : Embeddings textuels via Ollama (nomic-embed-text)
- **Vision RAG** : Embeddings visuels via MLX-VLM (Qwen2-VL adapter)
- **Late Interaction Matching** : Recherche multi-vecteurs style ColPali
- **Document Processing** : Conversion PDF → Images pour Vision RAG

## 📋 Prérequis

- **Python 3.11+**
- **Apple Silicon** (M1/M2/M3/M4) pour MLX
- **macOS 13+** recommandé
- **16GB RAM minimum** pour Vision RAG
- **32GB RAM** recommandé pour Qwen2-VL-7B

## 🚀 Installation

### 1. Setup automatique

```bash
cd apps/desktop/src/python
./setup.sh
```

### 2. Installation manuelle

```bash
# Créer virtual environment
python3 -m venv venv

# Activer venv
source venv/bin/activate

# Installer dépendances
pip install -r requirements.txt
```

### 3. Vérifier l'installation

```bash
# Test MLX
python -c "import mlx.core as mx; print(mx.ones((2,2)))"

# Test MLX-VLM
python -c "import mlx_vlm; print('MLX-VLM OK')"

# Test LanceDB
python -c "import lancedb; print('LanceDB OK')"
```

## 📁 Structure

```
python/
├── requirements.txt          # Dépendances Python
├── setup.sh                  # Script d'installation
├── __init__.py
├── text_rag/                 # TEXT RAG module
│   ├── __init__.py
│   └── ollama_embeddings.py  # Ollama integration
├── vision_rag/               # VISION RAG module
│   ├── __init__.py
│   ├── mlx_vision_embedder.py   # MLX-VLM wrapper
│   ├── late_interaction.py      # MaxSim matching
│   └── document_processor.py    # PDF → Images
└── utils/                    # Utilities
    ├── __init__.py
    └── vector_store_utils.py    # LanceDB helpers
```

## 🔧 Utilisation

### Text RAG (via Ollama)

```python
from text_rag.ollama_embeddings import OllamaEmbedder

embedder = OllamaEmbedder(model="nomic-embed-text")
embedding = embedder.generate_embedding("Hello world")
print(f"Embedding shape: {len(embedding)}")  # 768 dims
```

### Vision RAG (via MLX-VLM)

```python
from vision_rag.mlx_vision_embedder import MLXVisionEmbedder

embedder = MLXVisionEmbedder(model_name="mlx-community/Qwen2-VL-2B-Instruct")
patch_embeddings = embedder.process_image("document_page.png")
print(f"Patch embeddings shape: {patch_embeddings.shape}")  # [1024, 128]
```

### Late Interaction Matching

```python
from vision_rag.late_interaction import LateInteractionMatcher

matcher = LateInteractionMatcher()
score = matcher.compute_similarity(query_embedding, document_patches)
print(f"Similarity score: {score}")
```

### Document Processing

```python
from vision_rag.document_processor import DocumentProcessor

processor = DocumentProcessor()
image_paths = processor.pdf_to_images("document.pdf", output_dir="./pages")
print(f"Generated {len(image_paths)} page images")
```

## 🎨 Modèles supportés

### Vision RAG (MLX-VLM)

| Modèle | RAM Required | Vitesse | Qualité |
|--------|-------------|---------|---------|
| `qwen2-vl-2b` | 16GB | ⚡⚡⚡ Rapide | ⭐⭐ Bonne |
| `qwen2-vl-7b` | 32GB | ⚡⚡ Moyen | ⭐⭐⭐ Excellente |
| `colpali-adapter` | 24GB | ⚡⚡ Moyen | ⭐⭐⭐ Excellente |

### Text RAG (Ollama)

| Modèle | Dimensions | Taille | Performance |
|--------|-----------|--------|-------------|
| `nomic-embed-text` | 768 | 274MB | ⭐⭐⭐ Excellent |
| `mxbai-embed-large` | 1024 | 669MB | ⭐⭐⭐ Très bon |
| `all-minilm` | 384 | 23MB | ⭐⭐ Bon |

## 🧪 Tests

```bash
# Activer venv
source venv/bin/activate

# Run tests (quand disponibles)
pytest tests/

# Test manuel
python -m vision_rag.mlx_vision_embedder --test
```

## 🐛 Troubleshooting

### Erreur: "MLX requires Apple Silicon"

MLX fonctionne uniquement sur puces Apple Silicon (M1/M2/M3/M4). Sur Intel Mac ou Linux, Vision RAG ne sera pas disponible. Text RAG continuera de fonctionner via Ollama.

### Erreur: "Out of memory"

Vision RAG avec Qwen2-VL-7B nécessite 32GB RAM. Solutions :
- Utiliser `qwen2-vl-2b` (16GB)
- Réduire la résolution des images
- Traiter moins de pages simultanément

### Erreur: "mlx_vlm not found"

```bash
pip install mlx-vlm --upgrade
```

### Performance lente

- Vérifier que Metal est activé (GPU Apple Silicon)
- Utiliser modèle plus léger (qwen2-vl-2b)
- Réduire la résolution (150 DPI au lieu de 200)

## 📚 Références

- [MLX Framework](https://github.com/ml-explore/mlx)
- [MLX-VLM](https://github.com/Blaizzy/mlx-vlm)
- [ColPali Paper](https://arxiv.org/abs/2407.01449)
- [LanceDB](https://lancedb.github.io/lancedb/)
- [Qwen2-VL](https://huggingface.co/Qwen/Qwen2-VL)

## 🤝 Support

Pour toute question sur l'environnement Python :
- Consulter cette documentation
- Vérifier les logs : `python -m vision_rag.mlx_vision_embedder --debug`
- Ouvrir une issue GitHub

---

**Note** : Ce module Python est appelé depuis Node.js via `python-shell`. Les services Node.js gèrent l'orchestration, ce module Python fournit uniquement les capacités MLX/Vision RAG.
