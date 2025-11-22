/**
 * MCP Protocol Types
 * Model Context Protocol - Types et interfaces pour le serveur MCP local
 */

// ============================================================================
// TOOL DEFINITIONS
// ============================================================================

/**
 * Type de paramètre d'un outil
 */
export type MCPParameterType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'file';

/**
 * Définition d'un paramètre d'outil
 */
export interface MCPToolParameter {
  name: string;
  type: MCPParameterType;
  description: string;
  required: boolean;
  default?: unknown;
  enum?: string[];           // Valeurs possibles
  minLength?: number;        // Pour strings
  maxLength?: number;
  min?: number;              // Pour numbers
  max?: number;
  pattern?: string;          // Regex pour validation
  items?: MCPToolParameter;  // Pour arrays
  properties?: Record<string, MCPToolParameter>; // Pour objects
}

/**
 * Catégorie d'outil MCP
 */
export type MCPToolCategory =
  | 'files'
  | 'apps'
  | 'clipboard'
  | 'notifications'
  | 'terminal'
  | 'system'
  | 'capture'
  | 'controls'
  | 'network'
  | 'calendar'
  | 'contacts'
  | 'multimedia';

/**
 * Permission macOS requise
 */
export type MCPPermission =
  | 'accessibility'      // Contrôle des apps
  | 'files'              // Accès fichiers (géré par notre système)
  | 'screen_capture'     // Captures d'écran
  | 'notifications'      // Notifications
  | 'microphone'         // Microphone
  | 'location'           // Localisation
  | 'calendar'           // Calendrier
  | 'reminders'          // Rappels
  | 'contacts'           // Contacts
  | 'bluetooth'          // Bluetooth
  | 'automation';        // AppleScript/Automation

/**
 * Définition complète d'un outil MCP
 */
export interface MCPTool {
  name: string;
  category: MCPToolCategory;
  description: string;
  longDescription?: string;
  icon: string;              // Emoji

  // Paramètres
  parameters: MCPToolParameter[];

  // Permissions requises
  permissions: MCPPermission[];

  // Exemples d'utilisation (pour l'UI)
  examples: MCPToolExample[];

  // Métadonnées
  dangerous?: boolean;       // Action destructive
  requiresConfirmation?: boolean;  // Demander confirmation
  timeout?: number;          // Timeout en ms (défaut: 30000)
  enabled?: boolean;         // Activé par défaut
}

/**
 * Exemple d'utilisation d'un outil
 */
export interface MCPToolExample {
  title: string;
  description: string;
  parameters: Record<string, unknown>;
  expectedOutput?: string;
}

// ============================================================================
// TOOL EXECUTION
// ============================================================================

/**
 * Requête d'exécution d'outil
 */
export interface MCPToolCallRequest {
  id: string;                // ID unique de l'appel
  tool: string;              // Nom de l'outil
  parameters: Record<string, unknown>;
  timeout?: number;
}

/**
 * Statut d'exécution
 */
export type MCPToolCallStatus = 'pending' | 'running' | 'success' | 'error' | 'cancelled' | 'timeout';

/**
 * Résultat d'exécution d'un outil
 */
export interface MCPToolCallResult {
  id: string;
  tool: string;
  status: MCPToolCallStatus;
  result?: unknown;
  error?: MCPToolError;
  startedAt: number;
  completedAt?: number;
  duration?: number;         // En millisecondes
}

/**
 * Erreur d'outil
 */
export interface MCPToolError {
  code: MCPErrorCode;
  message: string;
  details?: unknown;
}

/**
 * Codes d'erreur MCP
 */
export type MCPErrorCode =
  | 'TOOL_NOT_FOUND'
  | 'INVALID_PARAMETERS'
  | 'PERMISSION_DENIED'
  | 'DIRECTORY_NOT_ALLOWED'
  | 'EXECUTION_ERROR'
  | 'TIMEOUT'
  | 'CANCELLED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

// ============================================================================
// PERMISSIONS SYSTEM
// ============================================================================

/**
 * Type d'accès fichier
 */
export type FileAccessType = 'read' | 'write' | 'delete' | 'execute' | 'move';

/**
 * Configuration d'accès à un répertoire
 */
export interface DirectoryAccess {
  id: string;
  path: string;
  name: string;              // Nom affiché
  permissions: FileAccessType[];
  includeSubdirectories: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * État d'une permission macOS
 */
export interface MCPPermissionState {
  permission: MCPPermission;
  granted: boolean;
  enabled: boolean;          // Toggle utilisateur
  lastChecked?: number;
  systemGranted?: boolean;   // Permission accordée au niveau système
}

/**
 * Configuration complète des permissions
 */
export interface MCPPermissionsConfig {
  permissions: MCPPermissionState[];
  directories: DirectoryAccess[];
  globalEnabled: boolean;    // MCP activé globalement
  requireConfirmation: boolean;  // Demander confirmation pour actions dangereuses
  logAllCalls: boolean;      // Logger tous les appels
}

// ============================================================================
// MCP SERVER STATE
// ============================================================================

/**
 * État du serveur MCP
 */
export interface MCPServerState {
  running: boolean;
  startedAt?: number;
  toolsCount: number;
  callsCount: number;
  lastCall?: MCPToolCallResult;
  errors: MCPToolError[];
}

/**
 * Configuration du serveur MCP
 */
export interface MCPServerConfig {
  enabled: boolean;
  maxConcurrentCalls: number;
  defaultTimeout: number;
  rateLimitPerMinute: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// ============================================================================
// CHAT INTEGRATION
// ============================================================================

/**
 * Appel d'outil depuis le chat (format compatible OpenAI)
 */
export interface ChatToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;  // JSON string
  };
}

