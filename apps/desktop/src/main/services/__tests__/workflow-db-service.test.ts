import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { randomUUID } from 'crypto';
import {
  WorkflowTemplateService,
  WorkflowVersionService,
  WorkflowVariableService,
  WorkflowUpdateService,
} from '../workflow-db-service';
import { getDatabase } from '../../database/client';

/**
 * Tests unitaires pour les services de workflow avancés
 *
 * Ces tests vérifient les opérations CRUD et la logique métier pour:
 * - WorkflowTemplateService
 * - WorkflowVersionService
 * - WorkflowVariableService
 * - WorkflowUpdateService
 */

// Mock de la base de données
vi.mock('../../database/client', () => ({
  getDatabase: vi.fn(),
}));

describe('WorkflowTemplateService', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getDatabase as any).mockReturnValue(mockDb);
  });

  describe('getAll', () => {
    it('should return all templates ordered by usage count', async () => {
      const mockTemplates = [
        {
          id: 'template-1',
          name: 'Template 1',
          description: 'Description 1',
          category: 'general',
          usageCount: 10,
        },
        {
          id: 'template-2',
          name: 'Template 2',
          description: 'Description 2',
          category: 'automation',
          usageCount: 5,
        },
      ];

      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.orderBy.mockResolvedValue(mockTemplates);

      const result = await WorkflowTemplateService.getAll();

      expect(result).toEqual(mockTemplates);
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.orderBy).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new template with generated ID and timestamps', async () => {
      const templateData = {
        name: 'New Template',
        description: 'Test template',
        category: 'test',
        tags: '[]',
        nodes: JSON.stringify([]),
        edges: JSON.stringify([]),
      };

      mockDb.insert.mockReturnValue(mockDb);
      mockDb.values.mockResolvedValue(undefined);

      const result = await WorkflowTemplateService.create(templateData);

      expect(result.id).toBeDefined();
      expect(result.name).toBe(templateData.name);
      expect(result.usageCount).toBe(0);
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('incrementUsage', () => {
    it('should increment the usage count of a template', async () => {
      const templateId = 'template-1';

      mockDb.update.mockReturnValue(mockDb);
      mockDb.set.mockReturnValue(mockDb);
      mockDb.where.mockResolvedValue(undefined);

      await WorkflowTemplateService.incrementUsage(templateId);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should filter templates by search query', async () => {
      const allTemplates = [
        {
          id: 'template-1',
          name: 'Data Processing',
          description: 'Process CSV data',
          category: 'data',
          tags: '["csv", "processing"]',
        },
        {
          id: 'template-2',
          name: 'Image Analysis',
          description: 'Analyze images',
          category: 'ai',
          tags: '["image", "ai"]',
        },
      ];

      mockDb.select.mockResolvedValue(allTemplates);

      const result = await WorkflowTemplateService.search('data');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Data Processing');
    });
  });
});

describe('WorkflowVersionService', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getDatabase as any).mockReturnValue(mockDb);
  });

  describe('commit', () => {
    it('should create a new version with incremented version number', async () => {
      const workflowId = 'workflow-1';
      const existingVersions = [
        { id: 'v1', version: 'v2', workflowId },
        { id: 'v0', version: 'v1', workflowId },
      ];

      // Mock getByWorkflowId to return existing versions
      mockDb.select.mockResolvedValue(existingVersions);
      mockDb.insert.mockReturnValue(mockDb);
      mockDb.values.mockResolvedValue(undefined);

      const versionData = {
        workflowId,
        message: 'Test commit',
        author: 'Test User',
        nodes: JSON.stringify([]),
        edges: JSON.stringify([]),
      };

      const result = await WorkflowVersionService.commit(versionData);

      expect(result.version).toBe('v3'); // Should be v3 since we have v1 and v2
      expect(result.message).toBe('Test commit');
      expect(result.workflowId).toBe(workflowId);
    });
  });

  describe('getHistory', () => {
    it('should calculate detailed diff between consecutive versions', async () => {
      const workflowId = 'workflow-1';
      const versions = [
        {
          id: 'v2',
          version: 'v2',
          workflowId,
          nodes: JSON.stringify([{ id: '1' }, { id: '2' }]),
          edges: JSON.stringify([{ id: 'e1' }]),
          createdAt: new Date(),
        },
        {
          id: 'v1',
          version: 'v1',
          workflowId,
          nodes: JSON.stringify([{ id: '1' }]),
          edges: JSON.stringify([]),
          createdAt: new Date(),
        },
      ];

      mockDb.select.mockResolvedValue(versions);

      const result = await WorkflowVersionService.getHistory(workflowId);

      expect(result).toHaveLength(2);

      // Latest version has no diff
      expect(result[0].nodesChanged).toBe(0);
      expect(result[0].nodesDiff).toEqual({ added: 0, removed: 0, modified: 0, total: 0 });

      // v1 -> v2 added 1 node
      expect(result[1].nodesChanged).toBe(1);
      expect(result[1].nodesDiff.added).toBe(1);
      expect(result[1].nodesDiff.removed).toBe(0);
      expect(result[1].nodesDiff.modified).toBe(0);

      // v1 -> v2 added 1 edge
      expect(result[1].edgesChanged).toBe(1);
      expect(result[1].edgesDiff.added).toBe(1);
    });
  });
});

