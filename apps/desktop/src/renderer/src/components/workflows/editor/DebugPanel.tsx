import { useState, useCallback } from 'react';
import { Bug, Play, Pause, SkipForward, Square, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import type { Breakpoint, ExecutionState, WorkflowNode } from './types';

interface DebugPanelProps {
  nodes: WorkflowNode[];
  executionState: ExecutionState;
  onToggleBreakpoint: (nodeId: string) => void;
  onStartDebug: () => void;
  onStopDebug: () => void;
  onStepNext: () => void;
  onContinue: () => void;
  onPause: () => void;
}

export function DebugPanel({
  nodes,
  executionState,
  onToggleBreakpoint,
  onStartDebug,
  onStopDebug,
  onStepNext,
  onContinue,
  onPause,
}: DebugPanelProps) {
  const [selectedTab, setSelectedTab] = useState<'breakpoints' | 'variables' | 'callstack' | 'logs'>('breakpoints');
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');

  const { status, breakpoints, variables, callStack, logs, currentNodeId, stepMode } = executionState;

  const isRunning = status === 'running';
  const isPaused = status === 'paused';
  const isIdle = status === 'idle';

  // Filtrer les logs
  const filteredLogs = logs.filter((log) => logFilter === 'all' || log.level === logFilter);

  // Obtenir le nom du node
  const getNodeName = useCallback(
    (nodeId: string): string => {
      const node = nodes.find((n) => n.id === nodeId);
      return node?.data.label as string || nodeId;
    },
    [nodes]
  );

  return (
    <div className="h-full flex flex-col bg-gray-900/50 border-l border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Bug size={20} className="text-purple-400" />
          <h3 className="font-semibold text-white">Debugger</h3>
          {status !== 'idle' && (
            <span
              className={`px-2 py-0.5 rounded text-xs ${
                status === 'running'
                  ? 'bg-green-500/20 text-green-400'
                  : status === 'paused'
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : status === 'error'
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {status.toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 p-3 border-b border-white/10 bg-white/5">
        {isIdle || status === 'completed' || status === 'error' ? (
          <button
            onClick={onStartDebug}
            className="px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30
                     text-green-400 text-sm flex items-center gap-2 transition-colors"
            title="Démarrer le debug"
          >
            <Play size={14} />
            Start
          </button>
        ) : (
          <>
            {isPaused ? (
              <button
                onClick={onContinue}
                className="px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30
                         text-green-400 text-sm flex items-center gap-2 transition-colors"
                title="Continuer"
              >
                <Play size={14} />
                Continue
              </button>
            ) : (
              <button
                onClick={onPause}
                className="px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30
                         text-yellow-400 text-sm flex items-center gap-2 transition-colors"
                title="Pause"
              >
                <Pause size={14} />
                Pause
              </button>
            )}

            <button
              onClick={onStepNext}
              disabled={!isPaused && !stepMode}
              className="px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30
                       text-blue-400 text-sm flex items-center gap-2 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
              title="Exécuter le prochain node"
            >
              <SkipForward size={14} />
              Step
            </button>

            <button
              onClick={onStopDebug}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30
                       text-red-400 text-sm flex items-center gap-2 transition-colors"
              title="Arrêter"
            >
              <Square size={14} />
              Stop
            </button>
          </>
        )}

        {currentNodeId && (
          <div className="ml-auto text-xs text-gray-400">
            Current: <span className="text-purple-400">{getNodeName(currentNodeId)}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {(['breakpoints', 'variables', 'callstack', 'logs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab)}
            className={`px-4 py-2 text-sm transition-colors ${
              selectedTab === tab
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'breakpoints' && 'Breakpoints'}
            {tab === 'variables' && 'Variables'}
            {tab === 'callstack' && 'Call Stack'}
            {tab === 'logs' && `Logs (${logs.length})`}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-3">
        {selectedTab === 'breakpoints' && (
          <div className="space-y-2">
            {nodes.map((node) => {
              const hasBreakpoint = breakpoints.some((bp) => bp.nodeId === node.id && bp.enabled);
              return (
                <div
                  key={node.id}
                  className={`p-2 rounded-lg border transition-all ${
                    hasBreakpoint
                      ? 'bg-red-500/10 border-red-500/30'
                      : 'bg-white/5 border-white/10 hover:border-purple-500/30'
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasBreakpoint}
                      onChange={() => onToggleBreakpoint(node.id)}
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{getNodeName(node.id)}</div>
                      <div className="text-xs text-gray-500">{node.type}</div>
                    </div>
                    {node.id === currentNodeId && (
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    )}
                  </label>
                </div>
              );
            })}
          </div>
        )}

        {selectedTab === 'variables' && (
          <div className="space-y-2">
            {Object.keys(variables).length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Aucune variable disponible
                <br />
                <span className="text-xs">Lancez le debug pour voir les variables</span>
              </div>
            ) : (
              Object.entries(variables).map(([key, value]) => (
                <div key={key} className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-sm text-purple-400 font-mono">{key}</div>
                  <div className="text-xs text-gray-400 font-mono mt-1 break-all">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectedTab === 'callstack' && (
          <div className="space-y-1">
            {callStack.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                Call stack vide
                <br />
                <span className="text-xs">Lancez le debug pour voir la pile d'appels</span>
              </div>
            ) : (
              callStack.map((nodeId, index) => (
                <div
                  key={`${nodeId}-${index}`}
                  className={`p-2 rounded-lg ${
                    index === 0
                      ? 'bg-purple-500/20 border border-purple-500/30'
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">#{index + 1}</span>
                    <span className="text-sm text-white">{getNodeName(nodeId)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectedTab === 'logs' && (
          <>
            <div className="flex gap-2 mb-3">
              {(['all', 'info', 'warn', 'error'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setLogFilter(level)}
                  className={`px-3 py-1 rounded text-xs transition-colors ${
                    logFilter === level
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:border-purple-500/30'
                  }`}
                >
                  {level.charAt(0).toUpperCase() + level.slice(1)}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Aucun log disponible
                </div>
              ) : (
                filteredLogs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg border ${
                      log.level === 'error'
                        ? 'bg-red-500/10 border-red-500/30'
                        : log.level === 'warn'
                        ? 'bg-yellow-500/10 border-yellow-500/30'
                        : 'bg-blue-500/10 border-blue-500/30'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {log.level === 'error' ? (
                        <AlertCircle size={14} className="text-red-400 mt-0.5" />
                      ) : log.level === 'warn' ? (
                        <AlertTriangle size={14} className="text-yellow-400 mt-0.5" />
                      ) : (
                        <Info size={14} className="text-blue-400 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                          <span>•</span>
                          <span>{getNodeName(log.nodeId)}</span>
                        </div>
                        <div className="text-sm text-white mt-1">{log.message}</div>
                        {log.data && (
                          <pre className="text-xs text-gray-400 mt-1 font-mono overflow-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Info */}
      <div className="p-3 border-t border-white/10 bg-white/5">
        <p className="text-xs text-gray-500">
          💡 Activez des breakpoints et lancez le debug pour exécuter pas à pas
        </p>
      </div>
    </div>
  );
}
