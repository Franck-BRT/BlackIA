-- Migration: Add attachments table with dual RAG support
-- Created: 2025-11-11
-- Description: Add attachments table with text and vision RAG indexation support, tags, and polymorphic relations

-- Create attachments table
CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,

    -- File metadata
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size INTEGER NOT NULL,

    -- Paths (relative to userData)
    file_path TEXT NOT NULL,
    thumbnail_path TEXT,

    -- Extracted content
    extracted_text TEXT,
    extracted_metadata TEXT,

    -- Polymorphic relation (reusable for any entity)
    entity_type TEXT NOT NULL CHECK(entity_type IN ('message', 'workflow', 'document', 'persona', 'prompt', 'conversation')),
    entity_id TEXT NOT NULL,

    -- Tags (manual organization)
    tags TEXT NOT NULL DEFAULT '[]',

    -- RAG MODE CONFIGURATION
    rag_mode TEXT NOT NULL DEFAULT 'text' CHECK(rag_mode IN ('text', 'vision', 'hybrid', 'none')),

    -- TEXT RAG (textual embeddings via Ollama)
    is_indexed_text INTEGER NOT NULL DEFAULT 0,
    text_embedding_model TEXT,
    text_chunk_count INTEGER NOT NULL DEFAULT 0,

    -- VISION RAG (visual embeddings via MLX-VLM)
    is_indexed_vision INTEGER NOT NULL DEFAULT 0,
    vision_embedding_model TEXT,
    vision_patch_count INTEGER NOT NULL DEFAULT 0,
    page_count INTEGER NOT NULL DEFAULT 0,

    -- Indexing metadata
    last_indexed_at INTEGER,
    indexing_duration INTEGER,
    indexing_error TEXT,

    -- General metadata
    uploaded_by TEXT,
    is_analyzed INTEGER NOT NULL DEFAULT 0,

    -- Timestamps
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS attachments_entity_idx ON attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS attachments_indexed_text_idx ON attachments(is_indexed_text);
CREATE INDEX IF NOT EXISTS attachments_indexed_vision_idx ON attachments(is_indexed_vision);
CREATE INDEX IF NOT EXISTS attachments_rag_mode_idx ON attachments(rag_mode);
CREATE INDEX IF NOT EXISTS attachments_created_at_idx ON attachments(created_at DESC);
