/**
 * Service de synchronisation des tags entre personas et système global
 */

import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';

interface Persona {
  id: string;
  name: string;
  tags: string; // JSON string
}

interface Tag {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: number;
}

const USER_DATA_PATH = app.getPath('userData');
const PERSONAS_FILE = path.join(USER_DATA_PATH, 'personas.json');
const TAGS_FILE = path.join(USER_DATA_PATH, 'tags.json');

/**
 * Génère un ID unique pour un tag
 */
function generateTagId(): string {
  return `tag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Obtient une couleur par défaut basée sur le nom du tag
 */
function getDefaultColorForTagName(name: string): string {
  const lowerName = name.toLowerCase();

  if (lowerName.includes('code') || lowerName.includes('dev')) return '#3b82f6';
  if (lowerName.includes('design') || lowerName.includes('ui')) return '#a855f7';
  if (lowerName.includes('bug') || lowerName.includes('error')) return '#ef4444';
  if (lowerName.includes('feature') || lowerName.includes('new')) return '#22c55e';
  if (lowerName.includes('doc')) return '#eab308';
  if (lowerName.includes('test')) return '#f97316';

  return '#6b7280';
}

/**
 * Obtient une icône par défaut basée sur le nom du tag
 */
function getDefaultIconForTagName(name: string): string {
  const lowerName = name.toLowerCase();

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
  if (lowerName.includes('général') || lowerName.includes('general')) return '🏷️';
  if (lowerName.includes('assistant')) return '🤖';
  if (lowerName.includes('polyvalent')) return '🔧';
  if (lowerName.includes('écriture') || lowerName.includes('writing')) return '✍️';
  if (lowerName.includes('contenu') || lowerName.includes('content')) return '📝';
  if (lowerName.includes('rédaction')) return '📄';
  if (lowerName.includes('article')) return '📰';
  if (lowerName.includes('enseignement') || lowerName.includes('teaching')) return '🎓';
  if (lowerName.includes('pédagogie')) return '👨‍🏫';
  if (lowerName.includes('explication')) return '💡';
  if (lowerName.includes('apprentissage')) return '📖';
  if (lowerName.includes('analyse') || lowerName.includes('analysis')) return '🔍';
  if (lowerName.includes('recherche') || lowerName.includes('research')) return '🔬';
  if (lowerName.includes('critique')) return '🎯';
  if (lowerName.includes('synthèse')) return '📊';
  if (lowerName.includes('créativité') || lowerName.includes('creative')) return '🎨';
  if (lowerName.includes('storytelling')) return '📚';
  if (lowerName.includes('imagination')) return '💭';
  if (lowerName.includes('brainstorming')) return '💡';
  if (lowerName.includes('business')) return '💼';
  if (lowerName.includes('stratégie') || lowerName.includes('strategy')) return '📈';
  if (lowerName.includes('consulting')) return '👔';
  if (lowerName.includes('entrepreneuriat')) return '🚀';
  if (lowerName.includes('nextjs')) return '▲';
  if (lowerName.includes('typescript')) return '🔷';

  return '🏷️';
}

/**
 * Synchronise les tags des personas avec le système global
 */
export async function syncPersonaTags(): Promise<void> {
  try {
    console.log('[TagSyncService] Début de la synchronisation des tags...');

    // Charger les personas
    let personasData: { personas: Persona[] };
    try {
      const personasContent = await fs.readFile(PERSONAS_FILE, 'utf-8');
      personasData = JSON.parse(personasContent);
    } catch (error) {
      console.log('[TagSyncService] Aucun fichier personas.json trouvé');
      return;
    }

    // Charger les tags existants
    let existingTags: Tag[] = [];
    try {
      const tagsContent = await fs.readFile(TAGS_FILE, 'utf-8');
      existingTags = JSON.parse(tagsContent);

      // Nettoyer les tags orphelins (dont le nom est l'ID)
      const orphanCount = existingTags.filter(t => t.name.startsWith('tag-')).length;
      if (orphanCount > 0) {
        existingTags = existingTags.filter(t => !t.name.startsWith('tag-'));
        console.log(`[TagSyncService] Nettoyé ${orphanCount} tags orphelins`);
      }
    } catch (error) {
      console.log('[TagSyncService] Aucun fichier tags.json trouvé, création...');
    }

    // Créer un map des tags existants par nom (insensible à la casse)
    const tagsByName = new Map<string, Tag>();
    existingTags.forEach(tag => {
      tagsByName.set(tag.name.toLowerCase(), tag);
    });

    // Collecter tous les noms de tags des personas
    const allTagNames = new Set<string>();
    personasData.personas.forEach(persona => {
      try {
        const tags: string[] = JSON.parse(persona.tags || '[]');
        tags.forEach(tagName => {
          if (typeof tagName === 'string' && tagName.trim()) {
            allTagNames.add(tagName.trim());
          }
        });
      } catch (error) {
        console.error(`[TagSyncService] Erreur parsing tags pour persona ${persona.id}:`, error);
      }
    });

    console.log(`[TagSyncService] ${allTagNames.size} tags uniques trouvés dans les personas`);

    // Créer les tags manquants
    let newTagsCreated = 0;
    allTagNames.forEach(tagName => {
      if (!tagsByName.has(tagName.toLowerCase())) {
        const newTag: Tag = {
          id: generateTagId(),
          name: tagName,
          color: getDefaultColorForTagName(tagName),
          icon: getDefaultIconForTagName(tagName),
          createdAt: Date.now(),
        };
        existingTags.push(newTag);
        tagsByName.set(tagName.toLowerCase(), newTag);
        newTagsCreated++;
        console.log(`[TagSyncService] Nouveau tag créé: "${tagName}" avec icône ${newTag.icon}`);
      }
    });

    if (newTagsCreated > 0) {
      // Sauvegarder les tags mis à jour
      await fs.writeFile(TAGS_FILE, JSON.stringify(existingTags, null, 2), 'utf-8');
      console.log(`[TagSyncService] ${newTagsCreated} nouveaux tags créés et sauvegardés`);
    } else {
      console.log('[TagSyncService] Aucun nouveau tag à créer');
    }

    console.log('[TagSyncService] Synchronisation terminée avec succès');
  } catch (error) {
    console.error('[TagSyncService] Erreur lors de la synchronisation des tags:', error);
  }
}
