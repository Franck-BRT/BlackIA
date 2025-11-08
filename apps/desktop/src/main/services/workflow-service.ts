import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

/**
 * Service de gestion des workflows avec stockage JSON
 */

export interface WorkflowNode {
  id: string;
  type: 'input' | 'output' | 'aiPrompt' | 'condition' | 'loop' | 'transform' | 'switch';
  position: { x: number; y: number };
  data: {
    label?: string;
    config?: Record<string, unknown>;
    // Input node
    inputType?: 'text' | 'file' | 'variable';
    inputValue?: string;
    // Output node
    outputType?: 'text' | 'file' | 'variable';
    outputFormat?: string;
    // AI Prompt node
    promptTemplate?: string;
    personaId?: string;
    temperature?: number;
    maxTokens?: number;
    // Condition node
    condition?: string;
    conditionType?: 'equals' | 'contains' | 'greater' | 'less' | 'regex';
    // Loop node
    loopType?: 'forEach' | 'while' | 'count';
    loopCount?: number;
    loopCondition?: string;
    // Transform node
    transformType?: 'extract' | 'format' | 'merge' | 'split';
    transformScript?: string;
  };
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
  description: string;
  nodes: string; // JSON serialized WorkflowNode[]
  edges: string; // JSON serialized WorkflowEdge[]
  icon: string;
  color: string;
  category?: string | null;
  tags: string; // JSON array
  isFavorite: boolean;
  usageCount: number;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WorkflowsData {
  workflows: Workflow[];
  version: string;
  schemaVersion?: number;
}

// Chemin vers le fichier de données
const USER_DATA_PATH = app.getPath('userData');
const WORKFLOWS_FILE = path.join(USER_DATA_PATH, 'workflows.json');

// Version du schéma des workflows par défaut
const CURRENT_SCHEMA_VERSION = 1;

// Cache en mémoire
let cachedData: WorkflowsData | null = null;

/**
 * Workflows templates par défaut
 */
const DEFAULT_WORKFLOWS: Workflow[] = [
  {
    id: 'template-persona-creator',
    name: 'Créateur de Persona Parfait',
    description:
      'Workflow qui analyse vos besoins et génère le meilleur persona possible en comparant plusieurs variations',
    nodes: JSON.stringify([
      {
        id: '1',
        type: 'input',
        position: { x: 100, y: 100 },
        data: {
          label: 'Entrée',
          inputType: 'text',
          inputValue: '',
        },
      },
      {
        id: '2',
        type: 'aiPrompt',
        position: { x: 100, y: 250 },
        data: {
          label: 'Analyser les besoins',
          promptTemplate:
            "Analyse les besoins suivants pour créer un persona IA : {{input}}. Identifie le domaine d'expertise, le style de communication souhaité, et les critères de qualité à respecter.",
          temperature: 0.7,
        },
      },
      {
        id: '3',
        type: 'loop',
        position: { x: 100, y: 400 },
        data: {
          label: 'Générer 3 variations',
          loopType: 'count',
          loopCount: 3,
        },
      },
      {
        id: '4',
        type: 'aiPrompt',
        position: { x: 100, y: 550 },
        data: {
          label: 'Créer système prompt',
          promptTemplate:
            "Basé sur l'analyse suivante : {{analysis}}, crée un système prompt unique et optimisé pour un persona IA. Sois créatif et varie les approches.",
          temperature: 0.8,
        },
      },
      {
        id: '5',
        type: 'aiPrompt',
        position: { x: 100, y: 700 },
        data: {
          label: 'Comparer et noter',
          promptTemplate:
            'Compare les 3 variations de personas suivantes : {{variations}}. Note chacune sur 10 selon la clarté, la pertinence et la qualité. Retourne la meilleure avec sa note.',
          temperature: 0.3,
        },
      },
      {
        id: '6',
        type: 'condition',
        position: { x: 100, y: 850 },
        data: {
          label: 'Note > 8 ?',
          condition: '{{score}} > 8',
          conditionType: 'greater',
        },
      },
      {
        id: '7',
        type: 'output',
        position: { x: 300, y: 1000 },
        data: {
          label: 'Persona parfait',
          outputType: 'text',
        },
      },
      {
        id: '8',
        type: 'aiPrompt',
        position: { x: -100, y: 1000 },
        data: {
          label: 'Affiner et réessayer',
          promptTemplate:
            'Le persona précédent a obtenu {{score}}/10. Améliore-le en gardant ses points forts et en corrigeant ses faiblesses.',
          temperature: 0.6,
        },
      },
    ]),
    edges: JSON.stringify([
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e4-5', source: '4', target: '5' },
      { id: 'e5-6', source: '5', target: '6' },
      { id: 'e6-7', source: '6', target: '7', sourceHandle: 'yes', label: 'Oui' },
      { id: 'e6-8', source: '6', target: '8', sourceHandle: 'no', label: 'Non' },
      { id: 'e8-5', source: '8', target: '5', animated: true },
    ]),
    icon: '🎭',
    color: 'purple',
    category: 'Templates',
    tags: '["persona", "création", "IA", "template"]',
    isFavorite: true,
    usageCount: 0,
    isTemplate: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template-document-summary',
    name: 'Résumé de Document',
    description: 'Workflow simple pour résumer un document texte avec extraction des points clés',
    nodes: JSON.stringify([
      {
        id: '1',
        type: 'input',
        position: { x: 250, y: 50 },
        data: {
          label: 'Document source',
          inputType: 'text',
          inputValue: '',
        },
      },
      {
        id: '2',
        type: 'aiPrompt',
        position: { x: 250, y: 200 },
        data: {
          label: 'Résumer le contenu',
          promptTemplate:
            'Résume le document suivant de manière concise en gardant les informations essentielles : {{input}}',
          temperature: 0.5,
          maxTokens: 500,
        },
      },
      {
        id: '3',
        type: 'aiPrompt',
        position: { x: 250, y: 350 },
        data: {
          label: 'Extraire les points clés',
          promptTemplate: 'Extrais 5 points clés du résumé suivant sous forme de liste : {{summary}}',
          temperature: 0.3,
        },
      },
      {
        id: '4',
        type: 'transform',
        position: { x: 250, y: 500 },
        data: {
          label: 'Formater la sortie',
          transformType: 'format',
          transformScript: 'Markdown',
        },
      },
      {
        id: '5',
        type: 'output',
        position: { x: 250, y: 650 },
        data: {
          label: 'Résumé final',
          outputType: 'text',
          outputFormat: 'markdown',
        },
      },
    ]),
    edges: JSON.stringify([
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e4-5', source: '4', target: '5' },
    ]),
    icon: '📄',
    color: 'blue',
    category: 'Templates',
    tags: '["document", "résumé", "analyse", "template"]',
    isFavorite: false,
    usageCount: 0,
    isTemplate: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template-content-generator',
    name: 'Générateur de Contenu Multi-étapes',
    description: 'Génère du contenu en plusieurs phases : brainstorming, rédaction, amélioration',
    nodes: JSON.stringify([
      {
        id: '1',
        type: 'input',
        position: { x: 200, y: 50 },
        data: {
          label: 'Sujet',
          inputType: 'text',
        },
      },
      {
        id: '2',
        type: 'aiPrompt',
        position: { x: 200, y: 180 },
        data: {
          label: 'Brainstorming',
          promptTemplate: "Génère 5 angles d'approche créatifs pour le sujet suivant : {{input}}",
          temperature: 0.9,
        },
      },
      {
        id: '3',
        type: 'aiPrompt',
        position: { x: 200, y: 310 },
        data: {
          label: 'Rédaction initiale',
          promptTemplate: 'Rédige un article complet en suivant cet angle : {{angles}}. Minimum 500 mots.',
          temperature: 0.7,
        },
      },
      {
        id: '4',
        type: 'aiPrompt',
        position: { x: 200, y: 440 },
        data: {
          label: 'Amélioration du style',
          promptTemplate:
            "Améliore le style de ce texte pour le rendre plus engageant et professionnel : {{draft}}",
          temperature: 0.6,
        },
      },
      {
        id: '5',
        type: 'output',
        position: { x: 200, y: 570 },
        data: {
          label: 'Contenu final',
          outputType: 'text',
        },
      },
    ]),
    edges: JSON.stringify([
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e4-5', source: '4', target: '5' },
    ]),
    icon: '✍️',
    color: 'pink',
    category: 'Templates',
    tags: '["contenu", "écriture", "génération", "template"]',
    isFavorite: false,
    usageCount: 0,
    isTemplate: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Initialise le fichier de données avec les workflows par défaut
 */
async function initializeWorkflowsFile(): Promise<void> {
  try {
    // Créer le dossier userData s'il n'existe pas
    await fs.mkdir(USER_DATA_PATH, { recursive: true });

    // Vérifier si le fichier existe
    try {
      await fs.access(WORKFLOWS_FILE);
      console.log('[WorkflowService] Workflows file already exists');
      return;
    } catch {
      // Le fichier n'existe pas, le créer
      const initialData: WorkflowsData = {
        workflows: DEFAULT_WORKFLOWS,
        version: '1.0.0',
        schemaVersion: CURRENT_SCHEMA_VERSION,
      };

      await fs.writeFile(WORKFLOWS_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      cachedData = initialData;

      console.log('[WorkflowService] Workflows file created with default templates');
    }
  } catch (error) {
    console.error('[WorkflowService] Failed to initialize workflows file:', error);
    throw error;
  }
}

/**
 * Charge les données depuis le fichier
 */
async function loadData(): Promise<WorkflowsData> {
  if (cachedData) {
    return cachedData;
  }

  try {
    const fileContent = await fs.readFile(WORKFLOWS_FILE, 'utf-8');
    const data: WorkflowsData = JSON.parse(fileContent);

    cachedData = data;
    return cachedData;
  } catch (error) {
    console.error('[WorkflowService] Failed to load workflows:', error);
    // Si le fichier n'existe pas ou est corrompu, retourner les données par défaut
    const defaultData: WorkflowsData = {
      workflows: DEFAULT_WORKFLOWS,
      version: '1.0.0',
      schemaVersion: CURRENT_SCHEMA_VERSION,
    };
    cachedData = defaultData;
    return defaultData;
  }
}

/**
 * Sauvegarde les données dans le fichier
 */
async function saveData(data: WorkflowsData): Promise<void> {
  try {
    await fs.writeFile(WORKFLOWS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    cachedData = data;
  } catch (error) {
    console.error('[WorkflowService] Failed to save workflows:', error);
    throw error;
  }
}

/**
 * Service public
 */
export const WorkflowService = {
  /**
   * Initialise le service
   */
  async initialize(): Promise<void> {
    await initializeWorkflowsFile();
    await loadData();
  },

  /**
   * Récupère tous les workflows
   */
  async getAll(): Promise<Workflow[]> {
    const data = await loadData();
    return data.workflows;
  },

  /**
   * Récupère un workflow par ID
   */
  async getById(id: string): Promise<Workflow | null> {
    const data = await loadData();
    return data.workflows.find((w) => w.id === id) || null;
  },

  /**
   * Crée un nouveau workflow
   */
  async create(
    workflowData: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>
  ): Promise<Workflow> {
    const data = await loadData();

    const newWorkflow: Workflow = {
      ...workflowData,
      id: randomUUID(),
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.workflows.push(newWorkflow);
    await saveData(data);

    return newWorkflow;
  },

  /**
   * Met à jour un workflow
   */
  async update(id: string, updates: Partial<Workflow>): Promise<Workflow | null> {
    const data = await loadData();
    const index = data.workflows.findIndex((w) => w.id === id);

    if (index === -1) {
      return null;
    }

    data.workflows[index] = {
      ...data.workflows[index],
      ...updates,
      id, // Ne pas permettre de changer l'ID
      updatedAt: new Date().toISOString(),
    };

    await saveData(data);
    return data.workflows[index];
  },

  /**
   * Supprime un workflow
   */
  async delete(id: string): Promise<boolean> {
    const data = await loadData();
    const index = data.workflows.findIndex((w) => w.id === id);

    if (index === -1) {
      return false;
    }

    // Ne pas permettre de supprimer un template par défaut
    if (data.workflows[index].isTemplate) {
      throw new Error('Cannot delete default template');
    }

    data.workflows.splice(index, 1);
    await saveData(data);

    return true;
  },

  /**
   * Duplique un workflow
   */
  async duplicate(id: string): Promise<Workflow | null> {
    const original = await this.getById(id);
    if (!original) {
      return null;
    }

    const duplicate: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'> = {
      ...original,
      name: `${original.name} (Copie)`,
      isTemplate: false,
      isFavorite: false,
    };

    return await this.create(duplicate);
  },

  /**
   * Toggle le statut favori
   */
  async toggleFavorite(id: string): Promise<Workflow | null> {
    const workflow = await this.getById(id);
    if (!workflow) {
      return null;
    }

    return await this.update(id, { isFavorite: !workflow.isFavorite });
  },

  /**
   * Incrémente le compteur d'utilisation
   */
  async incrementUsage(id: string): Promise<void> {
    const workflow = await this.getById(id);
    if (workflow) {
      await this.update(id, { usageCount: workflow.usageCount + 1 });
    }
  },

  /**
   * Recherche des workflows
   */
  async search(query: string): Promise<Workflow[]> {
    const data = await loadData();
    const lowerQuery = query.toLowerCase();

    return data.workflows.filter(
      (w) =>
        w.name.toLowerCase().includes(lowerQuery) ||
        w.description.toLowerCase().includes(lowerQuery) ||
        w.category?.toLowerCase().includes(lowerQuery) ||
        w.tags.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Filtre par catégorie
   */
  async filterByCategory(category: string): Promise<Workflow[]> {
    const data = await loadData();
    return data.workflows.filter((w) => w.category === category);
  },

  /**
   * Récupère les favoris
   */
  async getFavorites(): Promise<Workflow[]> {
    const data = await loadData();
    return data.workflows.filter((w) => w.isFavorite);
  },

  /**
   * Récupère les templates
   */
  async getTemplates(): Promise<Workflow[]> {
    const data = await loadData();
    return data.workflows.filter((w) => w.isTemplate);
  },

  /**
   * Récupère toutes les catégories
   */
  async getCategories(): Promise<string[]> {
    const data = await loadData();
    const categories = new Set<string>();

    data.workflows.forEach((w) => {
      if (w.category) {
        categories.add(w.category);
      }
    });

    return Array.from(categories).sort();
  },
};
