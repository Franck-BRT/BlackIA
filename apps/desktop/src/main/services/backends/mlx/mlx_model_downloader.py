#!/usr/bin/env python3
"""
MLX Model Downloader
Télécharge et gère les modèles MLX depuis Hugging Face

Communication via stdin/stdout en JSON avec progression en temps réel
"""

import sys
import json
import os
from typing import Dict, Optional, Callable
from pathlib import Path

try:
    from huggingface_hub import snapshot_download, hf_hub_download
    from huggingface_hub.utils import tqdm as hf_tqdm
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False
    sys.stderr.write("[MLX Downloader] Warning: huggingface_hub not installed\n")
    sys.stderr.flush()


class ProgressCallback:
    """Callback pour suivre la progression du téléchargement"""

    def __init__(self):
        self.total_size = 0
        self.downloaded_size = 0
        self.current_file = ""
        self.total_files = 0
        self.downloaded_files = 0

    def update(self, downloaded: int, total: Optional[int] = None):
        """Met à jour la progression"""
        self.downloaded_size = downloaded
        if total:
            self.total_size = total

        # Calculer le pourcentage
        percentage = 0
        if self.total_size > 0:
            percentage = (self.downloaded_size / self.total_size) * 100

        # Envoyer la progression
        progress = {
            "type": "progress",
            "downloaded": self.downloaded_size,
            "total": self.total_size,
            "percentage": round(percentage, 2),
            "current_file": self.current_file,
            "downloaded_files": self.downloaded_files,
            "total_files": self.total_files
        }
        print(json.dumps(progress))
        sys.stdout.flush()


