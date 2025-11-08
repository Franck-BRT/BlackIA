import { useEffect, useState } from 'react';
import { Play, X, CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react';

interface ExecutionLog {
  nodeId: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  data?: Record<string, unknown>;
}

interface ExecutionResult {
  success: boolean;
  outputs: Record<string, unknown>;
  logs: ExecutionLog[];
  error?: string;
  duration: number;
}

interface WorkflowExecutionPanelProps {
  workflowId: string;
  workflowName: string;
  onClose: () => void;
}

export function WorkflowExecutionPanel({
  workflowId,
  workflowName,
  onClose,
}: WorkflowExecutionPanelProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({ input: '' });
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [aiStreams, setAiStreams] = useState<Record<string, string>>({});

  useEffect(() => {
    // Écouter les événements de progression
    window.electronAPI.workflows.onProgress((data) => {
      setCurrentNode(data.nodeId);
    });

    // Écouter les événements de streaming AI
    window.electronAPI.workflows.onAIStream((data) => {
      if (data.error) {
        // En cas d'erreur, afficher l'erreur
        setAiStreams((prev) => ({
          ...prev,
          [data.nodeId]: `[Erreur] ${data.error}`,
        }));
      } else if (data.fullText) {
        // Mettre à jour le texte complet pour ce node
        setAiStreams((prev) => ({
          ...prev,
          [data.nodeId]: data.fullText,
        }));
      }
    });

    return () => {
      window.electronAPI.workflows.removeProgressListener();
      window.electronAPI.workflows.removeAIStreamListener();
    };
  }, []);

  const handleExecute = async () => {
    setIsExecuting(true);
    setResult(null);
    setCurrentNode(null);
    setAiStreams({});

    try {
      const response = await window.electronAPI.workflows.execute(workflowId, inputs);

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setResult({
          success: false,
          outputs: {},
          logs: [],
          error: response.error || 'Execution failed',
          duration: 0,
        });
      }
    } catch (error) {
      setResult({
        success: false,
        outputs: {},
        logs: [],
        error: String(error),
        duration: 0,
      });
    } finally {
      setIsExecuting(false);
      setCurrentNode(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">Exécution du Workflow</h2>
            <p className="text-gray-400 text-sm mt-1">{workflowName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Inputs */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Données d'entrée
            </label>
            <textarea
              value={inputs.input}
              onChange={(e) => setInputs({ input: e.target.value })}
              placeholder="Entrez vos données d'entrée ici..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10
                       text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50
                       focus:ring-2 focus:ring-purple-500/20 transition-colors resize-none"
              disabled={isExecuting}
            />
          </div>

          {/* Execute Button */}
          <button
            onClick={handleExecute}
            disabled={isExecuting}
            className="w-full px-6 py-3 rounded-lg bg-purple-500 hover:bg-purple-600
                     text-white font-medium transition-colors flex items-center justify-center gap-2
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExecuting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Exécution en cours...
              </>
            ) : (
              <>
                <Play size={20} />
                Exécuter le Workflow
              </>
            )}
          </button>

          {/* Current Node */}
          {currentNode && (
            <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center gap-3">
              <Loader2 className="animate-spin text-blue-400" size={20} />
              <span className="text-blue-400">
                Exécution du nœud: <strong>{currentNode}</strong>
              </span>
            </div>
          )}

          {/* AI Streaming Responses */}
          {Object.keys(aiStreams).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Loader2 className="animate-spin text-purple-400" size={16} />
                Réponses IA en temps réel
              </h3>
              {Object.entries(aiStreams).map(([nodeId, text]) => (
                <div
                  key={nodeId}
                  className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/30"
                >
                  <div className="text-xs text-purple-400 font-medium mb-2">
                    Node: {nodeId}
                  </div>
                  <div className="text-sm text-gray-200 whitespace-pre-wrap">
                    {text}
                    <span className="inline-block w-2 h-4 bg-purple-400 ml-1 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              {/* Status */}
              <div
                className={`p-4 rounded-lg border flex items-center gap-3 ${
                  result.success
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                {result.success ? (
                  <>
                    <CheckCircle className="text-green-400" size={24} />
                    <div className="flex-1">
                      <div className="font-semibold text-green-400">Exécution réussie</div>
                      <div className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                        <Clock size={14} />
                        Durée: {result.duration}ms
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="text-red-400" size={24} />
                    <div className="flex-1">
                      <div className="font-semibold text-red-400">Échec de l'exécution</div>
                      <div className="text-sm text-gray-400 mt-1">{result.error}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Outputs */}
              {result.success && Object.keys(result.outputs).length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Résultats</h3>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <pre className="text-sm text-gray-300 overflow-auto max-h-60">
                      {JSON.stringify(result.outputs, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Logs */}
              {result.logs.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">
                    Logs d'exécution ({result.logs.length})
                  </h3>
                  <div className="space-y-2 max-h-60 overflow-auto">
                    {result.logs.map((log, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border text-sm ${
                          log.type === 'error'
                            ? 'bg-red-500/5 border-red-500/20 text-red-400'
                            : log.type === 'warning'
                              ? 'bg-yellow-500/5 border-yellow-500/20 text-yellow-400'
                              : log.type === 'success'
                                ? 'bg-green-500/5 border-green-500/20 text-green-400'
                                : 'bg-white/5 border-white/10 text-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <span className="font-medium">{log.nodeId}</span>
                            <span className="mx-2">·</span>
                            <span>{log.message}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-white/10 text-gray-300
                     hover:bg-white/5 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
