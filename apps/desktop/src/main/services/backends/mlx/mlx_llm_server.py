#!/usr/bin/env python3
"""
MLX LLM Server
Serveur de génération de texte utilisant mlx-lm
Optimisé pour Apple Silicon avec MLX

Communication via stdin/stdout en JSON
"""

import sys
import json
import os
from typing import Dict, List, Optional, Generator
from pathlib import Path

try:
    from mlx_lm import load, generate
    from mlx_lm.utils import generate_step
    MLX_AVAILABLE = True
except ImportError:
    MLX_AVAILABLE = False
    sys.stderr.write("[MLX LLM] Warning: mlx-lm not installed\n")
    sys.stderr.flush()


class MLXLLMServer:
    """Serveur MLX pour génération de texte avec LLM"""

    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.current_model_name = None
        self.model_path = None
        self.default_temp = 0.7
        self.default_top_p = 0.9
        self.default_max_tokens = 2048

    def load_model(self, model_path: str, adapter_path: Optional[str] = None) -> Dict:
        """Charge un modèle MLX"""
        try:
            if not MLX_AVAILABLE:
                return {
                    "success": False,
                    "error": "mlx-lm not installed. Install with: pip install mlx-lm"
                }

            sys.stderr.write(f"[MLX LLM] Loading model: {model_path}\n")
            sys.stderr.flush()

            # Vérifier si le modèle existe localement
            if not os.path.exists(model_path):
                # Si c'est un repo Hugging Face, mlx-lm le téléchargera automatiquement
                sys.stderr.write(f"[MLX LLM] Model not found locally, will download from HF\n")
                sys.stderr.flush()

            # Charger le modèle et le tokenizer
            self.model, self.tokenizer = load(model_path, adapter_path=adapter_path)
            self.current_model_name = model_path
            self.model_path = model_path

            sys.stderr.write(f"[MLX LLM] Model loaded successfully\n")
            sys.stderr.flush()

            return {
                "success": True,
                "model": model_path,
                "ready": True
            }

        except Exception as e:
            sys.stderr.write(f"[MLX LLM] Error loading model: {str(e)}\n")
            sys.stderr.flush()
            return {
                "success": False,
                "error": str(e)
            }

    def unload_model(self) -> Dict:
        """Décharge le modèle pour libérer la mémoire"""
        try:
            self.model = None
            self.tokenizer = None
            self.current_model_name = None
            self.model_path = None

            sys.stderr.write("[MLX LLM] Model unloaded\n")
            sys.stderr.flush()

            return {
                "success": True,
                "message": "Model unloaded successfully"
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

    def generate_text(
        self,
        prompt: str,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        stream: bool = True
    ) -> Dict:
        """Génère du texte à partir d'un prompt"""
        try:
            if self.model is None or self.tokenizer is None:
                return {
                    "success": False,
                    "error": "No model loaded. Load a model first."
                }

            # Paramètres de génération
            max_tokens = max_tokens or self.default_max_tokens
            temperature = temperature or self.default_temp
            top_p = top_p or self.default_top_p

            sys.stderr.write(f"[MLX LLM] Generating (max_tokens={max_tokens}, temp={temperature}, top_p={top_p})\n")
            sys.stderr.flush()

            if stream:
                # Génération en streaming
                response_text = ""
                for text in generate(
                    self.model,
                    self.tokenizer,
                    prompt=prompt,
                    max_tokens=max_tokens,
                    temp=temperature,
                    top_p=top_p,
                    verbose=False
                ):
                    response_text = text
                    # Envoyer chaque chunk
                    chunk_response = {
                        "success": True,
                        "type": "chunk",
                        "content": text,
                        "done": False
                    }
                    print(json.dumps(chunk_response))
                    sys.stdout.flush()

                # Envoyer le message de fin
                final_response = {
                    "success": True,
                    "type": "complete",
                    "content": response_text,
                    "done": True
                }
                return final_response
            else:
                # Génération non-streaming
                response = generate(
                    self.model,
                    self.tokenizer,
                    prompt=prompt,
                    max_tokens=max_tokens,
                    temp=temperature,
                    top_p=top_p,
                    verbose=False
                )

                return {
                    "success": True,
                    "content": response,
                    "model": self.current_model_name
                }

        except Exception as e:
            sys.stderr.write(f"[MLX LLM] Generation error: {str(e)}\n")
            sys.stderr.flush()
            return {
                "success": False,
                "error": str(e)
            }

    def chat(
        self,
        messages: List[Dict[str, str]],
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        stream: bool = True
    ) -> Dict:
        """Chat avec historique de messages"""
        try:
            if self.model is None or self.tokenizer is None:
                return {
                    "success": False,
                    "error": "No model loaded. Load a model first."
                }

            # Formatter les messages en prompt
            # Format standard pour la plupart des modèles de chat
            prompt = self._format_chat_messages(messages)

            # Utiliser generate_text avec le prompt formaté
            return self.generate_text(
                prompt=prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                stream=stream
            )

        except Exception as e:
            sys.stderr.write(f"[MLX LLM] Chat error: {str(e)}\n")
            sys.stderr.flush()
            return {
                "success": False,
                "error": str(e)
            }

    def _format_chat_messages(self, messages: List[Dict[str, str]]) -> str:
        """Formate les messages de chat en prompt"""
        # Format ChatML par défaut (compatible avec la plupart des modèles)
        formatted = ""
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")

            if role == "system":
                formatted += f"<|im_start|>system\n{content}<|im_end|>\n"
            elif role == "user":
                formatted += f"<|im_start|>user\n{content}<|im_end|>\n"
            elif role == "assistant":
                formatted += f"<|im_start|>assistant\n{content}<|im_end|>\n"

        # Ajouter le début de la réponse de l'assistant
        formatted += "<|im_start|>assistant\n"

        return formatted

    def get_status(self) -> Dict:
        """Retourne le statut du serveur"""
        return {
            "success": True,
            "model_loaded": self.current_model_name,
            "ready": self.model is not None,
            "mlx_available": MLX_AVAILABLE
        }

    def handle_request(self, request: Dict) -> Dict:
        """Traite une requête"""
        command = request.get("command")

        if command == "load":
            model_path = request.get("model_path")
            adapter_path = request.get("adapter_path")
            return self.load_model(model_path, adapter_path)

        elif command == "unload":
            return self.unload_model()

        elif command == "generate":
            prompt = request.get("prompt", "")
            max_tokens = request.get("max_tokens")
            temperature = request.get("temperature")
            top_p = request.get("top_p")
            stream = request.get("stream", True)
            return self.generate_text(prompt, max_tokens, temperature, top_p, stream)

        elif command == "chat":
            messages = request.get("messages", [])
            max_tokens = request.get("max_tokens")
            temperature = request.get("temperature")
            top_p = request.get("top_p")
            stream = request.get("stream", True)
            return self.chat(messages, max_tokens, temperature, top_p, stream)

        elif command == "status":
            return self.get_status()

        elif command == "ping":
            return {"success": True, "message": "pong"}

        else:
            return {
                "success": False,
                "error": f"Unknown command: {command}"
            }

    def run(self):
        """Boucle principale de traitement des requêtes"""
        sys.stderr.write("[MLX LLM] Server started\n")
        sys.stderr.flush()

        while True:
            try:
                # Lire une ligne depuis stdin
                line = sys.stdin.readline()

                if not line:
                    # EOF - terminer proprement
                    sys.stderr.write("[MLX LLM] Received EOF, shutting down\n")
                    sys.stderr.flush()
                    break

                # Parser la requête JSON
                request = json.loads(line.strip())

                # Traiter la requête
                response = self.handle_request(request)

                # Envoyer la réponse en JSON (sauf si c'est du streaming, déjà envoyé)
                if response.get("type") != "chunk":
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
                sys.stderr.write("[MLX LLM] Received interrupt, shutting down\n")
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
    server = MLXLLMServer()
    server.run()


if __name__ == "__main__":
    main()