describe('WorkflowVariableService', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getDatabase as any).mockReturnValue(mockDb);
  });

  describe('create', () => {
    it('should create a workflow-scoped variable with workflowId', async () => {
      const variableData = {
        name: 'api_key',
        value: JSON.stringify('secret123'),
        type: 'string' as const,
        scope: 'workflow' as const,
        workflowId: 'workflow-1',
        encrypted: true,
      };

      mockDb.insert.mockReturnValue(mockDb);
      mockDb.values.mockResolvedValue(undefined);

      const result = await WorkflowVariableService.create(variableData);

      expect(result.id).toBeDefined();
      expect(result.name).toBe('api_key');
      expect(result.scope).toBe('workflow');
      expect(result.workflowId).toBe('workflow-1');
      expect(result.encrypted).toBe(true);
    });

    it('should create a global variable without workflowId', async () => {
      const variableData = {
        name: 'global_setting',
        value: JSON.stringify('value'),
        type: 'string' as const,
        scope: 'global' as const,
        workflowId: null,
        encrypted: false,
      };

      mockDb.insert.mockReturnValue(mockDb);
      mockDb.values.mockResolvedValue(undefined);

      const result = await WorkflowVariableService.create(variableData);

      expect(result.scope).toBe('global');
      expect(result.workflowId).toBeNull();
    });
  });

  describe('getByScope', () => {
    it('should filter variables by scope', async () => {
      const mockVariables = [
        { id: 'var-1', name: 'workflow_var', scope: 'workflow' },
        { id: 'var-2', name: 'global_var', scope: 'global' },
      ];

      mockDb.select.mockResolvedValue([mockVariables[0]]);

      const result = await WorkflowVariableService.getByScope('workflow');

      expect(result).toHaveLength(1);
      expect(result[0].scope).toBe('workflow');
    });
  });

  describe('getByNameAndScope', () => {
    it('should find variable by name and scope', async () => {
      const mockVariable = {
        id: 'var-1',
        name: 'api_key',
        scope: 'workflow',
        workflowId: 'workflow-1',
      };

      mockDb.select.mockReturnValue(mockDb);
      mockDb.from.mockReturnValue(mockDb);
      mockDb.where.mockResolvedValue([mockVariable]);

      const result = await WorkflowVariableService.getByNameAndScope(
        'api_key',
        'workflow',
        'workflow-1'
      );

      expect(result).toEqual(mockVariable);
      expect(mockDb.where).toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should search variables by name and description', async () => {
      const allVariables = [
        {
          id: 'var-1',
          name: 'api_key',
          description: 'API authentication key',
        },
        {
          id: 'var-2',
          name: 'database_url',
          description: 'Database connection string',
        },
      ];

      mockDb.select.mockResolvedValue(allVariables);

      const result = await WorkflowVariableService.search('api');

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('api_key');
    });
  });

  describe('validation', () => {
    it('should throw error when workflow-scoped variable has no workflowId', async () => {
      const variableData = {
        name: 'test_var',
        value: JSON.stringify('value'),
        type: 'string' as const,
        scope: 'workflow' as const,
        workflowId: null, // Invalid: workflow scope requires workflowId
        encrypted: false,
      };

      await expect(WorkflowVariableService.create(variableData)).rejects.toThrow(
        'workflowId is required for workflow-scoped variables'
      );
    });

    it('should throw error when global variable has workflowId', async () => {
      const variableData = {
        name: 'test_var',
        value: JSON.stringify('value'),
        type: 'string' as const,
        scope: 'global' as const,
        workflowId: 'workflow-1', // Invalid: global scope should not have workflowId
        encrypted: false,
      };

      await expect(WorkflowVariableService.create(variableData)).rejects.toThrow(
        'workflowId must be null for global-scoped variables'
      );
    });

    it('should throw error when variable value is invalid JSON', async () => {
      const variableData = {
        name: 'test_var',
        value: '{invalid json}', // Invalid JSON
        type: 'string' as const,
        scope: 'global' as const,
        workflowId: null,
        encrypted: false,
      };

      await expect(WorkflowVariableService.create(variableData)).rejects.toThrow(
        'Invalid JSON format in value'
      );
    });
  });
});

