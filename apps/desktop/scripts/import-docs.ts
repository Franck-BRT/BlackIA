#!/usr/bin/env ts-node

/**
 * Script d'import de la documentation depuis les fichiers Markdown
 * Usage: pnpm tsx apps/desktop/scripts/import-docs.ts
 */

import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// Chemin vers la base de données
const DB_PATH = process.env.DB_PATH || path.join(process.env.HOME || '', 'Library/Application Support/blackia-dev/blackia.db');
const DOCS_ROOT = path.join(__dirname, '../../../');

// Mapping des fichiers vers les métadonnées de documentation
interface DocMetadata {
  slug: string;
  title: string;
  category: 'guide' | 'features' | 'roadmap' | 'api' | 'faq' | 'changelog';
  icon?: string;
  description?: string;
  order?: number;
  parentSlug?: string | null;
}

const DOCS_MAPPING: Record<string, DocMetadata> = {
  'README.md': {
    slug: 'guide/getting-started',
    title: 'Démarrage Rapide',
    category: 'guide',
    icon: '🚀',
    description: 'Guide de démarrage rapide pour installer et utiliser BlackIA',
    order: 1,
  },
  'QUICK_START.md': {
    slug: 'guide/quick-start',
    title: 'Guide de Démarrage',
    category: 'guide',
    icon: '⚡',
    description: 'Lancez-vous rapidement avec BlackIA',
    order: 2,
  },
  'DEMARRAGE.md': {
    slug: 'guide/installation',
    title: 'Installation',
    category: 'guide',
    icon: '📦',
    description: 'Instructions d\'installation complètes',
    order: 3,
  },
  'FIRST_RUN.md': {
    slug: 'guide/first-run',
    title: 'Premier Lancement',
    category: 'guide',
    icon: '🎉',
    description: 'Guide de configuration du premier lancement',
    order: 4,
  },
  'GUIDE_TEST_CHAT.md': {
    slug: 'guide/chat-testing',
    title: 'Guide Test Chat',
    category: 'guide',
    icon: '💬',
    description: 'Comment tester le module Chat',
    order: 5,
  },
  'BETA_TEST_GUIDE.md': {
    slug: 'guide/beta-testing',
    title: 'Guide de Test Beta',
    category: 'guide',
    icon: '🧪',
    description: 'Guide complet pour les beta-testeurs',
    order: 6,
  },
  'CAHIER_DES_CHARGES.md': {
    slug: 'features/specifications',
    title: 'Cahier des Charges',
    category: 'features',
    icon: '📋',
    description: 'Spécifications fonctionnelles complètes de BlackIA',
    order: 1,
  },
  'V1_CONSOLIDATION_PLAN.md': {
    slug: 'roadmap/v1-consolidation',
    title: 'Plan de Consolidation v1.0',
    category: 'roadmap',
    icon: '🗺️',
    description: 'Roadmap détaillée pour la version 1.0 stable',
    order: 1,
  },
  'WORKFLOW_DEVELOPMENT_PLAN.md': {
    slug: 'roadmap/workflow-development',
    title: 'Plan de Développement Workflows',
    category: 'roadmap',
    icon: '🔄',
    description: 'Roadmap et spécifications du module Workflows',
    order: 2,
  },
  'WORKFLOW_ADVANCED_FEATURES.md': {
    slug: 'roadmap/workflow-advanced',
    title: 'Features Avancées Workflows',
    category: 'roadmap',
    icon: '⚙️',
    description: 'Fonctionnalités avancées plannifiées pour les workflows',
    order: 3,
  },
  'DEVELOPMENT.md': {
    slug: 'api/development',
    title: 'Guide de Développement',
    category: 'api',
    icon: '👨‍💻',
    description: 'Guide pour contribuer au développement de BlackIA',
    order: 1,
  },
  'DECISIONS_TECHNIQUES.md': {
    slug: 'api/technical-decisions',
    title: 'Décisions Techniques',
    category: 'api',
    icon: '🏗️',
    description: 'Choix techniques et architecture',
    order: 2,
  },
  'CODEBASE_ANALYSIS.md': {
    slug: 'api/codebase-analysis',
    title: 'Analyse du Codebase',
    category: 'api',
    icon: '🔍',
    description: 'Analyse détaillée de la structure du code',
    order: 3,
  },
  'RELEASE_BUILD.md': {
    slug: 'api/release-build',
    title: 'Build de Release',
    category: 'api',
    icon: '📦',
    description: 'Processus de création des builds de production',
    order: 4,
  },
  'SETUP_VALIDATION.md': {
    slug: 'api/setup-validation',
    title: 'Validation du Setup',
    category: 'api',
    icon: '✅',
    description: 'Validation de l\'environnement de développement',
    order: 5,
  },
  'DOCUMENTATION_SETUP.md': {
    slug: 'api/documentation-setup',
    title: 'Setup Documentation',
    category: 'api',
    icon: '📚',
    description: 'Configuration du système de documentation intégrée',
    order: 6,
  },
};

