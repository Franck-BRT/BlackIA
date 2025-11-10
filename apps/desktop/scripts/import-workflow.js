#!/usr/bin/env node

/**
 * Script d'importation de workflow dans la base de données BlackIA
 * Usage: node import-workflow.js <workflow-json-file>
 *
 * Exemple: node import-workflow.js ../../persona-generator-workflow.json
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Déterminer le chemin de la base de données
function getDbPath() {
  // Sur Linux/Mac: ~/.config/blackia-desktop/blackia.db
  // Sur Windows: %APPDATA%/blackia-desktop/blackia.db
  const platform = process.platform;
  const homeDir = process.env.HOME || process.env.USERPROFILE;

  let userDataPath;
  if (platform === 'darwin') {
    userDataPath = path.join(homeDir, 'Library', 'Application Support', 'blackia-desktop');
  } else if (platform === 'win32') {
    userDataPath = path.join(process.env.APPDATA, 'blackia-desktop');
  } else {
    // Linux
    userDataPath = path.join(homeDir, '.config', 'blackia-desktop');
  }

  return path.join(userDataPath, 'blackia.db');
}

// Fonction pour créer les tables si elles n'existent pas
function ensureTablesExist(db) {
  console.log('[Import] Ensuring tables exist...');

  db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      nodes TEXT NOT NULL DEFAULT '[]',
      edges TEXT NOT NULL DEFAULT '[]',
      groups TEXT NOT NULL DEFAULT '[]',
      annotations TEXT NOT NULL DEFAULT '[]',
      icon TEXT NOT NULL DEFAULT '🔄',
      color TEXT NOT NULL DEFAULT 'purple',
      category TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      is_favorite INTEGER NOT NULL DEFAULT 0,
      usage_count INTEGER NOT NULL DEFAULT 0,
      is_template INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workflow_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      nodes TEXT NOT NULL DEFAULT '[]',
      edges TEXT NOT NULL DEFAULT '[]',
      variables TEXT,
      icon TEXT NOT NULL DEFAULT '📋',
      thumbnail TEXT,
      category TEXT NOT NULL,
      tags TEXT NOT NULL DEFAULT '[]',
      difficulty TEXT CHECK(difficulty IN ('beginner', 'intermediate', 'advanced')),
      estimated_duration INTEGER,
      usage_count INTEGER NOT NULL DEFAULT 0,
      is_default INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  console.log('[Import] ✅ Tables ensured');
}

// Fonction pour importer le workflow
function importWorkflow(workflowPath, asTemplate = true) {
  console.log('\n🔄 BlackIA Workflow Importer\n');

  // Vérifier que le fichier existe
  if (!fs.existsSync(workflowPath)) {
    console.error(`❌ Error: File not found: ${workflowPath}`);
    process.exit(1);
  }

  // Lire le fichier JSON
  console.log(`[Import] Reading workflow from: ${workflowPath}`);
  let workflow;
  try {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    workflow = JSON.parse(content);
    console.log(`[Import] ✅ Workflow loaded: ${workflow.name}`);
  } catch (error) {
    console.error(`❌ Error parsing JSON: ${error.message}`);
    process.exit(1);
  }

  // Valider la structure
  if (!workflow.id || !workflow.name || !workflow.nodes || !workflow.edges) {
    console.error('❌ Error: Invalid workflow structure. Required fields: id, name, nodes, edges');
    process.exit(1);
  }

  // Obtenir le chemin de la DB
  const dbPath = getDbPath();
  console.log(`[Import] Database path: ${dbPath}`);

  // Vérifier que la DB existe
  if (!fs.existsSync(dbPath)) {
    console.error(`❌ Error: Database not found at ${dbPath}`);
    console.error('Please run the BlackIA app at least once to create the database.');
    process.exit(1);
  }

  // Se connecter à la DB
  console.log('[Import] Connecting to database...');
  const db = new Database(dbPath);
  db.pragma('foreign_keys = ON');

  try {
    // Créer les tables si nécessaire
    ensureTablesExist(db);

    // Préparer les données
    const now = Date.now();
    const tableName = asTemplate ? 'workflow_templates' : 'workflows';

    const data = {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description || '',
      nodes: JSON.stringify(workflow.nodes),
      edges: JSON.stringify(workflow.edges),
      icon: workflow.metadata?.icon || workflow.icon || '🔄',
      category: workflow.metadata?.category || workflow.category || 'AI Generation',
      tags: JSON.stringify(workflow.tags || []),
      created_at: now,
      updated_at: now
    };

    if (asTemplate) {
      // Données spécifiques aux templates
      data.variables = workflow.metadata?.variables ? JSON.stringify(workflow.metadata.variables) : null;
      data.thumbnail = null;
      data.difficulty = workflow.metadata?.difficulty || 'intermediate';
      data.estimated_duration = workflow.metadata?.estimatedDuration || 60;
      data.usage_count = 0;
      data.is_default = 0;

      // Vérifier si le template existe déjà
      const existing = db.prepare('SELECT id FROM workflow_templates WHERE id = ?').get(data.id);

      if (existing) {
        console.log(`[Import] Template already exists, updating...`);
        const updateStmt = db.prepare(`
          UPDATE workflow_templates
          SET name = ?, description = ?, nodes = ?, edges = ?, variables = ?,
              icon = ?, category = ?, tags = ?, difficulty = ?, estimated_duration = ?,
              updated_at = ?
          WHERE id = ?
        `);

        updateStmt.run(
          data.name,
          data.description,
          data.nodes,
          data.edges,
          data.variables,
          data.icon,
          data.category,
          data.tags,
          data.difficulty,
          data.estimated_duration,
          data.updated_at,
          data.id
        );
      } else {
        console.log(`[Import] Creating new template...`);
        const insertStmt = db.prepare(`
          INSERT INTO workflow_templates (
            id, name, description, nodes, edges, variables, icon, thumbnail,
            category, tags, difficulty, estimated_duration, usage_count, is_default,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertStmt.run(
          data.id,
          data.name,
          data.description,
          data.nodes,
          data.edges,
          data.variables,
          data.icon,
          data.thumbnail,
          data.category,
          data.tags,
          data.difficulty,
          data.estimated_duration,
          data.usage_count,
          data.is_default,
          data.created_at,
          data.updated_at
        );
      }
    } else {
      // Données spécifiques aux workflows
      data.groups = JSON.stringify(workflow.groups || []);
      data.annotations = JSON.stringify(workflow.annotations || []);
      data.color = workflow.color || 'purple';
      data.is_favorite = 0;
      data.usage_count = 0;
      data.is_template = 0;

      // Vérifier si le workflow existe déjà
      const existing = db.prepare('SELECT id FROM workflows WHERE id = ?').get(data.id);

      if (existing) {
        console.log(`[Import] Workflow already exists, updating...`);
        const updateStmt = db.prepare(`
          UPDATE workflows
          SET name = ?, description = ?, nodes = ?, edges = ?, groups = ?,
              annotations = ?, icon = ?, color = ?, category = ?, tags = ?,
              updated_at = ?
          WHERE id = ?
        `);

        updateStmt.run(
          data.name,
          data.description,
          data.nodes,
          data.edges,
          data.groups,
          data.annotations,
          data.icon,
          data.color,
          data.category,
          data.tags,
          data.updated_at,
          data.id
        );
      } else {
        console.log(`[Import] Creating new workflow...`);
        const insertStmt = db.prepare(`
          INSERT INTO workflows (
            id, name, description, nodes, edges, groups, annotations, icon, color,
            category, tags, is_favorite, usage_count, is_template,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        insertStmt.run(
          data.id,
          data.name,
          data.description,
          data.nodes,
          data.edges,
          data.groups,
          data.annotations,
          data.icon,
          data.color,
          data.category,
          data.tags,
          data.is_favorite,
          data.usage_count,
          data.is_template,
          data.created_at,
          data.updated_at
        );
      }
    }

    console.log(`\n✅ Workflow imported successfully!`);
    console.log(`   Name: ${data.name}`);
    console.log(`   ID: ${data.id}`);
    console.log(`   Type: ${asTemplate ? 'Template' : 'Workflow'}`);
    console.log(`   Nodes: ${workflow.nodes.length}`);
    console.log(`   Edges: ${workflow.edges.length}`);
    console.log(`\n💡 Restart BlackIA to see the changes.\n`);

  } catch (error) {
    console.error(`\n❌ Error importing workflow: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Main
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: node import-workflow.js <workflow-json-file> [--as-workflow]

Options:
  --as-workflow    Import as regular workflow instead of template (default: template)

Examples:
  node import-workflow.js ../../persona-generator-workflow.json
  node import-workflow.js my-workflow.json --as-workflow
`);
    process.exit(1);
  }

  const workflowPath = path.resolve(args[0]);
  const asTemplate = !args.includes('--as-workflow');

  importWorkflow(workflowPath, asTemplate);
}

module.exports = { importWorkflow };
