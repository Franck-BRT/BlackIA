/**
 * ExecutionContext - Gestion du contexte d'exécution d'un workflow
 * Stocke les variables, l'historique et l'état de l'exécution
 */

export interface ExecutionLog {
  nodeId: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  data?: Record<string, unknown>;
}

export class ExecutionContext {
  private variables: Map<string, unknown> = new Map();
  private logs: ExecutionLog[] = [];
  private startTime: Date;
  private executedNodes: Set<string> = new Set();

  constructor(initialInputs: Record<string, unknown> = {}) {
    this.startTime = new Date();
    // Initialiser avec les inputs fournis
    Object.entries(initialInputs).forEach(([key, value]) => {
      this.variables.set(key, value);
    });
    this.log('execution', 'info', 'Workflow execution started', initialInputs);
  }

  /**
   * Définir une variable
   */
  setVariable(name: string, value: unknown): void {
    this.variables.set(name, value);
  }

  /**
   * Récupérer une variable
   */
  getVariable(name: string): unknown {
    return this.variables.get(name);
  }

  /**
   * Vérifier si une variable existe
   */
  hasVariable(name: string): boolean {
    return this.variables.has(name);
  }

  /**
   * Récupérer toutes les variables
   */
  getAllVariables(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    this.variables.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Ajouter un log
   */
  log(
    nodeId: string,
    type: ExecutionLog['type'],
    message: string,
    data?: Record<string, unknown>
  ): void {
    this.logs.push({
      nodeId,
      timestamp: new Date(),
      type,
      message,
      data,
    });
  }

  /**
   * Récupérer tous les logs
   */
  getLogs(): ExecutionLog[] {
    return [...this.logs];
  }

  /**
   * Marquer un nœud comme exécuté
   */
  markNodeExecuted(nodeId: string): void {
    this.executedNodes.add(nodeId);
  }

  /**
   * Vérifier si un nœud a été exécuté
   */
  hasNodeExecuted(nodeId: string): boolean {
    return this.executedNodes.has(nodeId);
  }

  /**
   * Démarquer un nœud pour permettre sa ré-exécution (utile pour les loops)
   */
  unmarkNodeExecuted(nodeId: string): void {
    this.executedNodes.delete(nodeId);
  }

  /**
   * Récupérer la liste des nœuds exécutés
   */
  getExecutedNodes(): string[] {
    return Array.from(this.executedNodes);
  }

  /**
   * Récupérer la durée d'exécution
   */
  getDuration(): number {
    return Date.now() - this.startTime.getTime();
  }

  /**
   * Interpoler les variables dans une chaîne (remplace {{variable}} par sa valeur)
   */
  interpolate(template: string): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      const value = this.getVariable(varName);
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Évaluer une condition simple
   */
  evaluateCondition(condition: string): boolean {
    try {
      // Interpoler les variables dans la condition
      const interpolated = this.interpolate(condition);

      // Évaluation simple et sécurisée (éviter eval)
      // Supporte: >, <, >=, <=, ==, !=
      const operators = ['>=', '<=', '==', '!=', '>', '<'];

      for (const op of operators) {
        if (interpolated.includes(op)) {
          const [left, right] = interpolated.split(op).map(s => s.trim());
          const leftVal = parseFloat(left);
          const rightVal = parseFloat(right);

          if (isNaN(leftVal) || isNaN(rightVal)) {
            // Comparaison de chaînes
            switch (op) {
              case '==': return left === right;
              case '!=': return left !== right;
              default: return false;
            }
          }

          // Comparaison numérique
          switch (op) {
            case '>': return leftVal > rightVal;
            case '<': return leftVal < rightVal;
            case '>=': return leftVal >= rightVal;
            case '<=': return leftVal <= rightVal;
            case '==': return leftVal === rightVal;
            case '!=': return leftVal !== rightVal;
          }
        }
      }

      // Si pas d'opérateur trouvé, vérifier la valeur boolean
      return interpolated === 'true' || interpolated === '1';
    } catch (error) {
      this.log('condition', 'error', `Error evaluating condition: ${condition}`, {
        error: String(error),
      });
      return false;
    }
  }

  /**
   * Résumé de l'exécution
   */
  getSummary(): {
    duration: number;
    nodesExecuted: number;
    errors: number;
    warnings: number;
  } {
    return {
      duration: this.getDuration(),
      nodesExecuted: this.executedNodes.size,
      errors: this.logs.filter(l => l.type === 'error').length,
      warnings: this.logs.filter(l => l.type === 'warning').length,
    };
  }
}