/**
 * Créer un document d'accueil
 */
function createWelcomeDoc(db: Database.Database): void {
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

1. **Installation** - Consultez le [Guide d'Installation](guide/installation)
2. **Premier Lancement** - Suivez le [Guide de Premier Lancement](guide/first-run)
3. **Explorez** - Testez le module Chat ou créez votre premier workflow

## 📖 Documentation

Naviguez dans les sections :
- **Guide Utilisateur** - Pour bien démarrer
- **Fonctionnalités** - Découvrez toutes les features
- **Roadmap** - Suivez l'évolution du projet
- **API & Technique** - Pour les développeurs

## 🆘 Besoin d'Aide?

Consultez la [FAQ](faq) ou le [Guide de Test Beta](guide/beta-testing) pour plus d'informations.

---

**Version:** 1.0.0
**Black Room Technologies** - 2025
`;

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO documentation (
      id, slug, title, content, category, parent_slug, "order",
      icon, description, tags, version, published, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
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
    Date.now(),
    Date.now()
  );

  console.log('✅ Document d\'accueil créé');
}

/**
 * Importer un fichier markdown
 */
function importMarkdownFile(db: Database.Database, filename: string, metadata: DocMetadata): void {
  const filePath = path.join(DOCS_ROOT, filename);

  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${filename}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  const stmt = db.prepare(`
    INSERT OR REPLACE INTO documentation (
      id, slug, title, content, category, parent_slug, "order",
      icon, description, tags, version, published, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const docId = `doc-${metadata.slug.replace(/\//g, '-')}`;

  stmt.run(
    docId,
    metadata.slug,
    metadata.title,
    content,
    metadata.category,
    metadata.parentSlug || null,
    metadata.order || 0,
    metadata.icon || '📄',
    metadata.description || '',
    '[]',
    '1.0',
    1,
    Date.now(),
    Date.now()
  );

  console.log(`✅ Imported: ${filename} → ${metadata.slug}`);
}

/**
 * Main
 */
function main() {
  console.log('==========================================');
  console.log('📚 BlackIA - Documentation Import Script');
  console.log('==========================================\n');

  // Vérifier que la DB existe
  if (!fs.existsSync(DB_PATH)) {
    console.error(`❌ Database not found at: ${DB_PATH}`);
    console.log('💡 Tip: Launch the app once to create the database');
    process.exit(1);
  }

  console.log(`📂 Database: ${DB_PATH}`);
  console.log(`📁 Docs root: ${DOCS_ROOT}\n`);

  // Ouvrir la connexion DB
  const db = new Database(DB_PATH);

  try {
    // Créer le document d'accueil
    console.log('Creating welcome document...');
    createWelcomeDoc(db);
    console.log('');

    // Importer tous les fichiers
    console.log('Importing markdown files...\n');
    let imported = 0;
    let skipped = 0;

    for (const [filename, metadata] of Object.entries(DOCS_MAPPING)) {
      try {
        importMarkdownFile(db, filename, metadata);
        imported++;
      } catch (error) {
        console.error(`❌ Error importing ${filename}:`, error);
        skipped++;
      }
    }

    console.log('\n==========================================');
    console.log(`✅ Import completed!`);
    console.log(`   Imported: ${imported} documents`);
    console.log(`   Skipped: ${skipped} documents`);
    console.log('==========================================\n');

    // Afficher les stats
    const stats = db.prepare('SELECT category, COUNT(*) as count FROM documentation GROUP BY category').all();
    console.log('📊 Documentation by category:');
    stats.forEach((stat: any) => {
      console.log(`   ${stat.category}: ${stat.count} documents`);
    });

    console.log('\n💡 Relancez l\'app pour voir la documentation!');
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run
main();
