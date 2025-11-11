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
   * Supporte le mapping intelligent de noms sémantiques vers les noms techniques
   */
  interpolate(template: string): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      // 1. Try exact match first
      let value = this.getVariable(varName);
      if (value !== undefined) {
        return this.formatValue(value);
      }

      // 2. Try smart aliases based on semantic patterns
      value = this.resolveSemanticVariable(varName);
      if (value !== undefined) {
        return this.formatValue(value);
      }

      // 3. Variable not found - return original placeholder
      return match;
    });
  }

  /**
   * Formater une valeur pour l'affichage dans les prompts
   */
  private formatValue(value: unknown): string {
    // Handle null/undefined
    if (value === null || value === undefined) {
      return String(value);
    }

    // Handle arrays - format as numbered list for better readability
    if (Array.isArray(value)) {
      // If array is empty
      if (value.length === 0) {
        return '[]';
      }

      // If all items are simple strings/numbers, format as numbered list
      const allSimple = value.every(
        item => typeof item === 'string' || typeof item === 'number'
      );

      if (allSimple) {
        return value
          .map((item, index) => `${index + 1}. ${String(item)}`)
          .join('\n\n---\n\n');
      }

      // For complex arrays, use JSON formatting
      return JSON.stringify(value, null, 2);
    }

    // Handle objects - format as JSON
    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    // Handle primitives (string, number, boolean)
    return String(value);
  }

  /**
   * Résoudre une variable sémantique vers une variable technique
   */
  private resolveSemanticVariable(semanticName: string): unknown {
    const lowerName = semanticName.toLowerCase();

    // Common aliases for AI outputs
    const aiOutputAliases = ['analysis', 'result', 'response', 'answer', 'output', 'content'];
    if (aiOutputAliases.includes(lowerName)) {
      return this.getMostRecentAIVariable();
    }

    // Common aliases for loop results
    const loopAliases = ['variations', 'items', 'results', 'list', 'array'];
    if (loopAliases.includes(lowerName)) {
      const loopResults = this.getVariable('loopResults');
      if (loopResults !== undefined) return loopResults;

      // Try to find most recent loop_* variable
      return this.getMostRecentLoopVariable();
    }

    // Common aliases for lastValue
    const lastValueAliases = ['last', 'previous', 'current'];
    if (lastValueAliases.includes(lowerName)) {
      return this.getVariable('lastValue');
    }

    // Try partial match on variable names
    return this.findPartialMatch(semanticName);
  }

  /**
   * Trouver la variable AI la plus récente (ai_*)
   */
  private getMostRecentAIVariable(): unknown {
    const allVars = this.getAllVariables();
    const aiVars = Object.keys(allVars)
      .filter(key => key.startsWith('ai_'))
      .sort((a, b) => {
        // Sort by node ID (assuming higher ID = more recent)
        const idA = parseInt(a.split('_')[1]) || 0;
        const idB = parseInt(b.split('_')[1]) || 0;
        return idB - idA; // Descending order
      });

    if (aiVars.length > 0) {
      return allVars[aiVars[0]];
    }

    return undefined;
  }

  /**
   * Trouver la variable de loop la plus récente (loop_*)
   */
  private getMostRecentLoopVariable(): unknown {
    const allVars = this.getAllVariables();
    const loopVars = Object.keys(allVars)
      .filter(key => key.startsWith('loop_'))
      .sort((a, b) => {
        const idA = parseInt(a.split('_')[1]) || 0;
        const idB = parseInt(b.split('_')[1]) || 0;
        return idB - idA;
      });

    if (loopVars.length > 0) {
      return allVars[loopVars[0]];
    }

    return undefined;
  }

  /**
   * Chercher une correspondance partielle dans les noms de variables
   */
  private findPartialMatch(searchName: string): unknown {
    const lowerSearch = searchName.toLowerCase();
    const allVars = this.getAllVariables();

    // Try to find a variable containing the search term
    for (const [key, value] of Object.entries(allVars)) {
      if (key.toLowerCase().includes(lowerSearch)) {
        return value;
      }
    }

    return undefined;
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
