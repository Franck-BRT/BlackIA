import type { WorkflowNode, WorkflowEdge, ExecutionState, Breakpoint } from './types';

/**
 * Résultat de l'exécution d'un node
 */
interface NodeExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * Contexte d'exécution partagé entre tous les nodes
 */
interface ExecutionContext {
  variables: Record<string, unknown>;
  nodeOutputs: Map<string, unknown>;
  globalVariables: Record<string, unknown>;
}

/**
 * Moteur d'exécution de workflow
 * Gère l'exécution séquentielle ou step-by-step des workflows
 */
export class WorkflowExecutionEngine {
  private nodes: WorkflowNode[];
  private edges: WorkflowEdge[];
  private executionState: ExecutionState;
  private context: ExecutionContext;
  private onStateChange: (state: ExecutionState) => void;
  private executionQueue: string[];
  private isRunning: boolean;
  private isPaused: boolean;

  constructor(
    nodes: WorkflowNode[],
    edges: WorkflowEdge[],
    initialState: ExecutionState,
    onStateChange: (state: ExecutionState) => void
  ) {
    this.nodes = nodes;
    this.edges = edges;
    this.executionState = initialState;
    this.onStateChange = onStateChange;
    this.executionQueue = [];
    this.isRunning = false;
    this.isPaused = false;

    // Initialize execution context
    this.context = {
      variables: { ...initialState.variables },
      nodeOutputs: new Map(),
      globalVariables: {},
    };
  }

