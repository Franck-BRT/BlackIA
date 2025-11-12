import type { Log, LogLevel, LogCategory, LogFilter, LogStats } from '@blackia/shared';
import { randomUUID } from 'crypto';
import { BrowserWindow } from 'electron';

/**
 * Service de gestion centralisée des logs
 * - Collecte et stocke les logs en mémoire
 * - Filtre et recherche dans les logs
 * - Calcule des statistiques
 * - Notifie le renderer process des nouveaux logs
 */
class LogService {
  private logs: Log[] = [];
  private maxLogs = 5000; // Limite pour éviter les fuites mémoire
  private mainWindow: BrowserWindow | null = null;

  /**
   * Configure la fenêtre principale pour les notifications
   */
  setMainWindow(window: BrowserWindow | null) {
    this.mainWindow = window;
  }

  /**
   * Ajoute un log
   */
  log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    details?: string,
    metadata?: Record<string, unknown>,
    source?: string
  ): Log {
    const log: Log = {
      id: randomUUID(),
      timestamp: new Date(),
      level,
      category,
      message,
      details,
      metadata,
      source,
    };

    this.logs.unshift(log); // Ajouter au début pour avoir les plus récents en premier

    // Limiter la taille
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Notifier le renderer
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('log:new', log);
    }

    // Aussi logger dans la console Electron pour le debug
    const consoleMessage = `[${category.toUpperCase()}] ${message}${details ? ' - ' + details : ''}`;
    switch (level) {
      case 'error':
        console.error(consoleMessage, metadata);
        break;
      case 'warning':
        console.warn(consoleMessage, metadata);
        break;
      case 'debug':
        console.debug(consoleMessage, metadata);
        break;
      default:
        console.log(consoleMessage, metadata);
    }

    return log;
  }

  /**
   * Méthodes helper pour chaque niveau
   */
  debug(category: LogCategory, message: string, details?: string, metadata?: Record<string, unknown>) {
    return this.log('debug', category, message, details, metadata);
  }

  info(category: LogCategory, message: string, details?: string, metadata?: Record<string, unknown>) {
    return this.log('info', category, message, details, metadata);
  }

  success(category: LogCategory, message: string, details?: string, metadata?: Record<string, unknown>) {
    return this.log('success', category, message, details, metadata);
  }

  warning(category: LogCategory, message: string, details?: string, metadata?: Record<string, unknown>) {
    return this.log('warning', category, message, details, metadata);
  }

  error(category: LogCategory, message: string, details?: string, metadata?: Record<string, unknown>) {
    return this.log('error', category, message, details, metadata);
  }

  /**
   * Récupère tous les logs avec filtres optionnels
   */
  getLogs(filter?: LogFilter, limit = 500): Log[] {
    let filtered = [...this.logs];

    if (filter) {
      // Filtrer par niveau
      if (filter.levels && filter.levels.length > 0) {
        filtered = filtered.filter((log) => filter.levels!.includes(log.level));
      }

      // Filtrer par catégorie
      if (filter.categories && filter.categories.length > 0) {
        filtered = filtered.filter((log) => filter.categories!.includes(log.category));
      }

      // Recherche textuelle
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        filtered = filtered.filter(
          (log) =>
            log.message.toLowerCase().includes(searchLower) ||
            log.details?.toLowerCase().includes(searchLower) ||
            log.source?.toLowerCase().includes(searchLower)
        );
      }

      // Filtrer par date
      if (filter.dateFrom) {
        filtered = filtered.filter((log) => log.timestamp >= filter.dateFrom!);
      }

      if (filter.dateTo) {
        filtered = filtered.filter((log) => log.timestamp <= filter.dateTo!);
      }
    }

    // Limiter le nombre de résultats
    return filtered.slice(0, limit);
  }

  /**
   * Calcule les statistiques des logs
   */
  getStats(): LogStats {
    const stats: LogStats = {
      total: this.logs.length,
      byLevel: {
        debug: 0,
        info: 0,
        success: 0,
        warning: 0,
        error: 0,
      },
      byCategory: {
        system: 0,
        database: 0,
        websearch: 0,
        ollama: 0,
        workflow: 0,
        persona: 0,
        prompt: 0,
        chat: 0,
        api: 0,
        ui: 0,
        attachments: 0,
        rag: 0,
      },
      recentErrors: 0,
      recentWarnings: 0,
    };

    const now = Date.now();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    for (const log of this.logs) {
      // Compter par niveau
      stats.byLevel[log.level]++;

      // Compter par catégorie
      stats.byCategory[log.category]++;

      // Compter les erreurs/warnings récentes
      const logTime = log.timestamp.getTime();
      if (now - logTime <= twentyFourHours) {
        if (log.level === 'error') stats.recentErrors++;
        if (log.level === 'warning') stats.recentWarnings++;
      }
    }

    return stats;
  }

  /**
   * Efface tous les logs
   */
  clear() {
    this.logs = [];
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('log:cleared');
    }
  }

  /**
   * Exporte les logs au format JSON
   */
  export(filter?: LogFilter): string {
    const logsToExport = filter ? this.getLogs(filter, this.maxLogs) : this.logs;
    return JSON.stringify(logsToExport, null, 2);
  }
}

// Instance singleton
export const logService = new LogService();

// Logger global pour remplacer les console.log éparpillés
export const logger = {
  debug: (category: LogCategory, message: string, details?: string, metadata?: Record<string, unknown>) =>
    logService.debug(category, message, details, metadata),

  info: (category: LogCategory, message: string, details?: string, metadata?: Record<string, unknown>) =>
    logService.info(category, message, details, metadata),

  success: (category: LogCategory, message: string, details?: string, metadata?: Record<string, unknown>) =>
    logService.success(category, message, details, metadata),

  warning: (category: LogCategory, message: string, details?: string, metadata?: Record<string, unknown>) =>
    logService.warning(category, message, details, metadata),

  error: (category: LogCategory, message: string, details?: string, metadata?: Record<string, unknown>) =>
    logService.error(category, message, details, metadata),
};
