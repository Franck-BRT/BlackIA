/**
 * MCP Server
 * Serveur MCP local pour BlackIA
 */

import { EventEmitter } from 'events';
import {
  MCPServerState,
  MCPServerConfig,
  MCPPermissionsConfig,
  MCPPermissionState,
  MCPPermission,
  DirectoryAccess,
  FileAccessType,
  MCPToolCallRequest,
  MCPToolCallResult,
  MCPToolStats,
  ChatToolDefinition,
  MCPTool,
  MCPToolCategory,
} from './mcp-protocol';
import { mcpToolsRegistry } from './mcp-tools-registry';
import { mcpExecutor, MCPExecutor } from './mcp-executor';
import * as mcpPersistence from './mcp-persistence';

// ============================================================================
// MCP SERVER CLASS
// ============================================================================

export class MCPServer extends EventEmitter {
  private state: MCPServerState;
  private config: MCPServerConfig;
  private permissionsConfig: MCPPermissionsConfig;
  private executor: MCPExecutor;
  private rateLimitMap: Map<string, number[]> = new Map();

  constructor() {
    super();

    // État initial
    this.state = {
      running: false,
      toolsCount: 0,
      callsCount: 0,
      errors: [],
    };

    // Configuration par défaut
    this.config = {
      enabled: true,
      maxConcurrentCalls: 5,
      defaultTimeout: 30000,
      rateLimitPerMinute: 60,
      logLevel: 'info',
    };

    // Permissions par défaut
    this.permissionsConfig = {
      permissions: this.getDefaultPermissions(),
      directories: [],
      globalEnabled: true,
      requireConfirmation: true,
      logAllCalls: true,
    };

    this.executor = mcpExecutor;
  }

  // ============================================================================
  // LIFECYCLE
  // ============================================================================

  /**
   * Démarre le serveur MCP
   */
  public async start(): Promise<void> {
    if (this.state.running) {
      return;
    }

    // Charger les répertoires depuis la base de données
    try {
      const savedDirectories = await mcpPersistence.loadDirectories();
      if (savedDirectories.length > 0) {
        this.permissionsConfig.directories = savedDirectories;
        console.log('[MCPServer] Loaded', savedDirectories.length, 'directories from database');
      }
    } catch (error) {
      console.error('[MCPServer] Error loading directories:', error);
    }

    // Charger les permissions depuis la base de données
    try {
      const savedPermissions = await mcpPersistence.loadPermissions();
      for (const saved of savedPermissions) {
        const perm = this.permissionsConfig.permissions.find(p => p.permission === saved.permission);
        if (perm) {
          perm.enabled = saved.enabled;
          perm.granted = saved.granted; // Restaurer aussi le statut granted
        }
      }
      console.log('[MCPServer] Loaded', savedPermissions.length, 'permissions from database');
    } catch (error) {
      console.error('[MCPServer] Error loading permissions:', error);
    }

    // Charger les configurations d'outils
    try {
      const savedToolConfigs = await mcpPersistence.loadToolConfigs();
      for (const config of savedToolConfigs) {
        const tool = mcpToolsRegistry.getTool(config.toolName);
        if (tool) {
          tool.enabled = config.enabled;
        }
      }
      console.log('[MCPServer] Loaded', savedToolConfigs.length, 'tool configs from database');
    } catch (error) {
      console.error('[MCPServer] Error loading tool configs:', error);
    }

    this.state = {
      running: true,
      startedAt: Date.now(),
      toolsCount: mcpToolsRegistry.getAllTools().length,
      callsCount: 0,
      errors: [],
    };

    // Appliquer les permissions à l'exécuteur
    this.applyPermissionsToExecutor();

    this.emit('started', this.state);
    this.log('info', 'MCP Server started');
  }

  /**
   * Arrête le serveur MCP
   */
  public async stop(): Promise<void> {
    if (!this.state.running) {
      return;
    }

    this.state.running = false;
    this.emit('stopped');
    this.log('info', 'MCP Server stopped');
  }

