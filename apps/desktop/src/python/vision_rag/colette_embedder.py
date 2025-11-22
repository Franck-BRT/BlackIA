#!/usr/bin/env python3
"""
Colette Vision RAG Embedder
Intègre le système Colette de JoliBrain pour le Vision RAG

Colette utilise ColPali ou Qwen2-VL pour générer des embeddings de patches visuels
à partir de documents (PDFs, images).

Installation:
    pip install colpali-engine torch torchvision pdf2image pillow

Référence: https://github.com/jolibrain/colette
"""

import sys
import json
import io

# BUILD VERSION IDENTIFIER - This will appear in logs even if imports fail
print("[COLETTE_EMBEDDER_BUILD_2025-01-19-v3]", file=sys.stderr, flush=True)

# CRITICAL FIX: Redirect stdout IMMEDIATELY to prevent ANY non-JSON output
# This must happen BEFORE any imports that might write to stdout
_ORIGINAL_STDOUT = sys.stdout
sys.stdout = io.StringIO()

import argparse
from pathlib import Path
from typing import List, Dict, Any, Tuple
import warnings

warnings.filterwarnings('ignore')

try:
    from PIL import Image
    import torch
    import transformers
    from colpali_engine.models import ColPali, ColPaliProcessor
    from pdf2image import convert_from_path
    import numpy as np
    # Import poppler_utils - gérer import relatif et absolu
    try:
        from .poppler_utils import check_poppler_installed, get_installation_instructions
    except ImportError:
        from poppler_utils import check_poppler_installed, get_installation_instructions

    # Log version info to stderr for debugging (won't pollute JSON stdout)
    print(f"[Colette] ✓ Dependencies loaded - transformers v{transformers.__version__}, torch v{torch.__version__}", file=sys.stderr)
except ImportError as e:
    # Restore stdout for error output
    sys.stdout = _ORIGINAL_STDOUT
    print(json.dumps({
        "success": False,
        "error": f"Missing dependencies: {str(e)}. Install with: pip install colpali-engine torch torchvision pdf2image pillow"
    }), file=sys.stderr)
    sys.exit(1)


class ColetteEmbedder:
    """
    Wrapper pour Colette Vision RAG
    Utilise ColPali pour générer des embeddings multi-vecteurs (late interaction)
    """

    def __init__(self, model_name: str = "vidore/colpali", device: str = "auto"):
        """
        Initialize Colette embedder

        Args:
            model_name: Model name (colpali or qwen2-vl)
            device: Device to use (cuda, mps, cpu, or auto)
        """
        self.model_name = model_name

        # Auto-detect device
        if device == "auto":
            if torch.cuda.is_available():
                self.device = "cuda"
            elif torch.backends.mps.is_available():
                self.device = "mps"
            else:
                self.device = "cpu"
        else:
            self.device = device

        print(f"[Colette] Using device: {self.device}", file=sys.stderr)
        print(f"[Colette] Loading model: {model_name}", file=sys.stderr)

        try:
            # Load ColPali model and processor
            # stdout is already redirected, so any output from transformers goes nowhere
            self.model = ColPali.from_pretrained(
                model_name,
                torch_dtype=torch.float16 if self.device != "cpu" else torch.float32,
            ).to(self.device)

            self.processor = ColPaliProcessor.from_pretrained(model_name)

            self.model.eval()

            print(f"[Colette] Model loaded successfully", file=sys.stderr)

        except Exception as e:
            print(f"[Colette] Error loading model: {str(e)}", file=sys.stderr)
            raise

    def load_images_from_paths(self, image_paths: List[str], save_cache: bool = False) -> Tuple[List[Image.Image], List[str]]:
        """
        Load images from file paths

        Args:
            image_paths: List of image file paths
            save_cache: If True, save converted PDF pages to cache and return paths

        Returns:
            Tuple of (List of PIL Images, List of cached image paths)
        """
        import tempfile
        import os

        # Vérifier poppler pour la conversion PDF
        poppler_installed, poppler_path = check_poppler_installed()

        if not poppler_installed:
            error_msg = get_installation_instructions()
            print(f"[Colette] ERROR: {error_msg}", file=sys.stderr)
            raise RuntimeError(f"poppler not installed. {error_msg}")

        images = []
        cached_paths = []

        for path_str in image_paths:
            try:
                path = Path(path_str)

                if not path.exists():
                    print(f"[Colette] Warning: File not found: {path_str}", file=sys.stderr)
                    continue

                # Handle PDF
                if path.suffix.lower() == '.pdf':
                    # Convert PDF pages to images with poppler_path if needed
                    convert_kwargs = {}
                    if poppler_path:
                        convert_kwargs["poppler_path"] = poppler_path
                        print(f"[Colette] Using poppler from: {poppler_path}", file=sys.stderr)

                    pdf_images = convert_from_path(str(path), **convert_kwargs)
                    images.extend(pdf_images)
                    print(f"[Colette] Converted PDF to {len(pdf_images)} images", file=sys.stderr)

                    # Save to cache if requested
                    if save_cache:
                        # Use home directory for cache to avoid permission issues
                        home = Path.home()
                        cache_dir = home / ".blackia" / "colette_cache"

                        try:
                            cache_dir.mkdir(parents=True, exist_ok=True)
                            print(f"[Colette] Cache directory: {cache_dir}", file=sys.stderr)
                        except Exception as cache_error:
                            print(f"[Colette] ERROR creating cache dir: {cache_error}", file=sys.stderr)
                            # Fallback to temp directory
                            cache_dir = Path(tempfile.gettempdir()) / "blackia_colette_cache"
                            cache_dir.mkdir(parents=True, exist_ok=True)
                            print(f"[Colette] Using fallback cache: {cache_dir}", file=sys.stderr)

                        # Use PDF name as base for cached images
                        pdf_name = path.stem

                        for page_idx, img in enumerate(pdf_images):
                            try:
                                cache_path = cache_dir / f"{pdf_name}_page_{page_idx}.png"
                                img.save(str(cache_path), "PNG")
                                cached_paths.append(str(cache_path))
                            except Exception as save_error:
                                print(f"[Colette] ERROR saving page {page_idx}: {save_error}", file=sys.stderr)
                                continue

                        print(f"[Colette] Saved {len(cached_paths)} pages to cache: {cache_dir}", file=sys.stderr)
                else:
                    # Load image directly
                    img = Image.open(path).convert('RGB')
                    images.append(img)
                    cached_paths.append(path_str)  # Original path for direct images

            except Exception as e:
                print(f"[Colette] Error loading {path_str}: {str(e)}", file=sys.stderr)
                continue

        return images, cached_paths

    def generate_embeddings(self, images: List[Image.Image]) -> Tuple[List[np.ndarray], Dict[str, Any]]:
        """
        Generate embeddings for images using ColPali

        Args:
            images: List of PIL Images

        Returns:
            Tuple of (embeddings, metadata)
            embeddings: List of patch embeddings per image [num_images, num_patches, embedding_dim]
            metadata: Dict with model info, dimensions, etc.
        """
        if not images:
            raise ValueError("No images provided")

        print(f"[Colette] Generating embeddings for {len(images)} images", file=sys.stderr)

        try:
            # Process images
            batch_images = self.processor.process_images(images).to(self.device)

            with torch.no_grad():
                # Generate embeddings - ColPali returns multi-vector representations
                image_embeddings = self.model(**batch_images)

            # Convert to numpy and move to CPU
            embeddings_list = []
            for img_emb in image_embeddings:
                # img_emb shape: [num_patches, embedding_dim]
                emb_np = img_emb.cpu().float().numpy()
                embeddings_list.append(emb_np)

            # Get embedding dimensions
            num_patches = embeddings_list[0].shape[0] if embeddings_list else 0
            embedding_dim = embeddings_list[0].shape[1] if embeddings_list else 0

            metadata = {
                "model": self.model_name,
                "device": self.device,
                "num_images": len(images),
                "num_patches_per_image": num_patches,
                "embedding_dim": embedding_dim,
                "total_patches": len(embeddings_list) * num_patches,
            }

            print(f"[Colette] Generated {len(embeddings_list)} page embeddings", file=sys.stderr)
            print(f"[Colette] Patches per page: {num_patches}, Dim: {embedding_dim}", file=sys.stderr)

            return embeddings_list, metadata

        except Exception as e:
            print(f"[Colette] Error generating embeddings: {str(e)}", file=sys.stderr)
            raise

    def encode_query(self, query: str) -> np.ndarray:
        """
        Encode text query for retrieval

        Args:
            query: Text query

        Returns:
            Query embedding
        """
        try:
            batch_queries = self.processor.process_queries([query]).to(self.device)

            with torch.no_grad():
                query_embeddings = self.model(**batch_queries)

            # Take first query
            query_emb = query_embeddings[0].cpu().float().numpy()

            return query_emb

        except Exception as e:
            print(f"[Colette] Error encoding query: {str(e)}", file=sys.stderr)
            raise


