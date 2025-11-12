/**
 * Service de génération de vignettes
 * Supporte images et PDFs (première page)
 */

import fs from 'fs/promises';
import path from 'path';

let sharp: any = null;

// Chargement lazy de sharp
async function loadSharp() {
  if (sharp) return sharp;

  try {
    sharp = (await import('sharp')).default;
    console.log('[ThumbnailService] sharp chargé avec succès');
    return sharp;
  } catch (error) {
    console.warn('[ThumbnailService] sharp non disponible:', error);
    console.warn('[ThumbnailService] Installez sharp avec: pnpm add sharp');
    return null;
  }
}

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality?: number; // Pour JPEG uniquement
}

const DEFAULT_OPTIONS: ThumbnailOptions = {
  width: 300,
  height: 300,
  fit: 'inside',
  quality: 80,
};

/**
 * Génère une vignette pour une image
 */
export async function generateImageThumbnail(
  inputPath: string,
  outputPath: string,
  options: ThumbnailOptions = {}
): Promise<void> {
  const sharpLib = await loadSharp();

  if (!sharpLib) {
    throw new Error('sharp n\'est pas installé. Installez-le avec: pnpm add sharp');
  }

  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    const pipeline = sharpLib(inputPath)
      .resize({
        width: opts.width,
        height: opts.height,
        fit: opts.fit,
        withoutEnlargement: true,
      });

    // Déterminer le format de sortie basé sur l'extension
    const ext = path.extname(outputPath).toLowerCase();

    if (ext === '.jpg' || ext === '.jpeg') {
      pipeline.jpeg({ quality: opts.quality });
    } else if (ext === '.png') {
      pipeline.png({ compressionLevel: 6 });
    } else if (ext === '.webp') {
      pipeline.webp({ quality: opts.quality });
    }

    await pipeline.toFile(outputPath);

    console.log('[ThumbnailService] Vignette image créée:', {
      input: inputPath,
      output: outputPath,
      options: opts,
    });
  } catch (error) {
    console.error('[ThumbnailService] Erreur création vignette image:', error);
    throw new Error(`Échec de la création de la vignette: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Génère une vignette pour un PDF (première page)
 * Note: Nécessite pdf-poppler ou similaire pour convertir PDF en image
 * Pour l'instant, on retourne null car la conversion PDF->Image nécessite des dépendances natives supplémentaires
 */
export async function generatePdfThumbnail(
  inputPath: string,
  outputPath: string,
  options: ThumbnailOptions = {}
): Promise<void> {
  console.warn('[ThumbnailService] Génération de vignette PDF pas encore implémentée');
  console.warn('[ThumbnailService] Nécessite pdf-poppler ou canvas/pdfjs pour convertir PDF en image');
  throw new Error('Génération de vignette PDF non supportée pour le moment');
}

/**
 * Génère une vignette selon le type MIME
 */
export async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  mimeType: string,
  options: ThumbnailOptions = {}
): Promise<boolean> {
  try {
    // Images
    if (mimeType.startsWith('image/')) {
      await generateImageThumbnail(inputPath, outputPath, options);
      return true;
    }

    // PDFs - pas encore supporté
    if (mimeType === 'application/pdf') {
      console.log('[ThumbnailService] Vignette PDF non supportée pour le moment');
      return false;
    }

    // Pas de vignette pour les autres types
    console.log('[ThumbnailService] Pas de vignette pour:', mimeType);
    return false;
  } catch (error) {
    console.error('[ThumbnailService] Erreur lors de la génération:', error);
    return false;
  }
}

/**
 * Vérifie si la génération de vignette est supportée pour un type MIME
 */
export function isThumbnailSupported(mimeType: string): boolean {
  // Images supportées par sharp
  const supportedImages = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/tiff',
    'image/gif',
    'image/avif',
    'image/svg+xml',
  ];

  if (supportedImages.includes(mimeType)) {
    return sharp !== null;
  }

  // PDFs pas encore supportés
  return false;
}

/**
 * Obtient les dimensions d'une image
 */
export async function getImageDimensions(filePath: string): Promise<{ width: number; height: number } | null> {
  const sharpLib = await loadSharp();

  if (!sharpLib) {
    return null;
  }

  try {
    const metadata = await sharpLib(filePath).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    console.error('[ThumbnailService] Erreur lecture dimensions:', error);
    return null;
  }
}

/**
 * Génère un nom de fichier pour la vignette
 */
export function getThumbnailFilename(originalFilename: string, suffix: string = '_thumb'): string {
  const ext = path.extname(originalFilename);
  const base = path.basename(originalFilename, ext);

  // Toujours utiliser .jpg pour les vignettes (sauf si l'original est .png pour la transparence)
  const thumbExt = ext.toLowerCase() === '.png' ? '.png' : '.jpg';

  return `${base}${suffix}${thumbExt}`;
}
