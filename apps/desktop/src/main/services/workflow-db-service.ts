import { eq, desc, and, or, sql } from 'drizzle-orm';
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

// ==================== VALIDATION HELPERS ====================

/**
 * Valide qu'une chaîne est un JSON valide
 * @throws Error si le JSON est invalide
 */
function validateJSON(jsonString: string, fieldName: string): void {
  try {
    JSON.parse(jsonString);
  } catch (error) {
    throw new Error(
      `Invalid JSON format in ${fieldName}: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Valide les champs JSON d'un template
 */
function validateTemplateJSON(data: {
  nodes: string;
  edges: string;
  groups?: string;
  annotations?: string;
}): void {
  validateJSON(data.nodes, 'nodes');
  validateJSON(data.edges, 'edges');
  if (data.groups) validateJSON(data.groups, 'groups');
  if (data.annotations) validateJSON(data.annotations, 'annotations');
}

/**
 * Valide les champs JSON d'une version
 */
function validateVersionJSON(data: {
  nodes: string;
  edges: string;
  groups?: string;
  annotations?: string;
  variables?: string | null;
}): void {
  validateJSON(data.nodes, 'nodes');
  validateJSON(data.edges, 'edges');
  if (data.groups) validateJSON(data.groups, 'groups');
  if (data.annotations) validateJSON(data.annotations, 'annotations');
  if (data.variables) validateJSON(data.variables, 'variables');
}

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
    // Validation JSON avant insertion
    validateTemplateJSON(templateData);

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
    // Validation JSON si présents dans les mises à jour
    if (updates.nodes || updates.edges || updates.groups || updates.annotations) {
      const validationData: any = {};
      if (updates.nodes) validationData.nodes = updates.nodes;
      if (updates.edges) validationData.edges = updates.edges;
      if (updates.groups) validationData.groups = updates.groups;
      if (updates.annotations) validationData.annotations = updates.annotations;

      // Si nodes ou edges sont modifiés, valider les deux (requis)
      if (updates.nodes || updates.edges) {
        const current = await this.getById(id);
        if (current) {
          if (!validationData.nodes) validationData.nodes = current.nodes;
          if (!validationData.edges) validationData.edges = current.edges;
        }
      }

      if (validationData.nodes && validationData.edges) {
        validateTemplateJSON(validationData);
      }
    }

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
   * Optimisé avec requête SQL LIKE au lieu de filtrage JavaScript
   */
  async search(query: string): Promise<WorkflowTemplate[]> {
    const db = getDatabase();
    const searchPattern = `%${query}%`;

    return await db
      .select()
      .from(workflowTemplates)
      .where(
        or(
          sql`LOWER(${workflowTemplates.name}) LIKE LOWER(${searchPattern})`,
          sql`LOWER(${workflowTemplates.description}) LIKE LOWER(${searchPattern})`,
          sql`LOWER(${workflowTemplates.category}) LIKE LOWER(${searchPattern})`,
          sql`LOWER(${workflowTemplates.tags}) LIKE LOWER(${searchPattern})`
        )
      )
      .orderBy(desc(workflowTemplates.usageCount));
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

/**
 * Interface pour le résultat du diff détaillé
 */
interface DetailedDiff {
  added: number;
  removed: number;
  modified: number;
  total: number;
}

/**
 * Calcule un diff détaillé entre deux listes d'éléments
 * Détecte les ajouts, suppressions ET modifications
 */
function calculateDetailedDiff(current: any[], previous: any[]): DetailedDiff {
  const currentIds = new Set(current.map((item: any) => item.id));
  const previousIds = new Set(previous.map((item: any) => item.id));

  // Éléments ajoutés (présents dans current mais pas dans previous)
  const added = current.filter((item: any) => !previousIds.has(item.id)).length;

  // Éléments supprimés (présents dans previous mais pas dans current)
  const removed = previous.filter((item: any) => !currentIds.has(item.id)).length;

  // Éléments modifiés (même ID mais contenu différent)
  const modified = current.filter((item: any) => {
    const prev = previous.find((p: any) => p.id === item.id);
    return prev && JSON.stringify(prev) !== JSON.stringify(item);
  }).length;

  return {
    added,
    removed,
    modified,
    total: added + removed + modified,
  };
}

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
    // Validation JSON avant création de version
    validateVersionJSON(versionData);

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
   * Récupère l'historique avec diff détaillé entre versions
   * Retourne les ajouts, suppressions et modifications de nœuds et connexions
   */
  async getHistory(workflowId: string): Promise<
    Array<{
      version: WorkflowVersion;
      nodesDiff: DetailedDiff;
      edgesDiff: DetailedDiff;
      // Rétrocompatibilité : total des changements
      nodesChanged: number;
      edgesChanged: number;
    }>
  > {
    const versions = await this.getByWorkflowId(workflowId);

    return versions.map((version, index) => {
      let nodesDiff: DetailedDiff = { added: 0, removed: 0, modified: 0, total: 0 };
      let edgesDiff: DetailedDiff = { added: 0, removed: 0, modified: 0, total: 0 };

      if (index < versions.length - 1) {
        const previousVersion = versions[index + 1];
        const currentNodes = JSON.parse(version.nodes);
        const previousNodes = JSON.parse(previousVersion.nodes);
        const currentEdges = JSON.parse(version.edges);
        const previousEdges = JSON.parse(previousVersion.edges);

        nodesDiff = calculateDetailedDiff(currentNodes, previousNodes);
        edgesDiff = calculateDetailedDiff(currentEdges, previousEdges);
      }

      return {
        version,
        nodesDiff,
        edgesDiff,
        // Rétrocompatibilité
        nodesChanged: nodesDiff.total,
        edgesChanged: edgesDiff.total,
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
    // Validation : si scope = 'workflow', workflowId obligatoire
    if (variableData.scope === 'workflow' && !variableData.workflowId) {
      throw new Error('workflowId is required for workflow-scoped variables');
    }

    // Validation : si scope != 'workflow', workflowId doit être null
    if (variableData.scope !== 'workflow' && variableData.workflowId) {
      throw new Error(
        `workflowId must be null for ${variableData.scope}-scoped variables. Remove workflowId or change scope to 'workflow'.`
      );
    }

    // Validation de la valeur JSON
    if (variableData.value) {
      validateJSON(variableData.value, 'value');
    }

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
   * Optimisé avec requête SQL LIKE au lieu de filtrage JavaScript
   */
  async search(query: string): Promise<WorkflowVariable[]> {
    const db = getDatabase();
    const searchPattern = `%${query}%`;

    return await db
      .select()
      .from(workflowVariables)
      .where(
        or(
          sql`LOWER(${workflowVariables.name}) LIKE LOWER(${searchPattern})`,
          sql`LOWER(${workflowVariables.description}) LIKE LOWER(${searchPattern})`
        )
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
