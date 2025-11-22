/**
 * MCP Executor
 * Exécuteur sécurisé des outils MCP
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { clipboard, shell, nativeImage, Notification, app } from 'electron';

import {
  MCPToolCallRequest,
  MCPToolCallResult,
  MCPToolError,
  MCPErrorCode,
  DirectoryAccess,
  FileAccessType,
  isPathAllowed,
  generateToolCallId,
} from './mcp-protocol';
import { mcpToolsRegistry } from './mcp-tools-registry';

const execAsync = promisify(exec);

// ============================================================================
// EXECUTOR CLASS
// ============================================================================

export class MCPExecutor {
  private runningCalls: Map<string, { abort: AbortController; startedAt: number }> = new Map();
  private callHistory: MCPToolCallResult[] = [];
  private directories: DirectoryAccess[] = [];
  private enabledPermissions: Set<string> = new Set();

  constructor() {
    // Initialiser avec des répertoires par défaut
    this.initializeDefaultDirectories();
  }

  /**
   * Configure les répertoires autorisés
   */
  public setDirectories(directories: DirectoryAccess[]): void {
    this.directories = directories;
  }

  /**
   * Configure les permissions activées
   */
  public setEnabledPermissions(permissions: string[]): void {
    this.enabledPermissions = new Set(permissions);
  }

  /**
   * Initialise les répertoires par défaut
   */
  private initializeDefaultDirectories(): void {
    const home = os.homedir();
    this.directories = [
      {
        id: 'default-home',
        path: home,
        name: 'Home',
        permissions: ['read'],
        includeSubdirectories: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
  }

  /**
   * Exécute un appel d'outil
   */
  public async execute(request: MCPToolCallRequest): Promise<MCPToolCallResult> {
    const startedAt = Date.now();
    const id = request.id || generateToolCallId();

    // Vérifier que l'outil existe
    const tool = mcpToolsRegistry.getTool(request.tool);
    if (!tool) {
      return this.createErrorResult(id, request.tool, startedAt, 'TOOL_NOT_FOUND', `Outil "${request.tool}" non trouvé`);
    }

    // Vérifier que l'outil est activé
    if (tool.enabled === false) {
      return this.createErrorResult(id, request.tool, startedAt, 'PERMISSION_DENIED', `Outil "${request.tool}" désactivé`);
    }

    // Créer un AbortController pour timeout/annulation
    const abortController = new AbortController();
    this.runningCalls.set(id, { abort: abortController, startedAt });

    // Configurer le timeout
    const timeout = request.timeout || tool.timeout || 30000;
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, timeout);

    try {
      // Exécuter l'outil
      const result = await this.executeToolInternal(request.tool, request.parameters, abortController.signal);

      clearTimeout(timeoutId);
      this.runningCalls.delete(id);

      const completedAt = Date.now();
      const callResult: MCPToolCallResult = {
        id,
        tool: request.tool,
        status: 'success',
        result,
        startedAt,
        completedAt,
        duration: completedAt - startedAt,
      };

      this.callHistory.push(callResult);
      return callResult;
    } catch (error) {
      clearTimeout(timeoutId);
      this.runningCalls.delete(id);

      const completedAt = Date.now();

      if (abortController.signal.aborted) {
        return this.createErrorResult(id, request.tool, startedAt, 'TIMEOUT', 'Timeout dépassé', completedAt);
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = this.inferErrorCode(errorMessage);

      return this.createErrorResult(id, request.tool, startedAt, errorCode, errorMessage, completedAt);
    }
  }

  /**
   * Annule un appel en cours
   */
  public cancel(callId: string): boolean {
    const call = this.runningCalls.get(callId);
    if (call) {
      call.abort.abort();
      this.runningCalls.delete(callId);
      return true;
    }
    return false;
  }

  /**
   * Récupère l'historique des appels
   */
  public getHistory(limit = 100): MCPToolCallResult[] {
    return this.callHistory.slice(-limit);
  }

  /**
   * Efface l'historique
   */
  public clearHistory(): void {
    this.callHistory = [];
  }

  // ============================================================================
  // INTERNAL EXECUTION
  // ============================================================================

  private async executeToolInternal(
    toolName: string,
    params: Record<string, unknown>,
    signal: AbortSignal
  ): Promise<unknown> {
    // Router vers la bonne implémentation
    switch (toolName) {
      // FILES
      case 'read_file': return this.readFile(params);
      case 'write_file': return this.writeFile(params);
      case 'append_file': return this.appendFile(params);
      case 'list_directory': return this.listDirectory(params);
      case 'search_files': return this.searchFiles(params);
      case 'get_file_info': return this.getFileInfo(params);
      case 'move_file': return this.moveFile(params);
      case 'copy_file': return this.copyFile(params);
      case 'delete_file': return this.deleteFile(params);
      case 'create_directory': return this.createDirectory(params);

      // APPS
      case 'open_app': return this.openApp(params);
      case 'quit_app': return this.quitApp(params);
      case 'force_quit_app': return this.forceQuitApp(params);
      case 'list_running_apps': return this.listRunningApps(params);
      case 'get_frontmost_app': return this.getFrontmostApp();
      case 'activate_app': return this.activateApp(params);
      case 'hide_app': return this.hideApp(params);
      case 'list_installed_apps': return this.listInstalledApps(params);

      // CLIPBOARD
      case 'read_clipboard': return this.readClipboard(params);
      case 'write_clipboard': return this.writeClipboard(params);
      case 'clear_clipboard': return this.clearClipboard();
      case 'get_clipboard_types': return this.getClipboardTypes();

      // NOTIFICATIONS
      case 'send_notification': return this.sendNotification(params);
      case 'send_notification_with_actions': return this.sendNotificationWithActions(params);
      case 'schedule_notification': return this.scheduleNotification(params);
      case 'clear_notifications': return this.clearNotifications();

      // TERMINAL
      case 'run_shell_command': return this.runShellCommand(params, signal);
      case 'run_applescript': return this.runAppleScript(params);
      case 'run_javascript_automation': return this.runJXA(params);
      case 'get_environment_variable': return this.getEnvironmentVariable(params);
      case 'run_shortcut': return this.runShortcut(params);
      case 'open_terminal': return this.openTerminal(params);

      // SYSTEM
      case 'get_system_info': return this.getSystemInfo();
      case 'get_cpu_usage': return this.getCpuUsage(params);
      case 'get_memory_usage': return this.getMemoryUsage();
      case 'get_disk_usage': return this.getDiskUsage(params);
      case 'get_battery_status': return this.getBatteryStatus();
      case 'get_network_info': return this.getNetworkInfo();
      case 'get_wifi_info': return this.getWifiInfo();
      case 'get_bluetooth_devices': return this.getBluetoothDevices(params);

      // CAPTURE
      case 'take_screenshot': return this.takeScreenshot(params);
      case 'take_screenshot_area': return this.takeScreenshotArea(params);
      case 'take_screenshot_window': return this.takeScreenshotWindow(params);
      case 'start_screen_recording': return this.startScreenRecording(params);
      case 'stop_screen_recording': return this.stopScreenRecording();

      // CONTROLS
      case 'get_volume': return this.getVolume();
      case 'set_volume': return this.setVolume(params);
      case 'mute_volume': return this.muteVolume(params);
      case 'get_brightness': return this.getBrightness();
      case 'set_brightness': return this.setBrightness(params);
      case 'get_dark_mode': return this.getDarkMode();
      case 'toggle_dark_mode': return this.toggleDarkMode(params);
      case 'lock_screen': return this.lockScreen();

      // NETWORK
      case 'ping_host': return this.pingHost(params);
      case 'get_public_ip': return this.getPublicIP();
      case 'check_internet_connection': return this.checkInternetConnection();
      case 'get_active_connections': return this.getActiveConnections(params);
      case 'wake_on_lan': return this.wakeOnLan(params);

      // CALENDAR
      case 'list_calendars': return this.listCalendars();
      case 'get_events': return this.getEvents(params);
      case 'create_event': return this.createEvent(params);
      case 'list_reminders': return this.listReminders(params);
      case 'create_reminder': return this.createReminder(params);
      case 'complete_reminder': return this.completeReminder(params);

      // CONTACTS
      case 'search_contacts': return this.searchContacts(params);
      case 'get_contact': return this.getContact(params);
      case 'create_contact': return this.createContact(params);
      case 'get_contact_groups': return this.getContactGroups();

      // MULTIMEDIA
      case 'play_sound': return this.playSound(params);
      case 'speak_text': return this.speakText(params);
      case 'get_now_playing': return this.getNowPlaying();
      case 'media_play_pause': return this.mediaPlayPause();
      case 'media_next': return this.mediaNext();
      case 'media_previous': return this.mediaPrevious();

      default:
        throw new Error(`Outil "${toolName}" non implémenté`);
    }
  }

  // ============================================================================
  // FILES IMPLEMENTATION
  // ============================================================================

  private resolvePath(inputPath: string): string {
    if (inputPath.startsWith('~')) {
      return path.join(os.homedir(), inputPath.slice(1));
    }
    return path.resolve(inputPath);
  }

  private checkFileAccess(filePath: string, accessType: FileAccessType): void {
    const resolved = this.resolvePath(filePath);
    if (!isPathAllowed(resolved, this.directories, accessType)) {
      throw new Error(`Accès refusé: "${resolved}" (${accessType})`);
    }
  }

  private async readFile(params: Record<string, unknown>): Promise<unknown> {
    const filePath = this.resolvePath(params.path as string);
    const encoding = (params.encoding as string) || 'utf8';
    const maxSize = (params.maxSize as number) || 10485760;

    this.checkFileAccess(filePath, 'read');

    const stats = await fs.stat(filePath);
    if (stats.size > maxSize) {
      throw new Error(`Fichier trop volumineux: ${stats.size} bytes (max: ${maxSize})`);
    }

    if (encoding === 'base64') {
      const buffer = await fs.readFile(filePath);
      return { content: buffer.toString('base64'), size: stats.size, encoding: 'base64' };
    }

    const content = await fs.readFile(filePath, 'utf8');
    return { content, size: stats.size, encoding: 'utf8' };
  }

  private async writeFile(params: Record<string, unknown>): Promise<unknown> {
    const filePath = this.resolvePath(params.path as string);
    const content = params.content as string;
    const encoding = (params.encoding as string) || 'utf8';
    const createDirectories = params.createDirectories !== false;

    this.checkFileAccess(filePath, 'write');

    if (createDirectories) {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
    }

    if (encoding === 'base64') {
      await fs.writeFile(filePath, Buffer.from(content, 'base64'));
    } else {
      await fs.writeFile(filePath, content, 'utf8');
    }

    return { success: true, path: filePath };
  }

  private async appendFile(params: Record<string, unknown>): Promise<unknown> {
    const filePath = this.resolvePath(params.path as string);
    const content = params.content as string;
    const newline = params.newline !== false;

    this.checkFileAccess(filePath, 'write');

    const toAppend = newline ? '\n' + content : content;
    await fs.appendFile(filePath, toAppend, 'utf8');

    return { success: true, path: filePath };
  }

  private async listDirectory(params: Record<string, unknown>): Promise<unknown> {
    const dirPath = this.resolvePath(params.path as string);
    const recursive = params.recursive === true;
    const includeHidden = params.includeHidden === true;
    const maxDepth = (params.maxDepth as number) || 3;

    this.checkFileAccess(dirPath, 'read');

    const listDir = async (dir: string, depth: number): Promise<unknown[]> => {
      if (depth > maxDepth) return [];

      const entries = await fs.readdir(dir, { withFileTypes: true });
      const results: unknown[] = [];

      for (const entry of entries) {
        if (!includeHidden && entry.name.startsWith('.')) continue;

        const fullPath = path.join(dir, entry.name);
        const stats = await fs.stat(fullPath);

        const item = {
          name: entry.name,
          path: fullPath,
          type: entry.isDirectory() ? 'directory' : 'file',
          size: stats.size,
          modified: stats.mtime.toISOString(),
          children: undefined as unknown[] | undefined,
        };

        if (recursive && entry.isDirectory()) {
          item.children = await listDir(fullPath, depth + 1);
        }

        results.push(item);
      }

      return results;
    };

    const items = await listDir(dirPath, 1);
    return { path: dirPath, items, count: items.length };
  }

  private async searchFiles(params: Record<string, unknown>): Promise<unknown> {
    const dirPath = this.resolvePath(params.path as string);
    const pattern = params.pattern as string;
    const searchType = (params.type as string) || 'glob';
    const searchContent = params.searchContent === true;
    const caseSensitive = params.caseSensitive === true;
    const maxResults = (params.maxResults as number) || 100;

    this.checkFileAccess(dirPath, 'read');

    // Utiliser find pour la recherche
    let command: string;
    if (searchContent) {
      const grepFlags = caseSensitive ? '' : '-i';
      command = `grep -r ${grepFlags} -l "${pattern}" "${dirPath}" 2>/dev/null | head -${maxResults}`;
    } else {
      const nameFlag = searchType === 'regex' ? '-regex' : '-name';
      command = `find "${dirPath}" ${nameFlag} "${pattern}" 2>/dev/null | head -${maxResults}`;
    }

    try {
      const { stdout } = await execAsync(command, { timeout: 30000 });
      const files = stdout.trim().split('\n').filter(Boolean);
      return { pattern, path: dirPath, results: files, count: files.length };
    } catch {
      return { pattern, path: dirPath, results: [], count: 0 };
    }
  }

  private async getFileInfo(params: Record<string, unknown>): Promise<unknown> {
    const filePath = this.resolvePath(params.path as string);
    this.checkFileAccess(filePath, 'read');

    const stats = await fs.stat(filePath);
    return {
      path: filePath,
      name: path.basename(filePath),
      extension: path.extname(filePath),
      size: stats.size,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      isSymlink: stats.isSymbolicLink(),
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      accessed: stats.atime.toISOString(),
      permissions: stats.mode.toString(8).slice(-3),
    };
  }

  private async moveFile(params: Record<string, unknown>): Promise<unknown> {
    const source = this.resolvePath(params.source as string);
    const destination = this.resolvePath(params.destination as string);
    const overwrite = params.overwrite === true;

    this.checkFileAccess(source, 'move');
    this.checkFileAccess(destination, 'write');

    if (!overwrite) {
      try {
        await fs.access(destination);
        throw new Error('Le fichier destination existe déjà');
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
      }
    }

    await fs.rename(source, destination);
    return { success: true, source, destination };
  }

  private async copyFile(params: Record<string, unknown>): Promise<unknown> {
    const source = this.resolvePath(params.source as string);
    const destination = this.resolvePath(params.destination as string);
    const overwrite = params.overwrite === true;

    this.checkFileAccess(source, 'read');
    this.checkFileAccess(destination, 'write');

    const flags = overwrite ? 0 : fs.constants.COPYFILE_EXCL;
    await fs.copyFile(source, destination, flags);
    return { success: true, source, destination };
  }

  private async deleteFile(params: Record<string, unknown>): Promise<unknown> {
    const filePath = this.resolvePath(params.path as string);
    const recursive = params.recursive === true;
    const moveToTrash = params.moveToTrash !== false;

    this.checkFileAccess(filePath, 'delete');

    if (moveToTrash) {
      await shell.trashItem(filePath);
    } else {
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        if (recursive) {
          await fs.rm(filePath, { recursive: true });
        } else {
          await fs.rmdir(filePath);
        }
      } else {
        await fs.unlink(filePath);
      }
    }

    return { success: true, path: filePath, trashed: moveToTrash };
  }

  private async createDirectory(params: Record<string, unknown>): Promise<unknown> {
    const dirPath = this.resolvePath(params.path as string);
    const recursive = params.recursive !== false;

    this.checkFileAccess(dirPath, 'write');

    await fs.mkdir(dirPath, { recursive });
    return { success: true, path: dirPath };
  }

  // ============================================================================
  // APPS IMPLEMENTATION
  // ============================================================================

  private async openApp(params: Record<string, unknown>): Promise<unknown> {
    const name = params.name as string;
    const background = params.background === true;

    const flags = background ? '-g' : '';
    await execAsync(`open ${flags} -a "${name}"`);
    return { success: true, app: name };
  }

  private async quitApp(params: Record<string, unknown>): Promise<unknown> {
    const name = params.name as string;
    const saveChanges = params.saveChanges !== false;

    const script = saveChanges
      ? `tell application "${name}" to quit saving yes`
      : `tell application "${name}" to quit`;

    await execAsync(`osascript -e '${script}'`);
    return { success: true, app: name };
  }

  private async forceQuitApp(params: Record<string, unknown>): Promise<unknown> {
    const name = params.name as string;
    await execAsync(`pkill -9 "${name}"`);
    return { success: true, app: name };
  }

  private async listRunningApps(params: Record<string, unknown>): Promise<unknown> {
    const includeBackground = params.includeBackground === true;

    const script = includeBackground
      ? 'tell application "System Events" to get name of every process'
      : 'tell application "System Events" to get name of every process whose background only is false';

    const { stdout } = await execAsync(`osascript -e '${script}'`);
    const apps = stdout.trim().split(', ').filter(Boolean);
    return { apps, count: apps.length };
  }

  private async getFrontmostApp(): Promise<unknown> {
    const script = `tell application "System Events" to get name of first process whose frontmost is true`;
    const { stdout } = await execAsync(`osascript -e '${script}'`);
    return { app: stdout.trim() };
  }

  private async activateApp(params: Record<string, unknown>): Promise<unknown> {
    const name = params.name as string;
    await execAsync(`osascript -e 'tell application "${name}" to activate'`);
    return { success: true, app: name };
  }

  private async hideApp(params: Record<string, unknown>): Promise<unknown> {
    const name = params.name as string;
    await execAsync(`osascript -e 'tell application "System Events" to set visible of process "${name}" to false'`);
    return { success: true, app: name };
  }

  private async listInstalledApps(params: Record<string, unknown>): Promise<unknown> {
    const searchPath = (params.searchPath as string) || '/Applications';
    const { stdout } = await execAsync(`ls -1 "${searchPath}" | grep ".app$"`);
    const apps = stdout.trim().split('\n').map(a => a.replace('.app', '')).filter(Boolean);
    return { apps, count: apps.length, path: searchPath };
  }

  // ============================================================================
  // CLIPBOARD IMPLEMENTATION
  // ============================================================================

  private async readClipboard(params: Record<string, unknown>): Promise<unknown> {
    const format = (params.format as string) || 'text';

    if (format === 'text' || format === 'all') {
      const text = clipboard.readText();
      if (format === 'text') return { type: 'text', content: text };
    }

    if (format === 'html' || format === 'all') {
      const html = clipboard.readHTML();
      if (format === 'html') return { type: 'html', content: html };
    }

    if (format === 'image' || format === 'all') {
      const image = clipboard.readImage();
      if (!image.isEmpty()) {
        const base64 = image.toPNG().toString('base64');
        if (format === 'image') return { type: 'image', content: base64, format: 'png' };
      }
    }

    if (format === 'all') {
      return {
        text: clipboard.readText(),
        html: clipboard.readHTML(),
        hasImage: !clipboard.readImage().isEmpty(),
      };
    }

    return { type: format, content: null };
  }

  private async writeClipboard(params: Record<string, unknown>): Promise<unknown> {
    const content = params.content as string;
    const format = (params.format as string) || 'text';

    if (format === 'html') {
      clipboard.writeHTML(content);
    } else {
      clipboard.writeText(content);
    }

    return { success: true, format };
  }

  private async clearClipboard(): Promise<unknown> {
    clipboard.clear();
    return { success: true };
  }

  private async getClipboardTypes(): Promise<unknown> {
    const formats = clipboard.availableFormats();
    return { formats };
  }

  // ============================================================================
  // NOTIFICATIONS IMPLEMENTATION
  // ============================================================================

  private async sendNotification(params: Record<string, unknown>): Promise<unknown> {
    const title = params.title as string;
    const message = params.message as string;
    const subtitle = params.subtitle as string | undefined;
    const sound = params.sound !== false;

    const notification = new Notification({
      title,
      body: message,
      subtitle,
      silent: !sound,
    });

    notification.show();
    return { success: true };
  }

  private async sendNotificationWithActions(params: Record<string, unknown>): Promise<unknown> {
    const title = params.title as string;
    const message = params.message as string;
    const actions = params.actions as string[];

    // macOS ne supporte pas vraiment les actions personnalisées via Electron
    // On utilise AppleScript pour plus de contrôle
    const actionsStr = actions.map(a => `"${a}"`).join(', ');
    const script = `display notification "${message}" with title "${title}" buttons {${actionsStr}}`;

    try {
      await execAsync(`osascript -e '${script}'`);
      return { success: true };
    } catch {
      // Fallback to basic notification
      return this.sendNotification({ title, message });
    }
  }

  private async scheduleNotification(params: Record<string, unknown>): Promise<unknown> {
    const title = params.title as string;
    const message = params.message as string;
    const delay = params.delay as number;

    setTimeout(() => {
      const notification = new Notification({ title, body: message });
      notification.show();
    }, delay * 1000);

    return { success: true, scheduledIn: delay };
  }

  private async clearNotifications(): Promise<unknown> {
    // Electron ne permet pas de supprimer les notifications programmatiquement
    return { success: true, note: 'Les notifications existantes restent visibles' };
  }

  // ============================================================================
  // TERMINAL IMPLEMENTATION
  // ============================================================================

  private async runShellCommand(params: Record<string, unknown>, signal: AbortSignal): Promise<unknown> {
    const command = params.command as string;
    const cwd = params.cwd ? this.resolvePath(params.cwd as string) : undefined;
    const timeout = (params.timeout as number) || 30000;
    const shellPath = (params.shell as string) || '/bin/zsh';

    if (cwd) {
      this.checkFileAccess(cwd, 'execute');
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout,
      shell: shellPath,
      signal,
    });

    return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode: 0 };
  }

  private async runAppleScript(params: Record<string, unknown>): Promise<unknown> {
    const script = params.script as string;
    const { stdout } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}'`);
    return { result: stdout.trim() };
  }

  private async runJXA(params: Record<string, unknown>): Promise<unknown> {
    const script = params.script as string;
    const { stdout } = await execAsync(`osascript -l JavaScript -e '${script.replace(/'/g, "'\\''")}'`);
    return { result: stdout.trim() };
  }

  private async getEnvironmentVariable(params: Record<string, unknown>): Promise<unknown> {
    const name = params.name as string;
    const value = process.env[name];
    return { name, value: value || null, exists: value !== undefined };
  }

  private async runShortcut(params: Record<string, unknown>): Promise<unknown> {
    const name = params.name as string;
    const input = params.input as string | undefined;

    let command = `shortcuts run "${name}"`;
    if (input) {
      command += ` --input-type text --input "${input}"`;
    }

    const { stdout } = await execAsync(command);
    return { success: true, output: stdout.trim() };
  }

  private async openTerminal(params: Record<string, unknown>): Promise<unknown> {
    const command = params.command as string | undefined;
    const cwd = params.cwd ? this.resolvePath(params.cwd as string) : undefined;
    const terminalApp = (params.app as string) || 'Terminal';

    let script: string;
    if (terminalApp === 'iTerm') {
      script = cwd
        ? `tell application "iTerm" to create window with default profile command "cd '${cwd}'${command ? ` && ${command}` : ''}"`
        : `tell application "iTerm" to create window with default profile`;
    } else {
      script = cwd
        ? `tell application "Terminal" to do script "cd '${cwd}'${command ? ` && ${command}` : ''}"`
        : `tell application "Terminal" to do script ""`;
    }

    await execAsync(`osascript -e '${script}'`);
    return { success: true, app: terminalApp };
  }

  // ============================================================================
  // SYSTEM IMPLEMENTATION
  // ============================================================================

  private async getSystemInfo(): Promise<unknown> {
    const [hostname, platform, release, arch] = await Promise.all([
      execAsync('hostname').then(r => r.stdout.trim()),
      Promise.resolve(os.platform()),
      execAsync('sw_vers -productVersion').then(r => r.stdout.trim()),
      Promise.resolve(os.arch()),
    ]);

    return {
      hostname,
      platform,
      release,
      arch,
      cpus: os.cpus().length,
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
      username: os.userInfo().username,
      homeDir: os.homedir(),
    };
  }

  private async getCpuUsage(params: Record<string, unknown>): Promise<unknown> {
    const perCore = params.perCore === true;
    const { stdout } = await execAsync("top -l 1 -n 0 | grep 'CPU usage'");
    const match = stdout.match(/(\d+\.?\d*)% user.*?(\d+\.?\d*)% sys.*?(\d+\.?\d*)% idle/);

    if (match) {
      const usage = {
        user: parseFloat(match[1]),
        system: parseFloat(match[2]),
        idle: parseFloat(match[3]),
        total: parseFloat(match[1]) + parseFloat(match[2]),
      };

      if (perCore) {
        return { ...usage, cores: os.cpus().map(c => c.times) };
      }
      return usage;
    }

    return { error: 'Could not parse CPU usage' };
  }

  private async getMemoryUsage(): Promise<unknown> {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;

    return {
      total,
      free,
      used,
      usedPercent: Math.round((used / total) * 100),
      totalGB: (total / 1073741824).toFixed(2),
      freeGB: (free / 1073741824).toFixed(2),
      usedGB: (used / 1073741824).toFixed(2),
    };
  }

  private async getDiskUsage(params: Record<string, unknown>): Promise<unknown> {
    const diskPath = (params.path as string) || '/';
    const { stdout } = await execAsync(`df -h "${diskPath}" | tail -1`);
    const parts = stdout.trim().split(/\s+/);

    return {
      filesystem: parts[0],
      size: parts[1],
      used: parts[2],
      available: parts[3],
      usedPercent: parts[4],
      mountPoint: parts[8] || diskPath,
    };
  }

  private async getBatteryStatus(): Promise<unknown> {
    try {
      const { stdout } = await execAsync('pmset -g batt');
      const percentMatch = stdout.match(/(\d+)%/);
      const chargingMatch = stdout.match(/(AC Power|Battery Power)/);
      const timeMatch = stdout.match(/(\d+:\d+) remaining/);

      return {
        percent: percentMatch ? parseInt(percentMatch[1]) : null,
        charging: chargingMatch ? chargingMatch[1] === 'AC Power' : null,
        timeRemaining: timeMatch ? timeMatch[1] : null,
        hasBattery: percentMatch !== null,
      };
    } catch {
      return { hasBattery: false };
    }
  }

  private async getNetworkInfo(): Promise<unknown> {
    const interfaces = os.networkInterfaces();
    const result: Record<string, unknown> = {};

    for (const [name, addrs] of Object.entries(interfaces)) {
      if (addrs) {
        result[name] = addrs.map(a => ({
          address: a.address,
          family: a.family,
          internal: a.internal,
          mac: a.mac,
        }));
      }
    }

    return result;
  }

  private async getWifiInfo(): Promise<unknown> {
    try {
      const { stdout } = await execAsync('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I');
      const lines = stdout.trim().split('\n');
      const info: Record<string, string> = {};

      for (const line of lines) {
        const [key, value] = line.split(':').map(s => s.trim());
        if (key && value) {
          info[key.replace(/\s+/g, '_')] = value;
        }
      }

      return {
        ssid: info['SSID'],
        bssid: info['BSSID'],
        channel: info['channel'],
        rssi: info['agrCtlRSSI'],
        noise: info['agrCtlNoise'],
        security: info['link_auth'],
      };
    } catch {
      return { connected: false };
    }
  }

  private async getBluetoothDevices(params: Record<string, unknown>): Promise<unknown> {
    const connectedOnly = params.connectedOnly === true;

    try {
      const script = connectedOnly
        ? 'system_profiler SPBluetoothDataType -json'
        : 'system_profiler SPBluetoothDataType -json';

      const { stdout } = await execAsync(script);
      const data = JSON.parse(stdout);
      return data;
    } catch {
      return { devices: [] };
    }
  }

  // ============================================================================
  // CAPTURE IMPLEMENTATION
  // ============================================================================

  private async takeScreenshot(params: Record<string, unknown>): Promise<unknown> {
    const savePath = params.path ? this.resolvePath(params.path as string) : undefined;
    const format = (params.format as string) || 'png';
    const display = (params.display as number) || 0;

    if (savePath) {
      this.checkFileAccess(savePath, 'write');
      await execAsync(`screencapture -t ${format} -D ${display} "${savePath}"`);
      return { success: true, path: savePath };
    }

    // Retourner en base64
    const tempPath = path.join(os.tmpdir(), `screenshot_${Date.now()}.${format}`);
    await execAsync(`screencapture -t ${format} -D ${display} "${tempPath}"`);
    const buffer = await fs.readFile(tempPath);
    await fs.unlink(tempPath);

    return { success: true, data: buffer.toString('base64'), format };
  }

  private async takeScreenshotArea(params: Record<string, unknown>): Promise<unknown> {
    const x = params.x as number;
    const y = params.y as number;
    const width = params.width as number;
    const height = params.height as number;
    const savePath = params.path ? this.resolvePath(params.path as string) : undefined;
    const format = (params.format as string) || 'png';

    const rect = `-R${x},${y},${width},${height}`;

    if (savePath) {
      this.checkFileAccess(savePath, 'write');
      await execAsync(`screencapture -t ${format} ${rect} "${savePath}"`);
      return { success: true, path: savePath };
    }

    const tempPath = path.join(os.tmpdir(), `screenshot_${Date.now()}.${format}`);
    await execAsync(`screencapture -t ${format} ${rect} "${tempPath}"`);
    const buffer = await fs.readFile(tempPath);
    await fs.unlink(tempPath);

    return { success: true, data: buffer.toString('base64'), format };
  }

  private async takeScreenshotWindow(params: Record<string, unknown>): Promise<unknown> {
    const savePath = params.path ? this.resolvePath(params.path as string) : undefined;
    const includeShadow = params.includeShadow !== false;
    const format = 'png';

    const shadowFlag = includeShadow ? '' : '-o';

    if (savePath) {
      this.checkFileAccess(savePath, 'write');
      await execAsync(`screencapture -t ${format} -w ${shadowFlag} "${savePath}"`);
      return { success: true, path: savePath };
    }

    const tempPath = path.join(os.tmpdir(), `screenshot_${Date.now()}.${format}`);
    await execAsync(`screencapture -t ${format} -w ${shadowFlag} "${tempPath}"`);
    const buffer = await fs.readFile(tempPath);
    await fs.unlink(tempPath);

    return { success: true, data: buffer.toString('base64'), format };
  }

  private screenRecordingProcess: ReturnType<typeof exec> | null = null;

  private async startScreenRecording(params: Record<string, unknown>): Promise<unknown> {
    const savePath = this.resolvePath(params.path as string);
    const audio = params.audio === true;
    const microphone = params.microphone === true;

    this.checkFileAccess(savePath, 'write');

    // Utiliser screencapture pour l'enregistrement
    const flags = ['-v'];
    if (audio) flags.push('-g');
    if (microphone) flags.push('-G');

    const command = `screencapture ${flags.join(' ')} "${savePath}"`;
    this.screenRecordingProcess = exec(command);

    return { success: true, path: savePath, recording: true };
  }

  private async stopScreenRecording(): Promise<unknown> {
    if (this.screenRecordingProcess) {
      this.screenRecordingProcess.kill('SIGINT');
      this.screenRecordingProcess = null;
      return { success: true };
    }
    return { success: false, error: 'Aucun enregistrement en cours' };
  }

  // ============================================================================
  // CONTROLS IMPLEMENTATION
  // ============================================================================

  private async getVolume(): Promise<unknown> {
    const { stdout } = await execAsync('osascript -e "output volume of (get volume settings)"');
    const volume = parseInt(stdout.trim());
    const { stdout: muteStdout } = await execAsync('osascript -e "output muted of (get volume settings)"');
    const muted = muteStdout.trim() === 'true';

    return { volume, muted };
  }

  private async setVolume(params: Record<string, unknown>): Promise<unknown> {
    const level = params.level as number;
    await execAsync(`osascript -e "set volume output volume ${level}"`);
    return { success: true, volume: level };
  }

  private async muteVolume(params: Record<string, unknown>): Promise<unknown> {
    const mute = params.mute as boolean | undefined;

    if (mute === undefined) {
      // Toggle
      const { stdout } = await execAsync('osascript -e "output muted of (get volume settings)"');
      const currentMuted = stdout.trim() === 'true';
      await execAsync(`osascript -e "set volume output muted ${!currentMuted}"`);
      return { success: true, muted: !currentMuted };
    }

    await execAsync(`osascript -e "set volume output muted ${mute}"`);
    return { success: true, muted: mute };
  }

  private async getBrightness(): Promise<unknown> {
    try {
      const { stdout } = await execAsync('brightness -l 2>/dev/null | grep "brightness" | head -1');
      const match = stdout.match(/brightness\s+(\d+\.?\d*)/);
      const brightness = match ? parseFloat(match[1]) * 100 : null;
      return { brightness };
    } catch {
      return { brightness: null, error: 'brightness tool not available' };
    }
  }

  private async setBrightness(params: Record<string, unknown>): Promise<unknown> {
    const level = (params.level as number) / 100;
    try {
      await execAsync(`brightness ${level}`);
      return { success: true, brightness: params.level };
    } catch {
      // Fallback via AppleScript (moins précis)
      return { success: false, error: 'brightness tool not available' };
    }
  }

  private async getDarkMode(): Promise<unknown> {
    const { stdout } = await execAsync('defaults read -g AppleInterfaceStyle 2>/dev/null || echo "Light"');
    const isDark = stdout.trim() === 'Dark';
    return { darkMode: isDark };
  }

  private async toggleDarkMode(params: Record<string, unknown>): Promise<unknown> {
    const enable = params.enable as boolean | undefined;

    const script = `
      tell application "System Events"
        tell appearance preferences
          ${enable === undefined ? 'set dark mode to not dark mode' : `set dark mode to ${enable}`}
        end tell
      end tell
    `;

    await execAsync(`osascript -e '${script}'`);
    const { darkMode } = await this.getDarkMode() as { darkMode: boolean };
    return { success: true, darkMode };
  }

  private async lockScreen(): Promise<unknown> {
    await execAsync('pmset displaysleepnow');
    return { success: true };
  }

  // ============================================================================
  // NETWORK IMPLEMENTATION
  // ============================================================================

  private async pingHost(params: Record<string, unknown>): Promise<unknown> {
    const host = params.host as string;
    const count = (params.count as number) || 4;
    const timeout = (params.timeout as number) || 5;

    try {
      const { stdout } = await execAsync(`ping -c ${count} -t ${timeout} "${host}"`);
      const lines = stdout.trim().split('\n');
      const statsLine = lines.find(l => l.includes('packets transmitted'));
      const timeLine = lines.find(l => l.includes('round-trip'));

      return {
        host,
        success: true,
        output: stdout,
        stats: statsLine,
        timing: timeLine,
      };
    } catch (error) {
      return { host, success: false, error: (error as Error).message };
    }
  }

  private async getPublicIP(): Promise<unknown> {
    try {
      const { stdout } = await execAsync('curl -s https://api.ipify.org');
      return { ip: stdout.trim() };
    } catch {
      return { ip: null, error: 'Could not fetch public IP' };
    }
  }

  private async checkInternetConnection(): Promise<unknown> {
    try {
      await execAsync('ping -c 1 -t 5 8.8.8.8');
      return { connected: true };
    } catch {
      return { connected: false };
    }
  }

  private async getActiveConnections(params: Record<string, unknown>): Promise<unknown> {
    const type = (params.type as string) || 'all';
    const flag = type === 'tcp' ? '-p tcp' : type === 'udp' ? '-p udp' : '';

    const { stdout } = await execAsync(`netstat -an ${flag} | head -50`);
    return { connections: stdout.trim() };
  }

  private async wakeOnLan(params: Record<string, unknown>): Promise<unknown> {
    const macAddress = params.macAddress as string;
    const broadcast = (params.broadcast as string) || '255.255.255.255';

    // Construire le magic packet
    const mac = macAddress.replace(/[:-]/g, '');
    const magicPacket = 'ff'.repeat(6) + mac.repeat(16);

    // Utiliser Python pour envoyer le paquet UDP
    const script = `
import socket
import binascii
mac = "${mac}"
broadcast = "${broadcast}"
packet = binascii.unhexlify("${'ff'.repeat(6) + mac.repeat(16)}")
s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
s.sendto(packet, (broadcast, 9))
s.close()
print("OK")
    `;

    try {
      await execAsync(`python3 -c '${script}'`);
      return { success: true, macAddress, broadcast };
    } catch {
      return { success: false, error: 'Failed to send WoL packet' };
    }
  }

  // ============================================================================
  // CALENDAR IMPLEMENTATION
  // ============================================================================

  private async listCalendars(): Promise<unknown> {
    const script = `
      tell application "Calendar"
        set calList to {}
        repeat with c in calendars
          set end of calList to name of c
        end repeat
        return calList
      end tell
    `;
    const { stdout } = await execAsync(`osascript -e '${script}'`);
    const calendars = stdout.trim().split(', ').filter(Boolean);
    return { calendars };
  }

  private async getEvents(params: Record<string, unknown>): Promise<unknown> {
    const calendar = params.calendar as string | undefined;
    const limit = (params.limit as number) || 50;

    // Utiliser icalBuddy si disponible, sinon AppleScript
    try {
      let command = `icalBuddy -n -nc -li ${limit} eventsToday+7`;
      if (calendar) {
        command += ` -ic "${calendar}"`;
      }
      const { stdout } = await execAsync(command);
      return { events: stdout.trim(), format: 'text' };
    } catch {
      // Fallback AppleScript
      const script = `
        tell application "Calendar"
          set eventList to {}
          set today to current date
          set endDate to today + 7 * days
          repeat with c in calendars
            repeat with e in (events of c whose start date >= today and start date <= endDate)
              set end of eventList to {summary:summary of e, startDate:start date of e, endDate:end date of e}
            end repeat
          end repeat
          return eventList
        end tell
      `;
      const { stdout } = await execAsync(`osascript -e '${script}'`);
      return { events: stdout.trim(), format: 'applescript' };
    }
  }

  private async createEvent(params: Record<string, unknown>): Promise<unknown> {
    const calendar = params.calendar as string;
    const title = params.title as string;
    const startDate = params.startDate as string;
    const endDate = params.endDate as string;
    const location = params.location as string | undefined;
    const notes = params.notes as string | undefined;

    const script = `
      tell application "Calendar"
        tell calendar "${calendar}"
          set newEvent to make new event with properties {summary:"${title}", start date:date "${startDate}", end date:date "${endDate}"}
          ${location ? `set location of newEvent to "${location}"` : ''}
          ${notes ? `set description of newEvent to "${notes}"` : ''}
        end tell
      end tell
    `;

    await execAsync(`osascript -e '${script}'`);
    return { success: true, title, calendar };
  }

  private async listReminders(params: Record<string, unknown>): Promise<unknown> {
    const list = params.list as string | undefined;
    const completed = params.completed === true;

    const script = list
      ? `tell application "Reminders" to get name of reminders of list "${list}" whose completed is ${completed}`
      : `tell application "Reminders" to get name of reminders whose completed is ${completed}`;

    const { stdout } = await execAsync(`osascript -e '${script}'`);
    const reminders = stdout.trim().split(', ').filter(Boolean);
    return { reminders };
  }

  private async createReminder(params: Record<string, unknown>): Promise<unknown> {
    const list = params.list as string;
    const title = params.title as string;
    const notes = params.notes as string | undefined;

    const script = `
      tell application "Reminders"
        tell list "${list}"
          make new reminder with properties {name:"${title}"${notes ? `, body:"${notes}"` : ''}}
        end tell
      end tell
    `;

    await execAsync(`osascript -e '${script}'`);
    return { success: true, title, list };
  }

  private async completeReminder(params: Record<string, unknown>): Promise<unknown> {
    // Les rappels ne sont pas facilement identifiables par ID en AppleScript
    // On utilise une approche par nom
    return { success: false, error: 'Requires reminder name, not ID' };
  }

  // ============================================================================
  // CONTACTS IMPLEMENTATION
  // ============================================================================

  private async searchContacts(params: Record<string, unknown>): Promise<unknown> {
    const query = params.query as string;

    const script = `
      tell application "Contacts"
        set matchingPeople to (every person whose name contains "${query}")
        set results to {}
        repeat with p in matchingPeople
          set end of results to {name:name of p, id:id of p}
        end repeat
        return results
      end tell
    `;

    const { stdout } = await execAsync(`osascript -e '${script}'`);
    return { results: stdout.trim(), query };
  }

  private async getContact(params: Record<string, unknown>): Promise<unknown> {
    const id = params.id as string;

    const script = `
      tell application "Contacts"
        set p to person id "${id}"
        return {name:name of p, emails:value of emails of p, phones:value of phones of p}
      end tell
    `;

    const { stdout } = await execAsync(`osascript -e '${script}'`);
    return { contact: stdout.trim() };
  }

  private async createContact(params: Record<string, unknown>): Promise<unknown> {
    const firstName = params.firstName as string;
    const lastName = params.lastName as string | undefined;
    const email = params.email as string | undefined;
    const phone = params.phone as string | undefined;

    const script = `
      tell application "Contacts"
        set newPerson to make new person with properties {first name:"${firstName}"${lastName ? `, last name:"${lastName}"` : ''}}
        ${email ? `make new email at end of emails of newPerson with properties {value:"${email}"}` : ''}
        ${phone ? `make new phone at end of phones of newPerson with properties {value:"${phone}"}` : ''}
        save
      end tell
    `;

    await execAsync(`osascript -e '${script}'`);
    return { success: true, firstName, lastName };
  }

  private async getContactGroups(): Promise<unknown> {
    const script = `tell application "Contacts" to get name of groups`;
    const { stdout } = await execAsync(`osascript -e '${script}'`);
    const groups = stdout.trim().split(', ').filter(Boolean);
    return { groups };
  }

  // ============================================================================
  // MULTIMEDIA IMPLEMENTATION
  // ============================================================================

  private async playSound(params: Record<string, unknown>): Promise<unknown> {
    const sound = params.sound as string;
    const volume = (params.volume as number) || 100;

    // Si c'est un son système
    const systemSounds = ['Basso', 'Blow', 'Bottle', 'Frog', 'Funk', 'Glass', 'Hero', 'Morse', 'Ping', 'Pop', 'Purr', 'Sosumi', 'Submarine', 'Tink'];
    if (systemSounds.includes(sound)) {
      await execAsync(`afplay /System/Library/Sounds/${sound}.aiff -v ${volume / 100}`);
    } else {
      // Fichier personnalisé
      const soundPath = this.resolvePath(sound);
      this.checkFileAccess(soundPath, 'read');
      await execAsync(`afplay "${soundPath}" -v ${volume / 100}`);
    }

    return { success: true, sound };
  }

  private async speakText(params: Record<string, unknown>): Promise<unknown> {
    const text = params.text as string;
    const voice = params.voice as string | undefined;
    const rate = (params.rate as number) || 175;

    let command = `say -r ${rate}`;
    if (voice) {
      command += ` -v "${voice}"`;
    }
    command += ` "${text.replace(/"/g, '\\"')}"`;

    await execAsync(command);
    return { success: true };
  }

  private async getNowPlaying(): Promise<unknown> {
    const script = `
      tell application "System Events"
        set musicApps to {"Music", "Spotify"}
        repeat with appName in musicApps
          if (exists process appName) then
            if appName is "Music" then
              tell application "Music"
                if player state is playing then
                  return {app:"Music", track:name of current track, artist:artist of current track, album:album of current track}
                end if
              end tell
            else if appName is "Spotify" then
              tell application "Spotify"
                if player state is playing then
                  return {app:"Spotify", track:name of current track, artist:artist of current track, album:album of current track}
                end if
              end tell
            end if
          end if
        end repeat
        return {playing:false}
      end tell
    `;

    try {
      const { stdout } = await execAsync(`osascript -e '${script}'`);
      return { nowPlaying: stdout.trim() };
    } catch {
      return { playing: false };
    }
  }

  private async mediaPlayPause(): Promise<unknown> {
    // Utiliser les touches média
    const script = `
      tell application "System Events"
        key code 49 using {command down, option down}
      end tell
    `;
    // Alternative: osascript pour Music/Spotify
    await execAsync(`osascript -e 'tell application "Music" to playpause'`).catch(() => {});
    return { success: true };
  }

  private async mediaNext(): Promise<unknown> {
    await execAsync(`osascript -e 'tell application "Music" to next track'`).catch(() => {});
    return { success: true };
  }

  private async mediaPrevious(): Promise<unknown> {
    await execAsync(`osascript -e 'tell application "Music" to previous track'`).catch(() => {});
    return { success: true };
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private createErrorResult(
    id: string,
    tool: string,
    startedAt: number,
    code: MCPErrorCode,
    message: string,
    completedAt?: number
  ): MCPToolCallResult {
    const completed = completedAt || Date.now();
    const result: MCPToolCallResult = {
      id,
      tool,
      status: code === 'TIMEOUT' ? 'timeout' : 'error',
      error: { code, message },
      startedAt,
      completedAt: completed,
      duration: completed - startedAt,
    };
    this.callHistory.push(result);
    return result;
  }

  private inferErrorCode(message: string): MCPErrorCode {
    if (message.includes('Accès refusé')) return 'DIRECTORY_NOT_ALLOWED';
    if (message.includes('Permission')) return 'PERMISSION_DENIED';
    if (message.includes('not found') || message.includes('ENOENT')) return 'TOOL_NOT_FOUND';
    if (message.includes('Invalid') || message.includes('requis')) return 'INVALID_PARAMETERS';
    return 'EXECUTION_ERROR';
  }
}

// Export singleton
export const mcpExecutor = new MCPExecutor();
