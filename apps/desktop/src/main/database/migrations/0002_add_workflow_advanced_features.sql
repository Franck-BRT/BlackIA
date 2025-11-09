-- Migration: Add advanced workflow features
-- Created: 2025-11-09
-- Description: Add workflow templates, versions, variables, groups, and annotations support

-- 1. Add groups and annotations columns to workflows table
ALTER TABLE workflows ADD COLUMN groups TEXT NOT NULL DEFAULT '[]';
ALTER TABLE workflows ADD COLUMN annotations TEXT NOT NULL DEFAULT '[]';

-- 2. Create workflow_templates table
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
    usage_count INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- 3. Create workflow_versions table
CREATE TABLE IF NOT EXISTS workflow_versions (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    version TEXT NOT NULL,
    message TEXT NOT NULL,
    author TEXT,
    nodes TEXT NOT NULL,
    edges TEXT NOT NULL,
    groups TEXT NOT NULL DEFAULT '[]',
    annotations TEXT NOT NULL DEFAULT '[]',
    variables TEXT,
    parent_id TEXT,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

-- 4. Create workflow_variables table
CREATE TABLE IF NOT EXISTS workflow_variables (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    value TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('string', 'number', 'boolean', 'object', 'array')),
    description TEXT,
    scope TEXT NOT NULL CHECK(scope IN ('workflow', 'global', 'environment')),
    workflow_id TEXT,
    encrypted INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

-- 5. Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workflow_versions_workflow_id ON workflow_versions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_versions_created_at ON workflow_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_workflow_variables_workflow_id ON workflow_variables(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_variables_scope ON workflow_variables(scope);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_usage_count ON workflow_templates(usage_count DESC);
