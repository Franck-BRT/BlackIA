import { ipcMain } from 'electron';
import {
  WorkflowTemplateService,
  WorkflowVersionService,
  WorkflowVariableService,
  WorkflowUpdateService,
} from '../services/workflow-db-service';
import type { NewWorkflowTemplate, NewWorkflowVariable } from '../database/schema';

/**
 * IPC Handlers pour la gestion des Workflows (Templates, Versions, Variables)
 */

export function registerWorkflowHandlers() {
  // ==================== WORKFLOW TEMPLATES ====================

  /**
   * Récupère tous les templates
   */
  ipcMain.handle('workflow-templates:getAll', async () => {
    try {
      const templates = await WorkflowTemplateService.getAll();
      return { success: true, data: templates };
    } catch (error) {
      console.error('[WorkflowTemplates] Error fetching all templates:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupère un template par ID
   */
  ipcMain.handle('workflow-templates:getById', async (_event, id: string) => {
    try {
      const template = await WorkflowTemplateService.getById(id);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }
      return { success: true, data: template };
    } catch (error) {
      console.error('[WorkflowTemplates] Error fetching template:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupère les templates par catégorie
   */
  ipcMain.handle('workflow-templates:getByCategory', async (_event, category: string) => {
    try {
      const templates = await WorkflowTemplateService.getByCategory(category);
      return { success: true, data: templates };
    } catch (error) {
      console.error('[WorkflowTemplates] Error fetching templates by category:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Crée un nouveau template
   */
  ipcMain.handle(
    'workflow-templates:create',
    async (
      _event,
      data: Omit<NewWorkflowTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>
    ) => {
      try {
        const template = await WorkflowTemplateService.create(data);
        return { success: true, data: template };
      } catch (error) {
        console.error('[WorkflowTemplates] Error creating template:', error);
        return { success: false, error: String(error) };
      }
    }
  );

  /**
   * Met à jour un template
   */
  ipcMain.handle('workflow-templates:update', async (_event, id: string, updates: any) => {
    try {
      const template = await WorkflowTemplateService.update(id, updates);
      if (!template) {
        return { success: false, error: 'Template not found' };
      }
      return { success: true, data: template };
    } catch (error) {
      console.error('[WorkflowTemplates] Error updating template:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Supprime un template
   */
  ipcMain.handle('workflow-templates:delete', async (_event, id: string) => {
    try {
      const deleted = await WorkflowTemplateService.delete(id);
      if (!deleted) {
        return { success: false, error: 'Template not found' };
      }
      return { success: true };
    } catch (error) {
      console.error('[WorkflowTemplates] Error deleting template:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Incrémente le compteur d'utilisation
   */
  ipcMain.handle('workflow-templates:incrementUsage', async (_event, id: string) => {
    try {
      await WorkflowTemplateService.incrementUsage(id);
      return { success: true };
    } catch (error) {
      console.error('[WorkflowTemplates] Error incrementing usage:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Recherche des templates
   */
  ipcMain.handle('workflow-templates:search', async (_event, query: string) => {
    try {
      const templates = await WorkflowTemplateService.search(query);
      return { success: true, data: templates };
    } catch (error) {
      console.error('[WorkflowTemplates] Error searching templates:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupère toutes les catégories
   */
  ipcMain.handle('workflow-templates:getCategories', async () => {
    try {
      const categories = await WorkflowTemplateService.getCategories();
      return { success: true, data: categories };
    } catch (error) {
      console.error('[WorkflowTemplates] Error fetching categories:', error);
      return { success: false, error: String(error) };
    }
  });

  // ==================== WORKFLOW VERSIONS ====================

  /**
   * Crée une nouvelle version (commit)
   */
  ipcMain.handle('workflow-versions:commit', async (_event, versionData: any) => {
    try {
      const version = await WorkflowVersionService.commit(versionData);
      return { success: true, data: version };
    } catch (error) {
      console.error('[WorkflowVersions] Error creating version:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupère toutes les versions d'un workflow
   */
  ipcMain.handle('workflow-versions:getByWorkflowId', async (_event, workflowId: string) => {
    try {
      const versions = await WorkflowVersionService.getByWorkflowId(workflowId);
      return { success: true, data: versions };
    } catch (error) {
      console.error('[WorkflowVersions] Error fetching versions:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupère une version par ID
   */
  ipcMain.handle('workflow-versions:getById', async (_event, id: string) => {
    try {
      const version = await WorkflowVersionService.getById(id);
      if (!version) {
        return { success: false, error: 'Version not found' };
      }
      return { success: true, data: version };
    } catch (error) {
      console.error('[WorkflowVersions] Error fetching version:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupère la dernière version d'un workflow
   */
  ipcMain.handle('workflow-versions:getLatest', async (_event, workflowId: string) => {
    try {
      const version = await WorkflowVersionService.getLatest(workflowId);
      return { success: true, data: version };
    } catch (error) {
      console.error('[WorkflowVersions] Error fetching latest version:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Restaure un workflow à une version spécifique
   */
  ipcMain.handle('workflow-versions:restore', async (_event, versionId: string) => {
    try {
      const workflow = await WorkflowVersionService.restore(versionId);
      if (!workflow) {
        return { success: false, error: 'Version or workflow not found' };
      }
      return { success: true, data: workflow };
    } catch (error) {
      console.error('[WorkflowVersions] Error restoring version:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupère l'historique avec diff
   */
  ipcMain.handle('workflow-versions:getHistory', async (_event, workflowId: string) => {
    try {
      const history = await WorkflowVersionService.getHistory(workflowId);
      return { success: true, data: history };
    } catch (error) {
      console.error('[WorkflowVersions] Error fetching history:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Supprime une version
   */
  ipcMain.handle('workflow-versions:delete', async (_event, id: string) => {
    try {
      const deleted = await WorkflowVersionService.delete(id);
      if (!deleted) {
        return { success: false, error: 'Version not found' };
      }
      return { success: true };
    } catch (error) {
      console.error('[WorkflowVersions] Error deleting version:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Supprime toutes les versions d'un workflow
   */
  ipcMain.handle('workflow-versions:deleteByWorkflowId', async (_event, workflowId: string) => {
    try {
      const count = await WorkflowVersionService.deleteByWorkflowId(workflowId);
      return { success: true, data: count };
    } catch (error) {
      console.error('[WorkflowVersions] Error deleting versions:', error);
      return { success: false, error: String(error) };
    }
  });

  // ==================== WORKFLOW VARIABLES ====================

  /**
   * Crée une nouvelle variable
   */
  ipcMain.handle(
    'workflow-variables:create',
    async (_event, data: Omit<NewWorkflowVariable, 'id' | 'createdAt' | 'updatedAt'>) => {
      try {
        const variable = await WorkflowVariableService.create(data);
        return { success: true, data: variable };
      } catch (error) {
        console.error('[WorkflowVariables] Error creating variable:', error);
        return { success: false, error: String(error) };
      }
    }
  );

  /**
   * Récupère toutes les variables
   */
  ipcMain.handle('workflow-variables:getAll', async () => {
    try {
      const variables = await WorkflowVariableService.getAll();
      return { success: true, data: variables };
    } catch (error) {
      console.error('[WorkflowVariables] Error fetching all variables:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupère une variable par ID
   */
  ipcMain.handle('workflow-variables:getById', async (_event, id: string) => {
    try {
      const variable = await WorkflowVariableService.getById(id);
      if (!variable) {
        return { success: false, error: 'Variable not found' };
      }
      return { success: true, data: variable };
    } catch (error) {
      console.error('[WorkflowVariables] Error fetching variable:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupère les variables par scope
   */
  ipcMain.handle('workflow-variables:getByScope', async (_event, scope: string) => {
    try {
      const variables = await WorkflowVariableService.getByScope(
        scope as 'workflow' | 'global' | 'environment'
      );
      return { success: true, data: variables };
    } catch (error) {
      console.error('[WorkflowVariables] Error fetching variables by scope:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupère les variables d'un workflow
   */
  ipcMain.handle('workflow-variables:getByWorkflowId', async (_event, workflowId: string) => {
    try {
      const variables = await WorkflowVariableService.getByWorkflowId(workflowId);
      return { success: true, data: variables };
    } catch (error) {
      console.error('[WorkflowVariables] Error fetching workflow variables:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupère les variables globales et d'environnement
   */
  ipcMain.handle('workflow-variables:getGlobalAndEnvironment', async () => {
    try {
      const variables = await WorkflowVariableService.getGlobalAndEnvironment();
      return { success: true, data: variables };
    } catch (error) {
      console.error('[WorkflowVariables] Error fetching global/env variables:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Met à jour une variable
   */
  ipcMain.handle('workflow-variables:update', async (_event, id: string, updates: any) => {
    try {
      const variable = await WorkflowVariableService.update(id, updates);
      if (!variable) {
        return { success: false, error: 'Variable not found' };
      }
      return { success: true, data: variable };
    } catch (error) {
      console.error('[WorkflowVariables] Error updating variable:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Supprime une variable
   */
  ipcMain.handle('workflow-variables:delete', async (_event, id: string) => {
    try {
      const deleted = await WorkflowVariableService.delete(id);
      if (!deleted) {
        return { success: false, error: 'Variable not found' };
      }
      return { success: true };
    } catch (error) {
      console.error('[WorkflowVariables] Error deleting variable:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Supprime toutes les variables d'un workflow
   */
  ipcMain.handle('workflow-variables:deleteByWorkflowId', async (_event, workflowId: string) => {
    try {
      const count = await WorkflowVariableService.deleteByWorkflowId(workflowId);
      return { success: true, data: count };
    } catch (error) {
      console.error('[WorkflowVariables] Error deleting workflow variables:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Recherche des variables
   */
  ipcMain.handle('workflow-variables:search', async (_event, query: string) => {
    try {
      const variables = await WorkflowVariableService.search(query);
      return { success: true, data: variables };
    } catch (error) {
      console.error('[WorkflowVariables] Error searching variables:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupère une variable par nom et scope
   */
  ipcMain.handle(
    'workflow-variables:getByNameAndScope',
    async (_event, name: string, scope: string, workflowId?: string) => {
      try {
        const variable = await WorkflowVariableService.getByNameAndScope(
          name,
          scope as 'workflow' | 'global' | 'environment',
          workflowId
        );
        return { success: true, data: variable };
      } catch (error) {
        console.error('[WorkflowVariables] Error fetching variable by name/scope:', error);
        return { success: false, error: String(error) };
      }
    }
  );

  // ==================== WORKFLOW UPDATES ====================

  /**
   * Met à jour les groupes d'un workflow
   */
  ipcMain.handle('workflows:updateGroups', async (_event, workflowId: string, groups: string) => {
    try {
      const workflow = await WorkflowUpdateService.updateGroups(workflowId, groups);
      if (!workflow) {
        return { success: false, error: 'Workflow not found' };
      }
      return { success: true, data: workflow };
    } catch (error) {
      console.error('[Workflows] Error updating groups:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Met à jour les annotations d'un workflow
   */
  ipcMain.handle(
    'workflows:updateAnnotations',
    async (_event, workflowId: string, annotations: string) => {
      try {
        const workflow = await WorkflowUpdateService.updateAnnotations(workflowId, annotations);
        if (!workflow) {
          return { success: false, error: 'Workflow not found' };
        }
        return { success: true, data: workflow };
      } catch (error) {
        console.error('[Workflows] Error updating annotations:', error);
        return { success: false, error: String(error) };
      }
    }
  );

  /**
   * Met à jour un workflow complet (groups, annotations, nodes, edges)
   */
  ipcMain.handle('workflows:updateFull', async (_event, workflowId: string, data: any) => {
    try {
      const workflow = await WorkflowUpdateService.updateFull(workflowId, data);
      if (!workflow) {
        return { success: false, error: 'Workflow not found' };
      }
      return { success: true, data: workflow };
    } catch (error) {
      console.error('[Workflows] Error updating workflow:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[IPC] Workflow handlers registered');
}
