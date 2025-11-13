/**
 * Backend Manager
 * Gère la sélection, le fallback et l'orchestration des différents backends AI
 */

import { EventEmitter } from 'events';
import { logger } from '../log-service';
import type { AIBackend } from './backend-interface';
import type {
  BackendType,
  BackendSettings,
  BackendEvent,
  BackendStatus,
  ChatRequest,
  ChatResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  VisionRequest,
  VisionResponse,
  BackendCapability,
} from './backend-types';

export class BackendManager extends EventEmitter {
  private backends: Map<BackendType, AIBackend> = new Map();
  private activeBackend: AIBackend | null = null;
  private settings: BackendSettings;
  private initialized = false;

  constructor() {
    super();
    // Paramètres par défaut
    this.settings = this.getDefaultSettings();
  }

  /**
   * Initialiser le Backend Manager
   * 1. Charger les paramètres utilisateur
   * 2. Enregistrer les backends disponibles
   * 3. Sélectionner le backend actif
   */
  async initialize(backends: AIBackend[]): Promise<void> {
    if (this.initialized) {
      logger.warning('backend', 'Backend Manager already initialized', '');
      return;
    }

    logger.info('backend', 'Initializing Backend Manager', '');

    // Enregistrer les backends
    for (const backend of backends) {
      this.backends.set(backend.type, backend);
      logger.debug('backend', `Registered backend: ${backend.type}`, '', {
        type: backend.type,
        capabilities: backend.capabilities,
      });
    }

    // Charger les paramètres
    await this.loadSettings();

    // Sélectionner le backend actif
    await this.selectBackend();

    this.initialized = true;
    logger.info('backend', 'Backend Manager initialized', `Active backend: ${this.activeBackend?.type}`);
  }

  /**
   * Sélectionner le backend actif selon la configuration
   * Avec fallback automatique si le backend préféré n'est pas disponible
   */
  private async selectBackend(): Promise<void> {
    const preferred = this.settings.preferredBackend;

    logger.debug('backend', 'Selecting backend', `Preferred: ${preferred}`);

    // Essayer le backend préféré
    const preferredBackend = this.backends.get(preferred);
    if (preferredBackend && (await this.tryActivateBackend(preferredBackend))) {
      logger.info('backend', 'Using preferred backend', preferred);
      return;
    }

    // Fallback si activé
    if (!this.settings.fallbackEnabled) {
      throw new Error(`Preferred backend ${preferred} not available and fallback is disabled`);
    }

    logger.warning('backend', 'Preferred backend not available, trying fallback', preferred);

    // Ordre de priorité pour le fallback
    const fallbackOrder: BackendType[] = ['mlx', 'ollama-external', 'ollama-embedded'];

    for (const type of fallbackOrder) {
      if (type === preferred) continue; // Déjà essayé

      const backend = this.backends.get(type);
      if (backend && (await this.tryActivateBackend(backend))) {
        this.emitEvent({
          type: 'backend-switched',
          from: preferred,
          to: type,
          reason: 'Preferred backend not available',
        });
        logger.info('backend', 'Using fallback backend', type);
        return;
      }
    }

    throw new Error('No AI backend available. Please configure at least one backend.');
  }

