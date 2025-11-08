import { useState, useEffect, useCallback } from 'react';

/**
 * Types pour les workflows
 */
export interface WorkflowNode {
  id: string;
  type: 'input' | 'output' | 'aiPrompt' | 'condition' | 'loop' | 'transform' | 'switch';
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  animated?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: string; // JSON string
  edges: string; // JSON string
  icon: string;
  color: string;
  category?: string | null;
  tags: string; // JSON string
  isFavorite: boolean;
  usageCount: number;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedWorkflow extends Omit<Workflow, 'nodes' | 'edges' | 'tags'> {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  tags: string[];
}

export interface CreateWorkflowData {
  name: string;
  description: string;
  nodes: string;
  edges: string;
  icon?: string;
  color?: string;
  category?: string;
  tags?: string;
  isFavorite?: boolean;
  isTemplate?: boolean;
}

export interface UpdateWorkflowData {
  name?: string;
  description?: string;
  nodes?: string;
  edges?: string;
  icon?: string;
  color?: string;
  category?: string;
  tags?: string;
  isFavorite?: boolean;
  isTemplate?: boolean;
}

interface WorkflowIpcResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Parse les champs JSON (nodes, edges, tags) d'un workflow
 */
function parseWorkflow(workflow: Workflow): ParsedWorkflow {
  try {
    const nodes: WorkflowNode[] = workflow.nodes ? JSON.parse(workflow.nodes) : [];
    const edges: WorkflowEdge[] = workflow.edges ? JSON.parse(workflow.edges) : [];
    const tags: string[] = workflow.tags ? JSON.parse(workflow.tags) : [];

    return {
      ...workflow,
      nodes,
      edges,
      tags,
    };
  } catch (err) {
    console.error('[useWorkflows] Error parsing workflow:', workflow.id, err);
    return {
      ...workflow,
      nodes: [],
      edges: [],
      tags: [],
    };
  }
}

/**
 * Hook pour gérer les workflows
 * Communique avec les IPC handlers pour les opérations CRUD
 */
export function useWorkflows() {
  const [workflows, setWorkflows] = useState<ParsedWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger tous les workflows
  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response: WorkflowIpcResponse<Workflow[]> = await window.electronAPI.workflows.getAll();

      if (response.success && response.data) {
        const parsedWorkflows = response.data.map(parseWorkflow);
        console.log('[useWorkflows] Workflows chargés et parsés:', parsedWorkflows.length);
        setWorkflows(parsedWorkflows);
      } else {
        setError(response.error || 'Failed to load workflows');
      }
    } catch (err) {
      setError(String(err));
      console.error('[useWorkflows] Error loading workflows:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  // Créer un nouveau workflow
  const createWorkflow = useCallback(
    async (data: CreateWorkflowData): Promise<ParsedWorkflow | null> => {
      try {
        const response: WorkflowIpcResponse<Workflow> =
          await window.electronAPI.workflows.create(data);

        if (response.success && response.data) {
          await loadWorkflows(); // Recharger la liste
          return parseWorkflow(response.data);
        } else {
          setError(response.error || 'Failed to create workflow');
          return null;
        }
      } catch (err) {
        setError(String(err));
        console.error('[useWorkflows] Error creating workflow:', err);
        return null;
      }
    },
    [loadWorkflows]
  );

  // Mettre à jour un workflow
  const updateWorkflow = useCallback(
    async (id: string, data: UpdateWorkflowData): Promise<ParsedWorkflow | null> => {
      try {
        const response: WorkflowIpcResponse<Workflow> =
          await window.electronAPI.workflows.update(id, data);

        if (response.success && response.data) {
          await loadWorkflows(); // Recharger la liste
          return parseWorkflow(response.data);
        } else {
          setError(response.error || 'Failed to update workflow');
          return null;
        }
      } catch (err) {
        setError(String(err));
        console.error('[useWorkflows] Error updating workflow:', err);
        return null;
      }
    },
    [loadWorkflows]
  );

  // Supprimer un workflow
  const deleteWorkflow = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response: WorkflowIpcResponse = await window.electronAPI.workflows.delete(id);

        if (response.success) {
          await loadWorkflows(); // Recharger la liste
          return true;
        } else {
          setError(response.error || 'Failed to delete workflow');
          return false;
        }
      } catch (err) {
        setError(String(err));
        console.error('[useWorkflows] Error deleting workflow:', err);
        return false;
      }
    },
    [loadWorkflows]
  );

  // Toggle favori
  const toggleFavorite = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response: WorkflowIpcResponse<Workflow> =
          await window.electronAPI.workflows.toggleFavorite(id);

        if (response.success) {
          await loadWorkflows();
          return true;
        } else {
          setError(response.error || 'Failed to toggle favorite');
          return false;
        }
      } catch (err) {
        setError(String(err));
        console.error('[useWorkflows] Error toggling favorite:', err);
        return false;
      }
    },
    [loadWorkflows]
  );

  // Dupliquer un workflow
  const duplicateWorkflow = useCallback(
    async (id: string): Promise<ParsedWorkflow | null> => {
      try {
        const response: WorkflowIpcResponse<Workflow> =
          await window.electronAPI.workflows.duplicate(id);

        if (response.success && response.data) {
          await loadWorkflows();
          return parseWorkflow(response.data);
        } else {
          setError(response.error || 'Failed to duplicate workflow');
          return null;
        }
      } catch (err) {
        setError(String(err));
        console.error('[useWorkflows] Error duplicating workflow:', err);
        return null;
      }
    },
    [loadWorkflows]
  );

  // Incrémenter le compteur d'utilisation
  const incrementUsage = useCallback(async (id: string): Promise<void> => {
    try {
      await window.electronAPI.workflows.incrementUsage(id);
    } catch (err) {
      console.error('[useWorkflows] Error incrementing usage:', err);
    }
  }, []);

  // Rechercher des workflows
  const searchWorkflows = useCallback(async (query: string): Promise<ParsedWorkflow[]> => {
    try {
      const response: WorkflowIpcResponse<Workflow[]> =
        await window.electronAPI.workflows.search(query);

      if (response.success && response.data) {
        return response.data.map(parseWorkflow);
      }
      return [];
    } catch (err) {
      console.error('[useWorkflows] Error searching workflows:', err);
      return [];
    }
  }, []);

  // Filtrer par catégorie
  const filterByCategory = useCallback(async (category: string): Promise<ParsedWorkflow[]> => {
    try {
      const response: WorkflowIpcResponse<Workflow[]> =
        await window.electronAPI.workflows.filterByCategory(category);

      if (response.success && response.data) {
        return response.data.map(parseWorkflow);
      }
      return [];
    } catch (err) {
      console.error('[useWorkflows] Error filtering workflows:', err);
      return [];
    }
  }, []);

  // Récupérer les favoris
  const getFavorites = useCallback(async (): Promise<ParsedWorkflow[]> => {
    try {
      const response: WorkflowIpcResponse<Workflow[]> =
        await window.electronAPI.workflows.getFavorites();

      if (response.success && response.data) {
        return response.data.map(parseWorkflow);
      }
      return [];
    } catch (err) {
      console.error('[useWorkflows] Error getting favorites:', err);
      return [];
    }
  }, []);

  // Récupérer les templates
  const getTemplates = useCallback(async (): Promise<ParsedWorkflow[]> => {
    try {
      const response: WorkflowIpcResponse<Workflow[]> =
        await window.electronAPI.workflows.getTemplates();

      if (response.success && response.data) {
        return response.data.map(parseWorkflow);
      }
      return [];
    } catch (err) {
      console.error('[useWorkflows] Error getting templates:', err);
      return [];
    }
  }, []);

  // Récupérer les catégories
  const getCategories = useCallback(async (): Promise<string[]> => {
    try {
      const response: WorkflowIpcResponse<string[]> =
        await window.electronAPI.workflows.getCategories();

      if (response.success && response.data) {
        return response.data;
      }
      return [];
    } catch (err) {
      console.error('[useWorkflows] Error getting categories:', err);
      return [];
    }
  }, []);

  // Récupérer un workflow par ID
  const getWorkflowById = useCallback(
    (id: string): ParsedWorkflow | undefined => {
      return workflows.find((w) => w.id === id);
    },
    [workflows]
  );

  return {
    workflows,
    loading,
    error,
    loadWorkflows,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleFavorite,
    duplicateWorkflow,
    incrementUsage,
    searchWorkflows,
    filterByCategory,
    getFavorites,
    getTemplates,
    getCategories,
    getWorkflowById,
  };
}
