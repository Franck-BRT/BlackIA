/**
 * useMCPTools Hook
 * Hook React pour interagir avec le serveur MCP
 */

import { useState, useEffect, useCallback } from 'react';

// Types MCP
export interface MCPTool {
  name: string;
  category: string;
  description: string;
  longDescription?: string;
  icon: string;
  parameters: MCPToolParameter[];
  permissions: string[];
  examples: { title: string; description: string; parameters: Record<string, unknown> }[];
  dangerous?: boolean;
  requiresConfirmation?: boolean;
  timeout?: number;
  enabled?: boolean;
}

export interface MCPToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'file';
  description: string;
  required: boolean;
  default?: unknown;
  enum?: string[];
  min?: number;
  max?: number;
}

export interface MCPToolCallResult {
  id: string;
  tool: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'cancelled' | 'timeout';
  result?: unknown;
  error?: { code: string; message: string };
  startedAt: number;
  completedAt?: number;
  duration?: number;
}

export interface MCPCategory {
  category: string;
  tools: MCPTool[];
  icon: string;
  name: string;
}

export interface MCPServerState {
  running: boolean;
  startedAt?: number;
  toolsCount: number;
  callsCount: number;
  lastCall?: MCPToolCallResult;
}

export interface DirectoryAccess {
  id: string;
  path: string;
  name: string;
  permissions: ('read' | 'write' | 'delete' | 'execute' | 'move')[];
  includeSubdirectories: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface MCPPermissionState {
  permission: string;
  granted: boolean;
  enabled: boolean;
  lastChecked?: number;
}

// Hook principal
export function useMCPTools() {
  const [serverState, setServerState] = useState<MCPServerState | null>(null);
  const [categories, setCategories] = useState<MCPCategory[]>([]);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [directories, setDirectories] = useState<DirectoryAccess[]>([]);
  const [permissions, setPermissions] = useState<MCPPermissionState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callHistory, setCallHistory] = useState<MCPToolCallResult[]>([]);

  // Charger l'état initial
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        setLoading(true);
        setError(null);

        const [state, cats, dirs, permsConfig] = await Promise.all([
          window.api.invoke('mcp:getState'),
          window.api.invoke('mcp:getAllCategories'),
          window.api.invoke('mcp:getDirectories'),
          window.api.invoke('mcp:getPermissionsConfig'),
        ]);

