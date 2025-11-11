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
    name: 'Créateur de Persona Parfait V1 (Simplifié)',
    description:
      'Version linéaire simple et fonctionnelle - 5 étapes: analyse, création, évaluation, optimisation, sortie',
    nodes: JSON.stringify([
      {
        id: '1',
        type: 'input',
        position: { x: 250, y: 50 },
        data: {
          label: 'Description du besoin',
          inputType: 'text',
          inputValue: '',
        },
      },
      {
        id: '2',
        type: 'aiPrompt',
        position: { x: 250, y: 200 },
        data: {
          label: 'Analyser le besoin',
          promptTemplate:
            "Tu es un expert en conception de personas IA. Analyse ce besoin et identifie les caractéristiques clés du persona à créer : {{input}}\n\nIdentifie précisément :\n- Le domaine d'expertise requis\n- Le niveau de compétence (débutant/intermédiaire/expert)\n- Le style de communication approprié\n- Les compétences et connaissances nécessaires\n- Le public cible",
          model: 'llama3.2:latest',
          temperature: 0.7,
          maxTokens: 800,
        },
      },
      {
        id: '3',
        type: 'aiPrompt',
        position: { x: 250, y: 350 },
        data: {
          label: 'Créer le système prompt',
          promptTemplate:
            "Basé sur cette analyse : {{lastValue}}\n\nCrée maintenant un système prompt complet et optimisé pour ce persona IA.\n\nLe système prompt doit inclure :\n1. Définition du rôle et de l'identité\n2. Domaine d'expertise et compétences\n3. Style de communication et ton\n4. Directives de comportement\n5. Exemples de réponses attendues\n\nSois précis, créatif et adapte le prompt au public cible.",
          model: 'llama3.2:latest',
          temperature: 0.8,
          maxTokens: 2000,
        },
      },
      {
        id: '4',
        type: 'aiPrompt',
        position: { x: 250, y: 500 },
        data: {
          label: 'Évaluer la qualité',
          promptTemplate:
            "Évalue ce système prompt de persona IA : {{lastValue}}\n\nAnalyse et note sur 10 les aspects suivants :\n- Clarté et précision\n- Pertinence pour le besoin initial\n- Complétude des informations\n- Originalité et créativité\n- Facilité d'utilisation\n\nCommence ta réponse par 'Score: X/10' puis détaille ton évaluation avec des suggestions d'amélioration.",
          model: 'llama3.2:latest',
          temperature: 0.3,
          maxTokens: 1000,
        },
      },
      {
        id: '5',
        type: 'aiPrompt',
        position: { x: 250, y: 650 },
        data: {
          label: 'Optimiser le prompt',
          promptTemplate:
            "Voici le système prompt initial et son évaluation : {{lastValue}}\n\nAméliore ce système prompt en :\n- Corrigeant les faiblesses identifiées\n- Renforçant les points forts\n- Ajoutant des détails pertinents\n- Peaufinant le style et le ton\n\nFournis la version finale optimisée du système prompt pour le persona IA, prête à l'emploi.",
          model: 'llama3.2:latest',
          temperature: 0.6,
          maxTokens: 2500,
        },
      },
      {
        id: '6',
        type: 'output',
        position: { x: 250, y: 800 },
        data: {
          label: 'Persona final',
          outputType: 'text',
        },
      },
    ]),
    edges: JSON.stringify([
      { id: 'e1-2', source: '1', target: '2' },
      { id: 'e2-3', source: '2', target: '3' },
      { id: 'e3-4', source: '3', target: '4' },
      { id: 'e4-5', source: '4', target: '5' },
      { id: 'e5-6', source: '5', target: '6' },
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
          model: 'llama3.2:latest',
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
          promptTemplate: 'Extrais 5 points clés du résumé suivant sous forme de liste : {{lastValue}}',
          model: 'llama3.2:latest',
          temperature: 0.3,
          maxTokens: 300,
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
          model: 'llama3.2:latest',
          temperature: 0.9,
          maxTokens: 800,
        },
      },
      {
        id: '3',
        type: 'aiPrompt',
        position: { x: 200, y: 310 },
        data: {
          label: 'Rédaction initiale',
          promptTemplate: 'Rédige un article complet en suivant cet angle : {{lastValue}}. Minimum 500 mots.',
          model: 'llama3.2:latest',
          temperature: 0.7,
          maxTokens: 3000,
        },
      },
      {
        id: '4',
        type: 'aiPrompt',
        position: { x: 200, y: 440 },
        data: {
          label: 'Amélioration du style',
          promptTemplate:
            "Améliore le style de ce texte pour le rendre plus engageant et professionnel : {{lastValue}}",
          model: 'llama3.2:latest',
          temperature: 0.6,
          maxTokens: 3000,
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
  {
    id: 'template-persona-creator-advanced',
    name: 'Créateur de Persona Parfait V2 (Avancé)',
    description:
      'Version complexe avec loops et conditions - Génère 3 variations, compare, note et affine jusqu\'à score > 8 (fonctionnalités en développement)',
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
          model: 'llama3.2:latest',
          temperature: 0.7,
          maxTokens: 1000,
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
            "Basé sur l'analyse suivante : {{lastValue}}, crée un système prompt unique et optimisé pour un persona IA. Sois créatif et varie les approches.",
          model: 'llama3.2:latest',
          temperature: 0.8,
          maxTokens: 2000,
        },
      },
      {
        id: '5',
        type: 'aiPrompt',
        position: { x: 100, y: 700 },
        data: {
          label: 'Comparer et noter',
          promptTemplate:
            'Compare les variations de personas suivantes : {{lastValue}}. Note chacune sur 10 selon la clarté, la pertinence et la qualité. Retourne la meilleure avec sa note au format "Score: X/10".',
          model: 'llama3.2:latest',
          temperature: 0.3,
          maxTokens: 1500,
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
            'Le persona précédent a obtenu une note insuffisante. Améliore la proposition suivante en gardant ses points forts et en corrigeant ses faiblesses: {{lastValue}}',
          model: 'llama3.2:latest',
          temperature: 0.6,
          maxTokens: 2000,
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
    color: 'orange',
    category: 'Templates',
    tags: '["persona", "création", "IA", "loop", "condition", "avancé", "v2"]',
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
