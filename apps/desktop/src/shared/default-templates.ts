/**
 * Templates de workflow par défaut
 * Ces templates sont initialisés au premier lancement de l'application
 */

export interface DefaultTemplate {
  name: string;
  description: string;
  category: string;
  tags: string;
  nodes: string;
  edges: string;
}

/**
 * Template 1: AI Chat Simple
 * Un workflow conversationnel basique avec IA
 */
const aiChatSimpleTemplate: DefaultTemplate = {
  name: 'AI Chat Simple',
  description: 'Workflow conversationnel basique avec un modèle IA. Idéal pour créer un chatbot ou un assistant virtuel simple.',
  category: 'ai',
  tags: JSON.stringify(['chat', 'conversation', 'ia', 'assistant']),
  nodes: JSON.stringify([
    {
      id: 'input-1',
      type: 'input',
      position: { x: 100, y: 200 },
      data: {
        label: 'Question utilisateur',
        inputValue: '',
      },
    },
    {
      id: 'ai-1',
      type: 'aiPrompt',
      position: { x: 400, y: 200 },
      data: {
        label: 'Assistant IA',
        promptTemplate: 'Tu es un assistant IA serviable. Réponds à la question suivante de manière claire et concise:\n\n{{input}}',
        model: 'llama3.2:latest',
        temperature: 0.7,
        maxTokens: 2000,
      },
    },
    {
      id: 'output-1',
      type: 'output',
      position: { x: 700, y: 200 },
      data: {
        label: 'Réponse',
      },
    },
  ]),
  edges: JSON.stringify([
    {
      id: 'e1-2',
      source: 'input-1',
      target: 'ai-1',
      type: 'smoothstep',
    },
    {
      id: 'e2-3',
      source: 'ai-1',
      target: 'output-1',
      type: 'smoothstep',
    },
  ]),
};

/**
 * Template 2: Analyse CSV
 * Workflow pour analyser et transformer des données CSV
 */
const csvAnalysisTemplate: DefaultTemplate = {
  name: 'Analyse CSV',
  description: 'Workflow pour analyser des données CSV, les transformer et générer un résumé avec IA. Parfait pour l\'analyse de données.',
  category: 'data',
  tags: JSON.stringify(['csv', 'données', 'analyse', 'transformation']),
  nodes: JSON.stringify([
    {
      id: 'input-1',
      type: 'input',
      position: { x: 100, y: 200 },
      data: {
        label: 'Données CSV',
        inputValue: '',
      },
    },
    {
      id: 'transform-1',
      type: 'transform',
      position: { x: 400, y: 200 },
      data: {
        label: 'Parser CSV',
        transformType: 'format',
      },
    },
    {
      id: 'loop-1',
      type: 'loop',
      position: { x: 700, y: 200 },
      data: {
        label: 'Pour chaque ligne',
        loopType: 'count',
        loopCount: 10,
      },
    },
    {
      id: 'ai-1',
      type: 'aiPrompt',
      position: { x: 1000, y: 200 },
      data: {
        label: 'Analyser ligne',
        promptTemplate: 'Analyse cette ligne de données CSV et extrait les informations clés:\n\n{{row}}',
        model: 'llama3.2:latest',
        temperature: 0.3,
        maxTokens: 1000,
      },
    },
    {
      id: 'output-1',
      type: 'output',
      position: { x: 1300, y: 200 },
      data: {
        label: 'Résultats',
      },
    },
  ]),
  edges: JSON.stringify([
    {
      id: 'e1-2',
      source: 'input-1',
      target: 'transform-1',
      type: 'smoothstep',
    },
    {
      id: 'e2-3',
      source: 'transform-1',
      target: 'loop-1',
      type: 'smoothstep',
    },
    {
      id: 'e3-4',
      source: 'loop-1',
      target: 'ai-1',
      type: 'smoothstep',
    },
    {
      id: 'e4-5',
      source: 'ai-1',
      target: 'output-1',
      type: 'smoothstep',
    },
  ]),
};

/**
 * Template 3: Génération de contenu
 * Workflow pour générer du contenu marketing, articles, posts
 */
