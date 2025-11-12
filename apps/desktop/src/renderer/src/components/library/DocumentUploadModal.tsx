/**
 * Document Upload Modal
 * Modal for uploading documents to a library
 */

import React, { useState, useCallback } from 'react';
import { X, Upload, File, Loader2 } from 'lucide-react';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  libraryId: string;
  onUpload: (params: {
    libraryId: string;
    filePath: string;
    originalName: string;
    mimeType: string;
    tags?: string[];
  }) => Promise<void>;
}

interface SelectedFile {
  path: string;
  name: string;
  size: number;
  mimeType: string;
}

export function DocumentUploadModal({
  isOpen,
  onClose,
  libraryId,
  onUpload,
}: DocumentUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleBrowseFiles = useCallback(async () => {
    try {
      const result = await window.electronAPI.file.openDialog({
        title: 'Sélectionner des documents',
        properties: ['openFile', 'multiSelections'],
        filters: [
          { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt', 'md'] },
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] },
          { name: 'Tous les fichiers', extensions: ['*'] },
        ],
      });

      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        const newFiles: SelectedFile[] = result.filePaths.map((filePath) => {
          const fileName = filePath.split(/[\\/]/).pop() || filePath;
          const ext = fileName.split('.').pop()?.toLowerCase() || '';

          // Déterminer le MIME type basé sur l'extension
          let mimeType = 'application/octet-stream';
          if (['pdf'].includes(ext)) mimeType = 'application/pdf';
          else if (['doc', 'docx'].includes(ext)) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          else if (['txt'].includes(ext)) mimeType = 'text/plain';
          else if (['md'].includes(ext)) mimeType = 'text/markdown';
          else if (['jpg', 'jpeg'].includes(ext)) mimeType = 'image/jpeg';
          else if (['png'].includes(ext)) mimeType = 'image/png';
          else if (['gif'].includes(ext)) mimeType = 'image/gif';
          else if (['webp'].includes(ext)) mimeType = 'image/webp';

          return {
            path: filePath,
            name: fileName,
            size: 0, // Size will be determined by backend
            mimeType,
          };
        });

        setSelectedFiles((prev) => [...prev, ...newFiles]);
      }
    } catch (err) {
      console.error('Error selecting files:', err);
      setError('Erreur lors de la sélection des fichiers');
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const addTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (selectedFiles.length === 0) {
      setError('Veuillez sélectionner au moins un fichier');
      return;
    }

    setLoading(true);
    try {
      console.log('[DocumentUploadModal] Uploading files:', selectedFiles.length);

      // Upload each file
      for (const file of selectedFiles) {
        console.log('[DocumentUploadModal] Uploading:', file.name);
        await onUpload({
          libraryId,
          filePath: file.path,
          originalName: file.name,
          mimeType: file.mimeType,
          tags,
        });
      }

      console.log('[DocumentUploadModal] All files uploaded successfully');

      // Reset and close
      setSelectedFiles([]);
      setTags([]);
      onClose();
    } catch (err) {
      console.error('[DocumentUploadModal] Upload error:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-800">
          <h2 className="text-xl font-semibold text-neutral-100">Ajouter des documents</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* File Selection */}
          <div className="border-2 border-dashed border-neutral-700 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-neutral-400" />
            <p className="text-neutral-200 mb-4">
              Cliquez sur le bouton ci-dessous pour sélectionner des fichiers
            </p>
            <button
              type="button"
              onClick={handleBrowseFiles}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              disabled={loading}
            >
              Parcourir les fichiers
            </button>
            <p className="text-sm text-neutral-400 mt-4">
              PDF, DOCX, TXT, MD, Images, etc.
            </p>
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-neutral-200 mb-2">
                Fichiers sélectionnés ({selectedFiles.length})
              </label>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-neutral-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <File className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-100 truncate">{file.name}</p>
                        <p className="text-xs text-neutral-400">
                          {file.mimeType}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="p-1 hover:bg-neutral-700 rounded transition-colors"
                      disabled={loading}
                    >
                      <X className="w-4 h-4 text-neutral-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-neutral-200 mb-2">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                className="flex-1 px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-blue-500"
                placeholder="Ajouter un tag..."
                disabled={loading}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg transition-colors"
                disabled={loading}
              >
                Ajouter
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:bg-blue-500/20 rounded-full p-0.5"
                      disabled={loading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-100 rounded-lg transition-colors"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loading || selectedFiles.length === 0}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Upload en cours...' : `Ajouter ${selectedFiles.length} fichier(s)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}
