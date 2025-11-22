/**
 * Tool Call Display
 * Composant pour afficher les appels d'outils MCP dans les messages du chat
 */

import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Zap,
  AlertTriangle,
} from 'lucide-react';

export interface ToolCallData {
  id: string;
  toolName: string;
  parameters: Record<string, unknown>;
  status: 'pending' | 'running' | 'success' | 'error' | 'cancelled' | 'timeout';
  result?: unknown;
  error?: { code: string; message: string };
  duration?: number;
  startedAt: number;
  completedAt?: number;
}

interface ToolCallDisplayProps {
  toolCalls: ToolCallData[];
  collapsed?: boolean;
}

export function ToolCallDisplay({ toolCalls, collapsed = true }: ToolCallDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsed);
  const [expandedCalls, setExpandedCalls] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (toolCalls.length === 0) return null;

  const successCount = toolCalls.filter(tc => tc.status === 'success').length;
  const errorCount = toolCalls.filter(tc => tc.status === 'error').length;
  const totalDuration = toolCalls.reduce((acc, tc) => acc + (tc.duration || 0), 0);

  const toggleCallExpanded = (id: string) => {
    setExpandedCalls(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const copyResult = async (id: string, result: unknown) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Error copying result:', error);
    }
  };

  const getStatusIcon = (status: ToolCallData['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-400" />;
      case 'pending':
      case 'running':
        return <Clock className="w-4 h-4 text-blue-400 animate-pulse" />;
      case 'timeout':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-white/40" />;
    }
  };

  const getStatusColor = (status: ToolCallData['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/10 border-green-500/20';
      case 'error':
        return 'bg-red-500/10 border-red-500/20';
      case 'pending':
      case 'running':
        return 'bg-blue-500/10 border-blue-500/20';
      case 'timeout':
        return 'bg-orange-500/10 border-orange-500/20';
      case 'cancelled':
        return 'bg-gray-500/10 border-gray-500/20';
      default:
        return 'bg-white/5 border-white/10';
    }
  };

  return (
    <div className="mt-3 mb-2">
      {/* Header - Résumé des tool calls */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-400">
            {toolCalls.length} outil{toolCalls.length > 1 ? 's' : ''} utilisé{toolCalls.length > 1 ? 's' : ''}
          </span>
          {successCount > 0 && (
            <span className="px-1.5 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
              {successCount} ✓
            </span>
          )}
          {errorCount > 0 && (
            <span className="px-1.5 py-0.5 rounded text-xs bg-red-500/20 text-red-400">
              {errorCount} ✗
            </span>
          )}
          {totalDuration > 0 && (
            <span className="text-xs text-white/40">
              {totalDuration}ms
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-white/40" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/40" />
        )}
      </button>

      {/* Liste des tool calls */}
      {isExpanded && (
        <div className="mt-2 space-y-2">
          {toolCalls.map(call => {
            const isCallExpanded = expandedCalls.has(call.id);

            return (
              <div
                key={call.id}
                className={`rounded-lg border overflow-hidden ${getStatusColor(call.status)}`}
              >
                {/* Tool call header */}
                <button
                  onClick={() => toggleCallExpanded(call.id)}
                  className="w-full flex items-center justify-between p-2 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(call.status)}
                    <span className="text-sm font-mono text-white/80">{call.toolName}</span>
                    {call.duration && (
                      <span className="text-xs text-white/40">{call.duration}ms</span>
                    )}
                  </div>
                  {isCallExpanded ? (
                    <ChevronUp className="w-4 h-4 text-white/40" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  )}
                </button>

                {/* Tool call details */}
                {isCallExpanded && (
                  <div className="border-t border-white/10 p-3 space-y-3">
                    {/* Parameters */}
                    {Object.keys(call.parameters).length > 0 && (
                      <div>
                        <div className="text-xs text-white/40 mb-1">Paramètres</div>
                        <pre className="p-2 bg-black/20 rounded text-xs text-white/70 overflow-x-auto">
                          {JSON.stringify(call.parameters, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Result or Error */}
                    {call.status === 'success' && call.result !== undefined && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-white/40">Résultat</span>
                          <button
                            onClick={() => copyResult(call.id, call.result)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Copier"
                          >
                            {copiedId === call.id ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-white/40" />
                            )}
                          </button>
                        </div>
                        <pre className="p-2 bg-black/20 rounded text-xs text-green-400/80 overflow-x-auto max-h-40">
                          {typeof call.result === 'string'
                            ? call.result
                            : JSON.stringify(call.result, null, 2)}
                        </pre>
                      </div>
                    )}

                    {call.status === 'error' && call.error && (
                      <div>
                        <div className="text-xs text-white/40 mb-1">Erreur</div>
                        <div className="p-2 bg-red-500/10 rounded text-sm text-red-400">
                          <div className="font-medium">{call.error.code}</div>
                          <div className="text-xs opacity-80">{call.error.message}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
