import React, { useState, useEffect, useCallback } from 'react';
import {
  ScrollText,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  Bug,
  Download,
  Trash2,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { Log, LogLevel, LogCategory, LogFilter, LogStats } from '@blackia/shared';

// Icônes pour chaque niveau de log
const levelIcons: Record<LogLevel, React.ElementType> = {
  debug: Bug,
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

// Couleurs pour chaque niveau de log
const levelColors: Record<LogLevel, string> = {
  debug: 'text-gray-400',
  info: 'text-blue-400',
  success: 'text-green-400',
  warning: 'text-yellow-400',
  error: 'text-red-400',
};

// Couleurs de badge pour chaque catégorie
const categoryColors: Record<LogCategory, string> = {
  system: 'bg-purple-500/20 text-purple-400',
  database: 'bg-blue-500/20 text-blue-400',
  websearch: 'bg-cyan-500/20 text-cyan-400',
  ollama: 'bg-green-500/20 text-green-400',
  workflow: 'bg-orange-500/20 text-orange-400',
  persona: 'bg-pink-500/20 text-pink-400',
  prompt: 'bg-indigo-500/20 text-indigo-400',
  chat: 'bg-teal-500/20 text-teal-400',
  api: 'bg-yellow-500/20 text-yellow-400',
  ui: 'bg-rose-500/20 text-rose-400',
};

export function LogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [filter, setFilter] = useState<LogFilter>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<LogLevel[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<LogCategory[]>([]);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Charger les logs et stats
  const loadLogs = useCallback(async () => {
    try {
      const currentFilter: LogFilter = {
        levels: selectedLevels.length > 0 ? selectedLevels : undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        search: searchQuery || undefined,
      };

      const [logsResult, statsResult] = await Promise.all([
        window.electronAPI.logs.getAll(currentFilter, 500),
        window.electronAPI.logs.getStats(),
      ]);

      if (logsResult.success && logsResult.data) {
        setLogs(logsResult.data);
      }

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('[LogsPage] Error loading logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLevels, selectedCategories, searchQuery]);

  // Charger au démarrage
  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Écouter les nouveaux logs en temps réel
  useEffect(() => {
    const handleNewLog = (log: Log) => {
      // Vérifier si le log correspond aux filtres actuels
      const matchesLevels = selectedLevels.length === 0 || selectedLevels.includes(log.level);
      const matchesCategories =
        selectedCategories.length === 0 || selectedCategories.includes(log.category);
      const matchesSearch =
        !searchQuery ||
        log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details?.toLowerCase().includes(searchQuery.toLowerCase());

      if (matchesLevels && matchesCategories && matchesSearch) {
        setLogs((prev) => [log, ...prev].slice(0, 500)); // Garder max 500 logs
      }

      // Rafraîchir les stats
      loadLogs();
    };

    const handleCleared = () => {
      setLogs([]);
      loadLogs();
    };

    window.electronAPI.logs.onNewLog(handleNewLog);
    window.electronAPI.logs.onCleared(handleCleared);

    return () => {
      window.electronAPI.logs.removeAllListeners();
    };
  }, [selectedLevels, selectedCategories, searchQuery, loadLogs]);

  // Effacer tous les logs
  const handleClearLogs = async () => {
    if (confirm('Êtes-vous sûr de vouloir effacer tous les logs ?')) {
      try {
        await window.electronAPI.logs.clear();
      } catch (error) {
        console.error('[LogsPage] Error clearing logs:', error);
      }
    }
  };

  // Exporter les logs
  const handleExportLogs = async () => {
    try {
      const currentFilter: LogFilter = {
        levels: selectedLevels.length > 0 ? selectedLevels : undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        search: searchQuery || undefined,
      };

      const result = await window.electronAPI.logs.export(currentFilter);
      if (result.success && result.data) {
        alert(`Logs exportés vers: ${result.data.filePath}`);
      }
    } catch (error) {
      console.error('[LogsPage] Error exporting logs:', error);
    }
  };

  // Formater la date
  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Toggle niveau de log
  const toggleLevel = (level: LogLevel) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    );
  };

  // Toggle catégorie
  const toggleCategory = (category: LogCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const allLevels: LogLevel[] = ['debug', 'info', 'success', 'warning', 'error'];
  const allCategories: LogCategory[] = [
    'system',
    'database',
    'websearch',
    'ollama',
    'workflow',
    'persona',
    'prompt',
    'chat',
    'api',
    'ui',
  ];

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <ScrollText className="w-12 h-12 text-purple-400 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Chargement des logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden p-8">
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full gap-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl glass-card flex items-center justify-center">
              <ScrollText className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Logs Système</h1>
              <p className="text-sm text-muted-foreground">
                {stats ? `${stats.total} logs` : "Historique de l'application"}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg glass-hover flex items-center gap-2 ${
                showFilters ? 'glass-lg' : ''
              }`}
            >
              <Filter className="w-4 h-4" />
              Filtres
            </button>
            <button
              onClick={handleExportLogs}
              className="px-4 py-2 rounded-lg glass-hover flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exporter
            </button>
            <button
              onClick={handleClearLogs}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Effacer
            </button>
          </div>
        </div>

        {/* Stats Dashboard */}
        {stats && (
          <div className="grid grid-cols-5 gap-4">
            {allLevels.map((level) => {
              const Icon = levelIcons[level];
              const count = stats.byLevel[level];
              return (
                <div key={level} className="glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`w-5 h-5 ${levelColors[level]}`} />
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                  <p className="text-sm text-muted-foreground capitalize">{level}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Filtres */}
        {showFilters && (
          <div className="glass-card rounded-xl p-4 space-y-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher dans les logs..."
                className="w-full pl-10 pr-4 py-2 glass-card rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtres par niveau */}
            <div>
              <p className="text-sm font-medium mb-2">Niveaux</p>
              <div className="flex flex-wrap gap-2">
                {allLevels.map((level) => {
                  const Icon = levelIcons[level];
                  const isSelected = selectedLevels.includes(level);
                  return (
                    <button
                      key={level}
                      onClick={() => toggleLevel(level)}
                      className={`px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'glass-lg ring-2 ring-purple-500/50'
                          : 'glass-card hover:glass-hover'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${levelColors[level]}`} />
                      <span className="text-sm capitalize">{level}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filtres par catégorie */}
            <div>
              <p className="text-sm font-medium mb-2">Catégories</p>
              <div className="flex flex-wrap gap-2">
                {allCategories.map((category) => {
                  const isSelected = selectedCategories.includes(category);
                  return (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-all ${
                        isSelected
                          ? `${categoryColors[category]} ring-2 ring-purple-500/50`
                          : 'glass-card hover:glass-hover'
                      }`}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reset filters */}
            {(selectedLevels.length > 0 || selectedCategories.length > 0 || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedLevels([]);
                  setSelectedCategories([]);
                  setSearchQuery('');
                }}
                className="text-sm text-purple-400 hover:text-purple-300"
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        )}

        {/* Liste des logs */}
        <div className="flex-1 glass-card rounded-xl overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center p-8">
                <div>
                  <ScrollText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucun log à afficher</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {logs.map((log) => {
                  const Icon = levelIcons[log.level];
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <div
                      key={log.id}
                      className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 ${levelColors[log.level]} flex-shrink-0 mt-0.5`} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs ${categoryColors[log.category]}`}>
                              {log.category}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(log.timestamp)}
                            </span>
                            {log.source && (
                              <span className="text-xs text-gray-500">• {log.source}</span>
                            )}
                          </div>

                          <p className="text-sm font-medium mb-1">{log.message}</p>

                          {log.details && (
                            <p className="text-xs text-muted-foreground">{log.details}</p>
                          )}

                          {/* Metadata expanded */}
                          {isExpanded && log.metadata && (
                            <div className="mt-3 p-3 glass-card rounded-lg">
                              <p className="text-xs font-medium mb-2">Métadonnées :</p>
                              <pre className="text-xs text-gray-400 overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>

                        <button className="p-1 hover:bg-white/10 rounded transition-colors">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
