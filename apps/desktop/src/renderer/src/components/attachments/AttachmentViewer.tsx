/**
 * AttachmentViewer - Modal fullscreen pour visualiser les fichiers
 * Supporte images, PDFs, et fichiers texte
 */

import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Maximize2 } from 'lucide-react';
import type { Attachment } from '../../types/attachment';

export interface AttachmentViewerProps {
  /**
   * Attachment actuellement affiché
   */
  attachment: Attachment;

  /**
   * Liste de tous les attachments pour navigation
   */
  attachments?: Attachment[];

  /**
   * Index de l'attachment actuel dans la liste
   */
  currentIndex?: number;

  /**
   * Callback de fermeture
   */
  onClose: () => void;

  /**
   * Callback de navigation
   */
  onNavigate?: (index: number) => void;

  /**
   * Callback de téléchargement
   */
  onDownload?: (attachment: Attachment) => void;
}

export function AttachmentViewer({
  attachment,
  attachments = [],
  currentIndex = 0,
  onClose,
  onNavigate,
  onDownload,
}: AttachmentViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset zoom quand l'attachment change
  useEffect(() => {
    setZoom(100);
    setFileContent(null);
    setError(null);
  }, [attachment.id]);

  // Charger le contenu du fichier pour les fichiers texte
  useEffect(() => {
    if (attachment.mimeType.startsWith('text/') || isTextBasedMime(attachment.mimeType)) {
      loadTextContent();
    }
  }, [attachment.id, attachment.mimeType]);

  const loadTextContent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await window.api.attachments.download(attachment.id);
      if (result.success && result.data) {
        // Convertir le Buffer en texte
        const text = new TextDecoder().decode(new Uint8Array(result.data.buffer));
        setFileContent(text);
      } else {
        setError(result.error || 'Échec du chargement du fichier');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0 && onNavigate) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < attachments.length - 1 && onNavigate) {
      onNavigate(currentIndex + 1);
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 300));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 25));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(attachment);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft') {
      handlePrevious();
    } else if (e.key === 'ArrowRight') {
      handleNext();
    } else if (e.key === '+' || e.key === '=') {
      handleZoomIn();
    } else if (e.key === '-') {
      handleZoomOut();
    } else if (e.key === '0') {
      handleResetZoom();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, attachments.length]);

  const isImage = attachment.mimeType.startsWith('image/');
  const isPdf = attachment.mimeType === 'application/pdf';
  const isText = attachment.mimeType.startsWith('text/') || isTextBasedMime(attachment.mimeType);

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/50">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-white truncate max-w-md">
            {attachment.originalName}
          </h2>
          <span className="text-sm text-gray-400">
            {formatFileSize(attachment.size)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation */}
          {attachments.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white"
                title="Précédent (←)"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <span className="text-sm text-gray-400 min-w-[80px] text-center">
                {currentIndex + 1} / {attachments.length}
              </span>

              <button
                onClick={handleNext}
                disabled={currentIndex === attachments.length - 1}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-white"
                title="Suivant (→)"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="w-px h-6 bg-white/10 mx-2" />
            </>
          )}

          {/* Zoom controls pour images */}
          {isImage && (
            <>
              <button
                onClick={handleZoomOut}
                disabled={zoom <= 25}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 text-white"
                title="Zoom - (-)"
              >
                <ZoomOut className="w-5 h-5" />
              </button>

              <span className="text-sm text-gray-400 min-w-[60px] text-center">
                {zoom}%
              </span>

              <button
                onClick={handleZoomIn}
                disabled={zoom >= 300}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 text-white"
                title="Zoom + (+)"
              >
                <ZoomIn className="w-5 h-5" />
              </button>

              <button
                onClick={handleResetZoom}
                className="p-2 rounded-lg hover:bg-white/10 text-white"
                title="Réinitialiser (0)"
              >
                <Maximize2 className="w-5 h-5" />
              </button>

              <div className="w-px h-6 bg-white/10 mx-2" />
            </>
          )}

          {/* Download */}
          {onDownload && (
            <button
              onClick={handleDownload}
              className="p-2 rounded-lg hover:bg-white/10 text-white"
              title="Télécharger"
            >
              <Download className="w-5 h-5" />
            </button>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white"
            title="Fermer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {error && (
          <div className="text-center">
            <div className="text-red-400 mb-2">❌ Erreur de chargement</div>
            <div className="text-sm text-gray-400">{error}</div>
          </div>
        )}

        {isLoading && (
          <div className="text-center">
            <div className="text-gray-400">Chargement...</div>
          </div>
        )}

        {!error && !isLoading && (
          <>
            {/* Image viewer */}
            {isImage && (
              <img
                src={`attachment://${attachment.id}`}
                alt={attachment.originalName}
                style={{
                  maxWidth: `${zoom}%`,
                  maxHeight: `${zoom}%`,
                  objectFit: 'contain',
                }}
                className="transition-all duration-200"
              />
            )}

            {/* PDF viewer */}
            {isPdf && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📄</div>
                  <div className="text-white text-xl mb-2">{attachment.originalName}</div>
                  <div className="text-gray-400 mb-4">Visualisation PDF à venir</div>
                  <div className="text-sm text-gray-500">
                    Pour le moment, utilisez le bouton télécharger pour ouvrir le PDF dans votre lecteur
                  </div>
                </div>
              </div>
            )}

            {/* Text viewer */}
            {isText && fileContent && (
              <div className="w-full max-w-4xl mx-auto">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-black/30 p-6 rounded-lg">
                  {fileContent}
                </pre>
              </div>
            )}

            {/* Unsupported */}
            {!isImage && !isPdf && !isText && (
              <div className="text-center">
                <div className="text-6xl mb-4">📎</div>
                <div className="text-white text-xl mb-2">{attachment.originalName}</div>
                <div className="text-gray-400 mb-4">Type de fichier non prévisualisable</div>
                <div className="text-sm text-gray-500">MIME: {attachment.mimeType}</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer with metadata */}
      {attachment.extractedText && (
        <div className="border-t border-white/10 p-4 bg-black/50">
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-400 hover:text-white">
              Texte extrait ({attachment.extractedText.length} caractères)
            </summary>
            <pre className="mt-2 text-gray-300 whitespace-pre-wrap font-mono text-xs max-h-32 overflow-y-auto">
              {attachment.extractedText}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

// Helper functions

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function isTextBasedMime(mimeType: string): boolean {
  const textBased = [
    'application/json',
    'application/javascript',
    'application/xml',
    'application/x-yaml',
    'application/yaml',
  ];

  return textBased.includes(mimeType);
}
