# Configuration MLX pour BlackIA

MLX est le backend d'embeddings optimisé pour Apple Silicon (M1/M2/M3).

## Avantages

- ✅ **10-15x plus rapide** qu'Ollama pour les embeddings
- ✅ **Pas de problèmes EOF** ou de bugs HTTP
- ✅ **Natif Apple Silicon** - utilise les capacités complètes du GPU
- ✅ **Gestion automatique des modèles** - télécharge et cache les modèles automatiquement
- ✅ **Léger** - ne nécessite pas de serveur séparé comme Ollama

## Prérequis

- macOS avec Apple Silicon (M1/M2/M3)
- Python 3.8+
- pip3

## Installation

### Option 1: Environnement virtuel (Recommandé)

```bash
# Créer un environnement virtuel dédié à BlackIA
python3 -m venv ~/.blackia-env

# Activer l'environnement
source ~/.blackia-env/bin/activate

# Installer les dépendances
pip install sentence-transformers torch
```

### Option 2: Installation globale

```bash
# Installer directement avec pip3
pip3 install sentence-transformers torch
```

### Option 3: Conda

```bash
# Créer un environnement conda
conda create -n blackia python=3.10
conda activate blackia

# Installer les dépendances
pip install sentence-transformers torch
```

## Configuration dans BlackIA

1. **Ouvrir les paramètres MLX** dans BlackIA
2. **Configurer le chemin Python**:
   - Environnement virtuel: `~/.blackia-env/bin/python3`
   - Installation globale: `python3` (détecté automatiquement)
   - Conda: `/opt/homebrew/Caskroom/miniconda/base/envs/blackia/bin/python3`

3. **Choisir un modèle**:
   - `sentence-transformers/all-MiniLM-L6-v2` (par défaut, 80MB, rapide)
   - `sentence-transformers/all-mpnet-base-v2` (420MB, meilleure qualité)
   - `sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2` (470MB, multilingue)

4. **Tester la configuration**: Cliquer sur "Tester MLX"

## Modèles disponibles

### all-MiniLM-L6-v2 (Recommandé pour démarrer)
- **Taille**: 80MB
- **Dimensions**: 384
- **Vitesse**: Très rapide
- **Usage**: Parfait pour la plupart des cas d'usage

### all-mpnet-base-v2 (Meilleure qualité)
- **Taille**: 420MB
- **Dimensions**: 768
- **Vitesse**: Rapide
- **Usage**: Recherche sémantique de haute qualité

### paraphrase-multilingual-MiniLM-L12-v2 (Multilingue)
- **Taille**: 470MB
- **Dimensions**: 384
- **Langues**: 50+ langues (FR, EN, DE, ES, IT, etc.)
- **Usage**: Documents multilingues

## Vérification de l'installation

```bash
# Vérifier que Python fonctionne
python3 --version

# Vérifier que sentence-transformers est installé
python3 -c "import sentence_transformers; print('OK')"

# Tester un embedding
python3 -c "
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
embedding = model.encode('Hello world')
print(f'Embedding dimensions: {len(embedding)}')
"
```

## Dépannage

### Erreur: "MLX backend not available"
- Vérifier que vous êtes sur macOS avec Apple Silicon
- Vérifier l'installation de sentence-transformers: `python3 -c "import sentence_transformers"`
- Essayer différents chemins Python (voir Configuration)

### Erreur: "sentence-transformers not installed"
```bash
# Réinstaller sentence-transformers
pip3 install --upgrade sentence-transformers torch
```

### Erreur lors du téléchargement des modèles
```bash
# Télécharger manuellement le modèle
python3 -c "
from sentence_transformers import SentenceTransformer
SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
print('Model downloaded')
"
```

### Les embeddings sont lents
- Vérifier que vous utilisez bien Python depuis l'environnement virtuel
- S'assurer que PyTorch utilise bien le GPU: `python3 -c "import torch; print(torch.backends.mps.is_available())"`

## Architecture

```
BlackIA App (Electron)
  └── TextRAGService (TypeScript)
      └── MLXBackend (TypeScript)
          └── mlx_embeddings.py (Python Process)
              └── SentenceTransformer (sentence-transformers)
                  └── Apple Metal/MLX (GPU natif)
```

La communication se fait via stdin/stdout en JSON, ce qui est très performant et évite les problèmes de réseau HTTP.

## Performances attendues

Sur un M1/M2/M3:
- **Premier embedding**: ~1-2s (chargement du modèle)
- **Embeddings suivants**: ~50-100ms par chunk
- **Batch de 10 chunks**: ~200-300ms

Comparé à Ollama:
- **MLX**: ~100ms par embedding
- **Ollama**: ~1-2s par embedding
- **Gain**: 10-20x plus rapide

## Base de données vectorielle

BlackIA utilise **LanceDB** pour stocker les embeddings:
- Stockage local dans `~/Library/Application Support/BlackIA/lancedb/`
- Pas de serveur séparé nécessaire
- Recherche ANN ultra-rapide
- Compatible avec tous les modèles d'embeddings

## API MLX disponible

Dans le renderer process (React):

```typescript
// Vérifier disponibilité
const isAvailable = await window.api.mlx.isAvailable();

// Obtenir le statut
const status = await window.api.mlx.getStatus();

// Lister les modèles
const models = await window.api.mlx.listModels();

// Changer de modèle
await window.api.mlx.updateConfig({
  model: 'sentence-transformers/all-mpnet-base-v2',
  pythonPath: '~/.blackia-env/bin/python3'
});

// Tester la configuration
const testResult = await window.api.mlx.test();

// Redémarrer le backend
await window.api.mlx.restart();
```

## Migration depuis Ollama

Si vous utilisiez Ollama auparavant:

1. **Les chunks existants restent compatibles** - LanceDB stocke les vecteurs de la même façon
2. **Réindexer vos documents** pour bénéficier des nouveaux embeddings MLX
3. **Désinstaller Ollama** si vous ne l'utilisez plus pour autre chose

## Support

Pour tout problème:
1. Vérifier les logs dans BlackIA (Module Logs)
2. Tester l'installation Python (commandes ci-dessus)
3. Consulter le README du projet
