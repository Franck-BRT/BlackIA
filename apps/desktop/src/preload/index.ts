import { contextBridge, ipcRenderer } from 'electron';
import type {
  OllamaConfig,
  OllamaModel,
  OllamaChatRequest,
  OllamaChatResponse,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  OllamaEmbeddingRequest,
  OllamaEmbeddingResponse,
  OllamaModelInfo,
  OllamaVersion,
} from '@blackia/ollama';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Basic IPC
  ping: () => ipcRenderer.invoke('ping'),

  // App info
  getVersion: () => ipcRenderer.invoke('app:getVersion'),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
  getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),

  // File system API
  file: {
    saveDialog: (options: {
      title?: string;
      defaultPath?: string;
      filters?: { name: string; extensions: string[] }[];
    }) => ipcRenderer.invoke('file:saveDialog', options),
    openDialog: (options: {
      title?: string;
      filters?: { name: string; extensions: string[] }[];
      properties?: ('openFile' | 'multiSelections')[];
    }) => ipcRenderer.invoke('file:openDialog', options),
    writeFile: (filePath: string, content: string) =>
      ipcRenderer.invoke('file:writeFile', filePath, content),
    readFile: (filePath: string) => ipcRenderer.invoke('file:readFile', filePath),
    exportPDF: (options: { title: string; content: string }) =>
      ipcRenderer.invoke('file:exportPDF', options),
  },

  // Personas API
  personas: {
    getAll: () => ipcRenderer.invoke('personas:getAll'),
    getById: (id: string) => ipcRenderer.invoke('personas:getById', id),
    create: (data: any) => ipcRenderer.invoke('personas:create', data),
    update: (id: string, data: any) => ipcRenderer.invoke('personas:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('personas:delete', id),
    search: (query: string) => ipcRenderer.invoke('personas:search', query),
    filterByCategory: (category: string) => ipcRenderer.invoke('personas:filterByCategory', category),
    getFavorites: () => ipcRenderer.invoke('personas:getFavorites'),
    toggleFavorite: (id: string) => ipcRenderer.invoke('personas:toggleFavorite', id),
    incrementUsage: (id: string) => ipcRenderer.invoke('personas:incrementUsage', id),
    duplicate: (id: string) => ipcRenderer.invoke('personas:duplicate', id),
    getCategories: () => ipcRenderer.invoke('personas:getCategories'),
  },

  // Prompts API
  prompts: {
    getAll: () => ipcRenderer.invoke('prompts:getAll'),
    getById: (id: string) => ipcRenderer.invoke('prompts:getById', id),
    create: (data: any) => ipcRenderer.invoke('prompts:create', data),
    update: (id: string, data: any) => ipcRenderer.invoke('prompts:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('prompts:delete', id),
    search: (query: string) => ipcRenderer.invoke('prompts:search', query),
    filterByCategory: (category: string) => ipcRenderer.invoke('prompts:filterByCategory', category),
    getFavorites: () => ipcRenderer.invoke('prompts:getFavorites'),
    toggleFavorite: (id: string) => ipcRenderer.invoke('prompts:toggleFavorite', id),
    incrementUsage: (id: string) => ipcRenderer.invoke('prompts:incrementUsage', id),
    duplicate: (id: string) => ipcRenderer.invoke('prompts:duplicate', id),
    getCategories: () => ipcRenderer.invoke('prompts:getCategories'),
  },

  // Workflows API
  workflows: {
    getAll: () => ipcRenderer.invoke('workflows:getAll'),
    getById: (id: string) => ipcRenderer.invoke('workflows:getById', id),
    create: (data: any) => ipcRenderer.invoke('workflows:create', data),
    update: (id: string, data: any) => ipcRenderer.invoke('workflows:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('workflows:delete', id),
    search: (query: string) => ipcRenderer.invoke('workflows:search', query),
    filterByCategory: (category: string) => ipcRenderer.invoke('workflows:filterByCategory', category),
    getFavorites: () => ipcRenderer.invoke('workflows:getFavorites'),
    getTemplates: () => ipcRenderer.invoke('workflows:getTemplates'),
    toggleFavorite: (id: string) => ipcRenderer.invoke('workflows:toggleFavorite', id),
    incrementUsage: (id: string) => ipcRenderer.invoke('workflows:incrementUsage', id),
    duplicate: (id: string) => ipcRenderer.invoke('workflows:duplicate', id),
    getCategories: () => ipcRenderer.invoke('workflows:getCategories'),
    execute: (id: string, inputs: Record<string, any>) => ipcRenderer.invoke('workflows:execute', id, inputs),
    onProgress: (callback: (data: { nodeId: string; status: string }) => void) => {
      ipcRenderer.on('workflow:progress', (_event, data) => callback(data));
    },
    removeProgressListener: () => {
      ipcRenderer.removeAllListeners('workflow:progress');
    },
    onAIStream: (callback: (data: { nodeId: string; chunk?: string; fullText?: string; done: boolean; error?: string }) => void) => {
      ipcRenderer.on('workflow:aiStream', (_event, data) => callback(data));
    },
    removeAIStreamListener: () => {
      ipcRenderer.removeAllListeners('workflow:aiStream');
    },
    // Advanced updates
    updateGroups: (id: string, groups: string) => ipcRenderer.invoke('workflows:updateGroups', id, groups),
    updateAnnotations: (id: string, annotations: string) => ipcRenderer.invoke('workflows:updateAnnotations', id, annotations),
    updateFull: (id: string, data: any) => ipcRenderer.invoke('workflows:updateFull', id, data),
  },

  // Workflow Templates API
  workflowTemplates: {
    getAll: () => ipcRenderer.invoke('workflow-templates:getAll'),
    getById: (id: string) => ipcRenderer.invoke('workflow-templates:getById', id),
    getByCategory: (category: string) => ipcRenderer.invoke('workflow-templates:getByCategory', category),
    create: (data: any) => ipcRenderer.invoke('workflow-templates:create', data),
    update: (id: string, data: any) => ipcRenderer.invoke('workflow-templates:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('workflow-templates:delete', id),
    incrementUsage: (id: string) => ipcRenderer.invoke('workflow-templates:incrementUsage', id),
    search: (query: string) => ipcRenderer.invoke('workflow-templates:search', query),
    getCategories: () => ipcRenderer.invoke('workflow-templates:getCategories'),
  },

  // Workflow Versions API
  workflowVersions: {
    commit: (data: any) => ipcRenderer.invoke('workflow-versions:commit', data),
    getByWorkflowId: (workflowId: string) => ipcRenderer.invoke('workflow-versions:getByWorkflowId', workflowId),
    getById: (id: string) => ipcRenderer.invoke('workflow-versions:getById', id),
    getLatest: (workflowId: string) => ipcRenderer.invoke('workflow-versions:getLatest', workflowId),
    restore: (versionId: string) => ipcRenderer.invoke('workflow-versions:restore', versionId),
    getHistory: (workflowId: string) => ipcRenderer.invoke('workflow-versions:getHistory', workflowId),
    delete: (id: string) => ipcRenderer.invoke('workflow-versions:delete', id),
    deleteByWorkflowId: (workflowId: string) => ipcRenderer.invoke('workflow-versions:deleteByWorkflowId', workflowId),
  },

  // Workflow Variables API
  workflowVariables: {
    create: (data: any) => ipcRenderer.invoke('workflow-variables:create', data),
    getAll: () => ipcRenderer.invoke('workflow-variables:getAll'),
    getById: (id: string) => ipcRenderer.invoke('workflow-variables:getById', id),
    getByScope: (scope: string) => ipcRenderer.invoke('workflow-variables:getByScope', scope),
    getByWorkflowId: (workflowId: string) => ipcRenderer.invoke('workflow-variables:getByWorkflowId', workflowId),
    getGlobalAndEnvironment: () => ipcRenderer.invoke('workflow-variables:getGlobalAndEnvironment'),
    update: (id: string, data: any) => ipcRenderer.invoke('workflow-variables:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('workflow-variables:delete', id),
    deleteByWorkflowId: (workflowId: string) => ipcRenderer.invoke('workflow-variables:deleteByWorkflowId', workflowId),
    search: (query: string) => ipcRenderer.invoke('workflow-variables:search', query),
    getByNameAndScope: (name: string, scope: string, workflowId?: string) =>
      ipcRenderer.invoke('workflow-variables:getByNameAndScope', name, scope, workflowId),
  },

  // Tags API
  tags: {
    getSynced: () => ipcRenderer.invoke('tags:getSynced'),
  },

  // Persona Suggestions API
  personaSuggestions: {
    getAll: () => ipcRenderer.invoke('persona-suggestions:get-all'),
    getActive: () => ipcRenderer.invoke('persona-suggestions:get-active'),
    create: (data: any) => ipcRenderer.invoke('persona-suggestions:create', data),
    update: (id: string, data: any) => ipcRenderer.invoke('persona-suggestions:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('persona-suggestions:delete', id),
    toggleActive: (id: string) => ipcRenderer.invoke('persona-suggestions:toggle-active', id),
    search: (query: string) => ipcRenderer.invoke('persona-suggestions:search', query),
    initializeDefaults: () => ipcRenderer.invoke('persona-suggestions:initialize-defaults'),
    resetToDefaults: () => ipcRenderer.invoke('persona-suggestions:reset-to-defaults'),
    getStats: () => ipcRenderer.invoke('persona-suggestions:get-stats'),
  },

  // Ollama API
  ollama: {
    // Vérification et configuration
    isAvailable: () => ipcRenderer.invoke('ollama:isAvailable'),
    getVersion: () => ipcRenderer.invoke('ollama:getVersion'),
    getConfig: () => ipcRenderer.invoke('ollama:getConfig'),
    setConfig: (config: Partial<OllamaConfig>) =>
      ipcRenderer.invoke('ollama:setConfig', config),

    // Gestion des modèles
    listModels: () => ipcRenderer.invoke('ollama:listModels'),
    getModelInfo: (modelName: string) =>
      ipcRenderer.invoke('ollama:getModelInfo', modelName),
    pullModel: (modelName: string) =>
      ipcRenderer.invoke('ollama:pullModel', modelName),
    deleteModel: (modelName: string) =>
      ipcRenderer.invoke('ollama:deleteModel', modelName),

    // Chat
    chat: (request: OllamaChatRequest) =>
      ipcRenderer.invoke('ollama:chat', request),
    chatStream: (request: OllamaChatRequest) =>
      ipcRenderer.invoke('ollama:chatStream', request),
    stopStream: (streamId: string) =>
      ipcRenderer.invoke('ollama:stopStream', streamId),

    // Generate
    generate: (request: OllamaGenerateRequest) =>
      ipcRenderer.invoke('ollama:generate', request),
    generateStream: (request: OllamaGenerateRequest) =>
      ipcRenderer.invoke('ollama:generateStream', request),

    // Embeddings
    embeddings: (request: OllamaEmbeddingRequest) =>
      ipcRenderer.invoke('ollama:embeddings', request),

    // Événements de streaming
    onStreamStart: (callback: (data: { streamId: string }) => void) => {
      ipcRenderer.on('ollama:streamStart', (_event, data) => callback(data));
    },
    onStreamChunk: (callback: (data: { streamId: string; chunk: any }) => void) => {
      ipcRenderer.on('ollama:streamChunk', (_event, data) => callback(data));
    },
    onStreamEnd: (callback: (data: { streamId: string }) => void) => {
      ipcRenderer.on('ollama:streamEnd', (_event, data) => callback(data));
    },
    onStreamError: (callback: (data: { error: string }) => void) => {
      ipcRenderer.on('ollama:streamError', (_event, data) => callback(data));
    },
    onPullProgress: (callback: (data: any) => void) => {
      ipcRenderer.on('ollama:pullProgress', (_event, data) => callback(data));
    },

    // Nettoyage des listeners
    removeAllListeners: (channel: string) => {
      ipcRenderer.removeAllListeners(channel);
    },
  },

  // Web Search API
  webSearch: {
    search: (
      query: string,
      provider: any,
      options?: {
        maxResults?: number;
        language?: string;
        region?: string;
        safeSearch?: boolean;
        timeout?: number;
      }
    ) => ipcRenderer.invoke('webSearch:search', query, provider, options),
    fetchUrl: (url: string, timeout?: number) =>
      ipcRenderer.invoke('webSearch:fetchUrl', url, timeout),
    clearCache: () => ipcRenderer.invoke('webSearch:clearCache'),
    setCache: (enabled: boolean, duration?: number) =>
      ipcRenderer.invoke('webSearch:setCache', enabled, duration),
  },

  // Documentation API
  documentation: {
    create: (data: any) => ipcRenderer.invoke('documentation:create', data),
    getById: (id: string) => ipcRenderer.invoke('documentation:getById', id),
    getBySlug: (slug: string) => ipcRenderer.invoke('documentation:getBySlug', slug),
    getAll: () => ipcRenderer.invoke('documentation:getAll'),
    getByCategory: (category: string) => ipcRenderer.invoke('documentation:getByCategory', category),
    getByParent: (parentSlug: string | null) => ipcRenderer.invoke('documentation:getByParent', parentSlug),
    update: (id: string, data: any) => ipcRenderer.invoke('documentation:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('documentation:delete', id),
    search: (query: string, limit?: number) => ipcRenderer.invoke('documentation:search', query, limit),
    getTree: () => ipcRenderer.invoke('documentation:getTree'),
    getBreadcrumbs: (slug: string) => ipcRenderer.invoke('documentation:getBreadcrumbs', slug),
    getStats: () => ipcRenderer.invoke('documentation:getStats'),
  },

  // Documents API (general documents)
  documents: {
    create: (data: any) => ipcRenderer.invoke('documents:create', data),
    getById: (id: string) => ipcRenderer.invoke('documents:getById', id),
    getAll: () => ipcRenderer.invoke('documents:getAll'),
    update: (id: string, data: any) => ipcRenderer.invoke('documents:update', id, data),
    delete: (id: string) => ipcRenderer.invoke('documents:delete', id),
    toggleFavorite: (id: string) => ipcRenderer.invoke('documents:toggleFavorite', id),
    search: (query: string) => ipcRenderer.invoke('documents:search', query),
    getFavorites: () => ipcRenderer.invoke('documents:getFavorites'),
  },
});

// Type definitions for the exposed API
export interface ElectronAPI {
  ping: () => Promise<string>;
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  getPath: (name: string) => Promise<string>;

  file: {
    saveDialog: (options: {
      title?: string;
      defaultPath?: string;
      filters?: { name: string; extensions: string[] }[];
    }) => Promise<{ canceled: boolean; filePath?: string }>;
    openDialog: (options: {
      title?: string;
      filters?: { name: string; extensions: string[] }[];
      properties?: ('openFile' | 'multiSelections')[];
    }) => Promise<{ canceled: boolean; filePaths: string[] }>;
    writeFile: (filePath: string, content: string) => Promise<{ success: boolean; error?: string }>;
    readFile: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
    exportPDF: (options: {
      title: string;
      content: string;
    }) => Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }>;
  };

  personas: {
    getAll: () => Promise<any>;
    getById: (id: string) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
    search: (query: string) => Promise<any>;
    filterByCategory: (category: string) => Promise<any>;
    getFavorites: () => Promise<any>;
    toggleFavorite: (id: string) => Promise<any>;
    incrementUsage: (id: string) => Promise<any>;
    duplicate: (id: string) => Promise<any>;
    getCategories: () => Promise<any>;
  };

  prompts: {
    getAll: () => Promise<any>;
    getById: (id: string) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
    search: (query: string) => Promise<any>;
    filterByCategory: (category: string) => Promise<any>;
    getFavorites: () => Promise<any>;
    toggleFavorite: (id: string) => Promise<any>;
    incrementUsage: (id: string) => Promise<any>;
    duplicate: (id: string) => Promise<any>;
    getCategories: () => Promise<any>;
  };

  workflows: {
    getAll: () => Promise<any>;
    getById: (id: string) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
    search: (query: string) => Promise<any>;
    filterByCategory: (category: string) => Promise<any>;
    getFavorites: () => Promise<any>;
    getTemplates: () => Promise<any>;
    toggleFavorite: (id: string) => Promise<any>;
    incrementUsage: (id: string) => Promise<any>;
    duplicate: (id: string) => Promise<any>;
    getCategories: () => Promise<any>;
    execute: (id: string, inputs: Record<string, any>) => Promise<any>;
    onProgress: (callback: (data: { nodeId: string; status: string }) => void) => void;
    removeProgressListener: () => void;
    updateGroups: (id: string, groups: string) => Promise<any>;
    updateAnnotations: (id: string, annotations: string) => Promise<any>;
    updateFull: (id: string, data: any) => Promise<any>;
  };

  workflowTemplates: {
    getAll: () => Promise<any>;
    getById: (id: string) => Promise<any>;
    getByCategory: (category: string) => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
    incrementUsage: (id: string) => Promise<any>;
    search: (query: string) => Promise<any>;
    getCategories: () => Promise<any>;
  };

  workflowVersions: {
    commit: (data: any) => Promise<any>;
    getByWorkflowId: (workflowId: string) => Promise<any>;
    getById: (id: string) => Promise<any>;
    getLatest: (workflowId: string) => Promise<any>;
    restore: (versionId: string) => Promise<any>;
    getHistory: (workflowId: string) => Promise<any>;
    delete: (id: string) => Promise<any>;
    deleteByWorkflowId: (workflowId: string) => Promise<any>;
  };

  workflowVariables: {
    create: (data: any) => Promise<any>;
    getAll: () => Promise<any>;
    getById: (id: string) => Promise<any>;
    getByScope: (scope: string) => Promise<any>;
    getByWorkflowId: (workflowId: string) => Promise<any>;
    getGlobalAndEnvironment: () => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
    deleteByWorkflowId: (workflowId: string) => Promise<any>;
    search: (query: string) => Promise<any>;
    getByNameAndScope: (name: string, scope: string, workflowId?: string) => Promise<any>;
  };

  tags: {
    getSynced: () => Promise<{ success: boolean; data?: any[]; error?: string }>;
  };

  personaSuggestions: {
    getAll: () => Promise<any>;
    getActive: () => Promise<any>;
    create: (data: any) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
    toggleActive: (id: string) => Promise<any>;
    search: (query: string) => Promise<any>;
    initializeDefaults: () => Promise<any>;
    resetToDefaults: () => Promise<any>;
    getStats: () => Promise<any>;
  };

  ollama: {
    // Vérification et configuration
    isAvailable: () => Promise<boolean>;
    getVersion: () => Promise<OllamaVersion>;
    getConfig: () => Promise<OllamaConfig>;
    setConfig: (config: Partial<OllamaConfig>) => Promise<{ success: boolean }>;

    // Gestion des modèles
    listModels: () => Promise<OllamaModel[]>;
    getModelInfo: (modelName: string) => Promise<OllamaModelInfo>;
    pullModel: (modelName: string) => Promise<{ success: boolean }>;
    deleteModel: (modelName: string) => Promise<{ success: boolean }>;

    // Chat
    chat: (request: OllamaChatRequest) => Promise<OllamaChatResponse>;
    chatStream: (request: OllamaChatRequest) => Promise<{ success: boolean; streamId: string }>;
    stopStream: (streamId: string) => Promise<{ success: boolean; stopped?: boolean; reason?: string }>;

    // Generate
    generate: (request: OllamaGenerateRequest) => Promise<OllamaGenerateResponse>;
    generateStream: (request: OllamaGenerateRequest) => Promise<{ success: boolean; streamId: string }>;

    // Embeddings
    embeddings: (request: OllamaEmbeddingRequest) => Promise<OllamaEmbeddingResponse>;

    // Événements de streaming
    onStreamStart: (callback: (data: { streamId: string }) => void) => void;
    onStreamChunk: (callback: (data: { streamId: string; chunk: any }) => void) => void;
    onStreamEnd: (callback: (data: { streamId: string }) => void) => void;
    onStreamError: (callback: (data: { error: string }) => void) => void;
    onPullProgress: (callback: (data: any) => void) => void;

    // Nettoyage des listeners
    removeAllListeners: (channel: string) => void;
  };

  webSearch: {
    search: (
      query: string,
      provider: any,
      options?: {
        maxResults?: number;
        language?: string;
        region?: string;
        safeSearch?: boolean;
        timeout?: number;
      }
    ) => Promise<{ success: boolean; data?: any; error?: string }>;
    fetchUrl: (url: string, timeout?: number) => Promise<{ success: boolean; data?: string; error?: string }>;
    clearCache: () => Promise<{ success: boolean }>;
    setCache: (enabled: boolean, duration?: number) => Promise<{ success: boolean }>;
  };

  documentation: {
    create: (data: any) => Promise<any>;
    getById: (id: string) => Promise<any>;
    getBySlug: (slug: string) => Promise<any>;
    getAll: () => Promise<any>;
    getByCategory: (category: string) => Promise<any>;
    getByParent: (parentSlug: string | null) => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
    search: (query: string, limit?: number) => Promise<any>;
    getTree: () => Promise<any>;
    getBreadcrumbs: (slug: string) => Promise<any>;
    getStats: () => Promise<any>;
  };

  documents: {
    create: (data: any) => Promise<any>;
    getById: (id: string) => Promise<any>;
    getAll: () => Promise<any>;
    update: (id: string, data: any) => Promise<any>;
    delete: (id: string) => Promise<any>;
    toggleFavorite: (id: string) => Promise<any>;
    search: (query: string) => Promise<any>;
    getFavorites: () => Promise<any>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
