-- Migration initiale BlackIA
-- Création des tables principales

-- Table personas
CREATE TABLE IF NOT EXISTS `personas` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `description` text NOT NULL,
  `system_prompt` text NOT NULL,
  `model` text,
  `temperature` real,
  `max_tokens` integer,
  `avatar` text NOT NULL,
  `color` text NOT NULL,
  `category` text,
  `tags` text DEFAULT '[]' NOT NULL,
  `is_default` integer DEFAULT 0 NOT NULL,
  `is_favorite` integer DEFAULT 0 NOT NULL,
  `usage_count` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

-- Table folders
CREATE TABLE IF NOT EXISTS `folders` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `color` text NOT NULL,
  `created_at` integer NOT NULL
);

-- Table conversations
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `persona_id` text,
  `folder_id` text,
  `tags` text DEFAULT '[]' NOT NULL,
  `is_favorite` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL,
  FOREIGN KEY (`persona_id`) REFERENCES `personas`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON DELETE SET NULL
);

-- Table messages
CREATE TABLE IF NOT EXISTS `messages` (
  `id` text PRIMARY KEY NOT NULL,
  `conversation_id` text NOT NULL,
  `role` text NOT NULL,
  `content` text NOT NULL,
  `images` text,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE
);

-- Indexes pour améliorer les performances
CREATE INDEX IF NOT EXISTS `idx_conversations_persona` ON `conversations` (`persona_id`);
CREATE INDEX IF NOT EXISTS `idx_conversations_folder` ON `conversations` (`folder_id`);
CREATE INDEX IF NOT EXISTS `idx_messages_conversation` ON `messages` (`conversation_id`);
CREATE INDEX IF NOT EXISTS `idx_personas_category` ON `personas` (`category`);
CREATE INDEX IF NOT EXISTS `idx_personas_favorite` ON `personas` (`is_favorite`);
CREATE INDEX IF NOT EXISTS `idx_conversations_favorite` ON `conversations` (`is_favorite`);
