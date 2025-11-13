#!/usr/bin/env python3
"""
MLX Embeddings Server
Génère des embeddings textuels en utilisant sentence-transformers
Optimisé pour Apple Silicon avec MLX

Communication via stdin/stdout en JSON
"""

import sys
import json
import numpy as np
from sentence_transformers import SentenceTransformer
from typing import Dict, List, Union

class MLXEmbeddingServer:
    def __init__(self):
        self.model = None
        self.current_model_name = None

    def load_model(self, model_name: str):
        """Charge un modèle d'embeddings"""
        if self.current_model_name == model_name and self.model is not None:
            return

        try:
            sys.stderr.write(f"[MLX] Loading model: {model_name}\n")
            sys.stderr.flush()

            self.model = SentenceTransformer(model_name)
            self.current_model_name = model_name

            sys.stderr.write(f"[MLX] Model loaded successfully\n")
            sys.stderr.flush()
        except Exception as e:
            sys.stderr.write(f"[MLX] Error loading model: {str(e)}\n")
            sys.stderr.flush()
            raise

    def generate_embedding(self, text: Union[str, List[str]], model_name: str) -> Dict:
        """Génère un embedding pour un ou plusieurs textes"""
        try:
            # Charger le modèle si nécessaire
            self.load_model(model_name)

            # Générer l'embedding
            is_batch = isinstance(text, list)
            texts = text if is_batch else [text]

            embeddings = self.model.encode(
                texts,
                show_progress_bar=False,
                convert_to_numpy=True
            )

            # Convertir en liste Python
            if is_batch:
                result = [emb.tolist() for emb in embeddings]
            else:
                result = embeddings[0].tolist()

            return {
                "success": True,
                "embeddings": result,
                "dimensions": len(result) if not is_batch else len(result[0]),
                "model": model_name
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "model": model_name
            }

    def handle_request(self, request: Dict) -> Dict:
        """Traite une requête"""
        command = request.get("command")

        if command == "embed":
            text = request.get("text")
            model = request.get("model", "sentence-transformers/all-mpnet-base-v2")
            return self.generate_embedding(text, model)

        elif command == "ping":
            return {"success": True, "message": "pong"}

        elif command == "status":
            return {
                "success": True,
                "model_loaded": self.current_model_name,
                "ready": self.model is not None
            }

        else:
            return {
                "success": False,
                "error": f"Unknown command: {command}"
            }

    def run(self):
        """Boucle principale de traitement des requêtes"""
        sys.stderr.write("[MLX] Embedding server started\n")
        sys.stderr.flush()

        while True:
            try:
                # Lire une ligne depuis stdin
                line = sys.stdin.readline()

                if not line:
                    # EOF - terminer proprement
                    sys.stderr.write("[MLX] Received EOF, shutting down\n")
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
                sys.stderr.write("[MLX] Received interrupt, shutting down\n")
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
    server = MLXEmbeddingServer()
    server.run()

if __name__ == "__main__":
    main()
