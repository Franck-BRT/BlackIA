import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import type { Prompt } from '../../types/prompt';

interface PromptImportExportProps {
  prompts: Prompt[];
  onImport: (prompts: Prompt[]) => Promise<void>;
}

export function PromptImportExport({ prompts, onImport }: PromptImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Exporter tous les prompts en JSON
  const handleExport = async () => {
    try {
      const jsonData = JSON.stringify(prompts, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Créer un lien de téléchargement
      const a = document.createElement('a');
      a.href = url;
      a.download = `prompts-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[PromptImportExport] Error exporting:', error);
      alert('Erreur lors de l\'export des prompts');
    }
  };

  // Importer des prompts depuis un fichier JSON
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const importedPrompts = JSON.parse(text);

      if (!Array.isArray(importedPrompts)) {
        throw new Error('Le fichier doit contenir un tableau de prompts');
      }

      await onImport(importedPrompts);
      alert(`${importedPrompts.length} prompts importés avec succès !`);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('[PromptImportExport] Error importing:', error);
      alert('Erreur lors de l\'import : fichier invalide');
    }
  };

  return (
    <div className="flex gap-4">
      {/* Export */}
      <button
        onClick={handleExport}
        disabled={prompts.length === 0}
        className="flex-1 px-4 py-3 glass-card rounded-xl font-medium hover:glass-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Download className="w-5 h-5" />
        Exporter ({prompts.length})
      </button>

      {/* Import */}
      <div className="flex-1">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
          id="prompt-import-input"
        />
        <label
          htmlFor="prompt-import-input"
          className="block px-4 py-3 glass-card rounded-xl font-medium hover:glass-lg transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Upload className="w-5 h-5" />
          Importer
        </label>
      </div>
    </div>
  );
}
