import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

/**
 * Service de gestion des prompts avec stockage JSON
 */

export interface Prompt {
  id: string;
  name: string;
  description: string;
  content: string;
  variables: string; // JSON array
  icon: string;
  color: string;
  category?: string | null;
  tags: string; // JSON array
  defaultPersonaId?: string | null;
  defaultIncludeFewShots: boolean;
    availableInEditor: false,
    editorTitle: null,
  availableInEditor: boolean; // Disponible dans l'éditeur
  editorTitle?: string | null; // Titre personnalisé pour l'éditeur
  isFavorite: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PromptsData {
  prompts: Prompt[];
  version: string;
  schemaVersion?: number;
}

// Chemin vers le fichier de données
const USER_DATA_PATH = app.getPath('userData');
const PROMPTS_FILE = path.join(USER_DATA_PATH, 'prompts.json');

// Version du schéma des prompts par défaut
const CURRENT_SCHEMA_VERSION = 2; // v2: Ajout de availableInEditor et editorTitle

// Cache en mémoire
let cachedData: PromptsData | null = null;

/**
 * Prompts par défaut
 */
const DEFAULT_PROMPTS: Prompt[] = [
  {
    id: 'default-code-review',
    name: 'Revue de Code',
    description: 'Analyse détaillée du code avec suggestions d\'amélioration',
    content: `Analyse le code suivant et fournis :

1. **Points positifs** : Ce qui est bien fait
2. **Points d'amélioration** : Ce qui peut être optimisé
3. **Bugs potentiels** : Erreurs ou edge cases non gérés
4. **Best practices** : Suggestions selon les standards

Code à analyser :
\`\`\`{{langage}}
{{code}}
\`\`\`

Niveau de détail : {{niveau}}`,
    variables: JSON.stringify(['langage', 'code', 'niveau']),
    icon: '🔍',
    color: 'blue',
    category: 'Développement',
    tags: JSON.stringify(['code', 'review', 'qualité', 'debug']),
    defaultPersonaId: null,
    defaultIncludeFewShots: false,
    availableInEditor: false,
    editorTitle: null,
    isFavorite: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-documentation',
    name: 'Génération de Documentation',
    description: 'Crée une documentation complète pour une fonction ou module',
    content: `Génère une documentation complète pour le code suivant :

\`\`\`{{langage}}
{{code}}
\`\`\`

La documentation doit inclure :
- Description de la fonctionnalité
- Paramètres avec types et descriptions
- Valeur de retour
- Exemples d'utilisation
- Notes importantes / edge cases

Format : {{format}}`,
    variables: JSON.stringify(['langage', 'code', 'format']),
    icon: '📚',
    color: 'green',
    category: 'Développement',
    tags: JSON.stringify(['documentation', 'code', 'commentaires']),
    defaultPersonaId: null,
    defaultIncludeFewShots: false,
    availableInEditor: false,
    editorTitle: null,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-debug-helper',
    name: 'Assistant Debug',
    description: 'Aide à identifier et résoudre les bugs',
    content: `J'ai un bug dans mon code {{langage}}.

**Problème** : {{probleme}}

**Code concerné** :
\`\`\`{{langage}}
{{code}}
\`\`\`

**Message d'erreur** :
\`\`\`
{{erreur}}
\`\`\`

**Ce que j'ai déjà essayé** :
{{tentatives}}

Aide-moi à :
1. Identifier la cause du bug
2. Proposer une solution
3. Expliquer pourquoi ça ne fonctionnait pas`,
    variables: JSON.stringify(['langage', 'probleme', 'code', 'erreur', 'tentatives']),
    icon: '🐛',
    color: 'orange',
    category: 'Développement',
    tags: JSON.stringify(['debug', 'bug', 'erreur', 'fix']),
    defaultPersonaId: null,
    defaultIncludeFewShots: false,
    availableInEditor: false,
    editorTitle: null,
    isFavorite: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-test-generation',
    name: 'Génération de Tests',
    description: 'Crée des tests unitaires pour une fonction',
    content: `Génère des tests unitaires pour la fonction suivante :

\`\`\`{{langage}}
{{code}}
\`\`\`

Framework de test : {{framework}}

Les tests doivent couvrir :
- Cas nominaux
- Cas limites (edge cases)
- Cas d'erreur
- Différents types d'entrées

Utilise des noms de test descriptifs et ajoute des commentaires explicatifs.`,
    variables: JSON.stringify(['langage', 'code', 'framework']),
    icon: '🧪',
    color: 'purple',
    category: 'Développement',
    tags: JSON.stringify(['tests', 'unit-tests', 'TDD', 'qualité']),
    defaultPersonaId: null,
    defaultIncludeFewShots: false,
    availableInEditor: false,
    editorTitle: null,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-refactoring',
    name: 'Refactoring de Code',
    description: 'Améliore et nettoie le code existant',
    content: `Refactorise le code suivant pour améliorer :
- Lisibilité
- Performance
- Maintenabilité
- Respect des principes SOLID

\`\`\`{{langage}}
{{code}}
\`\`\`

Objectifs spécifiques : {{objectifs}}

Fournis :
1. Le code refactorisé
2. Explication des changements
3. Gains attendus`,
    variables: JSON.stringify(['langage', 'code', 'objectifs']),
    icon: '🔧',
    color: 'blue',
    category: 'Développement',
    tags: JSON.stringify(['refactoring', 'clean-code', 'optimisation']),
    defaultPersonaId: null,
    defaultIncludeFewShots: false,
    availableInEditor: false,
    editorTitle: null,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-article-writing',
    name: 'Rédaction d\'Article de Blog',
    description: 'Crée un article de blog structuré et engageant',
    content: `Rédige un article de blog sur le sujet suivant :

**Sujet** : {{sujet}}
**Audience cible** : {{audience}}
**Ton** : {{ton}}
**Longueur** : {{longueur}} mots

L'article doit inclure :
- Une introduction accrocheuse
- Des sous-titres clairs (H2, H3)
- Des exemples concrets
- Une conclusion avec CTA

Angle d'approche : {{angle}}`,
    variables: JSON.stringify(['sujet', 'audience', 'ton', 'longueur', 'angle']),
    icon: '✍️',
    color: 'pink',
    category: 'Écriture',
    tags: JSON.stringify(['blog', 'article', 'contenu', 'rédaction']),
    defaultPersonaId: null,
    defaultIncludeFewShots: false,
    availableInEditor: false,
    editorTitle: null,
    isFavorite: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-email-pro',
    name: 'Email Professionnel',
    description: 'Rédige un email professionnel adapté au contexte',
    content: `Rédige un email professionnel pour :

**Destinataire** : {{destinataire}}
**Objet** : {{objet}}
**Contexte** : {{contexte}}
**Ton souhaité** : {{ton}}
**Action attendue** : {{action}}

L'email doit être :
- Courtois et professionnel
- Clair et concis
- Structuré avec des paragraphes courts
- Avec une formule de politesse adaptée`,
    variables: JSON.stringify(['destinataire', 'objet', 'contexte', 'ton', 'action']),
    icon: '📧',
    color: 'blue',
    category: 'Business',
    tags: JSON.stringify(['email', 'communication', 'professionnel']),
    defaultPersonaId: null,
    defaultIncludeFewShots: false,
    availableInEditor: false,
    editorTitle: null,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-swot-analysis',
    name: 'Analyse SWOT',
    description: 'Crée une analyse SWOT complète pour un projet ou entreprise',
    content: `Réalise une analyse SWOT détaillée pour :

**Projet/Entreprise** : {{nom}}
**Secteur** : {{secteur}}
**Contexte** : {{contexte}}

Analyse :
1. **Strengths (Forces)** : Avantages internes
2. **Weaknesses (Faiblesses)** : Points à améliorer
3. **Opportunities (Opportunités)** : Facteurs externes favorables
4. **Threats (Menaces)** : Risques externes

Fournis également des recommandations stratégiques basées sur cette analyse.`,
    variables: JSON.stringify(['nom', 'secteur', 'contexte']),
    icon: '📊',
    color: 'purple',
    category: 'Business',
    tags: JSON.stringify(['analyse', 'stratégie', 'SWOT', 'business']),
    defaultPersonaId: null,
    defaultIncludeFewShots: false,
    availableInEditor: false,
    editorTitle: null,
    isFavorite: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-meeting-summary',
    name: 'Résumé de Réunion',
    description: 'Transforme des notes de réunion en compte-rendu structuré',
    content: `Transforme ces notes de réunion en compte-rendu professionnel :

**Réunion** : {{titre}}
**Date** : {{date}}
**Participants** : {{participants}}

**Notes brutes** :
{{notes}}

Le compte-rendu doit inclure :
1. Objectif de la réunion
2. Points discutés
3. Décisions prises
4. Actions à mener (qui fait quoi, deadline)
5. Prochaines étapes`,
    variables: JSON.stringify(['titre', 'date', 'participants', 'notes']),
    icon: '📝',
    color: 'orange',
    category: 'Business',
    tags: JSON.stringify(['réunion', 'compte-rendu', 'notes', 'synthèse']),
    defaultPersonaId: null,
    defaultIncludeFewShots: false,
    availableInEditor: false,
    editorTitle: null,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-eli5',
    name: 'Explication Simplifiée (ELI5)',
    description: 'Explique un concept complexe de manière simple',
    content: `Explique le concept suivant comme si tu parlais à quelqu'un de {{age}} :

**Concept** : {{concept}}

Utilise :
- Des analogies du quotidien
- Un vocabulaire simple
- Des exemples concrets
- Une progression logique

Niveau de détail : {{niveau}}

Assure-toi que l'explication soit accessible tout en restant précise.`,
    variables: JSON.stringify(['concept', 'age', 'niveau']),
    icon: '🎓',
    color: 'green',
    category: 'Enseignement',
    tags: JSON.stringify(['explication', 'simplification', 'pédagogie', 'ELI5']),
    defaultPersonaId: null,
    defaultIncludeFewShots: false,
    availableInEditor: false,
    editorTitle: null,
    isFavorite: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-brainstorm',
    name: 'Session de Brainstorming',
    description: 'Génère des idées créatives pour un projet',
    content: `Session de brainstorming pour :

**Objectif** : {{objectif}}
**Contraintes** : {{contraintes}}
**Public cible** : {{cible}}
**Budget** : {{budget}}

Génère {{nombre}} idées créatives et originales.

Pour chaque idée, fournis :
- Un titre accrocheur
- Description courte (2-3 lignes)
- Points forts
- Faisabilité (1-5)

Privilégie l'originalité et la créativité !`,
    variables: JSON.stringify(['objectif', 'contraintes', 'cible', 'budget', 'nombre']),
    icon: '💡',
    color: 'pink',
    category: 'Créatif',
    tags: JSON.stringify(['brainstorm', 'idées', 'créativité', 'innovation']),
    defaultPersonaId: null,
    defaultIncludeFewShots: false,
    availableInEditor: false,
    editorTitle: null,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-seo-content',
    name: 'Contenu Optimisé SEO',
    description: 'Crée du contenu optimisé pour les moteurs de recherche',
    content: `Rédige un contenu optimisé SEO sur :

**Mot-clé principal** : {{mot_cle}}
**Mots-clés secondaires** : {{mots_cles_secondaires}}
**Type de contenu** : {{type}}
**Longueur** : {{longueur}} mots

Le contenu doit :
- Utiliser le mot-clé naturellement (densité 1-2%)
- Avoir une structure H1, H2, H3 claire
- Inclure des paragraphes courts (<3-4 lignes)
- Avoir une meta description (150-160 caractères)
- Être informatif et engageant

Angle éditorial : {{angle}}`,
    variables: JSON.stringify(['mot_cle', 'mots_cles_secondaires', 'type', 'longueur', 'angle']),
    icon: '🔍',
    color: 'orange',
    category: 'Marketing',
    tags: JSON.stringify(['SEO', 'contenu', 'référencement', 'marketing']),
    defaultPersonaId: null,
    defaultIncludeFewShots: false,
    availableInEditor: false,
    editorTitle: null,
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // === PROMPTS POUR L'ÉDITEUR ===
  {
    id: 'editor-translate-fr',
    name: 'Traduire en Français',
    description: 'Traduit le texte sélectionné en français',
    content: `Traduis le texte suivant en français. Conserve le format markdown si présent.

{{texte}}

Fournis uniquement la traduction, sans commentaire additionnel.`,
    variables: JSON.stringify(['texte']),
    icon: '🌍',
    color: 'blue',
    category: 'Écriture',
    tags: JSON.stringify(['traduction', 'français', 'éditeur']),
    defaultPersonaId: null,
    defaultIncludeFewShots: false,
    availableInEditor: true,
    editorTitle: 'Traduire en français',
    isFavorite: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'editor-correct',
    name: 'Corriger l\'Orthographe et la Grammaire',
    description: 'Corrige les fautes d\'orthographe, grammaire et ponctuation',
    content: `Corrige les fautes d'orthographe, de grammaire et de ponctuation dans le texte suivant. Conserve le format markdown si présent.

{{texte}}

Fournis uniquement le texte corrigé, sans commentaire additionnel.`,
    variables: JSON.stringify(['texte']),
    icon: '✅',
    color: 'green',
    category: 'Écriture',
    tags: JSON.stringify(['correction', 'orthographe', 'grammaire', 'éditeur']),
    defaultPersonaId: null,
    defaultIncludeFewShots: false,
    availableInEditor: true,
    editorTitle: 'Corriger',
    isFavorite: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'editor-summarize',
    name: 'Résumer le Texte',
    description: 'Crée un résumé concis du texte',
    content: `Résume le texte suivant de manière concise et claire. Garde les points essentiels.

{{texte}}

Fournis uniquement le résumé, sans introduction.`,
    variables: JSON.stringify(['texte']),
    icon: '📝',
    color: 'purple',
    category: 'Analyse',
    tags: JSON.stringify(['résumé', 'synthèse', 'éditeur']),
    defaultPersonaId: null,
    defaultIncludeFewShots: false,
    availableInEditor: true,
    editorTitle: 'Résumer',
    isFavorite: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'editor-improve',
    name: 'Améliorer le Style',
    description: 'Améliore la qualité et la clarté du texte',
    content: `Améliore le style et la clarté du texte suivant tout en conservant son sens. Rends-le plus fluide et professionnel. Conserve le format markdown si présent.

{{texte}}

Fournis uniquement le texte amélioré, sans commentaire additionnel.`,
    variables: JSON.stringify(['texte']),
    icon: '✨',
    color: 'pink',
    category: 'Écriture',
    tags: JSON.stringify(['amélioration', 'style', 'qualité', 'éditeur']),
    defaultPersonaId: null,
    defaultIncludeFewShots: false,
    availableInEditor: true,
    editorTitle: 'Améliorer',
    isFavorite: true,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'editor-simplify',
    name: 'Simplifier le Langage',
    description: 'Simplifie le texte pour le rendre plus accessible',
    content: `Simplifie le texte suivant pour le rendre plus accessible et facile à comprendre. Utilise un vocabulaire simple. Conserve le format markdown si présent.

{{texte}}

Fournis uniquement le texte simplifié, sans commentaire additionnel.`,
    variables: JSON.stringify(['texte']),
    icon: '💡',
    color: 'orange',
    category: 'Écriture',
    tags: JSON.stringify(['simplification', 'accessibilité', 'éditeur']),
    defaultPersonaId: null,
    defaultIncludeFewShots: false,
    availableInEditor: true,
    editorTitle: 'Simplifier',
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'editor-expand',
    name: 'Développer le Texte',
    description: 'Développe et enrichit le texte avec plus de détails',
    content: `Développe le texte suivant en ajoutant plus de détails, d'exemples et d'explications. Enrichis le contenu tout en restant cohérent. Conserve le format markdown si présent.

{{texte}}

Fournis uniquement le texte développé, sans commentaire additionnel.`,
    variables: JSON.stringify(['texte']),
    icon: '📈',
    color: 'blue',
    category: 'Écriture',
    tags: JSON.stringify(['développement', 'enrichissement', 'éditeur']),
    defaultPersonaId: null,
    defaultIncludeFewShots: false,
    availableInEditor: true,
    editorTitle: 'Développer',
    isFavorite: false,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

/**
 * Initialise le fichier de données avec les prompts par défaut
 */
async function initializePromptsFile(): Promise<void> {
  try {
    await fs.mkdir(USER_DATA_PATH, { recursive: true });

    try {
      await fs.access(PROMPTS_FILE);
      console.log('[PromptService] Prompts file already exists');
      return;
    } catch {
      const initialData: PromptsData = {
        prompts: DEFAULT_PROMPTS,
        version: '1.0.0',
        schemaVersion: CURRENT_SCHEMA_VERSION,
      };

      await fs.writeFile(PROMPTS_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      cachedData = initialData;

      console.log('[PromptService] Prompts file created with default prompts');
    }
  } catch (error) {
    console.error('[PromptService] Failed to initialize prompts file:', error);
    throw error;
  }
}

/**
 * Charge les données depuis le fichier
 */
/**
 * Migre les prompts de l'ancienne version vers la nouvelle
 */
function migratePrompts(data: PromptsData): PromptsData {
  const currentVersion = data.schemaVersion || 1;

  // Migration v1 -> v2: Ajout de availableInEditor et editorTitle
  if (currentVersion < 2) {
    console.log('[PromptService] Migration v1->v2: Ajout des champs éditeur');
    data.prompts = data.prompts.map(prompt => ({
      ...prompt,
      availableInEditor: false, // Par défaut, non disponible dans l'éditeur
      editorTitle: null,
    }));
    data.schemaVersion = 2;
  }

  return data;
}

async function loadData(): Promise<PromptsData> {
  if (cachedData) {
    return cachedData;
  }

  try {
    const fileContent = await fs.readFile(PROMPTS_FILE, 'utf-8');
    let data: PromptsData = JSON.parse(fileContent);

    // Appliquer les migrations si nécessaire
    data = migratePrompts(data);

    // Sauvegarder si des migrations ont été appliquées
    if ((data.schemaVersion || 1) < CURRENT_SCHEMA_VERSION) {
      await fs.writeFile(PROMPTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }

    cachedData = data;
    return cachedData;
  } catch (error) {
    console.error('[PromptService] Failed to load prompts:', error);
    const defaultData: PromptsData = {
      prompts: DEFAULT_PROMPTS,
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
async function saveData(data: PromptsData): Promise<void> {
  try {
    await fs.writeFile(PROMPTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
    cachedData = data;
  } catch (error) {
    console.error('[PromptService] Failed to save prompts:', error);
    throw error;
  }
}

/**
 * Service public
 */
export const PromptService = {
  /**
   * Initialise le service
   */
  async initialize(): Promise<void> {
    await initializePromptsFile();
    await loadData();
  },

  /**
   * Récupère tous les prompts
   */
  async getAll(): Promise<Prompt[]> {
    const data = await loadData();
    return data.prompts;
  },

  /**
   * Récupère un prompt par ID
   */
  async getById(id: string): Promise<Prompt | null> {
    const data = await loadData();
    return data.prompts.find((p) => p.id === id) || null;
  },

  /**
   * Crée un nouveau prompt
   */
  async create(promptData: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<Prompt> {
    const data = await loadData();

    const newPrompt: Prompt = {
      ...promptData,
      id: randomUUID(),
      usageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.prompts.push(newPrompt);
    await saveData(data);

    return newPrompt;
  },

  /**
   * Met à jour un prompt
   */
  async update(id: string, updates: Partial<Prompt>): Promise<Prompt | null> {
    const data = await loadData();
    const index = data.prompts.findIndex((p) => p.id === id);

    if (index === -1) {
      return null;
    }

    data.prompts[index] = {
      ...data.prompts[index],
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    };

    await saveData(data);
    return data.prompts[index];
  },

  /**
   * Supprime un prompt
   */
  async delete(id: string): Promise<boolean> {
    const data = await loadData();
    const index = data.prompts.findIndex((p) => p.id === id);

    if (index === -1) {
      return false;
    }

    data.prompts.splice(index, 1);
    await saveData(data);

    return true;
  },

  /**
   * Duplique un prompt
   */
  async duplicate(id: string): Promise<Prompt | null> {
    const original = await this.getById(id);
    if (!original) {
      return null;
    }

    const duplicate: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'> = {
      ...original,
      name: `${original.name} (Copie)`,
      isFavorite: false,
    };

    return await this.create(duplicate);
  },

  /**
   * Toggle le statut favori
   */
  async toggleFavorite(id: string): Promise<Prompt | null> {
    const prompt = await this.getById(id);
    if (!prompt) {
      return null;
    }

    return await this.update(id, { isFavorite: !prompt.isFavorite });
  },

  /**
   * Incrémente le compteur d'utilisation
   */
  async incrementUsage(id: string): Promise<void> {
    const prompt = await this.getById(id);
    if (prompt) {
      await this.update(id, { usageCount: prompt.usageCount + 1 });
    }
  },

  /**
   * Recherche des prompts
   */
  async search(query: string): Promise<Prompt[]> {
    const data = await loadData();
    const lowerQuery = query.toLowerCase();

    return data.prompts.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.content.toLowerCase().includes(lowerQuery) ||
        p.category?.toLowerCase().includes(lowerQuery) ||
        p.tags.toLowerCase().includes(lowerQuery)
    );
  },

  /**
   * Filtre par catégorie
   */
  async filterByCategory(category: string): Promise<Prompt[]> {
    const data = await loadData();
    return data.prompts.filter((p) => p.category === category);
  },

  /**
   * Récupère les favoris
   */
  async getFavorites(): Promise<Prompt[]> {
    const data = await loadData();
    return data.prompts.filter((p) => p.isFavorite);
  },

  /**
   * Récupère toutes les catégories
   */
  async getCategories(): Promise<string[]> {
    const data = await loadData();
    const categories = new Set<string>();

    data.prompts.forEach((p) => {
      if (p.category) {
        categories.add(p.category);
      }
    });

    return Array.from(categories).sort();
  },
};