  /**
   * Démarre l'exécution du workflow
   */
  async start(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;
    this.isPaused = false;

    // Build execution order (topological sort)
    this.executionQueue = this.buildExecutionOrder();

    this.updateState({
      status: 'running',
      currentNodeId: null,
      callStack: [],
      logs: [
        ...this.executionState.logs,
        {
          nodeId: 'system',
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Starting workflow execution with ${this.executionQueue.length} nodes`,
        },
      ],
    });

    // Execute workflow
    await this.executeWorkflow();
  }

  /**
   * Arrête l'exécution
   */
  stop(): void {
    this.isRunning = false;
    this.isPaused = false;

    this.updateState({
      status: 'idle',
      currentNodeId: null,
      callStack: [],
      logs: [
        ...this.executionState.logs,
        {
          nodeId: 'system',
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Workflow execution stopped',
        },
      ],
    });
  }

  /**
   * Met en pause l'exécution
   */
  pause(): void {
    this.isPaused = true;
    this.updateState({
      status: 'paused',
    });
  }

  /**
   * Reprend l'exécution
   */
  continue(): void {
    if (!this.isPaused) return;

    this.isPaused = false;
    this.updateState({
      status: 'running',
    });

    // Continue execution
    this.executeWorkflow();
  }

  /**
   * Exécute le prochain node (step mode)
   */
  async stepNext(): Promise<void> {
    if (this.executionQueue.length === 0) {
      this.stop();
      return;
    }

    const nodeId = this.executionQueue.shift()!;
    await this.executeNode(nodeId);

    if (this.executionQueue.length === 0) {
      this.updateState({
        status: 'completed',
        currentNodeId: null,
        logs: [
          ...this.executionState.logs,
          {
            nodeId: 'system',
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'Workflow execution completed',
          },
        ],
      });
      this.isRunning = false;
    } else {
      this.updateState({
        status: 'paused',
        currentNodeId: this.executionQueue[0],
      });
    }
  }

  /**
   * Construit l'ordre d'exécution (tri topologique)
   */
  private buildExecutionOrder(): string[] {
    const order: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    // Find nodes with no incoming edges (start nodes)
    const incomingEdges = new Map<string, number>();
    this.nodes.forEach((node) => incomingEdges.set(node.id, 0));
    this.edges.forEach((edge) => {
      incomingEdges.set(edge.target, (incomingEdges.get(edge.target) || 0) + 1);
    });

    // Start with nodes that have no incoming edges
    const startNodes = this.nodes
      .filter((node) => incomingEdges.get(node.id) === 0)
      .map((node) => node.id);

    // If no start nodes, use first node
    if (startNodes.length === 0 && this.nodes.length > 0) {
      startNodes.push(this.nodes[0].id);
    }

    // DFS to build execution order
    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      if (visiting.has(nodeId)) {
        // Cycle detected - log warning
        console.warn('Cycle detected in workflow graph');
        return;
      }

      visiting.add(nodeId);

      // Visit all targets of this node
      const outgoingEdges = this.edges.filter((e) => e.source === nodeId);
      outgoingEdges.forEach((edge) => visit(edge.target));

      visiting.delete(nodeId);
      visited.add(nodeId);
      order.unshift(nodeId); // Add to front for correct order
    };

    startNodes.forEach((nodeId) => visit(nodeId));

    // Add any unvisited nodes (isolated nodes)
    this.nodes.forEach((node) => {
      if (!visited.has(node.id)) {
        order.push(node.id);
      }
    });

    return order;
  }

  /**
   * Exécute le workflow complet
   */
  private async executeWorkflow(): Promise<void> {
    while (this.executionQueue.length > 0 && this.isRunning && !this.isPaused) {
      const nodeId = this.executionQueue.shift()!;

      // Check for breakpoint
      if (this.hasBreakpoint(nodeId)) {
        this.pause();
        this.updateState({
          currentNodeId: nodeId,
          logs: [
            ...this.executionState.logs,
            {
              nodeId,
              timestamp: new Date().toISOString(),
              level: 'info',
              message: 'Breakpoint hit',
            },
          ],
        });
        return;
      }

      await this.executeNode(nodeId);

      // Small delay for visual feedback
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (this.executionQueue.length === 0 && this.isRunning) {
      this.updateState({
        status: 'completed',
        currentNodeId: null,
        logs: [
          ...this.executionState.logs,
          {
            nodeId: 'system',
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'Workflow execution completed successfully',
          },
        ],
      });
      this.isRunning = false;
    }
  }

  /**
   * Exécute un node individuel
   */
  private async executeNode(nodeId: string): Promise<void> {
    const node = this.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    this.updateState({
      currentNodeId: nodeId,
      callStack: [...this.executionState.callStack, nodeId],
      logs: [
        ...this.executionState.logs,
        {
          nodeId,
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Executing node: ${node.type} - ${node.data.label || nodeId}`,
        },
      ],
    });

    try {
      const result = await this.executeNodeLogic(node);

      if (result.success) {
        this.context.nodeOutputs.set(nodeId, result.data);
        this.updateState({
          variables: { ...this.context.variables, [`output_${nodeId}`]: result.data },
          logs: [
            ...this.executionState.logs,
            {
              nodeId,
              timestamp: new Date().toISOString(),
              level: 'info',
              message: `Node executed successfully`,
              data: result.data,
            },
          ],
        });
      } else {
        throw new Error(result.error || 'Node execution failed');
      }
    } catch (error) {
      this.updateState({
        status: 'error',
        logs: [
          ...this.executionState.logs,
          {
            nodeId,
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
            data: error,
          },
        ],
      });
      this.isRunning = false;
    }
  }

  /**
   * Exécute la logique spécifique d'un type de node
   */
  private async executeNodeLogic(node: WorkflowNode): Promise<NodeExecutionResult> {
    // Get inputs from previous nodes
    const inputs = this.getNodeInputs(node.id);

    switch (node.type) {
      case 'http':
        return this.executeHttpNode(node, inputs);
      case 'transform':
        return this.executeTransformNode(node, inputs);
      case 'condition':
        return this.executeConditionNode(node, inputs);
      case 'llm':
        return this.executeLLMNode(node, inputs);
      case 'database':
        return this.executeDatabaseNode(node, inputs);
      case 'email':
        return this.executeEmailNode(node, inputs);
      case 'trigger':
        return this.executeTriggerNode(node, inputs);
      default:
        return {
          success: true,
          data: { message: `Node type ${node.type} executed (placeholder)`, inputs },
        };
    }
  }

