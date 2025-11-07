import React, { useState, useRef, useEffect } from 'react';
import { Upload, Download, Database, FileUp, FileDown, Check, AlertCircle } from 'lucide-react';
import type { Conversation } from '../../hooks/useConversations';
import type { Folder } from '../../hooks/useFolders';
import type { Tag } from '../../hooks/useTags';

interface ImportExportMenuProps {
  // Export
  conversations: Conversation[];
  folders: Folder[];
  tags: Tag[];

  // Import
  onImportConversation: (conversation: Conversation) => void;
  onImportBackup: (data: BackupData, mode: 'merge' | 'replace') => void;
}

export interface BackupData {
  version: string;
  exportedAt: string;
  conversations: Conversation[];
  folders: Folder[];
  tags: Tag[];
}

export function ImportExportMenu({
  conversations,
  folders,
  tags,
  onImportConversation,
  onImportBackup,
}: ImportExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Export complet (backup)
  const exportBackup = async () => {
    try {
      const backup: BackupData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        conversations,
        folders,
        tags,
      };

      const result = await window.electronAPI.file.saveDialog({
        title: 'Exporter toutes les conversations',
        defaultPath: `blackia-backup-${new Date().toISOString().split('T')[0]}.json`,
        filters: [{ name: 'Backup JSON', extensions: ['json'] }],
      });

      if (!result.canceled && result.filePath) {
        const content = JSON.stringify(backup, null, 2);
        await window.electronAPI.file.writeFile(result.filePath, content);

        setImportStatus({
          type: 'success',
          message: `✅ Backup exporté avec succès ! (${conversations.length} conversations, ${folders.length} dossiers, ${tags.length} tags)`,
        });

        setTimeout(() => setImportStatus(null), 3000);
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'export:', error);
      setImportStatus({
        type: 'error',
        message: `❌ Erreur: ${error.message}`,
      });
      setTimeout(() => setImportStatus(null), 3000);
    }
    setIsOpen(false);
  };

  // Import de conversations
  const importFile = async () => {
    try {
      setImporting(true);

      const result = await window.electronAPI.file.openDialog({
        title: 'Importer des conversations',
        filters: [
          { name: 'Fichiers JSON', extensions: ['json'] },
        ],
        properties: ['openFile'],
      });

      if (result.canceled || result.filePaths.length === 0) {
        setImporting(false);
        return;
      }

      const fileResult = await window.electronAPI.file.readFile(result.filePaths[0]);

      if (!fileResult.success || !fileResult.content) {
        throw new Error(fileResult.error || 'Impossible de lire le fichier');
      }

      const data = JSON.parse(fileResult.content);

      // Vérifier si c'est un backup complet ou une conversation unique
      if (isBackupData(data)) {
        // Backup complet - demander le mode d'import
        const mode = await showImportModeDialog(data);
        if (mode) {
          onImportBackup(data, mode);
          setImportStatus({
            type: 'success',
            message: `✅ Backup importé avec succès ! (${data.conversations.length} conversations)`,
          });
        }
      } else if (isConversation(data)) {
        // Conversation unique
        onImportConversation(data);
        setImportStatus({
          type: 'success',
          message: '✅ Conversation importée avec succès !',
        });
      } else {
        throw new Error('Format de fichier non reconnu');
      }

      setTimeout(() => setImportStatus(null), 3000);
    } catch (error: any) {
      console.error('Erreur lors de l\'import:', error);
      setImportStatus({
        type: 'error',
        message: `❌ Erreur: ${error.message}`,
      });
      setTimeout(() => setImportStatus(null), 5000);
    } finally {
      setImporting(false);
      setIsOpen(false);
    }
  };

  return (
    <>
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center flex-shrink-0 min-w-[40px] min-h-[40px] p-2 rounded-xl glass-hover hover:bg-white/10 transition-colors"
          title="Import/Export"
        >
          <Database className="w-5 h-5" />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-64 glass-card bg-gray-900/95 rounded-xl overflow-hidden shadow-xl border border-white/10 z-[9999]">
            <div className="p-2 space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                Export
              </div>

              <button
                onClick={exportBackup}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left"
              >
                <FileDown className="w-4 h-4 text-blue-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium">Exporter tout</div>
                  <div className="text-xs text-muted-foreground">
                    {conversations.length} conversations, {folders.length} dossiers
                  </div>
                </div>
              </button>

              <div className="my-2 border-t border-white/10"></div>

              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                Import
              </div>

              <button
                onClick={importFile}
                disabled={importing}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileUp className="w-4 h-4 text-green-400" />
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {importing ? 'Import en cours...' : 'Importer'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Conversation ou backup complet
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status notification */}
      {importStatus && (
        <div className="fixed bottom-4 right-4 z-[99999] animate-in fade-in slide-in-from-bottom-2">
          <div
            className={`glass-card rounded-xl p-4 flex items-center gap-3 min-w-[300px] ${
              importStatus.type === 'success'
                ? 'bg-green-500/20 border-green-500/50'
                : 'bg-red-500/20 border-red-500/50'
            }`}
          >
            {importStatus.type === 'success' ? (
              <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            )}
            <div className="text-sm">{importStatus.message}</div>
          </div>
        </div>
      )}
    </>
  );
}

// Vérifier si c'est un backup complet
function isBackupData(data: any): data is BackupData {
  return (
    data &&
    typeof data === 'object' &&
    Array.isArray(data.conversations) &&
    Array.isArray(data.folders) &&
    Array.isArray(data.tags) &&
    typeof data.version === 'string' &&
    typeof data.exportedAt === 'string'
  );
}

// Vérifier si c'est une conversation unique
function isConversation(data: any): data is Conversation {
  return (
    data &&
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.title === 'string' &&
    Array.isArray(data.messages) &&
    typeof data.model === 'string'
  );
}

// Dialog pour choisir le mode d'import
async function showImportModeDialog(data: BackupData): Promise<'merge' | 'replace' | null> {
  return new Promise((resolve) => {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm';

    modal.innerHTML = `
      <div class="glass-card bg-gray-900/95 rounded-2xl w-full max-w-md m-4 p-6">
        <h2 class="text-xl font-bold mb-4">Mode d'import</h2>
        <p class="text-muted-foreground mb-6">
          Vous êtes sur le point d'importer <strong>${data.conversations.length} conversations</strong>,
          <strong>${data.folders.length} dossiers</strong> et <strong>${data.tags.length} tags</strong>.
          <br><br>
          Comment souhaitez-vous procéder ?
        </p>
        <div class="space-y-3">
          <button id="merge-btn" class="w-full px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-xl transition-colors text-left">
            <div class="font-semibold">Fusionner</div>
            <div class="text-sm text-muted-foreground">Ajouter aux conversations existantes</div>
          </button>
          <button id="replace-btn" class="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl transition-colors text-left">
            <div class="font-semibold">Remplacer</div>
            <div class="text-sm text-muted-foreground">Supprimer toutes les conversations actuelles</div>
          </button>
          <button id="cancel-btn" class="w-full px-4 py-3 glass-hover hover:bg-white/10 rounded-xl transition-colors">
            Annuler
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const mergeBtn = modal.querySelector('#merge-btn');
    const replaceBtn = modal.querySelector('#replace-btn');
    const cancelBtn = modal.querySelector('#cancel-btn');

    mergeBtn?.addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve('merge');
    });

    replaceBtn?.addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve('replace');
    });

    cancelBtn?.addEventListener('click', () => {
      document.body.removeChild(modal);
      resolve(null);
    });
  });
}
