/**
 * Tools Page
 * Page principale pour le module Outils MCP
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Settings,
  Play,
  ChevronRight,
  Shield,
  FolderOpen,
  History,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useMCPTools, type MCPTool, type MCPCategory, type MCPToolCallResult } from '../hooks/useMCPTools';
import { ToolTestPanel } from '../components/tools/ToolTestPanel';
import { PermissionsPanel } from '../components/tools/PermissionsPanel';
import { DirectoriesPanel } from '../components/tools/DirectoriesPanel';

type TabType = 'tools' | 'permissions' | 'directories' | 'history';

export function ToolsPage() {
  const {
    categories,
    tools,
    directories,
    permissions,
    loading,
    error,
    callHistory,
    serverState,
    callTool,
    setToolEnabled,
    setPermissionEnabled,
    requestSystemPermission,
    addDirectory,
    removeDirectory,
    updateDirectoryPermissions,
    refresh,
  } = useMCPTools();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<MCPTool | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('tools');

  // Filtrer les catégories et outils
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;

    const query = searchQuery.toLowerCase();
    return categories
      .map(cat => ({
        ...cat,
        tools: cat.tools.filter(
          t =>
            t.name.toLowerCase().includes(query) ||
            t.description.toLowerCase().includes(query) ||
            cat.name.toLowerCase().includes(query)
        ),
      }))
      .filter(cat => cat.tools.length > 0);
  }, [categories, searchQuery]);

  // Obtenir les outils de la catégorie sélectionnée
  const categoryTools = useMemo(() => {
    if (!selectedCategory) return [];
    return filteredCategories.find(c => c.category === selectedCategory)?.tools || [];
  }, [filteredCategories, selectedCategory]);

  // Statistiques
  const stats = useMemo(() => {
    const totalTools = tools.length;
    const enabledTools = tools.filter(t => t.enabled !== false).length;
    const enabledPerms = permissions.filter(p => p.enabled && p.granted).length;
    const totalPerms = permissions.length;
    const successCalls = callHistory.filter(c => c.status === 'success').length;
    const errorCalls = callHistory.filter(c => c.status === 'error').length;

    return { totalTools, enabledTools, enabledPerms, totalPerms, successCalls, errorCalls };
  }, [tools, permissions, callHistory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-white/60">Chargement des outils MCP...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-400">{error}</p>
          <button
            onClick={refresh}
            className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="shrink-0 p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Outils MCP</h1>
              <p className="text-sm text-white/60">
                {stats.enabledTools}/{stats.totalTools} outils actifs •{' '}
                {serverState?.running ? (
                  <span className="text-green-400">Serveur actif</span>
                ) : (
                  <span className="text-red-400">Serveur arrêté</span>
                )}
              </p>
            </div>
          </div>

          {/* Stats badges */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-green-500/20 rounded-lg flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-400">{stats.successCalls} succès</span>
            </div>
            {stats.errorCalls > 0 && (
              <div className="px-3 py-1.5 bg-red-500/20 rounded-lg flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">{stats.errorCalls} erreurs</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1">
          {[
            { id: 'tools' as const, label: 'Outils', icon: Zap },
            { id: 'permissions' as const, label: 'Permissions', icon: Shield },
            { id: 'directories' as const, label: 'Répertoires', icon: FolderOpen },
            { id: 'history' as const, label: 'Historique', icon: History },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'tools' && (
          <div className="h-full flex">
            {/* Categories sidebar */}
            <div className="w-64 border-r border-white/10 overflow-y-auto">
              {/* Search */}
              <div className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Rechercher un outil..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Categories list */}
              <div className="px-2 pb-4">
                {filteredCategories.map(cat => (
                  <button
                    key={cat.category}
                    onClick={() => {
                      setSelectedCategory(cat.category);
                      setSelectedTool(null);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-colors ${
                      selectedCategory === cat.category
                        ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{cat.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{cat.name}</div>
                      <div className="text-xs text-white/40">{cat.tools.length} outils</div>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>
                ))}
              </div>
            </div>

            {/* Tools list */}
            {selectedCategory && !selectedTool && (
              <div className="flex-1 overflow-y-auto p-4">
                <h2 className="text-lg font-semibold text-white mb-4">
                  {filteredCategories.find(c => c.category === selectedCategory)?.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryTools.map(tool => (
                    <ToolCard
                      key={tool.name}
                      tool={tool}
                      onSelect={() => setSelectedTool(tool)}
                      onToggle={enabled => setToolEnabled(tool.name, enabled)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Tool test panel */}
            {selectedTool && (
              <ToolTestPanel
                tool={selectedTool}
                onClose={() => setSelectedTool(null)}
                onCallTool={callTool}
                permissions={permissions}
              />
            )}

            {/* Empty state */}
            {!selectedCategory && !selectedTool && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Zap className="w-12 h-12 text-purple-500/50 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Sélectionnez une catégorie</h3>
                  <p className="text-white/60">
                    Choisissez une catégorie d'outils pour voir les outils disponibles
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'permissions' && (
          <PermissionsPanel
            permissions={permissions}
            onTogglePermission={setPermissionEnabled}
            onRequestPermission={requestSystemPermission}
          />
        )}

        {activeTab === 'directories' && (
          <DirectoriesPanel
            directories={directories}
            onAddDirectory={addDirectory}
            onRemoveDirectory={removeDirectory}
            onUpdatePermissions={updateDirectoryPermissions}
          />
        )}

        {activeTab === 'history' && <HistoryPanel history={callHistory} />}
      </div>
    </div>
  );
}

// ============================================================================
// TOOL CARD COMPONENT
// ============================================================================

interface ToolCardProps {
  tool: MCPTool;
  onSelect: () => void;
  onToggle: (enabled: boolean) => void;
}

function ToolCard({ tool, onSelect, onToggle }: ToolCardProps) {
  const isEnabled = tool.enabled !== false;

  return (
    <div
      className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
        isEnabled
          ? 'bg-white/5 border-white/10 hover:border-purple-500/50 hover:bg-white/10'
          : 'bg-white/[0.02] border-white/5 opacity-60'
      }`}
      onClick={onSelect}
    >
      {/* Dangerous badge */}
      {tool.dangerous && (
        <div className="absolute top-2 right-2">
          <AlertTriangle className="w-4 h-4 text-orange-400" />
        </div>
      )}

      {/* Icon and title */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center text-xl">
          {tool.icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white truncate">{tool.name}</h3>
          <p className="text-xs text-white/40">{tool.parameters.length} paramètres</p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-white/60 line-clamp-2 mb-3">{tool.description}</p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {tool.permissions.slice(0, 2).map(perm => (
            <span key={perm} className="px-2 py-0.5 bg-white/10 rounded text-[10px] text-white/50">
              {perm}
            </span>
          ))}
          {tool.permissions.length > 2 && (
            <span className="text-[10px] text-white/40">+{tool.permissions.length - 2}</span>
          )}
        </div>

        <button
          onClick={e => {
            e.stopPropagation();
            onToggle(!isEnabled);
          }}
          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
            isEnabled
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
              : 'bg-white/10 text-white/40 hover:bg-white/20'
          }`}
        >
          {isEnabled ? 'Actif' : 'Inactif'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// HISTORY PANEL
// ============================================================================

interface HistoryPanelProps {
  history: MCPToolCallResult[];
}

function HistoryPanel({ history }: HistoryPanelProps) {
  if (history.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <History className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucun historique</h3>
          <p className="text-white/60">Les appels d'outils apparaîtront ici</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-2">
        {history.map(call => (
          <div
            key={call.id}
            className="p-4 bg-white/5 rounded-xl border border-white/10"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-white">{call.tool}</span>
                <StatusBadge status={call.status} />
              </div>
              <div className="flex items-center gap-2 text-sm text-white/40">
                {call.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {call.duration}ms
                  </span>
                )}
                <span>{new Date(call.startedAt).toLocaleTimeString()}</span>
              </div>
            </div>

            {call.error && (
              <div className="mt-2 p-2 bg-red-500/10 rounded-lg text-sm text-red-400">
                {call.error.message}
              </div>
            )}

            {call.status === 'success' && call.result && (
              <div className="mt-2 p-2 bg-white/5 rounded-lg">
                <pre className="text-xs text-white/60 overflow-x-auto">
                  {JSON.stringify(call.result, null, 2).slice(0, 500)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: MCPToolCallResult['status'] }) {
  const config = {
    pending: { color: 'bg-yellow-500/20 text-yellow-400', icon: Clock },
    running: { color: 'bg-blue-500/20 text-blue-400', icon: RefreshCw },
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
