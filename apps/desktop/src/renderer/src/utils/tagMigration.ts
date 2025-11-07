import type { Tag } from '../hooks/useTags';

/**
 * Vérifie si une chaîne est un ID de tag (format: "tag-timestamp-random")
 */
function isTagId(str: string): boolean {
  return str.startsWith('tag-');
}

/**
 * Migre les anciens tags (noms simples) vers le nouveau format (IDs)
 * @param tags - Tableau de tags (peut être des noms ou des IDs)
 * @param existingTags - Liste des tags existants
 * @param createTag - Fonction pour créer un nouveau tag
 * @returns Tableau d'IDs de tags
 */
export function migrateTagsToIds(
  tags: string[],
  existingTags: Tag[],
  createTag: (name: string, color: string, icon?: string) => Tag
): string[] {
  const tagIds: string[] = [];

  for (const tag of tags) {
    if (isTagId(tag)) {
      // C'est déjà un ID, on le garde
      tagIds.push(tag);
    } else {
      // C'est un nom de tag, on doit le convertir en ID
      // Chercher si un tag avec ce nom existe déjà
      const existingTag = existingTags.find(
        (t) => t.name.toLowerCase() === tag.toLowerCase()
      );

      if (existingTag) {
        // Le tag existe déjà, utiliser son ID
        tagIds.push(existingTag.id);
      } else {
        // Créer un nouveau tag
        const newTag = createTag(
          tag,
          getDefaultColorForTagName(tag),
          getDefaultIconForTagName(tag)
        );
        tagIds.push(newTag.id);
      }
    }
  }

  return tagIds;
}

/**
 * Retourne une couleur par défaut selon le nom du tag
 */
function getDefaultColorForTagName(name: string): string {
  const lowerName = name.toLowerCase();

  // Couleurs basées sur des mots-clés
  if (lowerName.includes('code') || lowerName.includes('dev')) return '#3b82f6'; // Bleu
  if (lowerName.includes('design') || lowerName.includes('ui')) return '#a855f7'; // Violet
  if (lowerName.includes('bug') || lowerName.includes('error')) return '#ef4444'; // Rouge
  if (lowerName.includes('feature') || lowerName.includes('new')) return '#22c55e'; // Vert
  if (lowerName.includes('doc')) return '#eab308'; // Jaune
  if (lowerName.includes('test')) return '#f97316'; // Orange

  // Couleur par défaut
  return '#6b7280'; // Gris
}

/**
 * Retourne une icône par défaut selon le nom du tag
 */
function getDefaultIconForTagName(name: string): string {
  const lowerName = name.toLowerCase();

  // Icônes basées sur des mots-clés
  if (lowerName.includes('code') || lowerName.includes('dev')) return '💻';
  if (lowerName.includes('design') || lowerName.includes('ui')) return '🎨';
  if (lowerName.includes('bug') || lowerName.includes('error')) return '🐛';
  if (lowerName.includes('feature')) return '✨';
  if (lowerName.includes('doc')) return '📚';
  if (lowerName.includes('test')) return '🧪';
  if (lowerName.includes('python')) return '🐍';
  if (lowerName.includes('react') || lowerName.includes('javascript')) return '⚛️';
  if (lowerName.includes('backend')) return '⚙️';
  if (lowerName.includes('frontend')) return '🖼️';

  // Icône par défaut
  return '🏷️';
}