  /**
   * Récupère les entrées d'un node depuis ses prédécesseurs
   */
  private getNodeInputs(nodeId: string): Record<string, unknown> {
    const inputs: Record<string, unknown> = {};
    const incomingEdges = this.edges.filter((e) => e.target === nodeId);

    incomingEdges.forEach((edge) => {
      const sourceOutput = this.context.nodeOutputs.get(edge.source);
      if (sourceOutput !== undefined) {
        inputs[edge.source] = sourceOutput;
      }
    });

    return inputs;
  }

  /**
   * Exécuteurs spécifiques par type de node
   */
  private async executeHttpNode(node: WorkflowNode, inputs: Record<string, unknown>): Promise<NodeExecutionResult> {
    try {
      const url = (node.data.url as string) || 'https://api.example.com';
      const method = (node.data.method as string) || 'GET';

      // Simulate HTTP request
      await new Promise((resolve) => setTimeout(resolve, 300));

      return {
        success: true,
        data: {
          status: 200,
          body: { message: 'HTTP request successful', url, method, inputs },
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'HTTP request failed',
      };
    }
  }

  private async executeTransformNode(node: WorkflowNode, inputs: Record<string, unknown>): Promise<NodeExecutionResult> {
    try {
      const transformCode = node.data.code as string | undefined;

      // Simple transformation
      const transformed = {
        inputs,
        transformed: true,
        timestamp: new Date().toISOString(),
        code: transformCode || 'No transformation code',
      };

      return {
        success: true,
        data: transformed,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Transform failed',
      };
    }
  }

  private async executeConditionNode(node: WorkflowNode, inputs: Record<string, unknown>): Promise<NodeExecutionResult> {
    try {
      const condition = node.data.condition as string | undefined;

      // Simple condition evaluation (placeholder)
      const result = Object.keys(inputs).length > 0;

      return {
        success: true,
        data: {
          condition,
          result,
          inputs,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Condition evaluation failed',
      };
    }
  }

  private async executeLLMNode(node: WorkflowNode, inputs: Record<string, unknown>): Promise<NodeExecutionResult> {
    try {
      const prompt = node.data.prompt as string | undefined;

      // Simulate LLM call
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        success: true,
        data: {
          response: 'LLM response (simulated)',
          prompt,
          inputs,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'LLM call failed',
      };
    }
  }

  private async executeDatabaseNode(node: WorkflowNode, inputs: Record<string, unknown>): Promise<NodeExecutionResult> {
    try {
      const query = node.data.query as string | undefined;

      return {
        success: true,
        data: {
          rows: [],
          query,
          inputs,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Database query failed',
      };
    }
  }

  private async executeEmailNode(node: WorkflowNode, inputs: Record<string, unknown>): Promise<NodeExecutionResult> {
    try {
      const to = node.data.to as string | undefined;
      const subject = node.data.subject as string | undefined;

      return {
        success: true,
        data: {
          sent: true,
          to,
          subject,
          inputs,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email send failed',
      };
    }
  }

  private async executeTriggerNode(node: WorkflowNode, inputs: Record<string, unknown>): Promise<NodeExecutionResult> {
    return {
      success: true,
      data: {
        triggered: true,
        timestamp: new Date().toISOString(),
        inputs,
      },
    };
  }

  /**
   * Vérifie si un node a un breakpoint actif
   */
  private hasBreakpoint(nodeId: string): boolean {
    return this.executionState.breakpoints.some((bp) => bp.nodeId === nodeId && bp.enabled);
  }

  /**
   * Met à jour l'état d'exécution
   */
  private updateState(updates: Partial<ExecutionState>): void {
    this.executionState = {
      ...this.executionState,
      ...updates,
    };
    this.onStateChange(this.executionState);
  }
}
