import { useState, useCallback, useEffect } from 'react';
import { GitBranch, Clock, Save, RotateCcw, X, GitCommit } from 'lucide-react';
import type { WorkflowVersion, WorkflowNode, WorkflowEdge, NodeGroup, Annotation } from './types';

interface VersionManagerProps {
  isOpen: boolean;
  onClose: () => void;
  workflowId: string;
  currentNodes: WorkflowNode[];
  currentEdges: WorkflowEdge[];
  currentGroups?: NodeGroup[];
  currentAnnotations?: Annotation[];
  onRestoreVersion: (version: WorkflowVersion) => void;
}

export function VersionManager({
  isOpen,
  onClose,
  workflowId,
  currentNodes,
  currentEdges,
  currentGroups,
  currentAnnotations,
  onRestoreVersion,
}: VersionManagerProps) {
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [commitMessage, setCommitMessage] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  // Charger les versions au montage
  useEffect(() => {
    const loadVersions = async () => {
      const result = await window.electronAPI.workflowVersions.getByWorkflowId(workflowId);
      if (result.success) {
        // Parse nodes, edges, groups, annotations from JSON strings
        const parsedVersions = result.data.map((v: any) => ({
          ...v,
          nodes: typeof v.nodes === 'string' ? JSON.parse(v.nodes) : v.nodes,
          edges: typeof v.edges === 'string' ? JSON.parse(v.edges) : v.edges,
          groups: v.groups && typeof v.groups === 'string' ? JSON.parse(v.groups) : v.groups,
          annotations: v.annotations && typeof v.annotations === 'string' ? JSON.parse(v.annotations) : v.annotations,
          parent: v.parentId,
        }));
        setVersions(parsedVersions);
      } else {
        console.error('Failed to load versions:', result.error);
      }
    };

    if (isOpen && workflowId) {
      loadVersions();
    }
  }, [isOpen, workflowId]);

  // Créer une nouvelle version (commit)
  const handleCommit = useCallback(async () => {
    if (!commitMessage.trim()) {
      alert('Veuillez entrer un message de commit');
      return;
    }

    const latestVersion = versions[0];

    const versionData = {
      workflowId,
      message: commitMessage,
      author: 'User', // À remplacer par l'utilisateur connecté
      nodes: JSON.stringify(currentNodes),
      edges: JSON.stringify(currentEdges),
      groups: currentGroups ? JSON.stringify(currentGroups) : '[]',
      annotations: currentAnnotations ? JSON.stringify(currentAnnotations) : '[]',
      parentId: latestVersion?.id,
    };

    const result = await window.electronAPI.workflowVersions.commit(versionData);

    if (result.success) {
      // Parse the response data
      const newVersion = {
        ...result.data,
        nodes: JSON.parse(result.data.nodes),
        edges: JSON.parse(result.data.edges),
        groups: result.data.groups ? JSON.parse(result.data.groups) : undefined,
        annotations: result.data.annotations ? JSON.parse(result.data.annotations) : undefined,
        parent: result.data.parentId,
      };
      setVersions((prev) => [newVersion, ...prev]);
      setCommitMessage('');
    } else {
      console.error('Failed to create version:', result.error);
      alert('Erreur lors de la création de la version');
    }
  }, [commitMessage, versions, workflowId, currentNodes, currentEdges, currentGroups, currentAnnotations]);

  // Restaurer une version
  const handleRestore = useCallback(
    async (version: WorkflowVersion) => {
      if (window.confirm(`Restaurer la version ${version.version} ?\nCela remplacera l'état actuel du workflow.`)) {
        const result = await window.electronAPI.workflowVersions.restore(version.id);
        if (result.success) {
          onRestoreVersion(version);
          onClose();
        } else {
          console.error('Failed to restore version:', result.error);
          alert('Erreur lors de la restauration de la version');
        }
      }
    },
    [onRestoreVersion, onClose]
  );

  // Comparer deux versions
  const getVersionDiff = useCallback((v1: WorkflowVersion, v2: WorkflowVersion) => {
    const nodesDiff = {
      added: v2.nodes.length - v1.nodes.length,
      modified: 0, // Simplification
    };

    const edgesDiff = {
      added: v2.edges.length - v1.edges.length,
    };

    return { nodesDiff, edgesDiff };
  }, []);

  // Formater la date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
      }
      return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }

    if (days < 7) {
      return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    }

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <GitBranch className="text-purple-400" size={24} />
            <div>
              <h2 className="text-2xl font-bold text-white">Historique des versions</h2>
              <p className="text-gray-400 text-sm mt-1">
                {versions.length} version{versions.length > 1 ? 's' : ''} sauvegardée{versions.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Commit form */}
        <div className="p-4 border-b border-white/10 bg-white/5">
          <div className="flex gap-3">
            <input
              type="text"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCommit()}
              placeholder="Message de commit (ex: Ajout de la validation des inputs)"
              className="flex-1 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white
                       placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
            <button
              onClick={handleCommit}
              disabled={!commitMessage.trim()}
              className="px-6 py-2 rounded-lg bg-purple-500 hover:bg-purple-600 text-white
                       transition-colors flex items-center gap-2 disabled:opacity-50
                       disabled:cursor-not-allowed"
            >
              <Save size={16} />
              Commit
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Sauvegardez l'état actuel du workflow avec un message descriptif
          </p>
        </div>

        {/* Versions list */}
        <div className="flex-1 overflow-auto p-6">
          {versions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <GitCommit size={48} className="mx-auto mb-4 opacity-50" />
              <p>Aucune version sauvegardée</p>
              <p className="text-sm mt-2">Créez votre premier commit ci-dessus</p>
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version, index) => {
                const isSelected = selectedVersion === version.id;
                const previousVersion = versions[index + 1];

                return (
                  <div
                    key={version.id}
                    className={`p-4 rounded-lg border transition-all cursor-pointer
                              ${isSelected
                                ? 'bg-purple-500/20 border-purple-500/50'
                                : 'bg-white/5 border-white/10 hover:border-purple-500/30'
                              }`}
                    onClick={() => setSelectedVersion(isSelected ? null : version.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-400 text-xs font-mono">
                            {version.version}
                          </span>
                          {index === 0 && (
                            <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs">
                              LATEST
                            </span>
                          )}
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(version.createdAt)}
                          </span>
                        </div>
                        <p className="text-white font-medium mb-1">{version.message}</p>
                        <p className="text-xs text-gray-500">
                          Par {version.author || 'Utilisateur'} • {version.nodes.length} nœuds • {version.edges.length} connexions
                        </p>

                        {isSelected && previousVersion && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <p className="text-xs text-gray-400 mb-2">Changements depuis {previousVersion.version}:</p>
                            <div className="flex gap-4 text-xs">
                              <span className="text-green-400">
                                +{Math.max(0, version.nodes.length - previousVersion.nodes.length)} nœuds
                              </span>
                              <span className="text-red-400">
                                -{Math.max(0, previousVersion.nodes.length - version.nodes.length)} nœuds
                              </span>
                              <span className="text-blue-400">
                                {version.edges.length - previousVersion.edges.length > 0 ? '+' : ''}
                                {version.edges.length - previousVersion.edges.length} connexions
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {index !== 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRestore(version);
                          }}
                          className="ml-4 p-2 rounded-lg border border-white/10 hover:bg-purple-500/20
                                   hover:border-purple-500/30 text-gray-400 hover:text-purple-400
                                   transition-colors"
                          title="Restaurer cette version"
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/5">
          <p className="text-xs text-gray-500">
            💡 Astuce: Les versions sont sauvegardées localement et persistent entre les sessions
          </p>
        </div>
      </div>
    </div>
  );
}
