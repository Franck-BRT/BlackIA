/**
 * Directories Panel
 * Gestion des répertoires autorisés pour les outils fichiers MCP
 */

import React, { useState } from 'react';
import {
  FolderOpen,
  Plus,
  Trash2,
  Check,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { DirectoryAccess } from '../../hooks/useMCPTools';

interface DirectoriesPanelProps {
  directories: DirectoryAccess[];
  onAddDirectory: (dir: Omit<DirectoryAccess, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onRemoveDirectory: (id: string) => Promise<void>;
  onUpdatePermissions: (id: string, permissions: DirectoryAccess['permissions']) => Promise<void>;
}

const PERMISSION_TYPES: { key: DirectoryAccess['permissions'][0]; label: string; icon: string; description: string }[] = [
  { key: 'read', label: 'Lecture', icon: '👁️', description: 'Lire le contenu des fichiers' },
  { key: 'write', label: 'Écriture', icon: '✏️', description: 'Créer et modifier des fichiers' },
  { key: 'delete', label: 'Suppression', icon: '🗑️', description: 'Supprimer des fichiers' },
  { key: 'move', label: 'Déplacement', icon: '📦', description: 'Déplacer et renommer des fichiers' },
  { key: 'execute', label: 'Exécution', icon: '⚡', description: 'Exécuter des scripts' },
];

const PRESET_DIRECTORIES = [
  { path: '~/Documents', name: 'Documents', permissions: ['read', 'write'] as DirectoryAccess['permissions'] },
  { path: '~/Desktop', name: 'Bureau', permissions: ['read', 'write'] as DirectoryAccess['permissions'] },
  { path: '~/Downloads', name: 'Téléchargements', permissions: ['read'] as DirectoryAccess['permissions'] },
  { path: '~/Pictures', name: 'Images', permissions: ['read'] as DirectoryAccess['permissions'] },
  { path: '/Applications', name: 'Applications', permissions: ['read', 'execute'] as DirectoryAccess['permissions'] },
];

export function DirectoriesPanel({
  directories,
  onAddDirectory,
  onRemoveDirectory,
  onUpdatePermissions,
}: DirectoriesPanelProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedDir, setExpandedDir] = useState<string | null>(null);

  const handleAddPreset = async (preset: typeof PRESET_DIRECTORIES[0]) => {
    if (directories.some(d => d.path === preset.path)) return;
    await onAddDirectory({
      ...preset,
      includeSubdirectories: true,
    });
  };

  const handleTogglePermission = async (
    dirId: string,
    currentPerms: DirectoryAccess['permissions'],
    perm: DirectoryAccess['permissions'][0]
  ) => {
    const newPerms = currentPerms.includes(perm)
      ? currentPerms.filter(p => p !== perm)
      : [...currentPerms, perm];
    await onUpdatePermissions(dirId, newPerms);
  };

  return (
    <div className="h-full overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Répertoires autorisés</h2>
          <p className="text-sm text-white/60">
            Les outils fichiers ne peuvent accéder qu'aux répertoires listés ci-dessous
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter</span>
        </button>
      </div>

      {/* Quick presets */}
      {directories.length === 0 && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <h3 className="font-medium text-blue-400 mb-3">Démarrage rapide</h3>
          <p className="text-sm text-white/60 mb-3">
            Ajoutez rapidement des répertoires courants :
          </p>
          <div className="flex flex-wrap gap-2">
            {PRESET_DIRECTORIES.map(preset => (
              <button
                key={preset.path}
                onClick={() => handleAddPreset(preset)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Directories list */}
      {directories.length > 0 ? (
        <div className="space-y-3">
          {directories.map(dir => {
            const isExpanded = expandedDir === dir.id;

            return (
              <div
                key={dir.id}
                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
              >
                {/* Directory header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5"
                  onClick={() => setExpandedDir(isExpanded ? null : dir.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                      <FolderOpen className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-white">{dir.name}</h3>
                      <p className="text-sm text-white/60 font-mono">{dir.path}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Permission badges */}
                    <div className="flex items-center gap-1">
                      {dir.permissions.map(perm => (
                        <span
                          key={perm}
                          className="px-2 py-0.5 bg-white/10 rounded text-xs text-white/60"
                        >
                          {PERMISSION_TYPES.find(p => p.key === perm)?.label || perm}
                        </span>
                      ))}
                    </div>

                    {/* Expand/collapse */}
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-white/40" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-white/40" />
                    )}
                  </div>
                </div>

                {/* Expanded permissions */}
                {isExpanded && (
                  <div className="border-t border-white/10 p-4">
                    <h4 className="text-sm font-medium text-white/80 mb-3">Permissions</h4>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4">
                      {PERMISSION_TYPES.map(perm => {
                        const isActive = dir.permissions.includes(perm.key);
                        return (
                          <button
                            key={perm.key}
                            onClick={e => {
                              e.stopPropagation();
                              handleTogglePermission(dir.id, dir.permissions, perm.key);
                            }}
                            className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                              isActive
                                ? 'bg-purple-600/20 border-purple-500/30 text-purple-400'
                                : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                            }`}
                          >
                            <span className="text-lg">{perm.icon}</span>
                            <div className="text-left">
                              <div className="text-sm font-medium">{perm.label}</div>
                            </div>
                            {isActive && <Check className="w-4 h-4 ml-auto" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Include subdirectories toggle */}
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg mb-4">
                      <div>
                        <span className="text-sm text-white">Inclure les sous-dossiers</span>
                        <p className="text-xs text-white/40">
                          Appliquer les permissions à tous les sous-dossiers
                        </p>
                      </div>
                      <div
                        className={`w-10 h-5 rounded-full transition-colors ${
                          dir.includeSubdirectories ? 'bg-purple-600' : 'bg-white/20'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transition-transform mt-0.5 ${
                            dir.includeSubdirectories ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        onRemoveDirectory(dir.id);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Retirer ce répertoire</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-orange-400/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucun répertoire autorisé</h3>
          <p className="text-white/60 mb-4">
            Ajoutez des répertoires pour permettre aux outils d'accéder aux fichiers
          </p>
        </div>
      )}

      {/* Add directory modal */}
      {showAddModal && (
        <AddDirectoryModal
          onClose={() => setShowAddModal(false)}
          onAdd={async (dir) => {
            await onAddDirectory(dir);
            setShowAddModal(false);
          }}
          existingPaths={directories.map(d => d.path)}
        />
      )}
    </div>
  );
}

// ============================================================================
// ADD DIRECTORY MODAL
// ============================================================================

interface AddDirectoryModalProps {
  onClose: () => void;
  onAdd: (dir: Omit<DirectoryAccess, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  existingPaths: string[];
}

function AddDirectoryModal({ onClose, onAdd, existingPaths }: AddDirectoryModalProps) {
  const [path, setPath] = useState('');
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<DirectoryAccess['permissions']>(['read']);
  const [includeSubdirectories, setIncludeSubdirectories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectFolder = async () => {
    try {
      const result = await window.api.invoke('dialog:selectFolder', {
        title: 'Sélectionner un répertoire',
      });
      if (result.success && result.path) {
        setPath(result.path);
        // Auto-fill name from path
        const parts = result.path.split('/');
        setName(parts[parts.length - 1] || 'Nouveau répertoire');
      }
    } catch (err) {
      console.error('Error selecting folder:', err);
    }
  };

  const handleSubmit = async () => {
    if (!path || !name) return;
    if (existingPaths.includes(path)) return;

    setIsSubmitting(true);
    try {
      await onAdd({ path, name, permissions, includeSubdirectories });
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePermission = (perm: DirectoryAccess['permissions'][0]) => {
    setPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-[#1a1a2e] border border-white/10 rounded-2xl w-full max-w-lg p-6"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold text-white mb-4">Ajouter un répertoire</h2>

        {/* Path selection */}
        <div className="mb-4">
          <label className="block text-sm text-white/80 mb-1.5">Chemin</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={path}
              onChange={e => setPath(e.target.value)}
              placeholder="/Users/..."
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
            />
            <button
              onClick={handleSelectFolder}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              Parcourir
            </button>
          </div>
          {existingPaths.includes(path) && (
            <p className="text-sm text-red-400 mt-1">Ce répertoire est déjà ajouté</p>
          )}
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-sm text-white/80 mb-1.5">Nom affiché</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Documents"
            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Permissions */}
        <div className="mb-4">
          <label className="block text-sm text-white/80 mb-2">Permissions</label>
          <div className="flex flex-wrap gap-2">
            {PERMISSION_TYPES.map(perm => {
              const isActive = permissions.includes(perm.key);
              return (
                <button
                  key={perm.key}
                  onClick={() => togglePermission(perm.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    isActive
                      ? 'bg-purple-600/20 border-purple-500/30 text-purple-400'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <span>{perm.icon}</span>
                  <span className="text-sm">{perm.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Include subdirectories */}
        <label className="flex items-center gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={includeSubdirectories}
            onChange={e => setIncludeSubdirectories(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
          />
          <span className="text-sm text-white">Inclure les sous-dossiers</span>
        </label>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!path || !name || existingPaths.includes(path) || isSubmitting}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
          >
            {isSubmitting ? 'Ajout...' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}