const contentGenerationTemplate: DefaultTemplate = {
  name: 'Génération de contenu',
  description: 'Workflow pour générer du contenu marketing (articles, posts sociaux, emails) avec différents styles et tons.',
  category: 'content',
  tags: JSON.stringify(['contenu', 'marketing', 'rédaction', 'génération']),
  nodes: JSON.stringify([
    {
      id: 'input-1',
      type: 'input',
      position: { x: 100, y: 150 },
      data: {
        label: 'Sujet',
        inputValue: '',
      },
    },
    {
      id: 'input-2',
      type: 'input',
      position: { x: 100, y: 300 },
      data: {
        label: 'Ton souhaité',
        inputValue: '',
      },
    },
    {
      id: 'ai-1',
      type: 'aiPrompt',
      position: { x: 400, y: 200 },
      data: {
        label: 'Générer plan',
        promptTemplate: 'Crée un plan détaillé pour un article sur le sujet suivant:\n\nSujet: {{subject}}\nTon: {{tone}}\n\nFournis 3-5 sections principales.',
        model: 'llama3.2:latest',
        temperature: 0.8,
        maxTokens: 1500,
      },
    },
    {
      id: 'ai-2',
      type: 'aiPrompt',
      position: { x: 700, y: 200 },
      data: {
        label: 'Rédiger contenu',
        promptTemplate: 'En te basant sur ce plan, rédige un article complet et engageant:\n\n{{plan}}\n\nReste cohérent avec le ton: {{tone}}',
        model: 'llama3.2:latest',
        temperature: 0.9,
        maxTokens: 3000,
      },
    },
    {
      id: 'output-1',
      type: 'output',
      position: { x: 1000, y: 200 },
      data: {
        label: 'Article final',
      },
    },
  ]),
  edges: JSON.stringify([
    {
      id: 'e1-3',
      source: 'input-1',
      target: 'ai-1',
      type: 'smoothstep',
    },
    {
      id: 'e2-3',
      source: 'input-2',
      target: 'ai-1',
      type: 'smoothstep',
    },
    {
      id: 'e3-4',
      source: 'ai-1',
      target: 'ai-2',
      type: 'smoothstep',
    },
    {
      id: 'e4-5',
      source: 'ai-2',
      target: 'output-1',
      type: 'smoothstep',
    },
  ]),
};

/**
 * Template 4: Résumé de document
 * Workflow pour résumer des documents longs avec niveaux de détail
 */
const documentSummaryTemplate: DefaultTemplate = {
  name: 'Résumé de document',
  description: 'Workflow intelligent pour résumer des documents longs avec plusieurs niveaux de détail (court, moyen, détaillé).',
  category: 'productivity',
  tags: JSON.stringify(['résumé', 'document', 'synthèse', 'productivité']),
  nodes: JSON.stringify([
    {
      id: 'input-1',
      type: 'input',
      position: { x: 100, y: 200 },
      data: {
        label: 'Document',
        inputValue: '',
      },
    },
    {
      id: 'switch-1',
      type: 'switch',
      position: { x: 400, y: 200 },
      data: {
        label: 'Type de résumé',
      },
    },
    {
      id: 'ai-1',
      type: 'aiPrompt',
      position: { x: 700, y: 100 },
      data: {
        label: 'Résumé court',
        promptTemplate: 'Résume ce document en 2-3 phrases maximum:\n\n{{document}}',
        model: 'llama3.2:latest',
        temperature: 0.3,
        maxTokens: 500,
      },
    },
    {
      id: 'ai-2',
      type: 'aiPrompt',
      position: { x: 700, y: 200 },
      data: {
        label: 'Résumé moyen',
        promptTemplate: 'Résume ce document en un paragraphe de 5-7 phrases:\n\n{{document}}',
        model: 'llama3.2:latest',
        temperature: 0.3,
        maxTokens: 1000,
      },
    },
    {
      id: 'ai-3',
      type: 'aiPrompt',
      position: { x: 700, y: 300 },
      data: {
        label: 'Résumé détaillé',
        promptTemplate: 'Crée un résumé détaillé avec points clés et sections:\n\n{{document}}',
        model: 'llama3.2:latest',
        temperature: 0.3,
        maxTokens: 2000,
      },
    },
    {
      id: 'output-1',
      type: 'output',
      position: { x: 1000, y: 200 },
      data: {
        label: 'Résumé',
      },
    },
  ]),
  edges: JSON.stringify([
    {
      id: 'e1-2',
      source: 'input-1',
      target: 'switch-1',
      type: 'smoothstep',
    },
    {
      id: 'e2-3a',
      source: 'switch-1',
      target: 'ai-1',
      type: 'smoothstep',
    },
    {
      id: 'e2-3b',
      source: 'switch-1',
      target: 'ai-2',
      type: 'smoothstep',
    },
    {
      id: 'e2-3c',
      source: 'switch-1',
      target: 'ai-3',
      type: 'smoothstep',
    },
    {
      id: 'e3a-4',
      source: 'ai-1',
      target: 'output-1',
      type: 'smoothstep',
    },
    {
      id: 'e3b-4',
      source: 'ai-2',
      target: 'output-1',
      type: 'smoothstep',
    },
    {
      id: 'e3c-4',
      source: 'ai-3',
      target: 'output-1',
      type: 'smoothstep',
    },
  ]),
};

