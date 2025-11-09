import { WorkflowNodeRegistry, type NodeTypeConfig } from './types';

/**
 * Configuration des types de nœuds par défaut
 */

// Nœud d'entrée
WorkflowNodeRegistry.register({
  type: 'input',
  label: 'Entrée',
  icon: '📥',
  description: 'Point de départ du workflow',
  color: '#3b82f6',
  category: 'input',
  defaultData: {
    label: 'Entrée',
    inputValue: '',
  },
});

// Nœud de sortie
WorkflowNodeRegistry.register({
  type: 'output',
  label: 'Sortie',
  icon: '📤',
  description: 'Point de fin du workflow',
  color: '#10b981',
  category: 'output',
  defaultData: {
    label: 'Sortie',
  },
});

// Nœud IA Prompt
WorkflowNodeRegistry.register({
  type: 'aiPrompt',
  label: 'IA Prompt',
  icon: '🤖',
  description: 'Génération de texte avec IA',
  color: '#8b5cf6',
  category: 'ai',
  defaultData: {
    label: 'IA Prompt',
    promptTemplate: '',
    model: 'llama3.2:latest',
    temperature: 0.7,
    maxTokens: 2000,
  },
  validate: (data) => {
    return typeof data.promptTemplate === 'string' && data.promptTemplate.length > 0;
  },
});

// Nœud Condition
WorkflowNodeRegistry.register({
  type: 'condition',
  label: 'Condition',
  icon: '❓',
  description: 'Branchement conditionnel (if/else)',
  color: '#f59e0b',
  category: 'logic',
  defaultData: {
    label: 'Condition',
    condition: '',
  },
});

// Nœud Loop
WorkflowNodeRegistry.register({
  type: 'loop',
  label: 'Boucle',
  icon: '🔁',
  description: 'Répétition (loop/forEach)',
  color: '#ec4899',
  category: 'logic',
  defaultData: {
    label: 'Boucle',
    loopType: 'count',
    loopCount: 3,
  },
});

// Nœud Transform
WorkflowNodeRegistry.register({
  type: 'transform',
  label: 'Transform',
  icon: '⚙️',
  description: 'Transformation de données',
  color: '#06b6d4',
  category: 'transform',
  defaultData: {
    label: 'Transform',
    transformType: 'format',
  },
});

// Nœud Switch
WorkflowNodeRegistry.register({
  type: 'switch',
  label: 'Switch',
  icon: '🔀',
  description: 'Branchement multiple',
  color: '#6366f1',
  category: 'logic',
  defaultData: {
    label: 'Switch',
  },
});

/**
 * Créer un nouveau nœud à partir d'un type
 */
export function createNode(
  type: string,
  position: { x: number; y: number }
): {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
} | null {
  const config = WorkflowNodeRegistry.get(type);
  if (!config) {
    console.error(`Node type "${type}" not found in registry`);
    return null;
  }

  return {
    id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    position,
    data: { ...config.defaultData },
  };
}

/**
 * Obtenir la couleur d'un nœud
 */
export function getNodeColor(type: string): string {
  const config = WorkflowNodeRegistry.get(type);
  return config?.color || '#6b7280';
}

/**
 * Obtenir l'icône d'un nœud
 */
export function getNodeIcon(type: string): string {
  const config = WorkflowNodeRegistry.get(type);
  return config?.icon || '⚪';
}

/**
 * Obtenir le label d'un nœud
 */
export function getNodeLabel(type: string): string {
  const config = WorkflowNodeRegistry.get(type);
  return config?.label || type;
}
