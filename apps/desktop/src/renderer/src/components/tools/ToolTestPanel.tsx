/**
 * Tool Test Panel
 * Panneau de test interactif pour un outil MCP
 */

import React, { useState, useMemo } from 'react';
import {
  X,
  Play,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Copy,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import type { MCPTool, MCPToolCallResult, MCPPermissionState } from '../../hooks/useMCPTools';

interface ToolTestPanelProps {
  tool: MCPTool;
  onClose: () => void;
  onCallTool: (toolName: string, params: Record<string, unknown>) => Promise<MCPToolCallResult>;
  permissions: MCPPermissionState[];
}

export function ToolTestPanel({ tool, onClose, onCallTool, permissions }: ToolTestPanelProps) {
  const [params, setParams] = useState<Record<string, unknown>>(() => {
    // Initialiser avec les valeurs par défaut
    const initial: Record<string, unknown> = {};
    for (const param of tool.parameters) {
      if (param.default !== undefined) {
        initial[param.name] = param.default;
      } else if (param.type === 'boolean') {
        initial[param.name] = false;
      } else if (param.type === 'number') {
        initial[param.name] = param.min || 0;
      } else {
        initial[param.name] = '';
      }
    }
    return initial;
  });

  const [result, setResult] = useState<MCPToolCallResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  // Vérifier si les permissions sont accordées
  const missingPermissions = useMemo(() => {
    return tool.permissions.filter(perm => {
      const permState = permissions.find(p => p.permission === perm);
      return !permState || !permState.enabled || !permState.granted;
    });
  }, [tool.permissions, permissions]);

  // Exécuter le test
  const handleRun = async () => {
    // Filtrer les paramètres vides pour les optionnels
    const filteredParams: Record<string, unknown> = {};
    for (const param of tool.parameters) {
      const value = params[param.name];
      if (param.required || (value !== '' && value !== undefined && value !== null)) {
        filteredParams[param.name] = value;
      }
    }

    setIsRunning(true);
    setResult(null);

    try {
      const res = await onCallTool(tool.name, filteredParams);
      setResult(res);
    } catch (err) {
      setResult({
        id: `error-${Date.now()}`,
        tool: tool.name,
        status: 'error',
        error: { code: 'EXECUTION_ERROR', message: err instanceof Error ? err.message : 'Erreur inconnue' },
        startedAt: Date.now(),
        completedAt: Date.now(),
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Appliquer un exemple
  const applyExample = (example: typeof tool.examples[0]) => {
    setParams(prev => ({ ...prev, ...example.parameters }));
    setShowExamples(false);
  };

  // Copier le résultat
  const copyResult = () => {
    if (result?.result) {
      navigator.clipboard.writeText(JSON.stringify(result.result, null, 2));
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden border-l border-white/10">
      {/* Header */}
      <div className="shrink-0 p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-xl">
              {tool.icon}
            </div>
            <div>
              <h2 className="font-semibold text-white">{tool.name}</h2>
              <p className="text-sm text-white/60">{tool.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Warnings */}
        {tool.dangerous && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-orange-400">Cet outil peut effectuer des actions destructives</span>
          </div>
        )}

        {missingPermissions.length > 0 && (
          <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400">
              Permissions requises : {missingPermissions.join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Examples */}
        {tool.examples.length > 0 && (
          <div>
            <button
              onClick={() => setShowExamples(!showExamples)}
              className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
            >
              <Info className="w-4 h-4" />
              <span>Exemples d'utilisation</span>
              {showExamples ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showExamples && (
              <div className="mt-2 space-y-2">
                {tool.examples.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyExample(example)}
                    className="w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-colors"
                  >
                    <div className="font-medium text-white text-sm">{example.title}</div>
                    <div className="text-xs text-white/60">{example.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Parameters form */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-white/80">Paramètres</h3>

          {tool.parameters.map(param => (
            <ParameterInput
              key={param.name}
              param={param}
              value={params[param.name]}
              onChange={value => setParams(prev => ({ ...prev, [param.name]: value }))}
            />
          ))}

          {tool.parameters.length === 0 && (
            <p className="text-sm text-white/40 italic">Aucun paramètre requis</p>
          )}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="shrink-0 border-t border-white/10 p-4 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white">Résultat</span>
              <ResultBadge status={result.status} />
              {result.duration && (
                <span className="text-xs text-white/40 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {result.duration}ms
                </span>
              )}
            </div>
            {result.status === 'success' && result.result && (
              <button
                onClick={copyResult}
                className="p-1.5 hover:bg-white/10 rounded transition-colors"
                title="Copier"
              >
                <Copy className="w-4 h-4 text-white/60" />
              </button>
            )}
          </div>

          {result.status === 'success' && result.result && (
            <pre className="p-3 bg-white/5 rounded-lg text-xs text-white/80 overflow-x-auto">
              {JSON.stringify(result.result, null, 2)}
            </pre>
          )}

          {result.status === 'error' && result.error && (
            <div className="p-3 bg-red-500/10 rounded-lg text-sm text-red-400">
              <div className="font-medium">{result.error.code}</div>
              <div>{result.error.message}</div>
            </div>
          )}
        </div>
      )}

      {/* Footer - Run button */}
      <div className="shrink-0 p-4 border-t border-white/10">
        <button
          onClick={handleRun}
          disabled={isRunning || missingPermissions.length > 0}
          className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
            isRunning || missingPermissions.length > 0
              ? 'bg-white/10 text-white/40 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
          }`}
        >
          {isRunning ? (
            <>
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              <span>Exécution en cours...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              <span>Exécuter le test</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// PARAMETER INPUT
// ============================================================================

interface ParameterInputProps {
  param: MCPTool['parameters'][0];
  value: unknown;
  onChange: (value: unknown) => void;
}

function ParameterInput({ param, value, onChange }: ParameterInputProps) {
  const inputId = `param-${param.name}`;

  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="flex items-center gap-2">
        <span className="text-sm text-white/80">{param.name}</span>
        {param.required && <span className="text-red-400 text-xs">*</span>}
        <span className="text-xs text-white/40">({param.type})</span>
      </label>

      {param.type === 'boolean' ? (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value as boolean}
            onChange={e => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
          />
          <span className="text-sm text-white/60">{param.description}</span>
        </label>
      ) : param.enum ? (
        <select
          id={inputId}
          value={value as string}
          onChange={e => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
        >
          <option value="">Sélectionner...</option>
          {param.enum.map(opt => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : param.type === 'number' ? (
        <input
          id={inputId}
          type="number"
          value={value as number}
          min={param.min}
          max={param.max}
          onChange={e => onChange(parseFloat(e.target.value) || 0)}
          placeholder={param.description}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
        />
      ) : (
        <input
          id={inputId}
          type="text"
          value={value as string}
          onChange={e => onChange(e.target.value)}
          placeholder={param.description}
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
        />
      )}

      {param.description && param.type !== 'boolean' && (
        <p className="text-xs text-white/40">{param.description}</p>
      )}
    </div>
  );
}

// ============================================================================
// RESULT BADGE
// ============================================================================

function ResultBadge({ status }: { status: MCPToolCallResult['status'] }) {
  const config = {
    pending: { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
    running: { color: 'bg-blue-500/20 text-blue-400', icon: Clock },
    success: { color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
    error: { color: 'bg-red-500/20 text-red-400', icon: XCircle },
    cancelled: { color: 'bg-gray-500/20 text-gray-400', icon: XCircle },
    timeout: { color: 'bg-orange-500/20 text-orange-400', icon: Clock },
  }[status];

  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${config.color}`}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}
