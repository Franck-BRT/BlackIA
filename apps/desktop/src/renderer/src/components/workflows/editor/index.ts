/**
 * SimpleWorkflowEditor - Éditeur de workflows custom sans dépendances
 * Architecture extensible pour supporter les custom nodes
 */

export { SimpleWorkflowEditor } from './SimpleWorkflowEditor';
export { WorkflowNodeRegistry } from './types';
export type {
  WorkflowNode,
  WorkflowEdge,
  Position,
  NodeTypeConfig,
  NodeConfigProps,
  SimpleWorkflowEditorProps,
} from './types';

// Charger les nodes par défaut
import './defaultNodes';
