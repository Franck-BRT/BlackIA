"""
Document Processor
Convertit les PDFs en images pour Vision RAG
Supporte aussi l'extraction de métadonnées
"""

import sys
import json
import os
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
import tempfile

try:
    from pdf2image import convert_from_path
    from PIL import Image
    # Import poppler_utils - gérer import relatif et absolu
    try:
        from .poppler_utils import check_poppler_installed, get_installation_instructions
    except ImportError:
        from poppler_utils import check_poppler_installed, get_installation_instructions
except ImportError as e:
    print(json.dumps({
        "success": False,
        "error": f"Dependencies not installed: {e}. Run: cd src/python && ./setup.sh",
    }), file=sys.stderr)
    sys.exit(1)


class DocumentProcessor:
    """
    Convertit des PDFs en images pour Vision RAG

    Features:
    - Conversion PDF → PNG/JPEG
    - Résolution configurable (DPI)
    - Extraction métadonnées PDF
    - Support multi-pages
    - Optimisation qualité/taille
    """

    def __init__(
        self,
        dpi: int = 200,
        output_format: str = "PNG",
        verbose: bool = False,
    ):
        """
        Args:
            dpi: Résolution de sortie (défaut: 200 DPI)
            output_format: Format de sortie (PNG, JPEG)
            verbose: Activer les logs détaillés
        """
        self.dpi = dpi
        self.output_format = output_format.upper()
        self.verbose = verbose

        if self.output_format not in ["PNG", "JPEG", "JPG"]:
            raise ValueError(f"Unsupported format: {output_format}")

    def pdf_to_images(
        self,
        pdf_path: str,
        output_dir: str,
        filename_prefix: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Convertit un PDF en images (une par page)

        Args:
            pdf_path: Chemin vers le PDF
            output_dir: Répertoire de sortie pour les images
            filename_prefix: Préfixe optionnel pour les noms de fichiers

        Returns:
            Dict avec:
            - success: bool
            - imagePaths: List[str] - chemins des images générées
            - pageCount: int
            - metadata: Dict - métadonnées PDF extraites
            - error: str (si échec)
        """
        try:
            pdf_path = Path(pdf_path)
            output_dir = Path(output_dir)

            if not pdf_path.exists():
                return {
                    "success": False,
                    "error": f"PDF file not found: {pdf_path}",
                }

            # Créer le répertoire de sortie si nécessaire
            output_dir.mkdir(parents=True, exist_ok=True)

            if self.verbose:
                print(f"[DocumentProcessor] Converting PDF: {pdf_path}", file=sys.stderr)
                print(f"[DocumentProcessor] Output dir: {output_dir}", file=sys.stderr)
                print(f"[DocumentProcessor] DPI: {self.dpi}", file=sys.stderr)

            # Vérifier poppler pour la conversion PDF
            poppler_installed, poppler_path = check_poppler_installed()

            if not poppler_installed:
                error_msg = get_installation_instructions()
                return {
                    "success": False,
                    "error": f"poppler not installed. {error_msg}",
                }

            # Convertir PDF → images
            convert_kwargs = {
                "dpi": self.dpi,
                "fmt": self.output_format.lower(),
            }
            if poppler_path:
                convert_kwargs["poppler_path"] = poppler_path
                if self.verbose:
                    print(f"[DocumentProcessor] Using poppler from: {poppler_path}", file=sys.stderr)

            images = convert_from_path(pdf_path, **convert_kwargs)

            if self.verbose:
                print(f"[DocumentProcessor] Converted {len(images)} pages", file=sys.stderr)

            # Générer les noms de fichiers
            prefix = filename_prefix or pdf_path.stem
            extension = "png" if self.output_format == "PNG" else "jpg"

            image_paths = []

            for i, image in enumerate(images):
                # Nom: prefix_page_001.png, prefix_page_002.png, etc.
                filename = f"{prefix}_page_{i + 1:03d}.{extension}"
                filepath = output_dir / filename

                # Sauvegarder l'image
                if self.output_format == "JPEG":
                    # JPEG nécessite RGB (pas RGBA)
                    if image.mode == "RGBA":
                        image = image.convert("RGB")
                    image.save(filepath, "JPEG", quality=95, optimize=True)
                else:
                    image.save(filepath, "PNG", optimize=True)

                image_paths.append(str(filepath))

                if self.verbose:
                    print(f"[DocumentProcessor] Saved page {i + 1}: {filepath}", file=sys.stderr)

            # Extraire métadonnées PDF (si possible)
            metadata = self._extract_pdf_metadata(pdf_path)

            return {
                "success": True,
                "imagePaths": image_paths,
                "pageCount": len(images),
                "metadata": metadata,
            }

        except Exception as e:
            error_msg = f"Error converting PDF: {str(e)}"
            if self.verbose:
                print(f"[DocumentProcessor] ERROR: {error_msg}", file=sys.stderr)
                import traceback
                traceback.print_exc(file=sys.stderr)
            return {
                "success": False,
                "error": error_msg,
            }

    def _extract_pdf_metadata(self, pdf_path: Path) -> Dict[str, Any]:
        """
        Extrait les métadonnées d'un PDF

        Args:
            pdf_path: Chemin vers le PDF

        Returns:
            Dict avec title, author, creationDate, etc.
        """
        try:
            # Nécessite PyPDF2 ou pdfplumber
            # Pour l'instant, retourner des métadonnées basiques
            return {
                "filename": pdf_path.name,
                "size": pdf_path.stat().st_size,
                "extension": pdf_path.suffix,
            }
        except Exception as e:
            if self.verbose:
                print(f"[DocumentProcessor] Warning: Could not extract metadata: {e}", file=sys.stderr)
            return {}

    def resize_image(
        self,
        image_path: str,
        max_width: int = 1024,
        max_height: int = 1024,
        output_path: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Redimensionne une image (pour optimisation)

        Args:
            image_path: Chemin vers l'image
            max_width: Largeur max
            max_height: Hauteur max
            output_path: Chemin de sortie (ou écrase l'original si None)

        Returns:
            Dict avec success, outputPath, error
        """
        try:
            image = Image.open(image_path)
            original_size = image.size

            # Calculer le nouveau size en gardant l'aspect ratio
            image.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)

            # Sauvegarder
            output = output_path or image_path
            image.save(output, optimize=True)

            if self.verbose:
                print(f"[DocumentProcessor] Resized {original_size} → {image.size}", file=sys.stderr)

            return {
                "success": True,
                "outputPath": output,
                "originalSize": original_size,
                "newSize": image.size,
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
            }

    def optimize_images_for_vision(
        self,
        image_paths: List[str],
        target_size: Tuple[int, int] = (1024, 1024),
    ) -> List[str]:
        """
        Optimise plusieurs images pour Vision RAG
        (redimensionnement uniforme pour batch processing)

        Args:
            image_paths: Liste de chemins images
            target_size: Taille cible (width, height)

        Returns:
            Liste de chemins des images optimisées
        """
        optimized_paths = []

        for img_path in image_paths:
            result = self.resize_image(
                img_path,
                max_width=target_size[0],
                max_height=target_size[1],
            )

            if result["success"]:
                optimized_paths.append(result["outputPath"])
            else:
                optimized_paths.append(img_path)  # Fallback sur l'original

        return optimized_paths


def main():
    """
    Point d'entrée CLI pour tester le module
    Usage: python document_processor.py <pdf_path> <output_dir> [--dpi 200]
    """
    import argparse

    parser = argparse.ArgumentParser(description="PDF to Images converter for Vision RAG")
    parser.add_argument("pdf_path", help="Path to PDF file")
    parser.add_argument("output_dir", help="Output directory for images")
    parser.add_argument("--dpi", type=int, default=200, help="Resolution in DPI (default: 200)")
    parser.add_argument("--format", default="PNG", choices=["PNG", "JPEG"], help="Output format")
    parser.add_argument("--prefix", help="Filename prefix for images")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")
    parser.add_argument("--output", help="Output JSON file path")

    args = parser.parse_args()

    # Créer le processor
    processor = DocumentProcessor(
        dpi=args.dpi,
        output_format=args.format,
        verbose=args.verbose,
    )

    # Convertir le PDF
    result = processor.pdf_to_images(
        args.pdf_path,
        args.output_dir,
        filename_prefix=args.prefix,
    )

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
