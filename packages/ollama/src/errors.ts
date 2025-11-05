/**
 * Erreurs personnalisées pour le client Ollama
 */

export class OllamaError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'OllamaError';
    Object.setPrototypeOf(this, OllamaError.prototype);
  }
}

export class OllamaConnectionError extends OllamaError {
  constructor(message: string = 'Impossible de se connecter à Ollama') {
    super(message);
    this.name = 'OllamaConnectionError';
    Object.setPrototypeOf(this, OllamaConnectionError.prototype);
  }
}

export class OllamaModelNotFoundError extends OllamaError {
  constructor(modelName: string) {
    super(`Le modèle "${modelName}" n'est pas disponible`);
    this.name = 'OllamaModelNotFoundError';
    Object.setPrototypeOf(this, OllamaModelNotFoundError.prototype);
  }
}

export class OllamaTimeoutError extends OllamaError {
  constructor(message: string = 'La requête Ollama a expiré') {
    super(message);
    this.name = 'OllamaTimeoutError';
    Object.setPrototypeOf(this, OllamaTimeoutError.prototype);
  }
}

export class OllamaStreamError extends OllamaError {
  constructor(message: string = 'Erreur lors du streaming Ollama') {
    super(message);
    this.name = 'OllamaStreamError';
    Object.setPrototypeOf(this, OllamaStreamError.prototype);
  }
}