  /**
   * Redémarre le serveur
   */
  public async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  // ============================================================================
  // TOOL EXECUTION
  // ============================================================================

  /**
   * Exécute un appel d'outil
   */
  public async callTool(request: MCPToolCallRequest): Promise<MCPToolCallResult> {
    if (!this.state.running) {
      throw new Error('MCP Server is not running');
    }

    if (!this.config.enabled || !this.permissionsConfig.globalEnabled) {
      throw new Error('MCP is disabled');
    }

    // Vérifier le rate limit
    if (!this.checkRateLimit(request.tool)) {
      return {
        id: request.id,
        tool: request.tool,
        status: 'error',
        error: { code: 'RATE_LIMITED', message: 'Trop d\'appels, veuillez patienter' },
        startedAt: Date.now(),
        completedAt: Date.now(),
        duration: 0,
      };
    }

    // Vérifier les permissions
    const tool = mcpToolsRegistry.getTool(request.tool);
    if (!tool) {
      return {
        id: request.id,
        tool: request.tool,
        status: 'error',
        error: { code: 'TOOL_NOT_FOUND', message: `Outil "${request.tool}" non trouvé` },
        startedAt: Date.now(),
        completedAt: Date.now(),
        duration: 0,
      };
    }

    // Vérifier les permissions de l'outil
    for (const perm of tool.permissions) {
      if (!this.isPermissionEnabled(perm)) {
        return {
          id: request.id,
          tool: request.tool,
          status: 'error',
          error: { code: 'PERMISSION_DENIED', message: `Permission "${perm}" requise mais non activée` },
          startedAt: Date.now(),
          completedAt: Date.now(),
          duration: 0,
        };
      }
    }

    // Log l'appel si configuré
    if (this.permissionsConfig.logAllCalls) {
      this.log('info', `Tool call: ${request.tool}`, request.parameters);
    }

    // Émettre l'événement de début
    this.emit('toolCallStart', request);

    // Exécuter
    const result = await this.executor.execute(request);

    // Incrémenter le compteur
    this.state.callsCount++;
    this.state.lastCall = result;

    // Logger les erreurs
    if (result.status === 'error' && result.error) {
      this.state.errors.push(result.error);
      if (this.state.errors.length > 100) {
        this.state.errors.shift();
      }
    }

    // Émettre l'événement de fin
    this.emit('toolCallEnd', result);

    return result;
  }

  /**
   * Annule un appel en cours
   */
  public cancelCall(callId: string): boolean {
    return this.executor.cancel(callId);
  }

  // ============================================================================
  // PERMISSIONS MANAGEMENT
  // ============================================================================

  /**
   * Récupère la configuration des permissions
   */
  public getPermissionsConfig(): MCPPermissionsConfig {
    return { ...this.permissionsConfig };
  }

  /**
   * Met à jour la configuration des permissions
   */
  public setPermissionsConfig(config: Partial<MCPPermissionsConfig>): void {
    this.permissionsConfig = { ...this.permissionsConfig, ...config };
    this.applyPermissionsToExecutor();
    this.emit('permissionsChanged', this.permissionsConfig);
  }

  /**
   * Active ou désactive une permission
   */
  public setPermissionEnabled(permission: MCPPermission, enabled: boolean): void {
    const perm = this.permissionsConfig.permissions.find(p => p.permission === permission);
    if (perm) {
      perm.enabled = enabled;
      // Quand l'utilisateur active une permission, on considère qu'il l'a aussi accordée
      if (enabled) {
        perm.granted = true;
      }
      this.applyPermissionsToExecutor();
      this.emit('permissionChanged', { permission, enabled, granted: perm.granted });

      // Sauvegarder dans la base de données (avec le statut granted)
      mcpPersistence.savePermission(permission, enabled, perm.granted).catch(err => {
        console.error('[MCPServer] Error saving permission to database:', err);
      });
    }
  }

