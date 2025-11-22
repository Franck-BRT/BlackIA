/**
 * MCP IPC Handlers
 * Handlers pour la communication avec le frontend
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron';
import {
  mcpServer,
  MCPToolCallRequest,
  MCPPermission,
  DirectoryAccess,
  FileAccessType,
  MCPToolCategory,
  MCPServerConfig,
  generateToolCallId,
} from '../services/mcp';

// ============================================================================
// REGISTER ALL HANDLERS
// ============================================================================

export function registerMCPHandlers(): void {
  // Server lifecycle
  ipcMain.handle('mcp:start', handleStart);
  ipcMain.handle('mcp:stop', handleStop);
  ipcMain.handle('mcp:restart', handleRestart);
  ipcMain.handle('mcp:getState', handleGetState);
  ipcMain.handle('mcp:getConfig', handleGetConfig);
  ipcMain.handle('mcp:setConfig', handleSetConfig);

  // Tool execution
  ipcMain.handle('mcp:callTool', handleCallTool);
  ipcMain.handle('mcp:cancelCall', handleCancelCall);

  // Tools management
  ipcMain.handle('mcp:getAllTools', handleGetAllTools);
  ipcMain.handle('mcp:getToolsByCategory', handleGetToolsByCategory);
  ipcMain.handle('mcp:getAllCategories', handleGetAllCategories);
  ipcMain.handle('mcp:getTool', handleGetTool);
  ipcMain.handle('mcp:setToolEnabled', handleSetToolEnabled);
  ipcMain.handle('mcp:getToolsForChat', handleGetToolsForChat);

  // Permissions management
  ipcMain.handle('mcp:getPermissionsConfig', handleGetPermissionsConfig);
  ipcMain.handle('mcp:setPermissionsConfig', handleSetPermissionsConfig);
  ipcMain.handle('mcp:setPermissionEnabled', handleSetPermissionEnabled);
  ipcMain.handle('mcp:isPermissionEnabled', handleIsPermissionEnabled);
  ipcMain.handle('mcp:checkSystemPermission', handleCheckSystemPermission);
  ipcMain.handle('mcp:requestSystemPermission', handleRequestSystemPermission);

  // Directory management
  ipcMain.handle('mcp:getDirectories', handleGetDirectories);
  ipcMain.handle('mcp:addDirectory', handleAddDirectory);
  ipcMain.handle('mcp:removeDirectory', handleRemoveDirectory);
  ipcMain.handle('mcp:updateDirectoryPermissions', handleUpdateDirectoryPermissions);

  // Statistics
  ipcMain.handle('mcp:getToolStats', handleGetToolStats);
  ipcMain.handle('mcp:getCallHistory', handleGetCallHistory);
  ipcMain.handle('mcp:clearHistory', handleClearHistory);

  // Forward events to renderer
  setupEventForwarding();

  console.log('[MCP] Handlers registered');
}

// ============================================================================
// SERVER LIFECYCLE HANDLERS
// ============================================================================

async function handleStart(): Promise<{ success: boolean }> {
  await mcpServer.start();
  return { success: true };
}

async function handleStop(): Promise<{ success: boolean }> {
  await mcpServer.stop();
  return { success: true };
}

async function handleRestart(): Promise<{ success: boolean }> {
  await mcpServer.restart();
  return { success: true };
}

async function handleGetState(): Promise<ReturnType<typeof mcpServer.getState>> {
  return mcpServer.getState();
}

async function handleGetConfig(): Promise<ReturnType<typeof mcpServer.getConfig>> {
  return mcpServer.getConfig();
}

async function handleSetConfig(
  _event: IpcMainInvokeEvent,
  config: Partial<MCPServerConfig>
): Promise<{ success: boolean }> {
  mcpServer.setConfig(config);
  return { success: true };
}

// ============================================================================
// TOOL EXECUTION HANDLERS
// ============================================================================

async function handleCallTool(
  _event: IpcMainInvokeEvent,
  request: Omit<MCPToolCallRequest, 'id'> & { id?: string }
): Promise<ReturnType<typeof mcpServer.callTool>> {
  const fullRequest: MCPToolCallRequest = {
    ...request,
    id: request.id || generateToolCallId(),
  };
  return mcpServer.callTool(fullRequest);
}

async function handleCancelCall(
  _event: IpcMainInvokeEvent,
  callId: string
): Promise<{ success: boolean }> {
  const cancelled = mcpServer.cancelCall(callId);
  return { success: cancelled };
}

// ============================================================================
// TOOLS MANAGEMENT HANDLERS
// ============================================================================

async function handleGetAllTools(): Promise<ReturnType<typeof mcpServer.getAllTools>> {
  return mcpServer.getAllTools();
}

async function handleGetToolsByCategory(
  _event: IpcMainInvokeEvent,
  category: MCPToolCategory
): Promise<ReturnType<typeof mcpServer.getToolsByCategory>> {
  return mcpServer.getToolsByCategory(category);
}

async function handleGetAllCategories(): Promise<ReturnType<typeof mcpServer.getAllCategories>> {
  return mcpServer.getAllCategories();
}

async function handleGetTool(
  _event: IpcMainInvokeEvent,
  name: string
): Promise<ReturnType<typeof mcpServer.getTool>> {
  return mcpServer.getTool(name);
}

async function handleSetToolEnabled(
  _event: IpcMainInvokeEvent,
  toolName: string,
  enabled: boolean
): Promise<{ success: boolean }> {
  mcpServer.setToolEnabled(toolName, enabled);
  return { success: true };
}

async function handleGetToolsForChat(): Promise<ReturnType<typeof mcpServer.getToolsForChat>> {
  const tools = mcpServer.getToolsForChat();
  console.log('[MCP Handler] getToolsForChat:', {
    count: tools.length,
    tools: tools.map(t => t.function.name),
  });
  return tools;
}

// ============================================================================
// PERMISSIONS HANDLERS
// ============================================================================

async function handleGetPermissionsConfig(): Promise<ReturnType<typeof mcpServer.getPermissionsConfig>> {
  return mcpServer.getPermissionsConfig();
}

async function handleSetPermissionsConfig(
  _event: IpcMainInvokeEvent,
  config: Parameters<typeof mcpServer.setPermissionsConfig>[0]
): Promise<{ success: boolean }> {
  mcpServer.setPermissionsConfig(config);
  return { success: true };
}

async function handleSetPermissionEnabled(
  _event: IpcMainInvokeEvent,
  permission: MCPPermission,
  enabled: boolean
): Promise<{ success: boolean }> {
  mcpServer.setPermissionEnabled(permission, enabled);
  return { success: true };
}

async function handleIsPermissionEnabled(
  _event: IpcMainInvokeEvent,
  permission: MCPPermission
): Promise<boolean> {
  return mcpServer.isPermissionEnabled(permission);
}

async function handleCheckSystemPermission(
  _event: IpcMainInvokeEvent,
  permission: MCPPermission
): Promise<{ granted: boolean; canRequest: boolean }> {
  // Vérifier les permissions système macOS
  const { systemPreferences } = require('electron');

  switch (permission) {
    case 'accessibility':
      return {
        granted: systemPreferences.isTrustedAccessibilityClient(false),
        canRequest: true,
      };

    case 'screen_capture':
      // La permission screen capture ne peut pas être vérifiée directement
      // Elle est demandée automatiquement lors de la première capture
      return { granted: false, canRequest: true };

    case 'microphone':
      const micStatus = systemPreferences.getMediaAccessStatus('microphone');
      return {
        granted: micStatus === 'granted',
        canRequest: micStatus !== 'denied',
      };

    case 'calendar':
    case 'reminders':
    case 'contacts':
      // Ces permissions sont gérées au niveau des apps
      return { granted: false, canRequest: true };

    default:
      // Permissions qui ne nécessitent pas d'autorisation système
      return { granted: true, canRequest: false };
  }
}

async function handleRequestSystemPermission(
  _event: IpcMainInvokeEvent,
  permission: MCPPermission
): Promise<{ granted: boolean }> {
  const { systemPreferences, shell } = require('electron');

  switch (permission) {
    case 'accessibility':
      // Ouvrir les préférences système
      const trusted = systemPreferences.isTrustedAccessibilityClient(true);
      if (!trusted) {
        shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
      }
      return { granted: trusted };

    case 'screen_capture':
      shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
      return { granted: false };

    case 'microphone':
      const status = await systemPreferences.askForMediaAccess('microphone');
      return { granted: status };

    case 'calendar':
      shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Calendars');
      return { granted: false };

    case 'reminders':
      shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Reminders');
      return { granted: false };

    case 'contacts':
      shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Contacts');
      return { granted: false };

    case 'automation':
      shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Automation');
      return { granted: false };

    default:
      return { granted: true };
  }
}

// ============================================================================
// DIRECTORY HANDLERS
// ============================================================================

async function handleGetDirectories(): Promise<DirectoryAccess[]> {
  return mcpServer.getDirectories();
}

async function handleAddDirectory(
  _event: IpcMainInvokeEvent,
  directory: DirectoryAccess
): Promise<{ success: boolean }> {
  mcpServer.addDirectory(directory);
  return { success: true };
}

async function handleRemoveDirectory(
  _event: IpcMainInvokeEvent,
  directoryId: string
): Promise<{ success: boolean }> {
  mcpServer.removeDirectory(directoryId);
  return { success: true };
}

async function handleUpdateDirectoryPermissions(
  _event: IpcMainInvokeEvent,
  directoryId: string,
  permissions: FileAccessType[]
): Promise<{ success: boolean }> {
  mcpServer.updateDirectoryPermissions(directoryId, permissions);
  return { success: true };
}

// ============================================================================
// STATISTICS HANDLERS
// ============================================================================

async function handleGetToolStats(): Promise<ReturnType<typeof mcpServer.getToolStats>> {
  return mcpServer.getToolStats();
}

async function handleGetCallHistory(
  _event: IpcMainInvokeEvent,
  limit?: number
): Promise<ReturnType<typeof mcpServer.getCallHistory>> {
  return mcpServer.getCallHistory(limit);
}

async function handleClearHistory(): Promise<{ success: boolean }> {
  mcpServer.clearHistory();
  return { success: true };
}

// ============================================================================
// EVENT FORWARDING
// ============================================================================

function setupEventForwarding(): void {
  const { BrowserWindow } = require('electron');

  // Forward MCP events to all renderer windows
  const forwardEvent = (eventName: string) => {
    mcpServer.on(eventName, (data: unknown) => {
      for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
          win.webContents.send(`mcp:${eventName}`, data);
        }
      }
    });
  };

  // Events to forward
  forwardEvent('started');
  forwardEvent('stopped');
  forwardEvent('toolCallStart');
  forwardEvent('toolCallEnd');
  forwardEvent('permissionsChanged');
  forwardEvent('permissionChanged');
  forwardEvent('directoryAdded');
  forwardEvent('directoryRemoved');
  forwardEvent('directoryUpdated');
  forwardEvent('toolChanged');
  forwardEvent('configChanged');
  forwardEvent('log');
}
