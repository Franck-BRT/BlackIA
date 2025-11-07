-- Migration pour les suggestions intelligentes de personas
-- Ajout de la table persona_suggestion_keywords

-- Table persona_suggestion_keywords
CREATE TABLE IF NOT EXISTS `persona_suggestion_keywords` (
  `id` text PRIMARY KEY NOT NULL,
  `keyword` text NOT NULL,
  `categories` text NOT NULL,
  `is_active` integer DEFAULT 1 NOT NULL,
  `is_default` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

-- Index pour améliorer les performances de recherche
CREATE INDEX IF NOT EXISTS `idx_persona_suggestion_keywords_keyword` ON `persona_suggestion_keywords` (`keyword`);
CREATE INDEX IF NOT EXISTS `idx_persona_suggestion_keywords_active` ON `persona_suggestion_keywords` (`is_active`);
CREATE INDEX IF NOT EXISTS `idx_persona_suggestion_keywords_default` ON `persona_suggestion_keywords` (`is_default`);
