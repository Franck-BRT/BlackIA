/**
 * Types pour le SimpleWorkflowEditor
 * Architecture extensible pour supporter les custom nodes
 */

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

/**
 * Structure d'un nœud dans le workflow
 * Compatible avec ReactFlow pour faciliter la migration
 */
export interface WorkflowNode {
  id: string;
  type: string;
  position: Position;
  data: Record<string, unknown>;
}

/**
 * Structure d'une connexion entre nœuds
 */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
  animated?: boolean;
}

/**
 * Configuration d'un type de nœud
 * Les utilisateurs pourront enregistrer leurs propres types
 */
export interface NodeTypeConfig {
  type: string;
  label: string;
  icon: string;
  description: string;
  color: string;
  category: 'input' | 'output' | 'ai' | 'logic' | 'transform' | 'custom';

  // Définition des données par défaut
  defaultData: Record<string, unknown>;

  // Fonction pour valider les données du nœud
  validate?: (data: Record<string, unknown>) => boolean;

  // Composant de configuration (optionnel, pour les custom nodes)
  ConfigComponent?: React.ComponentType<NodeConfigProps>;
}

/**
 * Props pour les composants de configuration de nœuds
 */
export interface NodeConfigProps {
  node: WorkflowNode;
  onUpdate: (data: Record<string, unknown>) => void;
  onClose: () => void;
}

/**
 * Registry pour gérer les types de nœuds
 */
export class WorkflowNodeRegistry {
  private static nodeTypes = new Map<string, NodeTypeConfig>();

  /**
   * Enregistrer un nouveau type de nœud
   */
  static register(config: NodeTypeConfig): void {
    this.nodeTypes.set(config.type, config);
  }

  /**
   * Récupérer un type de nœud
   */
  static get(type: string): NodeTypeConfig | undefined {
    return this.nodeTypes.get(type);
  }

  /**
   * Récupérer tous les types de nœuds
   */
  static getAll(): NodeTypeConfig[] {
    return Array.from(this.nodeTypes.values());
  }

  /**
   * Récupérer les types par catégorie
   */
  static getByCategory(category: NodeTypeConfig['category']): NodeTypeConfig[] {
    return this.getAll().filter((config) => config.category === category);
  }

  /**
   * Supprimer un type de nœud
   */
  static unregister(type: string): void {
    this.nodeTypes.delete(type);
  }

  /**
   * Vider le registry
   */
  static clear(): void {
    this.nodeTypes.clear();
  }
}

/**
 * État du canvas
 */
export interface CanvasState {
  zoom: number;
  pan: Position;
  selecting: boolean;
  connecting: boolean;
  dragging: boolean;
}

/**
 * Props pour le SimpleWorkflowEditor
 */
export interface SimpleWorkflowEditorProps {
  workflow?: {
    id: string;
    name: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  };
  onSave: (data: {
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    category?: string;
    tags?: string[];
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  }) => Promise<void>;
  onCancel?: () => void;
  onExecute?: () => void;
}
