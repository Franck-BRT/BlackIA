/**
 * WorkflowEditor - Éditeur de workflows
 * Utilise SimpleWorkflowEditor (custom, sans dépendances externes)
 */

import type { ParsedWorkflow } from '../../hooks/useWorkflows';
import { SimpleWorkflowEditor } from './editor';
import type { WorkflowNode as EditorNode, WorkflowEdge as EditorEdge } from './editor';

interface WorkflowEditorProps {
  workflow?: ParsedWorkflow;
  onSave: (workflowData: {
    name?: string;
    description?: string;
    icon?: string;
    color?: string;
    category?: string;
    tags?: string[];
    nodes: EditorNode[];
    edges: EditorEdge[];
  }) => Promise<void>;
  onCancel?: () => void;
  onExecute?: () => void;
}

export function WorkflowEditor({ workflow, onSave, onCancel, onExecute }: WorkflowEditorProps) {
  return (
    <SimpleWorkflowEditor
      workflow={workflow}
      onSave={onSave}
      onCancel={onCancel}
      onExecute={onExecute}
    />
  );
}
