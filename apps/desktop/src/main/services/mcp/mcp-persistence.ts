/**
 * MCP Persistence Service
 * Gère la sauvegarde et le chargement des configurations MCP depuis la base de données
 */

import { eq } from 'drizzle-orm';
import { getDatabase } from '../../database/client';
import {
  mcpDirectoryAccess,
  mcpPermissions,
  mcpToolsConfig,
  type MCPDirectoryAccess as DBDirectoryAccess,
  type MCPPermission as DBPermission,
} from '../../database/schema';
import type { DirectoryAccess, MCPPermissionState, MCPPermission, FileAccessType } from './mcp-protocol';

// ============================================================================
// DIRECTORY PERSISTENCE
// ============================================================================

/**
 * Charge tous les répertoires autorisés depuis la base de données
 */
export async function loadDirectories(): Promise<DirectoryAccess[]> {
  try {
    const db = getDatabase();
    const rows = await db.select().from(mcpDirectoryAccess);

    console.log('[MCP Persistence] Loaded', rows.length, 'directories from database');

    return rows.map(row => ({
      id: row.id,
      path: row.path,
      name: row.name,
      permissions: JSON.parse(row.permissions) as FileAccessType[],
      includeSubdirectories: row.includeSubdirectories,
      createdAt: row.createdAt.getTime(),
      updatedAt: row.updatedAt.getTime(),
    }));
  } catch (error) {
    console.error('[MCP Persistence] Error loading directories:', error);
    return [];
  }
}

/**
 * Sauvegarde un répertoire dans la base de données
 */
export async function saveDirectory(directory: DirectoryAccess): Promise<void> {
  try {
    const db = getDatabase();
    const now = new Date();

    await db.insert(mcpDirectoryAccess)
      .values({
        id: directory.id,
        path: directory.path,
        name: directory.name,
        permissions: JSON.stringify(directory.permissions),
        includeSubdirectories: directory.includeSubdirectories ?? true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: mcpDirectoryAccess.path,
        set: {
          name: directory.name,
          permissions: JSON.stringify(directory.permissions),
          includeSubdirectories: directory.includeSubdirectories ?? true,
          updatedAt: now,
        },
      });

    console.log('[MCP Persistence] Saved directory:', directory.path);
  } catch (error) {
    console.error('[MCP Persistence] Error saving directory:', error);
    throw error;
  }
}

/**
 * Supprime un répertoire de la base de données
 */
export async function deleteDirectory(directoryId: string): Promise<void> {
  try {
    const db = getDatabase();
    await db.delete(mcpDirectoryAccess).where(eq(mcpDirectoryAccess.id, directoryId));
    console.log('[MCP Persistence] Deleted directory:', directoryId);
  } catch (error) {
    console.error('[MCP Persistence] Error deleting directory:', error);
    throw error;
  }
}

/**
 * Met à jour les permissions d'un répertoire
 */
export async function updateDirectoryPermissions(
  directoryId: string,
  permissions: FileAccessType[]
): Promise<void> {
  try {
    const db = getDatabase();
    await db.update(mcpDirectoryAccess)
      .set({
        permissions: JSON.stringify(permissions),
        updatedAt: new Date(),
      })
      .where(eq(mcpDirectoryAccess.id, directoryId));

    console.log('[MCP Persistence] Updated directory permissions:', directoryId);
  } catch (error) {
    console.error('[MCP Persistence] Error updating directory permissions:', error);
    throw error;
  }
}

// ============================================================================
// PERMISSION PERSISTENCE
// ============================================================================

/**
 * Charge toutes les permissions depuis la base de données
 */
export async function loadPermissions(): Promise<Array<{ permission: string; enabled: boolean }>> {
  try {
    const db = getDatabase();
    const rows = await db.select().from(mcpPermissions);

    console.log('[MCP Persistence] Loaded', rows.length, 'permissions from database');

    return rows.map(row => ({
      permission: row.permission,
      enabled: row.enabled,
    }));
  } catch (error) {
    console.error('[MCP Persistence] Error loading permissions:', error);
    return [];
  }
}

/**
 * Sauvegarde une permission dans la base de données
 */
export async function savePermission(permission: string, enabled: boolean): Promise<void> {
  try {
    const db = getDatabase();
    const now = new Date();

    await db.insert(mcpPermissions)
      .values({
        id: `perm-${permission}`,
        permission,
        enabled,
        lastCheckedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: mcpPermissions.permission,
        set: {
          enabled,
          lastCheckedAt: now,
          updatedAt: now,
        },
      });

    console.log('[MCP Persistence] Saved permission:', permission, enabled);
  } catch (error) {
    console.error('[MCP Persistence] Error saving permission:', error);
    throw error;
  }
}

// ============================================================================
// TOOL CONFIG PERSISTENCE
// ============================================================================

/**
 * Charge toutes les configurations d'outils
 */
export async function loadToolConfigs(): Promise<Array<{ toolName: string; enabled: boolean }>> {
  try {
    const db = getDatabase();
    const rows = await db.select().from(mcpToolsConfig);

    console.log('[MCP Persistence] Loaded', rows.length, 'tool configs from database');

    return rows.map(row => ({
      toolName: row.toolName,
      enabled: row.enabled,
    }));
  } catch (error) {
    console.error('[MCP Persistence] Error loading tool configs:', error);
    return [];
  }
}

/**
 * Sauvegarde la configuration d'un outil
 */
export async function saveToolConfig(toolName: string, category: string, enabled: boolean): Promise<void> {
  try {
    const db = getDatabase();
    const now = new Date();

    await db.insert(mcpToolsConfig)
      .values({
        id: `tool-${toolName}`,
        toolName,
        category,
        enabled,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: mcpToolsConfig.toolName,
        set: {
          enabled,
          updatedAt: now,
        },
      });

    console.log('[MCP Persistence] Saved tool config:', toolName, enabled);
  } catch (error) {
    console.error('[MCP Persistence] Error saving tool config:', error);
    throw error;
  }
}
