import { eq, desc, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { getDatabase } from '../database/client';
import {
  workflowTemplates,
  workflowVersions,
  workflowVariables,
  workflows,
  type WorkflowTemplate,
  type NewWorkflowTemplate,
  type WorkflowVersion,
  type NewWorkflowVersion,
  type WorkflowVariable,
  type NewWorkflowVariable,
  type Workflow,
} from '../database/schema';

/**
 * Service pour les opérations base de données des workflows
 * Gère les templates, versions, et variables avec Drizzle ORM
 */

// ==================== WORKFLOW TEMPLATES ====================

export const WorkflowTemplateService = {
  /**
   * Récupère tous les templates
   */
  async getAll(): Promise<WorkflowTemplate[]> {
    const db = getDatabase();
    return await db.select().from(workflowTemplates).orderBy(desc(workflowTemplates.usageCount));
  },

  /**
   * Récupère un template par ID
   */
  async getById(id: string): Promise<WorkflowTemplate | null> {
    const db = getDatabase();
    const results = await db.select().from(workflowTemplates).where(eq(workflowTemplates.id, id));
    return results[0] || null;
  },

  /**
   * Récupère les templates par catégorie
   */
  async getByCategory(category: string): Promise<WorkflowTemplate[]> {
    const db = getDatabase();
    return await db
      .select()
      .from(workflowTemplates)
      .where(eq(workflowTemplates.category, category))
      .orderBy(desc(workflowTemplates.usageCount));
  },

  /**
   * Crée un nouveau template
   */
  async create(
    templateData: Omit<NewWorkflowTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>
  ): Promise<WorkflowTemplate> {
    const db = getDatabase();
    const now = new Date();

    const newTemplate: NewWorkflowTemplate = {
      ...templateData,
      id: randomUUID(),
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(workflowTemplates).values(newTemplate);
    return newTemplate as WorkflowTemplate;
  },

  /**
   * Met à jour un template
   */
  async update(id: string, updates: Partial<WorkflowTemplate>): Promise<WorkflowTemplate | null> {
    const db = getDatabase();

    await db
      .update(workflowTemplates)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(workflowTemplates.id, id));

    return await this.getById(id);
  },

  /**
   * Supprime un template
   */
  async delete(id: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.delete(workflowTemplates).where(eq(workflowTemplates.id, id));
    return result.changes > 0;
  },

  /**
   * Incrémente le compteur d'utilisation
   */
  async incrementUsage(id: string): Promise<void> {
    const db = getDatabase();
    await db
      .update(workflowTemplates)
      .set({
        usageCount: sql`${workflowTemplates.usageCount} + 1`,
      })
      .where(eq(workflowTemplates.id, id));
  },

  /**
   * Recherche des templates
   */
  async search(query: string): Promise<WorkflowTemplate[]> {
    const db = getDatabase();
    const lowerQuery = query.toLowerCase();

    const allTemplates = await db.select().from(workflowTemplates);

    return allTemplates.filter(
      (t) =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.category.toLowerCase().includes(lowerQuery) ||
        t.tags.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Récupère toutes les catégories
   */
  async getCategories(): Promise<string[]> {
    const db = getDatabase();
    const templates = await db.select().from(workflowTemplates);
    const categories = new Set<string>();

    templates.forEach((t) => {
      if (t.category) {
        categories.add(t.category);
      }
    });

    return Array.from(categories).sort();
  },
};

// ==================== WORKFLOW VERSIONS ====================

export const WorkflowVersionService = {
  /**
   * Crée une nouvelle version (commit)
   */
  async commit(versionData: {
    workflowId: string;
    message: string;
    author?: string;
    nodes: string;
    edges: string;
    groups?: string;
    annotations?: string;
    variables?: string;
    parentId?: string;
  }): Promise<WorkflowVersion> {
    const db = getDatabase();

    // Déterminer le numéro de version
    const versions = await this.getByWorkflowId(versionData.workflowId);
    const versionNumber = `v${versions.length + 1}`;

    const newVersion: NewWorkflowVersion = {
      id: randomUUID(),
      workflowId: versionData.workflowId,
      version: versionNumber,
      message: versionData.message,
      author: versionData.author || null,
      nodes: versionData.nodes,
      edges: versionData.edges,
      groups: versionData.groups || '[]',
      annotations: versionData.annotations || '[]',
      variables: versionData.variables || null,
      parentId: versionData.parentId || null,
      createdAt: new Date(),
    };

    await db.insert(workflowVersions).values(newVersion);
    return newVersion as WorkflowVersion;
  },

  /**
   * Récupère toutes les versions d'un workflow
   */
  async getByWorkflowId(workflowId: string): Promise<WorkflowVersion[]> {
    const db = getDatabase();
    return await db
      .select()
      .from(workflowVersions)
      .where(eq(workflowVersions.workflowId, workflowId))
      .orderBy(desc(workflowVersions.createdAt));
  },

  /**
   * Récupère une version par ID
   */
  async getById(id: string): Promise<WorkflowVersion | null> {
    const db = getDatabase();
    const results = await db.select().from(workflowVersions).where(eq(workflowVersions.id, id));
    return results[0] || null;
  },

  /**
   * Récupère la dernière version d'un workflow
   */
  async getLatest(workflowId: string): Promise<WorkflowVersion | null> {
    const db = getDatabase();
    const results = await db
      .select()
      .from(workflowVersions)
      .where(eq(workflowVersions.workflowId, workflowId))
      .orderBy(desc(workflowVersions.createdAt))
      .limit(1);

    return results[0] || null;
  },

  /**
   * Restaure un workflow à une version spécifique
   */
  async restore(versionId: string): Promise<Workflow | null> {
    const db = getDatabase();

    // Récupérer la version
    const version = await this.getById(versionId);
    if (!version) {
      return null;
    }

    // Mettre à jour le workflow avec les données de la version
    await db
      .update(workflows)
      .set({
        nodes: version.nodes,
        edges: version.edges,
        groups: version.groups,
        annotations: version.annotations,
        updatedAt: new Date(),
      })
      .where(eq(workflows.id, version.workflowId));

    // Récupérer le workflow mis à jour
    const updatedWorkflow = await db
      .select()
      .from(workflows)
      .where(eq(workflows.id, version.workflowId));

    return updatedWorkflow[0] || null;
  },

  /**
   * Récupère l'historique avec diff entre versions
   */
  async getHistory(workflowId: string): Promise<
    Array<{
      version: WorkflowVersion;
      nodesChanged: number;
      edgesChanged: number;
    }>
  > {
    const versions = await this.getByWorkflowId(workflowId);

    return versions.map((version, index) => {
      let nodesChanged = 0;
      let edgesChanged = 0;

      if (index < versions.length - 1) {
        const previousVersion = versions[index + 1];
        const currentNodes = JSON.parse(version.nodes);
        const previousNodes = JSON.parse(previousVersion.nodes);
        const currentEdges = JSON.parse(version.edges);
        const previousEdges = JSON.parse(previousVersion.edges);

        nodesChanged = Math.abs(currentNodes.length - previousNodes.length);
        edgesChanged = Math.abs(currentEdges.length - previousEdges.length);
      }

      return {
        version,
        nodesChanged,
        edgesChanged,
      };
    });
  },

  /**
   * Supprime une version
   */
  async delete(id: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.delete(workflowVersions).where(eq(workflowVersions.id, id));
    return result.changes > 0;
  },

  /**
   * Supprime toutes les versions d'un workflow
   */
  async deleteByWorkflowId(workflowId: string): Promise<number> {
    const db = getDatabase();
    const result = await db
      .delete(workflowVersions)
      .where(eq(workflowVersions.workflowId, workflowId));
    return result.changes;
  },
};

// ==================== WORKFLOW VARIABLES ====================

export const WorkflowVariableService = {
  /**
   * Crée une nouvelle variable
   */
  async create(
    variableData: Omit<NewWorkflowVariable, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<WorkflowVariable> {
    const db = getDatabase();
    const now = new Date();

    const newVariable: NewWorkflowVariable = {
      ...variableData,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(workflowVariables).values(newVariable);
    return newVariable as WorkflowVariable;
  },

  /**
   * Récupère toutes les variables
   */
  async getAll(): Promise<WorkflowVariable[]> {
    const db = getDatabase();
    return await db.select().from(workflowVariables);
  },

  /**
   * Récupère une variable par ID
   */
  async getById(id: string): Promise<WorkflowVariable | null> {
    const db = getDatabase();
    const results = await db.select().from(workflowVariables).where(eq(workflowVariables.id, id));
    return results[0] || null;
  },

  /**
   * Récupère les variables par scope
   */
  async getByScope(scope: 'workflow' | 'global' | 'environment'): Promise<WorkflowVariable[]> {
    const db = getDatabase();
    return await db.select().from(workflowVariables).where(eq(workflowVariables.scope, scope));
  },

  /**
   * Récupère les variables d'un workflow spécifique
   */
  async getByWorkflowId(workflowId: string): Promise<WorkflowVariable[]> {
    const db = getDatabase();
    return await db
      .select()
      .from(workflowVariables)
      .where(eq(workflowVariables.workflowId, workflowId));
  },

  /**
   * Récupère les variables globales et d'environnement
   */
  async getGlobalAndEnvironment(): Promise<WorkflowVariable[]> {
    const db = getDatabase();
    return await db
      .select()
      .from(workflowVariables)
      .where(
        sql`${workflowVariables.scope} IN ('global', 'environment') AND ${workflowVariables.workflowId} IS NULL`
      );
  },

  /**
   * Met à jour une variable
   */
  async update(id: string, updates: Partial<WorkflowVariable>): Promise<WorkflowVariable | null> {
    const db = getDatabase();

    await db
      .update(workflowVariables)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(workflowVariables.id, id));

    return await this.getById(id);
  },

  /**
   * Supprime une variable
   */
  async delete(id: string): Promise<boolean> {
    const db = getDatabase();
    const result = await db.delete(workflowVariables).where(eq(workflowVariables.id, id));
    return result.changes > 0;
  },

  /**
   * Supprime toutes les variables d'un workflow
   */
  async deleteByWorkflowId(workflowId: string): Promise<number> {
    const db = getDatabase();
    const result = await db
      .delete(workflowVariables)
      .where(eq(workflowVariables.workflowId, workflowId));
    return result.changes;
  },

  /**
   * Recherche des variables par nom
   */
  async search(query: string): Promise<WorkflowVariable[]> {
    const db = getDatabase();
    const allVariables = await db.select().from(workflowVariables);
    const lowerQuery = query.toLowerCase();

    return allVariables.filter(
      (v) =>
        v.name.toLowerCase().includes(lowerQuery) ||
        v.description?.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Récupère une variable par nom et scope
   */
  async getByNameAndScope(
    name: string,
    scope: 'workflow' | 'global' | 'environment',
    workflowId?: string
  ): Promise<WorkflowVariable | null> {
    const db = getDatabase();

    // Build conditions array
    const conditions = [eq(workflowVariables.name, name), eq(workflowVariables.scope, scope)];

    if (scope === 'workflow' && workflowId) {
      conditions.push(eq(workflowVariables.workflowId, workflowId));
    }

    const results = await db
      .select()
      .from(workflowVariables)
      .where(and(...conditions));

    return results[0] || null;
  },
};

// ==================== WORKFLOW UPDATES ====================

/**
 * Met à jour les colonnes groups et annotations d'un workflow existant
 */
export const WorkflowUpdateService = {
  /**
   * Met à jour les groupes d'un workflow
   */
  async updateGroups(workflowId: string, groups: string): Promise<Workflow | null> {
    const db = getDatabase();

    await db
      .update(workflows)
      .set({
        groups,
        updatedAt: new Date(),
      })
      .where(eq(workflows.id, workflowId));

    const updatedWorkflow = await db.select().from(workflows).where(eq(workflows.id, workflowId));
    return updatedWorkflow[0] || null;
  },

  /**
   * Met à jour les annotations d'un workflow
   */
  async updateAnnotations(workflowId: string, annotations: string): Promise<Workflow | null> {
    const db = getDatabase();

    await db
      .update(workflows)
      .set({
        annotations,
        updatedAt: new Date(),
      })
      .where(eq(workflows.id, workflowId));

    const updatedWorkflow = await db.select().from(workflows).where(eq(workflows.id, workflowId));
    return updatedWorkflow[0] || null;
  },

  /**
   * Met à jour groups, annotations, nodes, edges
   */
  async updateFull(
    workflowId: string,
    data: {
      nodes?: string;
      edges?: string;
      groups?: string;
      annotations?: string;
    }
  ): Promise<Workflow | null> {
    const db = getDatabase();

    await db
      .update(workflows)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(workflows.id, workflowId));

    const updatedWorkflow = await db.select().from(workflows).where(eq(workflows.id, workflowId));
    return updatedWorkflow[0] || null;
  },
};
