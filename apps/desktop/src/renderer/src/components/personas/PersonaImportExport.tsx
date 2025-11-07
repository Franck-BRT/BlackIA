import React, { useState } from 'react';
import { Download, Upload, FileJson, AlertCircle, CheckCircle } from 'lucide-react';
import type { Persona } from '../../types/persona';

interface PersonaImportExportProps {
  personas: Persona[];
  onImport: (personas: Persona[]) => Promise<void>;
}

export function PersonaImportExport({ personas, onImport }: PersonaImportExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Export d'une persona individuelle
  const exportPersona = async (persona: Persona) => {
    try {
      const data = JSON.stringify(persona, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `persona-${persona.name.toLowerCase().replace(/\s+/g, '-')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting persona:', error);
      alert('Erreur lors de l\'export de la persona');
    }
  };

  // Export de toutes les personas (backup)
  const exportAll = async () => {
    setIsExporting(true);
    try {
      const backup = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        personas: personas,
        count: personas.length,
      };

      const data = JSON.stringify(backup, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().split('T')[0];
      link.download = `blackia-personas-backup-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setImportStatus({
        type: 'success',
        message: `${personas.length} personas exportées avec succès`,
      });

      setTimeout(() => setImportStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      console.error('Error exporting all personas:', error);
      setImportStatus({
        type: 'error',
        message: 'Erreur lors de l\'export',
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Import de personas depuis un fichier JSON
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Valider le format
      let personasToImport: Persona[] = [];

      if (Array.isArray(data)) {
        // Fichier contient directement un array de personas
        personasToImport = data;
      } else if (data.personas && Array.isArray(data.personas)) {
        // Fichier de backup avec structure complète
        personasToImport = data.personas;
      } else if (data.id && data.name && data.systemPrompt) {
        // Une seule persona
        personasToImport = [data];
      } else {
        throw new Error('Format de fichier invalide');
      }

      // Valider chaque persona
      const validPersonas = personasToImport.filter((p) => {
        return (
          p.name &&
          typeof p.name === 'string' &&
          p.description &&
          typeof p.description === 'string' &&
          p.systemPrompt &&
          typeof p.systemPrompt === 'string' &&
          p.avatar &&
          p.color
        );
      });

      if (validPersonas.length === 0) {
        throw new Error('Aucune persona valide trouvée dans le fichier');
      }

      // Importer les personas
      await onImport(validPersonas);

      setImportStatus({
        type: 'success',
        message: `${validPersonas.length} persona(s) importée(s) avec succès`,
      });

      setTimeout(() => setImportStatus({ type: null, message: '' }), 3000);
    } catch (error) {
      console.error('Error importing personas:', error);
      setImportStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Erreur lors de l\'import',
      });

      setTimeout(() => setImportStatus({ type: null, message: '' }), 5000);
    }

    // Reset input pour permettre de réimporter le même fichier
    event.target.value = '';
  };

  return (
    <div className="space-y-4">
      {/* Boutons d'actions */}
      <div className="flex flex-wrap gap-3">
        {/* Export toutes les personas */}
        <button
          onClick={exportAll}
          disabled={isExporting || personas.length === 0}
          className="flex items-center gap-2 px-4 py-2 glass-card rounded-lg hover:glass-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          <span>Exporter toutes ({personas.length})</span>
        </button>

        {/* Import */}
        <label className="flex items-center gap-2 px-4 py-2 glass-card rounded-lg hover:glass-lg transition-all cursor-pointer">
          <Upload className="w-4 h-4" />
          <span>Importer depuis un fichier</span>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
        </label>
      </div>

      {/* Messages de statut */}
      {importStatus.type && (
        <div
          className={`flex items-center gap-3 p-4 rounded-lg ${
            importStatus.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20'
              : 'bg-red-500/10 border border-red-500/20'
          }`}
        >
          {importStatus.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          )}
          <p
            className={`text-sm ${
              importStatus.type === 'success' ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {importStatus.message}
          </p>
        </div>
      )}

      {/* Info sur l'export individuel */}
      <div className="flex items-start gap-3 p-4 glass-card rounded-lg">
        <FileJson className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-1">Export individuel</p>
          <p>
            Pour exporter une seule persona, cliquez sur le bouton de duplication puis
            supprimez l'original si besoin.
          </p>
        </div>
      </div>
    </div>
  );
}