def main():
    """Main entry point for the embedder"""
    try:
        # stdout is already redirected at module level
        parser = argparse.ArgumentParser(description="Colette Vision RAG Embedder")
        parser.add_argument("--input", type=str, required=True, help="JSON input file or string")
        parser.add_argument("--mode", type=str, default="embed_images",
                           choices=["embed_images", "encode_query"],
                           help="Operation mode")
        parser.add_argument("--model", type=str, default="vidore/colpali",
                           help="Model name (vidore/colpali or vidore/colqwen2)")
        parser.add_argument("--device", type=str, default="auto",
                           help="Device (cuda, mps, cpu, auto)")

        args = parser.parse_args()

        # Parse input
        try:
            input_data = json.loads(args.input)
        except json.JSONDecodeError:
            # Try loading from file
            with open(args.input, 'r') as f:
                input_data = json.load(f)

        # Initialize embedder
        embedder = ColetteEmbedder(model_name=args.model, device=args.device)

        if args.mode == "embed_images":
            # Get image paths
            image_paths = input_data.get("image_paths", [])
            if not image_paths:
                raise ValueError("No image_paths provided in input")

            # Load images with cache enabled
            images, cached_paths = embedder.load_images_from_paths(image_paths, save_cache=True)

            if not images:
                raise ValueError("No images could be loaded")

            # Generate embeddings
            embeddings, metadata = embedder.generate_embeddings(images)

            # Convert embeddings to list for JSON serialization
            embeddings_list = [emb.tolist() for emb in embeddings]

            # Output result
            result = {
                "success": True,
                "embeddings": embeddings_list,
                "metadata": metadata,
                "cached_image_paths": cached_paths,  # Return paths to cached images
            }

        elif args.mode == "encode_query":
            # Get query
            query = input_data.get("query", "")
            if not query:
                raise ValueError("No query provided in input")

            # Encode query
            query_emb = embedder.encode_query(query)

            # Output result
            result = {
                "success": True,
                "query_embedding": query_emb.tolist(),
                "embedding_dim": query_emb.shape[-1],
            }

        # Restore stdout for JSON output ONLY
        sys.stdout = _ORIGINAL_STDOUT

        # Print result as JSON (THIS IS THE ONLY STDOUT OUTPUT)
        print(json.dumps(result))

    except Exception as e:
        # Restore stdout in case of error
        sys.stdout = _ORIGINAL_STDOUT
        error_result = {
            "success": False,
            "error": str(e),
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
