import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

/**
 * Service de gestion des personas avec stockage JSON
 * Alternative à SQLite en attendant l'installation des dépendances
 */

export interface Persona {
  id: string;
  name: string;
  description: string;
  systemPrompt: string;
  model?: string | null;
  temperature?: number | null;
  maxTokens?: number | null;
  avatar: string;
  color: string;
  category?: string | null;
  tags: string;
  isDefault: boolean;
  isFavorite: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PersonasData {
  personas: Persona[];
  version: string;
}

// Chemin vers le fichier de données
const USER_DATA_PATH = app.getPath('userData');
const PERSONAS_FILE = path.join(USER_DATA_PATH, 'personas.json');

// Cache en mémoire
let cachedData: PersonasData | null = null;

/**
 * Personas par défaut
 */
const DEFAULT_PERSONAS: Persona[] = [
  {
    id: 'default-general-assistant',
    name: 'Assistant Général',
    description: 'Un assistant IA polyvalent pour tous vos besoins quotidiens',
    systemPrompt:
      'Tu es un assistant IA serviable, précis et concis. Tu réponds de manière claire et structurée. Tu admets quand tu ne sais pas quelque chose.',
    avatar: '🤖',
    color: 'purple',
    category: 'Général',
    tags: '["assistant", "général", "polyvalent"]',
    isDefault: true,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-python-expert',
    name: 'Expert Python',
    description: 'Spécialiste Python pour développement, debugging et bonnes pratiques',
    systemPrompt:
      'Tu es un expert Python avec 10+ ans d\'expérience. Tu connais parfaitement les bonnes pratiques, PEP8, les frameworks modernes (FastAPI, Django, Flask), async/await, et les outils de l\'écosystème Python. Tu fournis du code propre, bien documenté, avec des type hints. Tu expliques les concepts complexes simplement.',
    model: 'codellama',
    temperature: 0.3,
    avatar: '🐍',
    color: 'green',
    category: 'Développement',
    tags: '["python", "code", "développement", "backend"]',
    isDefault: false,
    isFavorite: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-react-dev',
    name: 'Développeur React/TypeScript',
    description: 'Expert React, TypeScript, Next.js et écosystème frontend moderne',
    systemPrompt:
      'Tu es un expert React et TypeScript. Tu maîtrises React 18+, hooks, Context API, React Query, Zustand, Next.js 14+, et les meilleures pratiques frontend. Tu écris du code type-safe, performant, et accessible (a11y). Tu favorises les composants fonctionnels, les custom hooks, et l\'architecture modulaire. Tu connais parfaitement TailwindCSS et les patterns de design moderne.',
    model: 'codellama',
    temperature: 0.3,
    avatar: '⚛️',
    color: 'blue',
    category: 'Développement',
    tags: '["react", "typescript", "frontend", "nextjs", "javascript"]',
    isDefault: false,
    isFavorite: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-writer',
    name: 'Rédacteur Professionnel',
    description: 'Expert en rédaction de contenu clair, engageant et professionnel',
    systemPrompt:
      'Tu es un rédacteur professionnel expérimenté. Tu maîtrises tous les styles d\'écriture : articles de blog, documentation technique, marketing, storytelling, emails professionnels. Tu adaptes ton ton selon le contexte. Ton écriture est claire, fluide, sans fautes, et captivante. Tu structures bien tes textes avec des titres, sous-titres, et paragraphes aérés.',
    temperature: 0.7,
    avatar: '✍️',
    color: 'pink',
    category: 'Écriture',
    tags: '["écriture", "contenu", "rédaction", "articles"]',
    isDefault: false,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-teacher',
    name: 'Professeur Pédagogue',
    description: 'Explique des concepts complexes de manière simple et progressive',
    systemPrompt:
      'Tu es un professeur pédagogue exceptionnel. Tu excelles à expliquer des concepts complexes de manière simple et progressive. Tu utilises des analogies, des exemples concrets, et tu t\'assures que l\'élève comprend avant de continuer. Tu es patient, encourageant, et tu adaptes tes explications au niveau de compréhension. Tu poses des questions pour vérifier la compréhension.',
    temperature: 0.6,
    avatar: '🎓',
    color: 'orange',
    category: 'Enseignement',
    tags: '["enseignement", "pédagogie", "explication", "apprentissage"]',
    isDefault: false,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-analyst',
    name: 'Analyste & Chercheur',
    description: 'Analyse critique, recherche approfondie et synthèse d\'informations',
    systemPrompt:
      'Tu es un analyste et chercheur rigoureux. Tu analyses les informations de manière critique, tu identifies les biais, tu vérifies les sources, et tu synthétises les données complexes. Tu fournis des analyses structurées avec des arguments solides. Tu distingues clairement faits, hypothèses, et opinions. Tu cites tes sources et admets les limites de tes analyses.',
    temperature: 0.4,
    avatar: '🔍',
    color: 'purple',
    category: 'Analyse',
    tags: '["analyse", "recherche", "critique", "synthèse"]',
    isDefault: false,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-creative',
    name: 'Créatif & Storyteller',
    description: 'Imagination débordante pour histoires, brainstorming et idées créatives',
    systemPrompt:
      'Tu es un créatif imaginatif et un storyteller captivant. Tu excelles dans le brainstorming, la génération d\'idées originales, l\'écriture créative, et la narration. Tu penses en dehors des sentiers battus. Tu crées des histoires engageantes avec des personnages mémorables. Tu proposes des angles uniques et des perspectives inattendues. Ton imagination est sans limites.',
    temperature: 0.9,
    avatar: '🎨',
    color: 'pink',
    category: 'Créatif',
    tags: '["créativité", "storytelling", "imagination", "brainstorming"]',
    isDefault: false,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-business',
    name: 'Consultant Business',
    description: 'Stratégie d\'entreprise, analyse de marché et conseils professionnels',
    systemPrompt:
      'Tu es un consultant business senior avec une expertise en stratégie d\'entreprise, analyse de marché, business models, et croissance. Tu fournis des conseils pragmatiques et actionnables. Tu analyses les opportunités et risques. Tu maîtrises les frameworks business (SWOT, Porter, BMC, OKR). Tu communiques de manière professionnelle et data-driven.',
    temperature: 0.5,
    avatar: '💼',
    color: 'blue',
    category: 'Business',
    tags: '["business", "stratégie", "consulting", "entrepreneuriat"]',
    isDefault: false,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Initialise le fichier de données avec les personas par défaut
 */
async function initializePersonasFile(): Promise<void> {
  try {
    // Créer le dossier userData s'il n'existe pas
    await fs.mkdir(USER_DATA_PATH, { recursive: true });

    // Vérifier si le fichier existe
    try {
      await fs.access(PERSONAS_FILE);
      console.log('[PersonaService] Personas file already exists');
      return;
    } catch {
      // Le fichier n'existe pas, le créer
      const initialData: PersonasData = {
        personas: DEFAULT_PERSONAS,
        version: '1.0.0',
      };

      await fs.writeFile(PERSONAS_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      cachedData = initialData;

      console.log('[PersonaService] Personas file created with default personas');
    }
  } catch (error) {
    console.error('[PersonaService] Failed to initialize personas file:', error);
    throw error;
  }
}

/**
 * Charge les données depuis le fichier
 */
async function loadData(): Promise<PersonasData> {
  if (cachedData) {
    return cachedData;
  }

  try {
    const fileContent = await fs.readFile(PERSONAS_FILE, 'utf-8');
    cachedData = JSON.parse(fileContent);
    return cachedData!;
  } catch (error) {
    console.error('[PersonaService] Failed to load personas:', error);
    // Si le fichier n'existe pas ou est corrompu, retourner les données par défaut
    const defaultData: PersonasData = {
      personas: DEFAULT_PERSONAS,
      version: '1.0.0',
    };
    cachedData = defaultData;
    return defaultData;
  }
}

/**
 * Sauvegarde les données dans le fichier
 */
async function saveData(data: PersonasData): Promise<void> {
  try {
    await fs.writeFile(PERSONAS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    cachedData = data;
  } catch (error) {
    console.error('[PersonaService] Failed to save personas:', error);
    throw error;
  }
}

/**
 * Service public
 */
export const PersonaService = {
  /**
   * Initialise le service
   */
  async initialize(): Promise<void> {
    await initializePersonasFile();
    await loadData();
  },

  /**
   * Récupère toutes les personas
   */
  async getAll(): Promise<Persona[]> {
    const data = await loadData();
    return data.personas;
  },

  /**
   * Récupère une persona par ID
   */
  async getById(id: string): Promise<Persona | null> {
    const data = await loadData();
    return data.personas.find((p) => p.id === id) || null;
  },

  /**
   * Crée une nouvelle persona
   */
  async create(personaData: Omit<Persona, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<Persona> {
    const data = await loadData();

    const newPersona: Persona = {
      ...personaData,
      id: randomUUID(),
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.personas.push(newPersona);
    await saveData(data);

    return newPersona;
  },

  /**
   * Met à jour une persona
   */
  async update(id: string, updates: Partial<Persona>): Promise<Persona | null> {
    const data = await loadData();
    const index = data.personas.findIndex((p) => p.id === id);

    if (index === -1) {
      return null;
    }

    data.personas[index] = {
      ...data.personas[index],
      ...updates,
      id, // Ne pas permettre de changer l'ID
      updatedAt: new Date().toISOString(),
    };

    await saveData(data);
    return data.personas[index];
  },

  /**
   * Supprime une persona
   */
  async delete(id: string): Promise<boolean> {
    const data = await loadData();
    const index = data.personas.findIndex((p) => p.id === id);

    if (index === -1) {
      return false;
    }

    // Ne pas permettre de supprimer une persona par défaut
    if (data.personas[index].isDefault) {
      throw new Error('Cannot delete default persona');
    }

    data.personas.splice(index, 1);
    await saveData(data);

    return true;
  },

  /**
   * Duplique une persona
   */
  async duplicate(id: string): Promise<Persona | null> {
    const original = await this.getById(id);
    if (!original) {
      return null;
    }

    const duplicate: Omit<Persona, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'> = {
      ...original,
      name: `${original.name} (Copie)`,
      isDefault: false,
      isFavorite: false,
    };

    return await this.create(duplicate);
  },

  /**
   * Toggle le statut favori
   */
  async toggleFavorite(id: string): Promise<Persona | null> {
    const persona = await this.getById(id);
    if (!persona) {
      return null;
    }

    return await this.update(id, { isFavorite: !persona.isFavorite });
  },

  /**
   * Incrémente le compteur d'utilisation
   */
  async incrementUsage(id: string): Promise<void> {
    const persona = await this.getById(id);
    if (persona) {
      await this.update(id, { usageCount: persona.usageCount + 1 });
    }
  },

  /**
   * Recherche des personas
   */
  async search(query: string): Promise<Persona[]> {
    const data = await loadData();
    const lowerQuery = query.toLowerCase();

    return data.personas.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.category?.toLowerCase().includes(lowerQuery) ||
        p.systemPrompt.toLowerCase().includes(lowerQuery) ||
        p.tags.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Filtre par catégorie
   */
  async filterByCategory(category: string): Promise<Persona[]> {
    const data = await loadData();
    return data.personas.filter((p) => p.category === category);
  },

  /**
   * Récupère les favorites
   */
  async getFavorites(): Promise<Persona[]> {
    const data = await loadData();
    return data.personas.filter((p) => p.isFavorite);
  },

  /**
   * Récupère toutes les catégories
   */
  async getCategories(): Promise<string[]> {
    const data = await loadData();
    const categories = new Set<string>();

    data.personas.forEach((p) => {
      if (p.category) {
        categories.add(p.category);
      }
    });

    return Array.from(categories).sort();
  },
};
