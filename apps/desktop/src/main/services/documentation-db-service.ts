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
 * Catégoriser automatiquement un fichier selon son nom/chemin
 */
function categorizeFile(filename: string, filepath: string): {
  category: 'guide' | 'features' | 'roadmap' | 'api' | 'faq' | 'changelog';
  icon: string;
  order: number;
} {
  const lower = filename.toLowerCase();
  const pathLower = filepath.toLowerCase();

  // Guides utilisateur (ordre prioritaire)
  if (lower.includes('readme') && !pathLower.includes('scripts') && !pathLower.includes('resources')) {
    return { category: 'guide', icon: '📖', order: 1 };
  }
  if (lower.includes('quick') || lower.includes('start')) {
    return { category: 'guide', icon: '⚡', order: 2 };
  }
  if (lower.includes('first') || lower.includes('demarrage')) {
    return { category: 'guide', icon: '🎉', order: 3 };
  }
  if (lower.includes('guide') || lower.includes('test')) {
    return { category: 'guide', icon: '📚', order: 5 };
  }
  if (lower.includes('beta')) {
    return { category: 'guide', icon: '🧪', order: 6 };
  }

  // Features et spécifications
  if (lower.includes('cahier') || lower.includes('spec')) {
    return { category: 'features', icon: '📋', order: 0 };
  }

  // Roadmap et planification
  if (lower.includes('plan') || lower.includes('roadmap') || lower.includes('consolidation')) {
    return { category: 'roadmap', icon: '🗺️', order: 0 };
  }
  if (lower.includes('workflow')) {
    return { category: 'roadmap', icon: '🔄', order: 1 };
  }

  // Changelog et historique
  if (lower.includes('changelog') || lower.includes('session') || lower.includes('resume')) {
    return { category: 'changelog', icon: '📝', order: 0 };
  }

  // Documentation technique/API
  if (lower.includes('development') || lower.includes('technique') || lower.includes('analysis') ||
      lower.includes('release') || lower.includes('setup') || lower.includes('validation') ||
      lower.includes('documentation_setup') || lower.includes('packages') || lower.includes('todo')) {
    return { category: 'api', icon: '🔧', order: 0 };
  }

  // Par défaut selon le chemin
  if (pathLower.includes('docs/')) {
    return { category: 'guide', icon: '📄', order: 90 };
  }
  if (pathLower.includes('scripts/')) {
    return { category: 'api', icon: '⚙️', order: 90 };
  }

  // Par défaut: guide
  return { category: 'guide', icon: '📄', order: 99 };
}

/**
 * Générer un slug à partir d'un nom de fichier
 */
function generateSlug(filename: string, category: string): string {
  const base = filename
    .replace(/\.md$/i, '')
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/\s+/g, '-');

  return `${category}/${base}`;
}

/**
 * Générer un titre à partir d'un nom de fichier
 */
function generateTitle(filename: string): string {
  return filename
    .replace(/\.md$/i, '')
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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

    console.log('[Documentation] Auto-importing all documentation files...');

    const fs = await import('fs');
    const path = await import('path');

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

    // Scanner récursivement tous les fichiers .md
    const findMarkdownFiles = (dir: string, baseDir: string = dir): string[] => {
      let results: string[] = [];
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        // Ignorer certains dossiers
        if (stat.isDirectory()) {
          if (!['node_modules', '.git', 'dist', 'build', 'release', 'coverage'].includes(item)) {
            results = results.concat(findMarkdownFiles(fullPath, baseDir));
          }
        } else if (stat.isFile() && item.toLowerCase().endsWith('.md')) {
          results.push(fullPath);
        }
      }

      return results;
    };

    // Trouver tous les fichiers markdown
    const allMdFiles = findMarkdownFiles(appRoot);
    console.log(`[Documentation] Found ${allMdFiles.length} markdown files`);

    let imported = 0;
    const stmt = sqlite.prepare(`
      INSERT INTO documentation (
        id, slug, title, content, category, parent_slug, "order",
        icon, description, tags, version, published, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const filePath of allMdFiles) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const filename = path.basename(filePath);
        const relativePath = path.relative(appRoot, filePath);

        // Catégoriser automatiquement
        const { category, icon, order } = categorizeFile(filename, relativePath);

        // Générer slug et titre
        const slug = generateSlug(filename, category);
        const title = generateTitle(filename);
        const docId = `doc-${slug.replace(/\//g, '-')}`;

        // Extraire une description du contenu (premier paragraphe)
        const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
        const description = lines[0]?.substring(0, 150) || '';

        stmt.run(
          docId,
          slug,
          title,
          content,
          category,
          null,
          order,
          icon,
          description,
          '[]',
          '1.0',
          1,
          now,
          now
        );

        imported++;
        console.log(`[Documentation] ✓ ${filename} → ${category}/${filename.replace('.md', '')}`);
      } catch (error) {
        console.error(`[Documentation] Error importing ${filePath}:`, error);
      }
    }

    console.log(`[Documentation] Auto-import completed: ${imported + 1} documents imported (${imported} files + welcome page)`);
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
