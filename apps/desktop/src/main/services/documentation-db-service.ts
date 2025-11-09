import { eq, desc, and, or, sql, like } from 'drizzle-orm';
import { getDatabase, getSqliteInstance } from '../database/client';
import { documentation, type Documentation, type NewDocumentation } from '../database/schema';

/**
 * Service pour gérer la documentation intégrée
 * Utilise SQLite FTS5 pour la recherche full-text
 */

// ==================== FTS5 INITIALIZATION ====================

/**
 * Initialiser la table FTS5 pour la recherche full-text
 * Doit être appelé au démarrage de l'app
 */
export async function initializeDocumentationFTS(): Promise<void> {
  const sqlite = getSqliteInstance();

  try {
    // Créer la table virtuelle FTS5 si elle n'existe pas
    sqlite.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS documentation_fts USING fts5(
        id UNINDEXED,
        title,
        content,
        description,
        tags,
        category UNINDEXED,
        slug UNINDEXED,
        tokenize = 'porter unicode61'
      );
    `);

    // Créer les triggers pour maintenir le FTS à jour
    // Trigger INSERT
    sqlite.exec(`
      CREATE TRIGGER IF NOT EXISTS documentation_fts_insert AFTER INSERT ON documentation
      BEGIN
        INSERT INTO documentation_fts(id, title, content, description, tags, category, slug)
        VALUES (new.id, new.title, new.content, new.description, new.tags, new.category, new.slug);
      END;
    `);

    // Trigger UPDATE
    sqlite.exec(`
      CREATE TRIGGER IF NOT EXISTS documentation_fts_update AFTER UPDATE ON documentation
      BEGIN
        UPDATE documentation_fts
        SET title = new.title,
            content = new.content,
            description = new.description,
            tags = new.tags,
            category = new.category,
            slug = new.slug
        WHERE id = old.id;
      END;
    `);

    // Trigger DELETE
    sqlite.exec(`
      CREATE TRIGGER IF NOT EXISTS documentation_fts_delete AFTER DELETE ON documentation
      BEGIN
        DELETE FROM documentation_fts WHERE id = old.id;
      END;
    `);

    console.log('✅ Documentation FTS5 initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Documentation FTS5:', error);
    throw error;
  }
}

// ==================== CRUD OPERATIONS ====================

/**
 * Créer un nouveau document
 */
export async function createDoc(
  docData: Omit<NewDocumentation, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Documentation> {
  const db = getDatabase();

  const newDoc: NewDocumentation = {
    id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...docData,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await db.insert(documentation).values(newDoc).returning();
  return result[0];
}

/**
 * Récupérer un document par son ID
 */
export async function getDocById(id: string): Promise<Documentation | null> {
  const db = getDatabase();
  const result = await db.select().from(documentation).where(eq(documentation.id, id)).limit(1);
  return result[0] || null;
}

/**
 * Récupérer un document par son slug
 */
export async function getDocBySlug(slug: string): Promise<Documentation | null> {
  const db = getDatabase();
  const result = await db.select().from(documentation).where(eq(documentation.slug, slug)).limit(1);
  return result[0] || null;
}

/**
 * Récupérer tous les documents publiés
 */
export async function getAllDocs(): Promise<Documentation[]> {
  const db = getDatabase();
  return await db
    .select()
    .from(documentation)
    .where(eq(documentation.published, true))
    .orderBy(documentation.category, documentation.order, documentation.title);
}

/**
 * Récupérer les documents par catégorie
 */
export async function getDocsByCategory(category: string): Promise<Documentation[]> {
  const db = getDatabase();
  return await db
    .select()
    .from(documentation)
    .where(and(sql`${documentation.category} = ${category}`, eq(documentation.published, true)))
    .orderBy(documentation.order, documentation.title);
}

/**
 * Récupérer les documents enfants d'un parent (navigation hiérarchique)
 */
export async function getDocsByParent(parentSlug: string | null): Promise<Documentation[]> {
  const db = getDatabase();
  const condition = parentSlug
    ? and(eq(documentation.parentSlug, parentSlug), eq(documentation.published, true))
    : and(sql`${documentation.parentSlug} IS NULL`, eq(documentation.published, true));

  return await db.select().from(documentation).where(condition).orderBy(documentation.order, documentation.title);
}

/**
 * Mettre à jour un document
 */
export async function updateDoc(
  id: string,
  updates: Partial<Omit<Documentation, 'id' | 'createdAt'>>
): Promise<Documentation | null> {
  const db = getDatabase();

  const result = await db
    .update(documentation)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(documentation.id, id))
    .returning();

  return result[0] || null;
}

/**
 * Supprimer un document
 */
export async function deleteDoc(id: string): Promise<boolean> {
  const db = getDatabase();
  const result = await db.delete(documentation).where(eq(documentation.id, id)).returning();
  return result.length > 0;
}

// ==================== SEARCH WITH FTS5 ====================

export interface SearchResult extends Documentation {
  snippet: string; // Extrait de texte avec highlights
  rank: number; // Score de pertinence
}

/**
 * Rechercher dans la documentation avec FTS5
 */
export async function searchDocs(query: string, limit: number = 20): Promise<SearchResult[]> {
  const db = getDatabase();
  const sqlite = getSqliteInstance();

  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    // Recherche FTS5 avec snippet et rank
    const stmt = sqlite.prepare(`
      SELECT
        d.id,
        d.slug,
        d.title,
        d.content,
        d.category,
        d.parent_slug as parentSlug,
        d."order",
        d.icon,
        d.description,
        d.tags,
        d.version,
        d.published,
        d.created_at as createdAt,
        d.updated_at as updatedAt,
        snippet(documentation_fts, 1, '<mark>', '</mark>', '...', 30) as snippet,
        rank as rank
      FROM documentation_fts
      JOIN documentation d ON documentation_fts.id = d.id
      WHERE documentation_fts MATCH ?
        AND d.published = 1
      ORDER BY rank
      LIMIT ?
    `);

    const results = stmt.all(query, limit) as SearchResult[];
    return results;
  } catch (error) {
    console.error('Search error:', error);
    // Fallback: recherche simple avec LIKE
    return await db
      .select()
      .from(documentation)
      .where(
        and(
          or(
            like(documentation.title, `%${query}%`),
            like(documentation.content, `%${query}%`),
            like(documentation.description, `%${query}%`)
          ),
          eq(documentation.published, true)
        )
      )
      .limit(limit)
      .then((docs: Documentation[]) =>
        docs.map((doc: Documentation): SearchResult => ({
          ...doc,
          snippet: doc.description || doc.content.substring(0, 150) + '...',
          rank: 0,
        }))
      );
  }
}

// ==================== NAVIGATION HELPERS ====================

export interface DocTree {
  doc: Documentation;
  children: DocTree[];
}

/**
 * Construire l'arbre de navigation hiérarchique
 */
export async function getDocTree(): Promise<DocTree[]> {
  const allDocs = await getAllDocs();

  // Créer une map pour accès rapide
  const docMap = new Map<string, DocTree>();
  allDocs.forEach((doc) => {
    docMap.set(doc.slug, { doc, children: [] });
  });

  // Construire la hiérarchie
  const roots: DocTree[] = [];
  allDocs.forEach((doc) => {
    const node = docMap.get(doc.slug)!;
    if (doc.parentSlug && docMap.has(doc.parentSlug)) {
      docMap.get(doc.parentSlug)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/**
 * Récupérer le breadcrumb pour un document
 */
export async function getBreadcrumbs(slug: string): Promise<Documentation[]> {
  const breadcrumbs: Documentation[] = [];
  let currentSlug: string | null = slug;

  while (currentSlug) {
    const doc = await getDocBySlug(currentSlug);
    if (!doc) break;

    breadcrumbs.unshift(doc);
    currentSlug = doc.parentSlug;
  }

  return breadcrumbs;
}

// ==================== STATS ====================

/**
 * Obtenir les statistiques de la documentation
 */
export async function getDocStats(): Promise<{
  total: number;
  byCategory: Record<string, number>;
}> {
  const db = getDatabase();
  const allDocs = await getAllDocs();

  const byCategory: Record<string, number> = {};
  allDocs.forEach((doc) => {
    byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
  });

  return {
    total: allDocs.length,
    byCategory,
  };
}

// ==================== AUTO-IMPORT ====================

/**
 * Auto-import default documentation on first run
 */
export async function autoImportDefaultDocs(): Promise<void> {
  const db = getDatabase();
  const sqlite = getSqliteInstance();

  try {
    // Check if docs already exist
    const existingDocs = await db.select().from(documentation).limit(1);
    if (existingDocs.length > 0) {
      console.log('[Documentation] Docs already imported, skipping auto-import');
      return;
    }

    console.log('[Documentation] Auto-importing default documentation...');

    const fs = await import('fs');
    const path = await import('path');
    const { app } = await import('electron');

    // Get the app root directory (3 levels up from main/services)
    const appRoot = path.join(__dirname, '../../../');

    // Welcome document
    const welcomeContent = `# Bienvenue dans BlackIA

BlackIA est une suite d'assistants IA desktop pour macOS, propulsée par Ollama.

## 🌟 Fonctionnalités Principales

### 💬 Module Chat
Conversez avec des modèles IA locaux (Llama, Mistral, etc.) avec une interface intuitive et des personas personnalisables.

### 🔄 Module Workflows
Créez des workflows visuels complexes avec :
- **Templates réutilisables** - Bibliothèque de workflows prêts à l'emploi
- **Contrôle de version** - Historique Git-like de vos workflows
- **Variables globales** - Partagez des données entre workflows
- **Catégories organisées** - Classez vos workflows intelligemment

### ✨ Personas Intelligentes
Des assistants IA spécialisés pour chaque tâche :
- Développeur
- Rédacteur
- Analyste
- Designer
- Et bien plus...

### 📝 Bibliothèque de Prompts
Gérez vos prompts favoris et réutilisez-les facilement.

## 🚀 Démarrage Rapide

1. **Installation** - Consultez le Guide d'Installation
2. **Premier Lancement** - Suivez le Guide de Premier Lancement
3. **Explorez** - Testez le module Chat ou créez votre premier workflow

## 📖 Documentation

Naviguez dans les sections :
- **Guide Utilisateur** - Pour bien démarrer
- **Fonctionnalités** - Découvrez toutes les features
- **Roadmap** - Suivez l'évolution du projet
- **API & Technique** - Pour les développeurs

## 🆘 Besoin d'Aide?

Consultez la FAQ ou le Guide de Test Beta pour plus d'informations.

---

**Version:** 1.0.0
**Black Room Technologies** - 2025
`;

    const now = Date.now();
    sqlite.prepare(`
      INSERT INTO documentation (
        id, slug, title, content, category, parent_slug, "order",
        icon, description, tags, version, published, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'doc-accueil',
      'accueil',
      'Bienvenue dans BlackIA',
      welcomeContent,
      'guide',
      null,
      0,
      '🏠',
      'Page d\'accueil de la documentation BlackIA',
      '["welcome","accueil","introduction"]',
      '1.0',
      1,
      now,
      now
    );

    // Docs mapping
    const docsMapping: Record<string, any> = {
      'README.md': { slug: 'guide/getting-started', title: 'Démarrage Rapide', category: 'guide', icon: '🚀', order: 1 },
      'QUICK_START.md': { slug: 'guide/quick-start', title: 'Guide de Démarrage', category: 'guide', icon: '⚡', order: 2 },
      'DEMARRAGE.md': { slug: 'guide/installation', title: 'Installation', category: 'guide', icon: '📦', order: 3 },
      'FIRST_RUN.md': { slug: 'guide/first-run', title: 'Premier Lancement', category: 'guide', icon: '🎉', order: 4 },
      'GUIDE_TEST_CHAT.md': { slug: 'guide/chat-testing', title: 'Guide Test Chat', category: 'guide', icon: '💬', order: 5 },
      'BETA_TEST_GUIDE.md': { slug: 'guide/beta-testing', title: 'Guide de Test Beta', category: 'guide', icon: '🧪', order: 6 },
      'CAHIER_DES_CHARGES.md': { slug: 'features/specifications', title: 'Cahier des Charges', category: 'features', icon: '📋', order: 1 },
      'V1_CONSOLIDATION_PLAN.md': { slug: 'roadmap/v1-consolidation', title: 'Plan de Consolidation v1.0', category: 'roadmap', icon: '🗺️', order: 1 },
      'WORKFLOW_DEVELOPMENT_PLAN.md': { slug: 'roadmap/workflow-development', title: 'Plan de Développement Workflows', category: 'roadmap', icon: '🔄', order: 2 },
      'WORKFLOW_ADVANCED_FEATURES.md': { slug: 'roadmap/workflow-advanced', title: 'Features Avancées Workflows', category: 'roadmap', icon: '⚙️', order: 3 },
      'DEVELOPMENT.md': { slug: 'api/development', title: 'Guide de Développement', category: 'api', icon: '👨‍💻', order: 1 },
      'DECISIONS_TECHNIQUES.md': { slug: 'api/technical-decisions', title: 'Décisions Techniques', category: 'api', icon: '🏗️', order: 2 },
      'CODEBASE_ANALYSIS.md': { slug: 'api/codebase-analysis', title: 'Analyse du Codebase', category: 'api', icon: '🔍', order: 3 },
      'RELEASE_BUILD.md': { slug: 'api/release-build', title: 'Build de Release', category: 'api', icon: '📦', order: 4 },
      'SETUP_VALIDATION.md': { slug: 'api/setup-validation', title: 'Validation du Setup', category: 'api', icon: '✅', order: 5 },
      'DOCUMENTATION_SETUP.md': { slug: 'api/documentation-setup', title: 'Setup Documentation', category: 'api', icon: '📚', order: 6 },
    };

    let imported = 0;
    const stmt = sqlite.prepare(`
      INSERT INTO documentation (
        id, slug, title, content, category, parent_slug, "order",
        icon, description, tags, version, published, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const [filename, metadata] of Object.entries(docsMapping)) {
      const filePath = path.join(appRoot, filename);

      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const docId = `doc-${metadata.slug.replace(/\//g, '-')}`;

          stmt.run(
            docId,
            metadata.slug,
            metadata.title,
            content,
            metadata.category,
            null,
            metadata.order,
            metadata.icon,
            metadata.description || '',
            '[]',
            '1.0',
            1,
            now,
            now
          );

          imported++;
        } catch (error) {
          console.error(`[Documentation] Error importing ${filename}:`, error);
        }
      } else {
        console.warn(`[Documentation] File not found: ${filename}`);
      }
    }

    console.log(`[Documentation] Auto-import completed: ${imported + 1} documents imported`);
  } catch (error) {
    console.error('[Documentation] Auto-import failed:', error);
    // Don't throw - app should continue even if import fails
  }
}

// ==================== EXPORTS ====================

export const DocumentationService = {
  // Initialization
  initializeFTS: initializeDocumentationFTS,
  autoImport: autoImportDefaultDocs,

  // CRUD
  create: createDoc,
  getById: getDocById,
  getBySlug: getDocBySlug,
  getAll: getAllDocs,
  getByCategory: getDocsByCategory,
  getByParent: getDocsByParent,
  update: updateDoc,
  delete: deleteDoc,

  // Search
  search: searchDocs,

  // Navigation
  getTree: getDocTree,
  getBreadcrumbs: getBreadcrumbs,

  // Stats
  getStats: getDocStats,
};
