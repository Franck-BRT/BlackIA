import { eq, desc, and, or, sql, like } from 'drizzle-orm';
import { getDatabase } from '../database';
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
  const db = getDatabase();

  try {
    // Créer la table virtuelle FTS5 si elle n'existe pas
    await db.run(sql`
      CREATE VIRTUAL TABLE IF NOT EXISTS documentation_fts USING fts5(
        id UNINDEXED,
        title,
        content,
        description,
        tags,
        category UNINDEXED,
        slug UNINDEXED,
        tokenize = 'porter unicode61'
      )
    `);

    // Créer les triggers pour maintenir le FTS à jour
    // Trigger INSERT
    await db.run(sql`
      CREATE TRIGGER IF NOT EXISTS documentation_fts_insert AFTER INSERT ON documentation
      BEGIN
        INSERT INTO documentation_fts(id, title, content, description, tags, category, slug)
        VALUES (new.id, new.title, new.content, new.description, new.tags, new.category, new.slug);
      END
    `);

    // Trigger UPDATE
    await db.run(sql`
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
      END
    `);

    // Trigger DELETE
    await db.run(sql`
      CREATE TRIGGER IF NOT EXISTS documentation_fts_delete AFTER DELETE ON documentation
      BEGIN
        DELETE FROM documentation_fts WHERE id = old.id;
      END
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
    .where(and(eq(documentation.category, category), eq(documentation.published, true)))
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

  if (!query || query.trim().length < 2) {
    return [];
  }

  try {
    // Recherche FTS5 avec snippet et rank
    const results = await db.all<SearchResult>(sql`
      SELECT
        d.id,
        d.slug,
        d.title,
        d.content,
        d.category,
        d.parentSlug,
        d.order,
        d.icon,
        d.description,
        d.tags,
        d.version,
        d.published,
        d.createdAt,
        d.updatedAt,
        snippet(documentation_fts, 1, '<mark>', '</mark>', '...', 30) as snippet,
        rank as rank
      FROM documentation_fts
      JOIN documentation d ON documentation_fts.id = d.id
      WHERE documentation_fts MATCH ${query}
        AND d.published = 1
      ORDER BY rank
      LIMIT ${limit}
    `);

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
      .then((docs) =>
        docs.map((doc) => ({
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

// ==================== EXPORTS ====================

export const DocumentationService = {
  // Initialization
  initializeFTS: initializeDocumentationFTS,

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
