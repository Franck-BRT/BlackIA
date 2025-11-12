/**
 * Service d'extraction de texte des fichiers
 * Supporte PDFs et fichiers texte
 */

import fs from 'fs/promises';
import path from 'path';

let pdfParse: any = null;

// Chargement lazy de pdf-parse
async function loadPdfParse() {
  if (pdfParse) return pdfParse;

  try {
    pdfParse = (await import('pdf-parse')).default;
    console.log('[TextExtractionService] pdf-parse chargé avec succès');
    return pdfParse;
  } catch (error) {
    console.warn('[TextExtractionService] pdf-parse non disponible:', error);
    console.warn('[TextExtractionService] Installez pdf-parse avec: pnpm add pdf-parse');
    return null;
  }
}

/**
 * Extrait le texte d'un fichier PDF
 */
export async function extractTextFromPdf(filePath: string): Promise<string> {
  const parse = await loadPdfParse();

  if (!parse) {
    throw new Error('pdf-parse n\'est pas installé. Installez-le avec: pnpm add pdf-parse');
  }

  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await parse(dataBuffer);

    console.log('[TextExtractionService] PDF extrait:', {
      path: filePath,
      pages: data.numpages,
      textLength: data.text.length,
    });

    return data.text.trim();
  } catch (error) {
    console.error('[TextExtractionService] Erreur extraction PDF:', error);
    throw new Error(`Échec de l'extraction du texte du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Extrait le texte d'un fichier texte brut
 */
export async function extractTextFromTextFile(filePath: string): Promise<string> {
  try {
    const text = await fs.readFile(filePath, 'utf-8');

    console.log('[TextExtractionService] Texte extrait:', {
      path: filePath,
      textLength: text.length,
    });

    return text.trim();
  } catch (error) {
    console.error('[TextExtractionService] Erreur extraction texte:', error);
    throw new Error(`Échec de la lecture du fichier texte: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
}

/**
 * Extrait le texte d'un fichier selon son type MIME
 */
export async function extractText(filePath: string, mimeType: string): Promise<string | null> {
  try {
    // PDFs
    if (mimeType === 'application/pdf') {
      return await extractTextFromPdf(filePath);
    }

    // Fichiers texte
    if (mimeType.startsWith('text/')) {
      return await extractTextFromTextFile(filePath);
    }

    // Types spécifiques basés sur texte
    const textBasedMimes = [
      'application/json',
      'application/javascript',
      'application/xml',
      'application/x-yaml',
    ];

    if (textBasedMimes.includes(mimeType)) {
      return await extractTextFromTextFile(filePath);
    }

    // Pas d'extraction pour les autres types (images, etc.)
    console.log('[TextExtractionService] Pas d\'extraction de texte pour:', mimeType);
    return null;
  } catch (error) {
    console.error('[TextExtractionService] Erreur lors de l\'extraction:', error);
    // Ne pas throw, retourner null pour permettre l'upload quand même
    return null;
  }
}

/**
 * Vérifie si l'extraction de texte est disponible pour un type MIME
 */
export function isTextExtractionSupported(mimeType: string): boolean {
  if (mimeType === 'application/pdf') {
    return pdfParse !== null;
  }

  if (mimeType.startsWith('text/')) {
    return true;
  }

  const textBasedMimes = [
    'application/json',
    'application/javascript',
    'application/xml',
    'application/x-yaml',
  ];

  return textBasedMimes.includes(mimeType);
}

/**
 * Obtient des statistiques sur le texte extrait
 */
export function getTextStats(text: string): {
  length: number;
  words: number;
  lines: number;
} {
  const lines = text.split('\n').length;
  const words = text.split(/\s+/).filter(w => w.length > 0).length;

  return {
    length: text.length,
    words,
    lines,
  };
}