/**
 * Template 5: Traduction multilingue
 * Workflow pour traduire du contenu en plusieurs langues
 */
const multiLanguageTranslationTemplate: DefaultTemplate = {
  name: 'Traduction multilingue',
  description: 'Workflow pour traduire du contenu en plusieurs langues avec vérification de qualité et adaptation culturelle.',
  category: 'translation',
  tags: JSON.stringify(['traduction', 'langues', 'international', 'localisation']),
  nodes: JSON.stringify([
    {
      id: 'input-1',
      type: 'input',
      position: { x: 100, y: 200 },
      data: {
        label: 'Texte source',
        inputValue: '',
      },
    },
    {
      id: 'condition-1',
      type: 'condition',
      position: { x: 400, y: 200 },
      data: {
        label: 'Langue détectée?',
        condition: '',
      },
    },
    {
      id: 'loop-1',
      type: 'loop',
      position: { x: 700, y: 200 },
      data: {
        label: 'Pour chaque langue',
        loopType: 'count',
        loopCount: 3,
      },
    },
    {
      id: 'ai-1',
      type: 'aiPrompt',
      position: { x: 1000, y: 200 },
      data: {
        label: 'Traduire',
        promptTemplate: 'Traduis ce texte en {{target_language}} en respectant les nuances culturelles:\n\n{{text}}\n\nAssure-toi que la traduction est naturelle et idiomatique.',
        model: 'llama3.2:latest',
        temperature: 0.5,
        maxTokens: 2000,
      },
    },
    {
      id: 'transform-1',
      type: 'transform',
      position: { x: 1300, y: 200 },
      data: {
        label: 'Formater résultats',
        transformType: 'format',
      },
    },
    {
      id: 'output-1',
      type: 'output',
      position: { x: 1600, y: 200 },
      data: {
        label: 'Traductions',
      },
    },
  ]),
  edges: JSON.stringify([
    {
      id: 'e1-2',
      source: 'input-1',
      target: 'condition-1',
      type: 'smoothstep',
    },
    {
      id: 'e2-3',
      source: 'condition-1',
      target: 'loop-1',
      type: 'smoothstep',
    },
    {
      id: 'e3-4',
      source: 'loop-1',
      target: 'ai-1',
      type: 'smoothstep',
    },
    {
      id: 'e4-5',
      source: 'ai-1',
      target: 'transform-1',
      type: 'smoothstep',
    },
    {
      id: 'e5-6',
      source: 'transform-1',
      target: 'output-1',
      type: 'smoothstep',
    },
  ]),
};

/**
 * Export de tous les templates par défaut
 */
export const defaultTemplates: DefaultTemplate[] = [
  aiChatSimpleTemplate,
  csvAnalysisTemplate,
  contentGenerationTemplate,
  documentSummaryTemplate,
  multiLanguageTranslationTemplate,
];

/**
 * Vérifier si les templates par défaut ont déjà été initialisés
 * Utilise une clé dans localStorage pour éviter de réinitialiser à chaque lancement
 */
export const DEFAULT_TEMPLATES_KEY = 'blackia_default_templates_initialized';

/**
 * Marquer les templates par défaut comme initialisés
 */
export function markDefaultTemplatesAsInitialized(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(DEFAULT_TEMPLATES_KEY, 'true');
  }
}

/**
 * Vérifier si les templates par défaut ont déjà été initialisés
 */
export function areDefaultTemplatesInitialized(): boolean {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(DEFAULT_TEMPLATES_KEY) === 'true';
  }
  return false;
}
