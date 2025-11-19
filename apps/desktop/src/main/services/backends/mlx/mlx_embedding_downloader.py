#!/usr/bin/env python3
"""
MLX Embedding Model Downloader
Télécharge des modèles sentence-transformers depuis Hugging Face
"""

import sys
import json
import os
from pathlib import Path

try:
    from huggingface_hub import snapshot_download
    from tqdm import tqdm
except ImportError as e:
    print(json.dumps({
        "type": "error",
        "error": f"Missing dependency: {e}. Install with: pip3 install huggingface_hub tqdm"
    }), flush=True)
    sys.exit(1)


def make_tqdm_progress(repo_id):
    """
    Crée une classe tqdm personnalisée qui envoie des mises à jour de progression
    """
    class TqdmProgress(tqdm):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self.last_percentage = 0

        def update(self, n=1):
            super().update(n)
            if self.total and self.total > 0:
                percentage = (self.n / self.total) * 100
                # Envoyer une mise à jour tous les 5%
                if percentage - self.last_percentage >= 5 or percentage >= 99:
                    progress = {
                        "type": "progress",
                        "repo_id": repo_id,
                        "downloaded": self.n,
                        "total": self.total,
                        "percentage": round(percentage, 2)
                    }
                    print(json.dumps(progress), flush=True)
                    self.last_percentage = percentage

    return TqdmProgress


def download_model(repo_id):
    """
    Télécharge un modèle sentence-transformers
    """
    try:
        print(json.dumps({
            "type": "start",
            "repo_id": repo_id,
            "message": f"Starting download of {repo_id}"
        }), flush=True)

        # Créer la classe tqdm avec progression
        TqdmProgressClass = make_tqdm_progress(repo_id)

        # Télécharger le modèle
        downloaded_path = snapshot_download(
            repo_id=repo_id,
            cache_dir=None,  # Utilise le cache par défaut de HF
            tqdm_class=TqdmProgressClass,
            resume_download=True,
        )

        print(json.dumps({
            "type": "complete",
            "repo_id": repo_id,
            "path": downloaded_path,
            "message": f"Successfully downloaded {repo_id}"
        }), flush=True)

        return 0

    except Exception as e:
        print(json.dumps({
            "type": "error",
            "repo_id": repo_id,
            "error": str(e)
        }), flush=True)
        return 1


def list_models():
    """
    Liste les modèles téléchargés localement
    """
    try:
        cache_dir = os.environ.get('HF_HOME') or Path.home() / '.cache' / 'huggingface' / 'hub'
        cache_path = Path(cache_dir)

        models = []
        if cache_path.exists():
            for model_dir in cache_path.iterdir():
                if model_dir.is_dir() and model_dir.name.startswith('models--'):
                    # Convertir le nom du dossier en repo_id
                    repo_id = model_dir.name.replace('models--', '').replace('--', '/')
                    models.append({
                        "repo_id": repo_id,
                        "path": str(model_dir)
                    })

        print(json.dumps({
            "type": "list",
            "models": models
        }), flush=True)

        return 0

    except Exception as e:
        print(json.dumps({
            "type": "error",
            "error": str(e)
        }), flush=True)
        return 1


def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "type": "error",
            "error": "Usage: mlx_embedding_downloader.py <command> [args]"
        }), flush=True)
        sys.exit(1)

    command = sys.argv[1]

    if command == "download":
        if len(sys.argv) < 3:
            print(json.dumps({
                "type": "error",
                "error": "Usage: mlx_embedding_downloader.py download <repo_id>"
            }), flush=True)
            sys.exit(1)

        repo_id = sys.argv[2]
        sys.exit(download_model(repo_id))

    elif command == "list":
        sys.exit(list_models())

    else:
        print(json.dumps({
            "type": "error",
            "error": f"Unknown command: {command}"
        }), flush=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
