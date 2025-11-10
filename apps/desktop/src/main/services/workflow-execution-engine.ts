import { ExecutionContext } from './workflow-execution-context';
import { OllamaClient } from '@blackia/ollama';
import type { WebContents } from 'electron';

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
  private eventSender?: WebContents;
  private ollamaClient: OllamaClient;

  constructor(
    workflow: Workflow,
    onProgress?: (nodeId: string, status: string) => void,
    eventSender?: WebContents
  ) {
    this.workflow = workflow;
    this.context = new ExecutionContext();
    this.onProgress = onProgress;
    this.eventSender = eventSender;
    this.ollamaClient = new OllamaClient({
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
      timeout: 120000,
      mode: 'local',
    });
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
      // Retourne true si le nœud gère lui-même la suite (condition, switch, loop)
      const handledFlow = await this.executeNodeLogic(node);

      // Marquer comme exécuté (sauf si géré manuellement par le nœud)
      if (!handledFlow) {
        this.context.markNodeExecuted(node.id);
      }

      this.context.log(node.id, 'success', 'Node executed successfully');
      this.onProgress?.(node.id, 'completed');

      // Trouver et exécuter les nœuds suivants (sauf si géré manuellement)
      if (!handledFlow) {
        await this.executeNextNodes(node);
      }

    } catch (error) {
      this.context.log(node.id, 'error', `Node execution failed: ${String(error)}`);
      this.onProgress?.(node.id, 'error');
      throw error;
    }
  }

  /**
   * Exécuter la logique d'un nœud selon son type
   * @returns true si le nœud gère lui-même le flow (marking + next nodes), false sinon
   */
  private async executeNodeLogic(node: WorkflowNode): Promise<boolean> {
    switch (node.type) {
      case 'input':
        await this.executeInputNode(node);
        return false;
      case 'output':
        await this.executeOutputNode(node);
        return false;
      case 'aiPrompt':
        await this.executeAIPromptNode(node);
        return false;
      case 'condition':
        await this.executeConditionNode(node);
        return true; // Gère le flow manuellement
      case 'loop':
        await this.executeLoopNode(node);
        return true; // Gère le flow manuellement
      case 'transform':
        await this.executeTransformNode(node);
        return false;
      case 'switch':
        await this.executeSwitchNode(node);
        return true; // Gère le flow manuellement
      default:
        throw new Error(`Unknown node type: ${node.type}`);
    }
  }

  /**
   * Trouver et exécuter les nœuds suivants
   * @param node Nœud actuel
   * @param handle Handle source optionnel pour le branchement conditionnel (ex: 'yes', 'no', 'case1')
   */
  private async executeNextNodes(node: WorkflowNode, handle?: string): Promise<void> {
    let outgoingEdges = this.workflow.edges.filter(e => e.source === node.id);

    // Si un handle est spécifié (branchement conditionnel), filtrer par sourceHandle
    if (handle !== undefined) {
      outgoingEdges = outgoingEdges.filter(e => e.sourceHandle === handle);
      this.context.log(node.id, 'info', `Branching to handle: ${handle}`, {
        edgesFound: outgoingEdges.length
      });
    }

    // Exécuter les nœuds suivants en parallèle (peuvent être multiples)
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
    // Le nœud input utilise les valeurs passées lors de l'exécution
    // Si 'input' existe déjà dans le context (passé en paramètre), on l'utilise
    let inputValue = this.context.getVariable('input');

    // Sinon, on utilise la valeur par défaut du node
    if (inputValue === undefined) {
      inputValue = node.data.inputValue || node.data.label || '';
      this.context.setVariable('input', inputValue);
    }

    this.context.setVariable(`input_${node.id}`, inputValue);
    this.context.setVariable('lastValue', inputValue); // Initialiser lastValue

    this.context.log(node.id, 'info', 'Input node executed', {
      inputValue: String(inputValue).substring(0, 100)
    });
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
    const model = (node.data.model as string) || 'llama3.2:latest';
    const temperature = (node.data.temperature as number) ?? 0.7;
    const maxTokens = (node.data.maxTokens as number) || 2000;

    // Log pour debug : afficher les variables disponibles
    const availableVars = this.context.getAllVariables();
    this.context.log(node.id, 'info', 'AI Prompt node starting', {
      template: promptTemplate.substring(0, 200),
      interpolated: interpolatedPrompt.substring(0, 200),
      model,
      temperature,
      availableVariables: Object.keys(availableVars),
      lastValuePreview: String(availableVars.lastValue || 'undefined').substring(0, 100)
    });

    try {
      // Vérifier la disponibilité d'Ollama
      const isAvailable = await this.ollamaClient.isAvailable();

      if (!isAvailable) {
        throw new Error('Ollama is not available. Please ensure Ollama is running.');
      }

      let fullResponse = '';

      // Utiliser le streaming avec Ollama
      await this.ollamaClient.chatStream(
        {
          model,
          messages: [
            {
              role: 'user',
              content: interpolatedPrompt,
            },
          ],
          options: {
            temperature,
            num_predict: maxTokens,
          },
        },
        (chunk) => {
          // Accumuler la réponse
          const content = chunk.message?.content || '';
          fullResponse += content;

          // Envoyer l'event de streaming au renderer si disponible
          if (this.eventSender) {
            this.eventSender.send('workflow:aiStream', {
              nodeId: node.id,
              chunk: content,
              fullText: fullResponse,
              done: chunk.done,
            });
          }

          // Log de progression
          if (chunk.done) {
            this.context.log(node.id, 'success', 'AI generation completed', {
              tokensGenerated: chunk.eval_count,
              duration: chunk.total_duration,
            });
          }
        }
      );

      // Stocker la réponse complète dans le contexte
      this.context.setVariable(`ai_${node.id}`, fullResponse);
      this.context.setVariable('lastValue', fullResponse);

      this.context.log(node.id, 'info', 'AI response stored', {
        responseLength: fullResponse.length,
      });

    } catch (error) {
      this.context.log(node.id, 'error', `AI generation failed: ${String(error)}`);

      // En cas d'erreur, utiliser une réponse de fallback
      const fallbackResponse = `[AI Error: ${String(error)}] - Fallback response for: ${interpolatedPrompt}`;
      this.context.setVariable(`ai_${node.id}`, fallbackResponse);
      this.context.setVariable('lastValue', fallbackResponse);

      // Envoyer l'erreur au renderer
      if (this.eventSender) {
        this.eventSender.send('workflow:aiStream', {
          nodeId: node.id,
          error: String(error),
          done: true,
        });
      }
    }
  }

  private async executeConditionNode(node: WorkflowNode): Promise<void> {
    const condition = node.data.condition as string || '';
    const conditionType = (node.data.conditionType as string) || 'equals';

    // Évaluer la condition
    const result = this.context.evaluateCondition(condition);

    this.context.log(node.id, 'info', `Condition evaluated: ${condition} (${conditionType}) = ${result}`);
    this.context.setVariable(`condition_${node.id}`, result);
    this.context.setVariable('lastValue', result);

    // Déterminer le handle à suivre en fonction du résultat
    const handle = result ? 'yes' : 'no';

    this.context.log(node.id, 'info', `Branching via '${handle}' path`);

    // Marquer comme exécuté maintenant pour éviter les cycles
    this.context.markNodeExecuted(node.id);

    // Exécuter les nœuds suivants avec le handle approprié
    await this.executeNextNodes(node, handle);
  }

  private async executeLoopNode(node: WorkflowNode): Promise<void> {
    const loopType = node.data.loopType as string || 'count';
    const loopCount = (node.data.loopCount as number) || 3;
    const loopCondition = node.data.loopCondition as string || '';

    this.context.log(node.id, 'info', `Loop node: ${loopType} (${loopCount} iterations)`);

    // Marquer le loop comme exécuté
    this.context.markNodeExecuted(node.id);

    // Trouver les nœuds du corps de la boucle
    // 1. D'abord essayer avec sourceHandle='body' (recommandé)
    let bodyEdges = this.workflow.edges.filter(
      e => e.source === node.id && e.sourceHandle === 'body'
    );

    // 2. Si aucun trouvé, utiliser tous les edges sortants comme corps de boucle (fallback)
    // SAUF ceux explicitement marqués comme 'out' ou qui sont des edges de sortie
    if (bodyEdges.length === 0) {
      const allOutgoingEdges = this.workflow.edges.filter(e => e.source === node.id);
      bodyEdges = allOutgoingEdges.filter(e =>
        e.sourceHandle !== 'out' &&
        e.sourceHandle !== 'exit' &&
        e.sourceHandle !== 'done'
      );

      this.context.log(node.id, 'info', `No body edges found, using fallback: all outgoing edges`, {
        totalOutgoingEdges: allOutgoingEdges.length,
        usingAsFallback: bodyEdges.length
      });
    }

    // Debug: afficher tous les edges sortants pour comprendre le problème
    const allOutgoingEdges = this.workflow.edges.filter(e => e.source === node.id);
    this.context.log(node.id, 'info', `Loop edges analysis`, {
      totalOutgoingEdges: allOutgoingEdges.length,
      edgesDetails: allOutgoingEdges.map(e => ({
        target: e.target,
        sourceHandle: e.sourceHandle || 'none',
        targetHandle: e.targetHandle || 'none'
      })),
      bodyEdgesFound: bodyEdges.length
    });

    const bodyNodeIds = bodyEdges.map(e => e.target);
    const results: unknown[] = [];

    this.context.log(node.id, 'info', `Loop body contains ${bodyNodeIds.length} node(s)`);

    // Exécuter les itérations
    for (let i = 0; i < loopCount; i++) {
      // Mettre à jour les variables de boucle
      this.context.setVariable('loopIndex', i);
      this.context.setVariable('loopCount', loopCount);
      this.context.setVariable('loopIteration', i + 1); // 1-based pour l'affichage

      this.context.log(node.id, 'info', `Loop iteration ${i + 1}/${loopCount}`, {
        currentLastValue: String(this.context.getVariable('lastValue') || 'undefined').substring(0, 100)
      });

      // Pour permettre la ré-exécution des nœuds du corps, on doit les "démarquer"
      // On collecte tous les nœuds qui ont été exécutés avant cette itération
      const executedBefore = new Set(this.context.getExecutedNodes());

      // Exécuter chaque nœud du corps de la boucle
      for (const targetId of bodyNodeIds) {
        const targetNode = this.workflow.nodes.find(n => n.id === targetId);
        if (targetNode) {
          // Permettre la ré-exécution en retirant temporairement le flag
          if (i > 0) {
            this.context.unmarkNodeExecuted(targetId);
          }

          // Exécuter le nœud du corps
          await this.executeNode(targetNode);
        }
      }

      // Capturer le résultat de cette itération
      const iterationResult = this.context.getVariable('lastValue');
      results.push(iterationResult);

      this.context.log(node.id, 'info', `Iteration ${i + 1} completed`, {
        resultPreview: String(iterationResult).substring(0, 100)
      });
    }

    // Stocker tous les résultats des itérations
    this.context.setVariable(`loop_${node.id}`, results);
    this.context.setVariable('lastValue', results);
    this.context.setVariable('loopResults', results);

    this.context.log(node.id, 'success', `Loop completed (${loopCount} iterations)`, {
      resultsCount: results.length,
      resultsPreview: results.map(r => String(r).substring(0, 50))
    });

    // Trouver et exécuter les nœuds suivants après le loop
    // Si on a utilisé des handles explicites (body), chercher 'out'
    // Sinon, ne pas exécuter de nœuds de sortie car ils ont été traités dans la boucle
    const exitEdges = this.workflow.edges.filter(
      e => e.source === node.id && (e.sourceHandle === 'out' || e.sourceHandle === 'exit' || e.sourceHandle === 'done')
    );

    this.context.log(node.id, 'info', `Loop exit: ${exitEdges.length} edge(s) found`);

    for (const edge of exitEdges) {
      const nextNode = this.workflow.nodes.find(n => n.id === edge.target);
      if (nextNode) {
        await this.executeNode(nextNode);
      }
    }
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

    // Convertir la valeur en string pour le matching de handle
    const handleValue = String(switchValue);

    this.context.log(node.id, 'info', `Switch on value: ${handleValue}`);
    this.context.setVariable(`switch_${node.id}`, switchValue);
    this.context.setVariable('lastValue', switchValue);

    // Marquer comme exécuté maintenant pour éviter les cycles
    this.context.markNodeExecuted(node.id);

    // Essayer de trouver un edge correspondant à la valeur exacte
    let outgoingEdges = this.workflow.edges.filter(
      e => e.source === node.id && e.sourceHandle === handleValue
    );

    // Si aucun edge trouvé, chercher un edge 'default'
    if (outgoingEdges.length === 0) {
      outgoingEdges = this.workflow.edges.filter(
        e => e.source === node.id && e.sourceHandle === 'default'
      );
      this.context.log(node.id, 'info', `No matching case for '${handleValue}', using default path`);
    } else {
      this.context.log(node.id, 'info', `Branching to case '${handleValue}'`);
    }

    // Exécuter les nœuds suivants
    for (const edge of outgoingEdges) {
      const nextNode = this.workflow.nodes.find(n => n.id === edge.target);
      if (nextNode) {
        await this.executeNode(nextNode);
      }
    }
  }
}
