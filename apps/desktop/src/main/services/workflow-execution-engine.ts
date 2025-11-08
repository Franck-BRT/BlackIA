import { ExecutionContext } from './workflow-execution-context';

/**
 * WorkflowExecutionEngine - Moteur d'exécution de workflows
 * Orchestre l'exécution des nœuds et gère le flux de données
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
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface ExecutionResult {
  success: boolean;
  outputs: Record<string, unknown>;
  logs: Array<{
    nodeId: string;
    timestamp: Date;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    data?: Record<string, unknown>;
  }>;
  error?: string;
  duration: number;
}

export class WorkflowExecutionEngine {
  private workflow: Workflow;
  private context: ExecutionContext;
  private onProgress?: (nodeId: string, status: string) => void;

  constructor(workflow: Workflow, onProgress?: (nodeId: string, status: string) => void) {
    this.workflow = workflow;
    this.context = new ExecutionContext();
    this.onProgress = onProgress;
  }

  /**
   * Exécuter le workflow
   */
  async execute(inputs: Record<string, unknown> = {}): Promise<ExecutionResult> {
    try {
      // Initialiser le contexte avec les inputs
      Object.entries(inputs).forEach(([key, value]) => {
        this.context.setVariable(key, value);
      });

      this.context.log('workflow', 'info', 'Starting workflow execution', { inputs });

      // Trouver le premier nœud (type 'input')
      const startNode = this.workflow.nodes.find(n => n.type === 'input');
      if (!startNode) {
        throw new Error('No input node found in workflow');
      }

      // Exécuter depuis le nœud de départ
      await this.executeNode(startNode);

      // Retourner le résultat
      const summary = this.context.getSummary();

      return {
        success: true,
        outputs: this.context.getAllVariables(),
        logs: this.context.getLogs(),
        duration: summary.duration,
      };
    } catch (error) {
      this.context.log('workflow', 'error', `Workflow execution failed: ${String(error)}`);

      return {
        success: false,
        outputs: this.context.getAllVariables(),
        logs: this.context.getLogs(),
        error: String(error),
        duration: this.context.getDuration(),
      };
    }
  }

  /**
   * Exécuter un nœud spécifique
   */
  private async executeNode(node: WorkflowNode): Promise<void> {
    // Éviter les boucles infinies
    if (this.context.hasNodeExecuted(node.id)) {
      this.context.log(node.id, 'warning', 'Node already executed, skipping');
      return;
    }

    this.context.log(node.id, 'info', `Executing node: ${node.type}`);
    this.onProgress?.(node.id, 'executing');

    try {
      // Exécuter la logique du nœud selon son type
      await this.executeNodeLogic(node);

      // Marquer comme exécuté
      this.context.markNodeExecuted(node.id);
      this.context.log(node.id, 'success', 'Node executed successfully');
      this.onProgress?.(node.id, 'completed');

      // Trouver et exécuter les nœuds suivants
      await this.executeNextNodes(node);

    } catch (error) {
      this.context.log(node.id, 'error', `Node execution failed: ${String(error)}`);
      this.onProgress?.(node.id, 'error');
      throw error;
    }
  }

  /**
   * Exécuter la logique d'un nœud selon son type
   */
  private async executeNodeLogic(node: WorkflowNode): Promise<void> {
    switch (node.type) {
      case 'input':
        await this.executeInputNode(node);
        break;
      case 'output':
        await this.executeOutputNode(node);
        break;
      case 'aiPrompt':
        await this.executeAIPromptNode(node);
        break;
      case 'condition':
        await this.executeConditionNode(node);
        break;
      case 'loop':
        await this.executeLoopNode(node);
        break;
      case 'transform':
        await this.executeTransformNode(node);
        break;
      case 'switch':
        await this.executeSwitchNode(node);
        break;
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * Trouver et exécuter les nœuds suivants
   */
  private async executeNextNodes(node: WorkflowNode): Promise<void> {
    const outgoingEdges = this.workflow.edges.filter(e => e.source === node.id);

    for (const edge of outgoingEdges) {
      const nextNode = this.workflow.nodes.find(n => n.id === edge.target);
      if (nextNode) {
        await this.executeNode(nextNode);
      }
    }
  }

  // ============================================================================
  // Node Executors (implémentation de base)
  // ============================================================================

  private async executeInputNode(node: WorkflowNode): Promise<void> {
    // Le nœud input stocke juste la valeur d'entrée
    const inputValue = node.data.inputValue || node.data.label || '';
    this.context.setVariable(`input_${node.id}`, inputValue);
    this.context.setVariable('input', inputValue); // Variable globale 'input'
  }

  private async executeOutputNode(node: WorkflowNode): Promise<void> {
    // Le nœud output récupère la dernière valeur et la stocke comme output final
    const previousValue = this.context.getVariable('lastValue');
    this.context.setVariable(`output_${node.id}`, previousValue);
    this.context.setVariable('output', previousValue); // Variable globale 'output'

    this.context.log(node.id, 'info', 'Output captured', {
      value: previousValue
    });
  }

  private async executeAIPromptNode(node: WorkflowNode): Promise<void> {
    // Interpoler le prompt avec les variables du contexte
    const promptTemplate = node.data.promptTemplate as string || '';
    const interpolatedPrompt = this.context.interpolate(promptTemplate);

    this.context.log(node.id, 'info', 'AI Prompt node', {
      template: promptTemplate,
      interpolated: interpolatedPrompt,
    });

    // TODO: Intégration avec Ollama pour génération IA
    // Pour l'instant, on simule une réponse
    const mockResponse = `AI Response for: ${interpolatedPrompt}`;

    this.context.setVariable(`ai_${node.id}`, mockResponse);
    this.context.setVariable('lastValue', mockResponse);

    // Ajouter un délai pour simuler le traitement
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  private async executeConditionNode(node: WorkflowNode): Promise<void> {
    const condition = node.data.condition as string || '';
    const result = this.context.evaluateCondition(condition);

    this.context.log(node.id, 'info', `Condition evaluated: ${condition} = ${result}`);
    this.context.setVariable(`condition_${node.id}`, result);
    this.context.setVariable('lastValue', result);

    // Le prochain nœud sera déterminé par le handle (yes/no)
  }

  private async executeLoopNode(node: WorkflowNode): Promise<void> {
    const loopType = node.data.loopType as string || 'count';
    const loopCount = (node.data.loopCount as number) || 3;

    this.context.log(node.id, 'info', `Loop node: ${loopType} (${loopCount} iterations)`);

    const results: unknown[] = [];

    for (let i = 0; i < loopCount; i++) {
      this.context.setVariable('loopIndex', i);
      this.context.setVariable('loopCount', loopCount);

      // Pour chaque itération, on exécute les nœuds enfants
      // (simplifié pour l'instant)
      const lastValue = this.context.getVariable('lastValue');
      results.push(lastValue);

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.context.setVariable(`loop_${node.id}`, results);
    this.context.setVariable('lastValue', results);
  }

  private async executeTransformNode(node: WorkflowNode): Promise<void> {
    const transformType = node.data.transformType as string || 'format';
    const lastValue = this.context.getVariable('lastValue');

    this.context.log(node.id, 'info', `Transform: ${transformType}`);

    // Transformation simple selon le type
    let result = lastValue;

    switch (transformType) {
      case 'format':
        result = JSON.stringify(lastValue, null, 2);
        break;
      case 'extract':
        // Extraire les champs si c'est un objet
        result = typeof lastValue === 'object' ? lastValue : { value: lastValue };
        break;
      case 'merge':
        // Fusionner avec d'autres variables
        result = { ...this.context.getAllVariables(), transformed: lastValue };
        break;
      default:
        result = lastValue;
    }

    this.context.setVariable(`transform_${node.id}`, result);
    this.context.setVariable('lastValue', result);
  }

  private async executeSwitchNode(node: WorkflowNode): Promise<void> {
    const switchValue = this.context.getVariable('lastValue');

    this.context.log(node.id, 'info', `Switch on value: ${switchValue}`);
    this.context.setVariable(`switch_${node.id}`, switchValue);

    // Le prochain nœud sera déterminé par le handle correspondant à la valeur
  }
}
