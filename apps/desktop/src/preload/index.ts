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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