class MLXModelDownloader:
    """Téléchargeur de modèles MLX depuis Hugging Face"""

    def __init__(self, models_dir: Optional[str] = None):
        # Répertoire par défaut pour les modèles
        if models_dir is None:
            home = Path.home()
            models_dir = home / "Library" / "Application Support" / "BlackIA" / "models"

        self.models_dir = Path(models_dir)
        self.models_dir.mkdir(parents=True, exist_ok=True)

    def download_model(
        self,
        repo_id: str,
        local_dir: Optional[str] = None,
        revision: str = "main",
        allow_patterns: Optional[list] = None,
        ignore_patterns: Optional[list] = None
    ) -> Dict:
        """Télécharge un modèle depuis Hugging Face"""
        try:
            if not HF_AVAILABLE:
                return {
                    "success": False,
                    "error": "huggingface_hub not installed. Install with: pip install huggingface_hub"
                }

            sys.stderr.write(f"[MLX Downloader] Downloading model: {repo_id}\n")
            sys.stderr.flush()

            # Déterminer le répertoire de destination
            if local_dir is None:
                # Utiliser le nom du repo comme nom de dossier
                model_name = repo_id.replace("/", "--")
                local_dir = self.models_dir / model_name
            else:
                local_dir = Path(local_dir)

            local_dir.mkdir(parents=True, exist_ok=True)

            # Patterns par défaut pour les modèles MLX
            if allow_patterns is None:
                allow_patterns = [
                    "*.json",
                    "*.safetensors",
                    "*.model",
                    "tokenizer.model",
                    "*.tiktoken",
                    "*.txt",
                    "config.json",
                    "tokenizer_config.json",
                    "special_tokens_map.json",
                ]

            if ignore_patterns is None:
                ignore_patterns = [
                    "*.bin",  # Ignorer les fichiers PyTorch
                    "*.pt",
                    "*.pth",
                    "*.gguf",  # Ignorer les fichiers GGUF
                    "*.onnx",
                    ".git*",
                ]

            # Télécharger le modèle
            sys.stderr.write(f"[MLX Downloader] Downloading to: {local_dir}\n")
            sys.stderr.flush()

            # Envoyer un message de début
            start_msg = {
                "type": "start",
                "repo_id": repo_id,
                "local_dir": str(local_dir)
            }
            print(json.dumps(start_msg))
            sys.stdout.flush()

            # Télécharger avec snapshot_download
            downloaded_path = snapshot_download(
                repo_id=repo_id,
                local_dir=str(local_dir),
                local_dir_use_symlinks=False,
                revision=revision,
                allow_patterns=allow_patterns,
                ignore_patterns=ignore_patterns,
            )

            sys.stderr.write(f"[MLX Downloader] Download complete: {downloaded_path}\n")
            sys.stderr.flush()

            # Calculer la taille du modèle
            model_size = self._get_directory_size(downloaded_path)

            return {
                "success": True,
                "type": "complete",
                "repo_id": repo_id,
                "local_path": str(downloaded_path),
                "size": model_size
            }

        except Exception as e:
            sys.stderr.write(f"[MLX Downloader] Download error: {str(e)}\n")
            sys.stderr.flush()
            return {
                "success": False,
                "type": "error",
                "error": str(e)
            }

    def list_local_models(self) -> Dict:
        """Liste les modèles téléchargés localement"""
        try:
            models = []

            if not self.models_dir.exists():
                return {
                    "success": True,
                    "models": []
                }

            # Parcourir le répertoire des modèles
            for model_dir in self.models_dir.iterdir():
                if model_dir.is_dir():
                    # Vérifier si c'est un modèle valide (contient config.json)
                    config_path = model_dir / "config.json"
                    if config_path.exists():
                        # Calculer la taille
                        size = self._get_directory_size(model_dir)

                        # Lire le config pour obtenir des infos
                        model_info = {
                            "name": model_dir.name,
                            "path": str(model_dir),
                            "size": size,
                            "has_config": True
                        }

                        # Essayer de lire le repo_id depuis le config
                        try:
                            with open(config_path, 'r') as f:
                                config = json.load(f)
                                if "_name_or_path" in config:
                                    model_info["repo_id"] = config["_name_or_path"]
                        except:
                            pass

                        models.append(model_info)

            return {
                "success": True,
                "models": models
            }

        except Exception as e:
            sys.stderr.write(f"[MLX Downloader] Error listing models: {str(e)}\n")
            sys.stderr.flush()
            return {
                "success": False,
                "error": str(e)
            }

    def delete_model(self, model_path: str) -> Dict:
        """Supprime un modèle local"""
        try:
            import shutil

            path = Path(model_path)
            if not path.exists():
                return {
                    "success": False,
                    "error": f"Model not found: {model_path}"
                }

            # Vérifier que c'est bien dans le répertoire des modèles
            if not str(path).startswith(str(self.models_dir)):
                return {
                    "success": False,
                    "error": "Can only delete models in the models directory"
                }

            sys.stderr.write(f"[MLX Downloader] Deleting model: {model_path}\n")
            sys.stderr.flush()

            # Supprimer le répertoire
            shutil.rmtree(path)

            return {
                "success": True,
                "message": f"Model deleted: {model_path}"
            }

        except Exception as e:
            sys.stderr.write(f"[MLX Downloader] Delete error: {str(e)}\n")
            sys.stderr.flush()
            return {
                "success": False,
                "error": str(e)
            }

    def _get_directory_size(self, path) -> int:
        """Calcule la taille d'un répertoire en octets"""
        total_size = 0
        path = Path(path)

        for item in path.rglob('*'):
            if item.is_file():
                total_size += item.stat().st_size

        return total_size

    def handle_request(self, request: Dict) -> Dict:
        """Traite une requête"""
        command = request.get("command")

        if command == "download":
            repo_id = request.get("repo_id")
            local_dir = request.get("local_dir")
            revision = request.get("revision", "main")
            allow_patterns = request.get("allow_patterns")
            ignore_patterns = request.get("ignore_patterns")

            return self.download_model(
                repo_id,
                local_dir,
                revision,
                allow_patterns,
                ignore_patterns
            )

        elif command == "list":
            return self.list_local_models()

        elif command == "delete":
            model_path = request.get("model_path")
            return self.delete_model(model_path)

        elif command == "ping":
            return {
                "success": True,
                "message": "pong",
                "hf_available": HF_AVAILABLE
            }

        else:
            return {
                "success": False,
                "error": f"Unknown command: {command}"
            }

    def run(self):
        """Boucle principale de traitement des requêtes"""
        sys.stderr.write("[MLX Downloader] Downloader started\n")
        sys.stderr.flush()

        while True:
            try:
                # Lire une ligne depuis stdin
                line = sys.stdin.readline()

                if not line:
                    # EOF - terminer proprement
                    sys.stderr.write("[MLX Downloader] Received EOF, shutting down\n")
                    sys.stderr.flush()
                    break

                # Parser la requête JSON
                request = json.loads(line.strip())

                # Traiter la requête
                response = self.handle_request(request)

                # Envoyer la réponse en JSON
                print(json.dumps(response))
                sys.stdout.flush()

            except json.JSONDecodeError as e:
                error_response = {
                    "success": False,
                    "error": f"Invalid JSON: {str(e)}"
                }
                print(json.dumps(error_response))
                sys.stdout.flush()

            except KeyboardInterrupt:
                sys.stderr.write("[MLX Downloader] Received interrupt, shutting down\n")
                sys.stderr.flush()
                break

            except Exception as e:
                error_response = {
                    "success": False,
                    "error": f"Unexpected error: {str(e)}"
                }
                print(json.dumps(error_response))
                sys.stdout.flush()


def main():
    # Lire le répertoire des modèles depuis les arguments si fourni
    models_dir = None
    if len(sys.argv) > 1:
        models_dir = sys.argv[1]

    downloader = MLXModelDownloader(models_dir)
    downloader.run()


if __name__ == "__main__":
    main()