  /**
   * Vérifie si une permission est activée
   */
  public isPermissionEnabled(permission: MCPPermission): boolean {
    const perm = this.permissionsConfig.permissions.find(p => p.permission === permission);
    return perm ? perm.enabled && perm.granted : false;
  }

  /**
   * Ajoute un répertoire autorisé
   */
  public addDirectory(directory: DirectoryAccess): void {
    // Vérifier si le répertoire existe déjà
    const existing = this.permissionsConfig.directories.find(d => d.path === directory.path);
    if (existing) {
      // Mettre à jour
      Object.assign(existing, directory, { updatedAt: Date.now() });
    } else {
      this.permissionsConfig.directories.push({
        ...directory,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    this.applyPermissionsToExecutor();
    this.emit('directoryAdded', directory);

    // Sauvegarder dans la base de données
    mcpPersistence.saveDirectory(directory).catch(err => {
      console.error('[MCPServer] Error saving directory to database:', err);
    });
  }

  /**
   * Supprime un répertoire autorisé
   */
  public removeDirectory(directoryId: string): void {
    const index = this.permissionsConfig.directories.findIndex(d => d.id === directoryId);
    if (index !== -1) {
      const removed = this.permissionsConfig.directories.splice(index, 1)[0];
      this.applyPermissionsToExecutor();
      this.emit('directoryRemoved', removed);

      // Supprimer de la base de données
      mcpPersistence.deleteDirectory(directoryId).catch(err => {
        console.error('[MCPServer] Error deleting directory from database:', err);
      });
    }
  }

  /**
   * Met à jour les permissions d'un répertoire
   */
  public updateDirectoryPermissions(directoryId: string, permissions: FileAccessType[]): void {
    const directory = this.permissionsConfig.directories.find(d => d.id === directoryId);
    if (directory) {
      directory.permissions = permissions;
      directory.updatedAt = Date.now();
      this.applyPermissionsToExecutor();
      this.emit('directoryUpdated', directory);

      // Sauvegarder dans la base de données
      mcpPersistence.updateDirectoryPermissions(directoryId, permissions).catch(err => {
        console.error('[MCPServer] Error updating directory permissions in database:', err);
      });
    }
  }

  /**
   * Récupère les répertoires autorisés
   */
  public getDirectories(): DirectoryAccess[] {
    return [...this.permissionsConfig.directories];
  }

  // ============================================================================
  // TOOLS MANAGEMENT
  // ============================================================================

  /**
   * Récupère tous les outils
   */
  public getAllTools(): MCPTool[] {
    return mcpToolsRegistry.getAllTools();
  }

  /**
   * Récupère les outils par catégorie
   */
  public getToolsByCategory(category: MCPToolCategory): MCPTool[] {
    return mcpToolsRegistry.getToolsByCategory(category);
  }

  /**
   * Récupère toutes les catégories avec leurs outils
   */
  public getAllCategories(): { category: MCPToolCategory; tools: MCPTool[]; icon: string; name: string }[] {
    return mcpToolsRegistry.getAllCategories();
  }

  /**
   * Active ou désactive un outil
   */
  public setToolEnabled(toolName: string, enabled: boolean): void {
    const tool = mcpToolsRegistry.getTool(toolName);
    if (tool) {
      tool.enabled = enabled;
      this.emit('toolChanged', { tool: toolName, enabled });

      // Sauvegarder dans la base de données
      mcpPersistence.saveToolConfig(toolName, tool.category, enabled).catch(err => {
        console.error('[MCPServer] Error saving tool config to database:', err);
      });
    }
  }

  /**
   * Récupère un outil par son nom
   */
  public getTool(name: string): MCPTool | undefined {
    return mcpToolsRegistry.getTool(name);
  }

  /**
   * Récupère les définitions d'outils pour le chat
   */
  public getToolsForChat(): ChatToolDefinition[] {
    const allTools = mcpToolsRegistry.getAllTools();
    console.log('[MCPServer] getToolsForChat - Total outils:', allTools.length);

    // Ne retourner que les outils dont les permissions sont activées
    const filteredTools = allTools.filter(tool => {
      if (tool.enabled === false) {
        console.log(`[MCPServer] Outil ${tool.name} désactivé`);
        return false;
      }
      for (const perm of tool.permissions) {
        const isEnabled = this.isPermissionEnabled(perm);
        if (!isEnabled) {
          console.log(`[MCPServer] Outil ${tool.name} - permission ${perm} non activée`);
          return false;
        }
      }
      return true;
    });

    console.log('[MCPServer] Outils avec permissions:', filteredTools.length, filteredTools.map(t => t.name));

    const chatTools = mcpToolsRegistry.getToolsForChat();
    const result = filteredTools
      .map(tool => chatTools.find(t => t.function.name === tool.name)!)
      .filter(Boolean);

    console.log('[MCPServer] Outils pour chat:', result.length);
    return result;
  }

  /**
   * Récupère les outils pour le chat avec leur statut et les permissions manquantes
   */
  public getToolsForChatWithStatus(): {
    enabledTools: ChatToolDefinition[];
    disabledTools: Array<{
      name: string;
      description: string;
      icon: string;
      category: string;
      missingPermissions: Array<{
        permission: string;
        label: string;
        granted: boolean;
        enabled: boolean;
      }>;
      isToolDisabled: boolean;
    }>;
  } {
    const allTools = mcpToolsRegistry.getAllTools();
    const chatTools = mcpToolsRegistry.getToolsForChat();
    const enabledTools: ChatToolDefinition[] = [];
    const disabledTools: Array<{
      name: string;
      description: string;
      icon: string;
      category: string;
      missingPermissions: Array<{
        permission: string;
        label: string;
        granted: boolean;
        enabled: boolean;
      }>;
      isToolDisabled: boolean;
    }> = [];

    const permissionLabels: Record<string, string> = {
      'files': 'Accès aux fichiers',
      'clipboard': 'Presse-papiers',
      'notifications': 'Notifications',
      'calendar': 'Calendrier',
      'contacts': 'Contacts',
      'reminders': 'Rappels',
      'photos': 'Photos',
      'music': 'Musique',
      'camera': 'Caméra',
      'microphone': 'Microphone',
      'location': 'Localisation',
      'screen': 'Enregistrement écran',
      'accessibility': 'Accessibilité',
      'automation': 'Automatisation',
      'full-disk-access': 'Accès disque complet',
      'system': 'Système',
      'network': 'Réseau',
      'browser': 'Navigateur',
    };

    for (const tool of allTools) {
      const isToolDisabled = tool.enabled === false;
      const missingPermissions: Array<{
        permission: string;
        label: string;
        granted: boolean;
        enabled: boolean;
      }> = [];

      // Vérifier chaque permission requise
      for (const perm of tool.permissions) {
        const permConfig = this.permissionsConfig.permissions.find(p => p.permission === perm);
        const granted = permConfig?.granted ?? false;
        const enabled = permConfig?.enabled ?? false;

        if (!granted || !enabled) {
          missingPermissions.push({
            permission: perm,
            label: permissionLabels[perm] || perm,
            granted,
            enabled,
          });
        }
      }

      if (isToolDisabled || missingPermissions.length > 0) {
        // Outil désactivé ou avec permissions manquantes
        disabledTools.push({
          name: tool.name,
          description: tool.description,
          icon: tool.icon || '🔧',
          category: tool.category,
          missingPermissions,
          isToolDisabled,
        });
      } else {
        // Outil activé et avec toutes les permissions
        const chatTool = chatTools.find(t => t.function.name === tool.name);
        if (chatTool) {
          enabledTools.push(chatTool);
        }
      }
    }

    console.log('[MCPServer] getToolsForChatWithStatus:', {
      enabled: enabledTools.length,
      disabled: disabledTools.length,
    });

    return { enabledTools, disabledTools };
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Récupère l'état du serveur
   */
  public getState(): MCPServerState {
    return { ...this.state };
  }

  /**
   * Récupère la configuration
   */
  public getConfig(): MCPServerConfig {
    return { ...this.config };
  }

  /**
   * Met à jour la configuration
   */
  public setConfig(config: Partial<MCPServerConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('configChanged', this.config);
  }

  /**
   * Récupère les statistiques des outils
   */
  public getToolStats(): MCPToolStats[] {
    const history = this.executor.getHistory(1000);
    const stats: Map<string, MCPToolStats> = new Map();

    for (const call of history) {
      let stat = stats.get(call.tool);
      if (!stat) {
        stat = {
          tool: call.tool,
          callsCount: 0,
          successCount: 0,
          errorCount: 0,
          averageDuration: 0,
        };
        stats.set(call.tool, stat);
      }

      stat.callsCount++;
      if (call.status === 'success') {
        stat.successCount++;
      } else {
        stat.errorCount++;
      }
      if (call.duration) {
        stat.averageDuration = (stat.averageDuration * (stat.callsCount - 1) + call.duration) / stat.callsCount;
      }
      stat.lastUsed = call.completedAt;
    }

    return Array.from(stats.values());
  }

  /**
   * Récupère l'historique des appels
   */
  public getCallHistory(limit = 100): MCPToolCallResult[] {
    return this.executor.getHistory(limit);
  }

  /**
   * Efface l'historique
   */
  public clearHistory(): void {
    this.executor.clearHistory();
    this.state.callsCount = 0;
    this.state.errors = [];
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private getDefaultPermissions(): MCPPermissionState[] {
    return [
      { permission: 'accessibility', granted: false, enabled: false },
      { permission: 'files', granted: true, enabled: true },
      { permission: 'screen_capture', granted: false, enabled: false },
      { permission: 'notifications', granted: true, enabled: true },
      { permission: 'microphone', granted: false, enabled: false },
      { permission: 'location', granted: false, enabled: false },
      { permission: 'calendar', granted: false, enabled: false },
      { permission: 'reminders', granted: false, enabled: false },
      { permission: 'contacts', granted: false, enabled: false },
      { permission: 'bluetooth', granted: false, enabled: false },
      { permission: 'automation', granted: false, enabled: false },
    ];
  }

  private applyPermissionsToExecutor(): void {
    // Appliquer les répertoires
    this.executor.setDirectories(this.permissionsConfig.directories);

    // Appliquer les permissions activées
    const enabledPerms = this.permissionsConfig.permissions
      .filter(p => p.enabled && p.granted)
      .map(p => p.permission);
    this.executor.setEnabledPermissions(enabledPerms);
  }

  private checkRateLimit(tool: string): boolean {
    const now = Date.now();
    const windowMs = 60000; // 1 minute

    let calls = this.rateLimitMap.get(tool) || [];
    // Nettoyer les anciens appels
    calls = calls.filter(t => now - t < windowMs);

    if (calls.length >= this.config.rateLimitPerMinute) {
      return false;
    }

    calls.push(now);
    this.rateLimitMap.set(tool, calls);
    return true;
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    const levels = ['debug', 'info', 'warn', 'error'];
    if (levels.indexOf(level) >= levels.indexOf(this.config.logLevel)) {
      const logMessage = `[MCP] ${message}`;
      switch (level) {
        case 'debug': console.debug(logMessage, data || ''); break;
        case 'info': console.log(logMessage, data || ''); break;
        case 'warn': console.warn(logMessage, data || ''); break;
        case 'error': console.error(logMessage, data || ''); break;
      }
      this.emit('log', { level, message, data, timestamp: Date.now() });
    }
  }
}

// Export singleton
export const mcpServer = new MCPServer();
