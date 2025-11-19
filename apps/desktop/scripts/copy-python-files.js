#!/usr/bin/env node
/**
 * Script pour copier les fichiers Python dans le dossier dist
 */

const fs = require('fs');
const path = require('path');

const pythonFiles = [
  {
    src: 'src/main/services/backends/mlx/mlx_embeddings.py',
    dest: 'dist/main/services/backends/mlx/mlx_embeddings.py',
  },
  {
    src: 'src/main/services/backends/mlx/mlx_model_downloader.py',
    dest: 'dist/main/services/backends/mlx/mlx_model_downloader.py',
  },
  {
    src: 'src/main/services/backends/mlx/mlx_embedding_downloader.py',
    dest: 'dist/main/services/backends/mlx/mlx_embedding_downloader.py',
  },
  {
    src: 'src/main/services/backends/mlx/mlx_llm.py',
    dest: 'dist/main/services/backends/mlx/mlx_llm.py',
  },
];

console.log('📦 Copie des fichiers Python...');

for (const file of pythonFiles) {
  const srcPath = path.join(__dirname, '..', file.src);
  const destPath = path.join(__dirname, '..', file.dest);

  // Créer le dossier de destination s'il n'existe pas
  const destDir = path.dirname(destPath);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Copier le fichier s'il existe
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✓ ${file.src} → ${file.dest}`);
  } else {
    console.warn(`⚠ Fichier non trouvé: ${file.src}`);
  }
}

console.log('✅ Copie terminée !');