  /**
   * Essayer d'activer un backend
   * @returns true si le backend a été activé avec succès
   */
  private async tryActivateBackend(backend: AIBackend): Promise<boolean> {
    try {
      logger.debug('backend', `Trying to activate backend: ${backend.type}`, '');

      // Vérifier disponibilité
      const available = await backend.isAvailable();
      if (!available) {
        logger.debug('backend', `Backend not available: ${backend.type}`, '');
        return false;
      }

      // Initialiser
      await backend.initialize();

      // Vérifier le statut
      const status = await backend.getStatus();
      if (!status.available || !status.initialized) {
        logger.warning('backend', `Backend initialization failed: ${backend.type}`, '', {
          status,
        });
        return false;
      }

      // Activer
      this.activeBackend = backend;
      this.emitEvent({
        type: 'status-changed',
        backend: backend.type,
        status,
      });

      return true;
    } catch (error) {
      logger.error('backend', `Failed to activate backend: ${backend.type}`, '', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Basculer manuellement vers un backend spécifique
   */
  async switchBackend(type: BackendType): Promise<void> {
    logger.info('backend', 'Manually switching backend', type);

    const backend = this.backends.get(type);
    if (!backend) {
      throw new Error(`Backend ${type} not registered`);
    }

    const oldBackend = this.activeBackend;

    if (await this.tryActivateBackend(backend)) {
      // Arrêter l'ancien backend
      if (oldBackend && oldBackend !== backend) {
        await oldBackend.shutdown().catch((err) => {
          logger.error('backend', 'Error shutting down old backend', '', { error: err });
        });
      }

      this.emitEvent({
        type: 'backend-switched',
        from: oldBackend?.type,
        to: type,
        reason: 'Manual switch',
      });
    } else {
      throw new Error(`Failed to switch to backend ${type}`);
    }
  }

  /**
   * Obtenir le statut de tous les backends
   */
  async getAllBackendStatus(): Promise<Map<BackendType, BackendStatus>> {
    const statuses = new Map<BackendType, BackendStatus>();

    for (const [type, backend] of this.backends) {
      try {
        const status = await backend.getStatus();
        statuses.set(type, status);
      } catch (error) {
        statuses.set(type, {
          type,
          available: false,
          initialized: false,
          capabilities: [],
          models: [],
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    return statuses;
  }

  /**
   * CHAT API
   */
  chat(request: ChatRequest): AsyncIterable<string> {
    this.assertInitialized();
    this.assertCapability('chat');
    return this.activeBackend!.chat(request);
  }

  async chatComplete(request: ChatRequest): Promise<ChatResponse> {
    this.assertInitialized();
    this.assertCapability('chat');
    return this.activeBackend!.chatComplete(request);
  }

  /**
   * EMBEDDINGS API
   */
  async generateEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    this.assertInitialized();
    this.assertCapability('embeddings');
    return this.activeBackend!.generateEmbedding(request);
  }

  /**
   * VISION API
   */
  async processImage(request: VisionRequest): Promise<VisionResponse> {
    this.assertInitialized();
    this.assertCapability('vision');
    return this.activeBackend!.processImage(request);
  }

  /**
   * Getters
   */
  getActiveBackend(): AIBackend | null {
    return this.activeBackend;
  }

  getActiveBackendType(): BackendType | null {
    return this.activeBackend?.type || null;
  }

  getSettings(): BackendSettings {
    return { ...this.settings };
  }

  async updateSettings(settings: Partial<BackendSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.saveSettings();

    // Si le backend préféré a changé, basculer
    if (settings.preferredBackend && settings.preferredBackend !== this.activeBackend?.type) {
      await this.selectBackend();
    }
  }

  /**
   * Fermer proprement tous les backends
   */
  async shutdown(): Promise<void> {
    logger.info('backend', 'Shutting down Backend Manager', '');

    for (const backend of this.backends.values()) {
      try {
        await backend.shutdown();
      } catch (error) {
        logger.error('backend', `Error shutting down backend ${backend.type}`, '', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.activeBackend = null;
    this.initialized = false;
  }

  /**
   * Helpers privés
   */
  private assertInitialized(): void {
    if (!this.initialized || !this.activeBackend) {
      throw new Error('Backend Manager not initialized. Call initialize() first.');
    }
  }

  private assertCapability(capability: BackendCapability): void {
    if (!this.activeBackend?.hasCapability(capability)) {
      throw new Error(
        `Active backend ${this.activeBackend?.type} does not support ${capability} capability`
      );
    }
  }

  private emitEvent(event: BackendEvent): void {
    this.emit('backend-event', event);
    logger.debug('backend', 'Backend event', event.type, { event });
  }

  private getDefaultSettings(): BackendSettings {
    return {
      preferredBackend: 'mlx',
      fallbackEnabled: true,
      mlx: {
        enabled: true,
        chatModel: 'mlx-community/Llama-3.2-3B-Instruct-4bit',
        embedModel: 'sentence-transformers/all-MiniLM-L6-v2',
        visionModel: 'mlx-community/pixtral-12b-4bit',
      },
      ollama: {
        external: {
          enabled: true,
          url: 'http://localhost:11434',
          timeout: 120000,
        },
        embedded: {
          enabled: true,
          port: 11435,
          modelsPath: '',
          autoStart: true,
        },
      },
    };
  }

  private async loadSettings(): Promise<void> {
    // TODO: Charger depuis un fichier de config ou base de données
    // Pour l'instant on garde les valeurs par défaut
    logger.debug('backend', 'Settings loaded', '', { settings: this.settings });
  }

  private async saveSettings(): Promise<void> {
    // TODO: Sauvegarder dans un fichier de config ou base de données
    logger.debug('backend', 'Settings saved', '', { settings: this.settings });
  }
}

// Singleton instance
export const backendManager = new BackendManager();
