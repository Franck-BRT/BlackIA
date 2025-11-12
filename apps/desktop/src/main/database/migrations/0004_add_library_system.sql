-- Migration: Add Library System
-- Description: Add tables for document libraries with RAG validation
-- Author: Claude AI
-- Date: 2025-11-12

-- ============================================================================
-- Table: libraries
-- Description: Collections of documents with custom RAG configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS `libraries` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `description` text DEFAULT '' NOT NULL,
  `color` text DEFAULT 'blue' NOT NULL,
  `icon` text DEFAULT '📚' NOT NULL,
  `rag_config` text DEFAULT '{}' NOT NULL,
  `storage_path` text NOT NULL,
  `document_count` integer DEFAULT 0 NOT NULL,
  `total_size` integer DEFAULT 0 NOT NULL,
  `total_chunks` integer DEFAULT 0 NOT NULL,
  `total_patches` integer DEFAULT 0 NOT NULL,
  `allowed_tags` text DEFAULT '[]' NOT NULL,
  `is_favorite` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

-- Index for fast library name search
CREATE INDEX IF NOT EXISTS `libraries_name_idx` ON `libraries` (`name`);

-- ============================================================================
-- Table: library_documents
-- Description: Documents in libraries with validation status
-- ============================================================================
CREATE TABLE IF NOT EXISTS `library_documents` (
  `id` text PRIMARY KEY NOT NULL,
  `library_id` text NOT NULL,
  `filename` text NOT NULL,
  `original_name` text NOT NULL,
  `mime_type` text NOT NULL,
  `size` integer NOT NULL,
  `file_path` text NOT NULL,
  `thumbnail_path` text,
  `extracted_text` text,
  `extracted_metadata` text,
  `tags` text DEFAULT '[]' NOT NULL,
  `rag_mode` text DEFAULT 'text' NOT NULL CHECK(rag_mode IN ('text', 'vision', 'hybrid', 'none')),
  `is_indexed_text` integer DEFAULT 0 NOT NULL,
  `text_embedding_model` text,
  `text_chunk_count` integer DEFAULT 0 NOT NULL,
  `is_indexed_vision` integer DEFAULT 0 NOT NULL,
  `vision_embedding_model` text,
  `vision_patch_count` integer DEFAULT 0 NOT NULL,
  `page_count` integer DEFAULT 0 NOT NULL,
  `validation_status` text DEFAULT 'pending' NOT NULL CHECK(validation_status IN ('pending', 'validated', 'needs_review', 'rejected')),
  `validated_by` text,
  `validated_at` integer,
  `validation_notes` text,
  `last_indexed_at` integer,
  `indexing_duration` integer,
  `indexing_error` text,
  `uploaded_by` text,
  `is_analyzed` integer DEFAULT 0 NOT NULL,
  `is_favorite` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`library_id`) REFERENCES `libraries`(`id`) ON DELETE CASCADE
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS `library_documents_library_idx` ON `library_documents` (`library_id`);
CREATE INDEX IF NOT EXISTS `library_documents_validation_idx` ON `library_documents` (`validation_status`);
CREATE INDEX IF NOT EXISTS `library_documents_rag_mode_idx` ON `library_documents` (`rag_mode`);

-- ============================================================================
-- Table: manual_chunks
-- Description: Manually modified chunks for RAG improvement
-- ============================================================================
CREATE TABLE IF NOT EXISTS `manual_chunks` (
  `id` text PRIMARY KEY NOT NULL,
  `document_id` text NOT NULL,
  `original_chunk_id` text NOT NULL,
  `modified_text` text NOT NULL,
  `reason` text NOT NULL,
  `modified_by` text NOT NULL,
  `modified_at` integer NOT NULL,
  FOREIGN KEY (`document_id`) REFERENCES `library_documents`(`id`) ON DELETE CASCADE
);

-- Index for fast document lookup
CREATE INDEX IF NOT EXISTS `manual_chunks_document_idx` ON `manual_chunks` (`document_id`);