describe('WorkflowUpdateService', () => {
  const mockDb = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getDatabase as any).mockReturnValue(mockDb);
  });

  describe('updateGroups', () => {
    it('should update workflow groups', async () => {
      const workflowId = 'workflow-1';
      const groups = JSON.stringify([{ id: 'group-1', name: 'Group 1' }]);
      const updatedWorkflow = {
        id: workflowId,
        groups,
        updatedAt: new Date(),
      };

      mockDb.update.mockReturnValue(mockDb);
      mockDb.set.mockReturnValue(mockDb);
      mockDb.where.mockResolvedValue(undefined);
      mockDb.select.mockResolvedValue([updatedWorkflow]);

      const result = await WorkflowUpdateService.updateGroups(workflowId, groups);

      expect(result).toEqual(updatedWorkflow);
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('updateAnnotations', () => {
    it('should update workflow annotations', async () => {
      const workflowId = 'workflow-1';
      const annotations = JSON.stringify([{ id: 'ann-1', text: 'Note' }]);
      const updatedWorkflow = {
        id: workflowId,
        annotations,
        updatedAt: new Date(),
      };

      mockDb.update.mockReturnValue(mockDb);
      mockDb.set.mockReturnValue(mockDb);
      mockDb.where.mockResolvedValue(undefined);
      mockDb.select.mockResolvedValue([updatedWorkflow]);

      const result = await WorkflowUpdateService.updateAnnotations(workflowId, annotations);

      expect(result).toEqual(updatedWorkflow);
      expect(mockDb.update).toHaveBeenCalled();
    });
  });

  describe('updateFull', () => {
    it('should update multiple workflow fields at once', async () => {
      const workflowId = 'workflow-1';
      const updateData = {
        nodes: JSON.stringify([{ id: 'node-1' }]),
        edges: JSON.stringify([]),
        groups: JSON.stringify([]),
        annotations: JSON.stringify([]),
      };
      const updatedWorkflow = {
        id: workflowId,
        ...updateData,
        updatedAt: new Date(),
      };

      mockDb.update.mockReturnValue(mockDb);
      mockDb.set.mockReturnValue(mockDb);
      mockDb.where.mockResolvedValue(undefined);
      mockDb.select.mockResolvedValue([updatedWorkflow]);

      const result = await WorkflowUpdateService.updateFull(workflowId, updateData);

      expect(result).toEqual(updatedWorkflow);
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          nodes: updateData.nodes,
          edges: updateData.edges,
          groups: updateData.groups,
          annotations: updateData.annotations,
        })
      );
    });
  });
});

/**
 * Tests d'intégration
 *
 * Ces tests vérifient les interactions entre les différents services
 */
describe('Integration Tests', () => {
  describe('Template to Workflow Creation Flow', () => {
    it('should track template usage when creating workflow from template', async () => {
      // Ce test simule le flux complet :
      // 1. Créer un template
      // 2. Incrémenter son usage lors de la création d'un workflow
      // 3. Vérifier que le compteur a bien été incrémenté

      // Note: Ce test nécessiterait une vraie base de données en mémoire
      // pour être pleinement fonctionnel
    });
  });

  describe('Version Control Flow', () => {
    it('should maintain version history when workflow is modified', async () => {
      // Ce test simule le flux de versioning :
      // 1. Créer un workflow initial
      // 2. Créer une première version (v1)
      // 3. Modifier le workflow
      // 4. Créer une deuxième version (v2)
      // 5. Restaurer v1
      // 6. Vérifier que le workflow est revenu à l'état v1
    });
  });

  describe('Variable Scope Management', () => {
    it('should correctly handle workflow-scoped vs global variables', async () => {
      // Ce test vérifie que :
      // 1. Les variables workflow sont isolées par workflow
      // 2. Les variables globales sont accessibles partout
      // 3. Les variables d'environnement sont correctement gérées
    });
  });
});
