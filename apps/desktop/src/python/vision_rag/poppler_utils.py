#!/usr/bin/env python3
"""
Poppler Utils - Détection automatique de poppler pour pdf2image
Gère la détection de poppler sur macOS, Linux et Windows
"""

import sys
import os
import shutil
from pathlib import Path
from typing import Optional


def find_poppler_path() -> Optional[str]:
    """
    Détecte automatiquement le chemin vers poppler sur le système

    Returns:
        Le chemin vers le répertoire bin de poppler, ou None si non trouvé
    """
    # Si pdftoppm est dans le PATH, pas besoin de spécifier poppler_path
    if shutil.which('pdftoppm'):
        return None

    # Liste des chemins courants pour poppler sur différents systèmes
    possible_paths = []

    # macOS (Homebrew)
    if sys.platform == 'darwin':
        possible_paths.extend([
            '/opt/homebrew/bin',  # Apple Silicon
            '/usr/local/bin',      # Intel
            '/opt/homebrew/opt/poppler/bin',
            '/usr/local/opt/poppler/bin',
        ])

    # Linux
    elif sys.platform.startswith('linux'):
        possible_paths.extend([
            '/usr/bin',
            '/usr/local/bin',
        ])

    # Windows
    elif sys.platform == 'win32':
        possible_paths.extend([
            r'C:\Program Files\poppler\Library\bin',
            r'C:\Program Files (x86)\poppler\Library\bin',
            os.path.join(os.environ.get('LOCALAPPDATA', ''), 'poppler', 'Library', 'bin'),
        ])

    # Vérifier chaque chemin
    for path in possible_paths:
        if not path:
            continue

        path_obj = Path(path)
        if not path_obj.exists():
            continue

        # Vérifier si pdftoppm existe dans ce chemin
        pdftoppm = path_obj / ('pdftoppm.exe' if sys.platform == 'win32' else 'pdftoppm')
        if pdftoppm.exists():
            return str(path_obj)

    return None


def check_poppler_installed() -> tuple[bool, Optional[str]]:
    """
    Vérifie si poppler est installé et retourne son chemin

    Returns:
        (installed: bool, path: Optional[str])
    """
    poppler_path = find_poppler_path()

    if poppler_path:
        return True, poppler_path

    # Vérifier dans le PATH sans chemin spécifique
    if shutil.which('pdftoppm'):
        return True, None

    return False, None


def get_installation_instructions() -> str:
    """
    Retourne les instructions d'installation de poppler selon la plateforme

    Returns:
        Instructions d'installation
    """
    if sys.platform == 'darwin':
        return """
poppler n'est pas installé sur votre système macOS.

Pour l'installer avec Homebrew:
  brew install poppler

Puis relancez l'indexation.
"""
    elif sys.platform.startswith('linux'):
        return """
poppler-utils n'est pas installé sur votre système Linux.

Pour l'installer:
  - Debian/Ubuntu: sudo apt-get install poppler-utils
  - Fedora/RHEL:   sudo dnf install poppler-utils
  - Arch Linux:    sudo pacman -S poppler

Puis relancez l'indexation.
"""
    elif sys.platform == 'win32':
        return """
poppler n'est pas installé sur votre système Windows.

Pour l'installer:
  1. Téléchargez poppler depuis: https://github.com/oschwartz10612/poppler-windows/releases
  2. Extrayez l'archive dans C:\\Program Files\\poppler
  3. Ajoutez C:\\Program Files\\poppler\\Library\\bin au PATH

Puis relancez l'indexation.
"""
    else:
        return """
poppler n'est pas installé sur votre système.

Veuillez installer poppler-utils selon votre système d'exploitation.
"""


if __name__ == "__main__":
    """Test de la détection de poppler"""
    installed, path = check_poppler_installed()

    if installed:
        print(f"✓ poppler détecté")
        if path:
            print(f"  Chemin: {path}")
        else:
            print(f"  Disponible dans le PATH")
    else:
        print(f"✗ poppler NON détecté")
        print(get_installation_instructions())
