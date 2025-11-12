"""
Ollama Embeddings
Wrapper Python pour générer des embeddings textuels via Ollama
Utilisé pour le TEXT RAG côté Python
"""

import sys
import json
import requests
from typing import List, Dict, Any, Optional


class OllamaEmbedder:
    """
    Client Python pour Ollama Embeddings API

    Modèles recommandés:
    - nomic-embed-text: 768 dims, excellent pour text retrieval
    - mxbai-embed-large: 1024 dims, très bon
    - all-minilm: 384 dims, léger et rapide
    """

    def __init__(
        self,
        base_url: str = "http://localhost:11434",
        model: str = "nomic-embed-text",
        timeout: int = 30,
        verbose: bool = False,
    ):
        """
        Args:
            base_url: URL de base Ollama (défaut: http://localhost:11434)
            model: Nom du modèle d'embedding
            timeout: Timeout en secondes
            verbose: Activer les logs détaillés
        """
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = timeout
        self.verbose = verbose

    def generate_embedding(self, text: str) -> List[float]:
        """
        Génère un embedding pour un texte

        Args:
            text: Texte à embedder

        Returns:
            Liste de floats (embedding vector)

        Raises:
            Exception si erreur
        """
        try:
            url = f"{self.base_url}/api/embeddings"

            payload = {
                "model": self.model,
                "prompt": text,
            }

            if self.verbose:
                print(f"[OllamaEmbedder] Generating embedding for text ({len(text)} chars)...", file=sys.stderr)

            response = requests.post(
                url,
                json=payload,
                timeout=self.timeout,
            )

            response.raise_for_status()

            data = response.json()

            if "embedding" not in data:
                raise ValueError("No embedding in response")

            embedding = data["embedding"]

            if self.verbose:
                print(f"[OllamaEmbedder] Generated embedding: {len(embedding)} dims", file=sys.stderr)

            return embedding

        except requests.exceptions.ConnectionError:
            raise Exception(
                f"Cannot connect to Ollama at {self.base_url}. "
                "Make sure Ollama is running."
            )
        except requests.exceptions.Timeout:
            raise Exception(f"Ollama request timed out after {self.timeout}s")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 404:
                raise Exception(
                    f"Model '{self.model}' not found. "
                    f"Run: ollama pull {self.model}"
                )
            raise Exception(f"Ollama HTTP error: {e}")
        except Exception as e:
            if self.verbose:
                import traceback
                traceback.print_exc(file=sys.stderr)
            raise

    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Génère des embeddings pour plusieurs textes

        Args:
            texts: Liste de textes

        Returns:
            Liste d'embeddings
        """
        embeddings = []

        for i, text in enumerate(texts):
            if self.verbose:
                print(f"[OllamaEmbedder] Processing {i + 1}/{len(texts)}...", file=sys.stderr)

            embedding = self.generate_embedding(text)
            embeddings.append(embedding)

        return embeddings

    def check_availability(self) -> Dict[str, Any]:
        """
        Vérifie si Ollama est disponible et liste les modèles

        Returns:
            Dict avec available (bool), models (list), error (str)
        """
        try:
            url = f"{self.base_url}/api/tags"

            response = requests.get(url, timeout=5)
            response.raise_for_status()

            data = response.json()
            models = [m["name"] for m in data.get("models", [])]

            if self.verbose:
                print(f"[OllamaEmbedder] Found {len(models)} models", file=sys.stderr)

            return {
                "available": True,
                "models": models,
                "currentModel": self.model,
                "modelAvailable": self.model in models,
            }

        except Exception as e:
            return {
                "available": False,
                "models": [],
                "error": str(e),
            }

    def get_model_info(self) -> Dict[str, Any]:
        """
        Récupère des infos sur le modèle courant

        Returns:
            Dict avec infos du modèle
        """
        try:
            url = f"{self.base_url}/api/show"

            payload = {"name": self.model}

            response = requests.post(url, json=payload, timeout=5)
            response.raise_for_status()

            return response.json()

        except Exception as e:
            if self.verbose:
                print(f"[OllamaEmbedder] Could not get model info: {e}", file=sys.stderr)
            return {}


def main():
    """
    Point d'entrée CLI pour tester le module
    Usage: python ollama_embeddings.py "text to embed" [--model nomic-embed-text]
    """
    import argparse

    parser = argparse.ArgumentParser(description="Ollama Embeddings Generator")
    parser.add_argument("text", nargs="?", help="Text to embed")
    parser.add_argument("--model", default="nomic-embed-text", help="Ollama model name")
    parser.add_argument("--url", default="http://localhost:11434", help="Ollama base URL")
    parser.add_argument("--check", action="store_true", help="Check Ollama availability")
    parser.add_argument("--batch", nargs="+", help="Batch mode: embed multiple texts")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")
    parser.add_argument("--output", help="Output JSON file path")

    args = parser.parse_args()

    # Créer l'embedder
    embedder = OllamaEmbedder(
        base_url=args.url,
        model=args.model,
        verbose=args.verbose,
    )

    # Mode check
    if args.check:
        result = embedder.check_availability()
        print(json.dumps(result, indent=2))
        sys.exit(0 if result["available"] else 1)

    # Mode batch
    if args.batch:
        try:
            embeddings = embedder.generate_embeddings_batch(args.batch)
            result = {
                "success": True,
                "embeddings": embeddings,
                "count": len(embeddings),
                "dims": len(embeddings[0]) if embeddings else 0,
            }
        except Exception as e:
            result = {
                "success": False,
                "error": str(e),
            }

        output = json.dumps(result, indent=2)
        if args.output:
            with open(args.output, 'w') as f:
                f.write(output)
        else:
            print(output)

        sys.exit(0 if result["success"] else 1)

    # Mode single text
    if not args.text:
        parser.print_help()
        sys.exit(1)

    try:
        embedding = embedder.generate_embedding(args.text)
        result = {
            "success": True,
            "embedding": embedding,
            "dims": len(embedding),
            "model": args.model,
        }
    except Exception as e:
        result = {
            "success": False,
            "error": str(e),
        }

    # Sortir le résultat en JSON
    output = json.dumps(result, indent=2)

    if args.output:
        with open(args.output, 'w') as f:
            f.write(output)
        print(f"Results saved to {args.output}", file=sys.stderr)
    else:
        print(output)

    # Exit code basé sur le succès
    sys.exit(0 if result["success"] else 1)


if __name__ == "__main__":
    main()
