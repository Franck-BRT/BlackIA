import { ipcMain, dialog } from 'electron';
import { writeFile } from 'fs/promises';
import path from 'path';
import type { LogFilter } from '@blackia/shared';
import { logService } from '../services/log-service';

/**
 * Enregistre les handlers IPC pour le module de logs
 */
export function registerLogHandlers() {
  // Récupérer les logs
  ipcMain.handle('logs:getAll', async (_event, filter?: LogFilter, limit?: number) => {
    try {
      return {
        success: true,
        data: logService.getLogs(filter, limit),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Récupérer les stats
  ipcMain.handle('logs:getStats', async () => {
    try {
      return {
        success: true,
        data: logService.getStats(),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Effacer tous les logs
  ipcMain.handle('logs:clear', async () => {
    try {
      logService.clear();
      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Exporter les logs
  ipcMain.handle('logs:export', async (_event, filter?: LogFilter) => {
    try {
      const json = logService.export(filter);

      // Demander à l'utilisateur où sauvegarder
      const result = await dialog.showSaveDialog({
        title: 'Exporter les logs',
        defaultPath: `blackia-logs-${new Date().toISOString().split('T')[0]}.json`,
        filters: [
          { name: 'JSON', extensions: ['json'] },
          { name: 'Tous les fichiers', extensions: ['*'] },
        ],
      });

      if (!result.canceled && result.filePath) {
        await writeFile(result.filePath, json, 'utf-8');
        return {
          success: true,
          data: { filePath: result.filePath },
        };
      }

      return {
        success: false,
        error: 'Export annulé',
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  });

  // Logger depuis le renderer (pour les logs UI)
  ipcMain.handle(
    'logs:log',
    async (
      _event,
      level: 'debug' | 'info' | 'success' | 'warning' | 'error',
      category: string,
      message: string,
      details?: string,
      metadata?: Record<string, unknown>
    ) => {
      try {
        logService.log(
          level,
          category as any,
          message,
          details,
          metadata,
          'renderer'
        );
        return { success: true };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }
  );

  console.log('[LogHandlers] ✅ Log handlers registered');
}