        setServerState(state);
        setCategories(cats);
        setTools(cats.flatMap((c: MCPCategory) => c.tools));
        setDirectories(dirs);
        setPermissions(permsConfig.permissions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    loadInitialState();
  }, []);

  // Écouter les événements MCP
  useEffect(() => {
    const handleToolCallEnd = (_event: unknown, result: MCPToolCallResult) => {
      setCallHistory(prev => [result, ...prev].slice(0, 100));
      setServerState(prev => prev ? { ...prev, callsCount: prev.callsCount + 1, lastCall: result } : prev);
    };

    const handlePermissionsChanged = (_event: unknown, config: { permissions: MCPPermissionState[] }) => {
      setPermissions(config.permissions || []);
    };

    const handleDirectoryAdded = (_event: unknown, dir: DirectoryAccess) => {
      setDirectories(prev => [...prev, dir]);
    };

    const handleDirectoryRemoved = (_event: unknown, dir: DirectoryAccess) => {
      setDirectories(prev => prev.filter(d => d.id !== dir.id));
    };

    window.api.on('mcp:toolCallEnd', handleToolCallEnd);
    window.api.on('mcp:permissionsChanged', handlePermissionsChanged);
    window.api.on('mcp:directoryAdded', handleDirectoryAdded);
    window.api.on('mcp:directoryRemoved', handleDirectoryRemoved);

    return () => {
      window.api.off('mcp:toolCallEnd', handleToolCallEnd);
      window.api.off('mcp:permissionsChanged', handlePermissionsChanged);
      window.api.off('mcp:directoryAdded', handleDirectoryAdded);
      window.api.off('mcp:directoryRemoved', handleDirectoryRemoved);
    };
  }, []);

  // Appeler un outil
  const callTool = useCallback(async (
    toolName: string,
    parameters: Record<string, unknown>
  ): Promise<MCPToolCallResult> => {
    try {
      const result = await window.api.invoke('mcp:callTool', { tool: toolName, parameters });
      return result;
    } catch (err) {
      return {
        id: `error-${Date.now()}`,
        tool: toolName,
        status: 'error',
        error: { code: 'EXECUTION_ERROR', message: err instanceof Error ? err.message : 'Erreur' },
        startedAt: Date.now(),
        completedAt: Date.now(),
        duration: 0,
      };
    }
  }, []);

  // Activer/désactiver un outil
  const setToolEnabled = useCallback(async (toolName: string, enabled: boolean) => {
    await window.api.invoke('mcp:setToolEnabled', toolName, enabled);
    setTools(prev => prev.map(t => t.name === toolName ? { ...t, enabled } : t));
    setCategories(prev => prev.map(cat => ({
      ...cat,
      tools: cat.tools.map(t => t.name === toolName ? { ...t, enabled } : t),
    })));
  }, []);

  // Activer/désactiver une permission
  const setPermissionEnabled = useCallback(async (permission: string, enabled: boolean) => {
    await window.api.invoke('mcp:setPermissionEnabled', permission, enabled);
    setPermissions(prev => prev.map(p =>
      p.permission === permission ? { ...p, enabled } : p
    ));
  }, []);

  // Demander une permission système
  const requestSystemPermission = useCallback(async (permission: string) => {
    const result = await window.api.invoke('mcp:requestSystemPermission', permission);
    if (result.granted) {
      setPermissions(prev => prev.map(p =>
        p.permission === permission ? { ...p, granted: true } : p
      ));
    }
    return result.granted;
  }, []);

  // Ajouter un répertoire
  const addDirectory = useCallback(async (directory: Omit<DirectoryAccess, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `dir-${Date.now()}`;
    const fullDir: DirectoryAccess = {
      ...directory,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await window.api.invoke('mcp:addDirectory', fullDir);
    setDirectories(prev => [...prev, fullDir]);
  }, []);

  // Supprimer un répertoire
  const removeDirectory = useCallback(async (directoryId: string) => {
    await window.api.invoke('mcp:removeDirectory', directoryId);
    setDirectories(prev => prev.filter(d => d.id !== directoryId));
  }, []);

  // Mettre à jour les permissions d'un répertoire
  const updateDirectoryPermissions = useCallback(async (
    directoryId: string,
    permissions: ('read' | 'write' | 'delete' | 'execute' | 'move')[]
  ) => {
    await window.api.invoke('mcp:updateDirectoryPermissions', directoryId, permissions);
    setDirectories(prev => prev.map(d =>
      d.id === directoryId ? { ...d, permissions, updatedAt: Date.now() } : d
    ));
  }, []);

  // Récupérer un outil par nom
  const getTool = useCallback((name: string) => {
    return tools.find(t => t.name === name);
  }, [tools]);

  // Récupérer les outils par catégorie
  const getToolsByCategory = useCallback((category: string) => {
    return categories.find(c => c.category === category)?.tools || [];
  }, [categories]);

  // Rafraîchir l'état
  const refresh = useCallback(async () => {
    try {
      const [state, cats, dirs, permsConfig] = await Promise.all([
        window.api.invoke('mcp:getState'),
        window.api.invoke('mcp:getAllCategories'),
        window.api.invoke('mcp:getDirectories'),
        window.api.invoke('mcp:getPermissionsConfig'),
      ]);

      setServerState(state);
      setCategories(cats);
      setTools(cats.flatMap((c: MCPCategory) => c.tools));
      setDirectories(dirs);
      setPermissions(permsConfig.permissions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de rafraîchissement');
    }
  }, []);

  return {
    // State
    serverState,
    categories,
    tools,
    directories,
    permissions,
    loading,
    error,
    callHistory,

    // Actions
    callTool,
    setToolEnabled,
    setPermissionEnabled,
    requestSystemPermission,
    addDirectory,
    removeDirectory,
    updateDirectoryPermissions,
    getTool,
    getToolsByCategory,
    refresh,
  };
}
