/**
 * Global TypeScript declarations for Electron API
 */

interface Window {
  electronAPI: ElectronAPI;
  api: ElectronAPI; // Alias
}

interface IPCResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ElectronAPI {
  // Library API
  library: {
    create: (input: any) => Promise<IPCResult>;
    getAll: () => Promise<IPCResult>;
    getById: (id: string) => Promise<IPCResult>;
    search: (query: string) => Promise<IPCResult>;
    update: (id: string, input: any) => Promise<IPCResult>;
    delete: (id: string, deleteFiles?: boolean) => Promise<IPCResult>;
    getStats: (libraryId: string) => Promise<IPCResult>;
    updateStats: (libraryId: string) => Promise<IPCResult>;
    getFavorites: () => Promise<IPCResult>;
  };

  // Library Document API
  libraryDocument: {
    add: (params: any) => Promise<IPCResult>;
    getDocuments: (libraryId: string, filters?: any) => Promise<IPCResult>;
    getById: (id: string) => Promise<IPCResult>;
    update: (id: string, updates: any) => Promise<IPCResult>;
    delete: (id: string) => Promise<IPCResult>;
    index: (params: any) => Promise<IPCResult>;
    deleteIndex: (documentId: string) => Promise<IPCResult>;
    getChunks: (documentId: string) => Promise<IPCResult>;
    search: (params: any) => Promise<IPCResult>;
  };

  // Chunk Editor API
  chunkEditor: {
    getDocumentChunks: (documentId: string) => Promise<IPCResult>;
    getChunkById: (chunkId: string, documentId: string) => Promise<IPCResult>;
    editChunk: (params: any) => Promise<IPCResult>;
    splitChunk: (params: any) => Promise<IPCResult>;
    mergeChunks: (params: any) => Promise<IPCResult>;
    deleteChunk: (params: any) => Promise<IPCResult>;
    insertChunk: (params: any) => Promise<IPCResult>;
    getChunksForTextSelection: (params: any) => Promise<IPCResult>;
    getTextPositionForChunk: (chunkId: string, documentId: string) => Promise<IPCResult>;
  };

  // Existing APIs (add more as needed)
  ping: () => Promise<string>;
  getVersion: () => Promise<string>;
  getPlatform: () => Promise<string>;
  getPath: (name: string) => Promise<string>;

  // Other APIs would be declared here...
  personas: any;
  prompts: any;
  workflows: any;
  conversations: any;
  folders: any;
  ollama: any;
  webSearch: any;
  tags: any;
  syncTags: any;
  documentation: any;
  documents: any;
  workflowTemplates: any;
  logs: any;
  file: any;
  attachments: any;
  textRAG: any;
  visionRAG: any;
  hybridRAG: any;
}