/**
 * Résultat d'outil pour le chat
 */
export interface ChatToolResult {
  tool_call_id: string;
  role: 'tool';
  content: string;      // JSON string du résultat
}

/**
 * Définition d'outil pour le LLM (format compatible OpenAI)
 */
export interface ChatToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description: string;
        enum?: string[];
      }>;
      required: string[];
    };
  };
}

// ============================================================================
// UI TYPES
// ============================================================================

/**
 * Statistiques d'un outil pour l'UI
 */
export interface MCPToolStats {
  tool: string;
  callsCount: number;
  successCount: number;
  errorCount: number;
  averageDuration: number;
  lastUsed?: number;
}

/**
 * État de test d'un outil dans l'UI
 */
export interface MCPToolTestState {
  tool: string;
  selectedFunction?: string;
  parameters: Record<string, unknown>;
  lastResult?: MCPToolCallResult;
  isRunning: boolean;
}

/**
 * Filtre pour la liste des outils
 */
export interface MCPToolFilter {
  category?: MCPToolCategory;
  search?: string;
  enabledOnly?: boolean;
  permission?: MCPPermission;
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

/**
 * Configuration d'outil stockée en DB
 */
export interface MCPToolConfigDB {
  id: string;
  toolName: string;
  category: MCPToolCategory;
  enabled: boolean;
  config: string;            // JSON string
  createdAt: number;
  updatedAt: number;
}

/**
 * Permission stockée en DB
 */
export interface MCPPermissionDB {
  id: string;
  permission: MCPPermission;
  enabled: boolean;
  grantedAt?: number;
  createdAt: number;
  updatedAt: number;
}

/**
 * Répertoire autorisé stocké en DB
 */
export interface MCPDirectoryAccessDB {
  id: string;
  path: string;
  name: string;
  permissions: string;       // JSON array de FileAccessType
  includeSubdirectories: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Log d'appel d'outil stocké en DB
 */
export interface MCPToolCallLogDB {
  id: string;
  toolName: string;
  parameters: string;        // JSON string
  status: MCPToolCallStatus;
  result?: string;           // JSON string
  error?: string;            // JSON string
  duration: number;
  createdAt: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convertit un MCPTool en ChatToolDefinition pour le LLM
 */
export function toolToChatDefinition(tool: MCPTool): ChatToolDefinition {
  const properties: Record<string, { type: string; description: string; enum?: string[] }> = {};
  const required: string[] = [];

  for (const param of tool.parameters) {
    properties[param.name] = {
      type: param.type === 'file' ? 'string' : param.type,
      description: param.description,
    };
    if (param.enum) {
      properties[param.name].enum = param.enum;
    }
    if (param.required) {
      required.push(param.name);
    }
  }

  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties,
        required,
      },
    },
  };
}

/**
 * Vérifie si un chemin est dans un répertoire autorisé
 */
export function isPathAllowed(
  path: string,
  directories: DirectoryAccess[],
  requiredAccess: FileAccessType
): boolean {
  const normalizedPath = path.replace(/\/$/, '');

  for (const dir of directories) {
    const normalizedDir = dir.path.replace(/\/$/, '');

    // Vérifier si le chemin est dans ce répertoire
    if (normalizedPath === normalizedDir ||
        (dir.includeSubdirectories && normalizedPath.startsWith(normalizedDir + '/'))) {
      // Vérifier si l'accès requis est autorisé
      if (dir.permissions.includes(requiredAccess)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Génère un ID unique pour les appels d'outils
 */
export function generateToolCallId(): string {
  return `tc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Valide les paramètres d'un outil
 */
export function validateToolParameters(
  tool: MCPTool,
  params: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const param of tool.parameters) {
    const value = params[param.name];

    // Vérifier les paramètres requis
    if (param.required && (value === undefined || value === null || value === '')) {
      errors.push(`Le paramètre "${param.name}" est requis`);
      continue;
    }

    // Si la valeur est présente, valider le type
    if (value !== undefined && value !== null) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      const expectedType = param.type === 'file' ? 'string' : param.type;

      if (actualType !== expectedType) {
        errors.push(`Le paramètre "${param.name}" doit être de type ${param.type}, reçu ${actualType}`);
        continue;
      }

      // Validations spécifiques selon le type
      if (param.type === 'string' && typeof value === 'string') {
        if (param.minLength && value.length < param.minLength) {
          errors.push(`"${param.name}" doit avoir au moins ${param.minLength} caractères`);
        }
        if (param.maxLength && value.length > param.maxLength) {
          errors.push(`"${param.name}" ne doit pas dépasser ${param.maxLength} caractères`);
        }
        if (param.pattern && !new RegExp(param.pattern).test(value)) {
          errors.push(`"${param.name}" ne correspond pas au format attendu`);
        }
        if (param.enum && !param.enum.includes(value)) {
          errors.push(`"${param.name}" doit être l'une des valeurs: ${param.enum.join(', ')}`);
        }
      }

      if (param.type === 'number' && typeof value === 'number') {
        if (param.min !== undefined && value < param.min) {
          errors.push(`"${param.name}" doit être au moins ${param.min}`);
        }
        if (param.max !== undefined && value > param.max) {
          errors.push(`"${param.name}" ne doit pas dépasser ${param.max}`);
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
