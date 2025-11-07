import { ipcMain } from 'electron';
import { getDatabase } from '../database/client';
import { personas, type Persona, type NewPersona } from '../database/schema';
import { eq, like, or, desc, asc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * IPC Handlers pour la gestion des Personas
 */

export function registerPersonaHandlers() {
  /**
   * Récupère toutes les personas
   */
  ipcMain.handle('personas:getAll', async () => {
    try {
      const db = getDatabase();
      const allPersonas = await db.select().from(personas).orderBy(desc(personas.usageCount));
      return { success: true, data: allPersonas };
    } catch (error) {
      console.error('[Personas] Error fetching all personas:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupère une persona par ID
   */
  ipcMain.handle('personas:getById', async (_event, id: string) => {
    try {
      const db = getDatabase();
      const persona = await db.select().from(personas).where(eq(personas.id, id));

      if (persona.length === 0) {
        return { success: false, error: 'Persona not found' };
      }

      return { success: true, data: persona[0] };
    } catch (error) {
      console.error('[Personas] Error fetching persona:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Crée une nouvelle persona
   */
  ipcMain.handle('personas:create', async (_event, data: Omit<NewPersona, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
    try {
      const db = getDatabase();

      const newPersona: NewPersona = {
        id: randomUUID(),
        ...data,
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(personas).values(newPersona);

      return { success: true, data: newPersona };
    } catch (error) {
      console.error('[Personas] Error creating persona:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Met à jour une persona existante
   */
  ipcMain.handle('personas:update', async (_event, id: string, data: Partial<Persona>) => {
    try {
      const db = getDatabase();

      const updateData = {
        ...data,
        updatedAt: new Date(),
      };

      await db.update(personas).set(updateData).where(eq(personas.id, id));

      // Récupérer la persona mise à jour
      const updated = await db.select().from(personas).where(eq(personas.id, id));

      if (updated.length === 0) {
        return { success: false, error: 'Persona not found after update' };
      }

      return { success: true, data: updated[0] };
    } catch (error) {
      console.error('[Personas] Error updating persona:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Supprime une persona
   */
  ipcMain.handle('personas:delete', async (_event, id: string) => {
    try {
      const db = getDatabase();
      await db.delete(personas).where(eq(personas.id, id));
      return { success: true };
    } catch (error) {
      console.error('[Personas] Error deleting persona:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Recherche des personas par texte
   */
  ipcMain.handle('personas:search', async (_event, query: string) => {
    try {
      const db = getDatabase();
      const searchPattern = `%${query}%`;

      const results = await db
        .select()
        .from(personas)
        .where(
          or(
            like(personas.name, searchPattern),
            like(personas.description, searchPattern),
            like(personas.category, searchPattern),
            like(personas.tags, searchPattern)
          )
        )
        .orderBy(desc(personas.usageCount));

      return { success: true, data: results };
    } catch (error) {
      console.error('[Personas] Error searching personas:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Filtre les personas par catégorie
   */
  ipcMain.handle('personas:filterByCategory', async (_event, category: string) => {
    try {
      const db = getDatabase();
      const results = await db
        .select()
        .from(personas)
        .where(eq(personas.category, category))
        .orderBy(desc(personas.usageCount));

      return { success: true, data: results };
    } catch (error) {
      console.error('[Personas] Error filtering personas:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupère les personas favorites
   */
  ipcMain.handle('personas:getFavorites', async () => {
    try {
      const db = getDatabase();
      const results = await db
        .select()
        .from(personas)
        .where(eq(personas.isFavorite, true))
        .orderBy(desc(personas.usageCount));

      return { success: true, data: results };
    } catch (error) {
      console.error('[Personas] Error fetching favorites:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Toggle le statut favori d'une persona
   */
  ipcMain.handle('personas:toggleFavorite', async (_event, id: string) => {
    try {
      const db = getDatabase();

      // Récupérer la persona actuelle
      const current = await db.select().from(personas).where(eq(personas.id, id));

      if (current.length === 0) {
        return { success: false, error: 'Persona not found' };
      }

      // Toggle favorite
      const newFavoriteStatus = !current[0].isFavorite;

      await db
        .update(personas)
        .set({ isFavorite: newFavoriteStatus, updatedAt: new Date() })
        .where(eq(personas.id, id));

      // Récupérer la persona mise à jour
      const updated = await db.select().from(personas).where(eq(personas.id, id));

      return { success: true, data: updated[0] };
    } catch (error) {
      console.error('[Personas] Error toggling favorite:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Incrémente le compteur d'utilisation d'une persona
   */
  ipcMain.handle('personas:incrementUsage', async (_event, id: string) => {
    try {
      const db = getDatabase();

      // Récupérer la persona actuelle
      const current = await db.select().from(personas).where(eq(personas.id, id));

      if (current.length === 0) {
        return { success: false, error: 'Persona not found' };
      }

      // Incrémenter usage count
      await db
        .update(personas)
        .set({
          usageCount: current[0].usageCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(personas.id, id));

      return { success: true };
    } catch (error) {
      console.error('[Personas] Error incrementing usage:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Duplique une persona
   */
  ipcMain.handle('personas:duplicate', async (_event, id: string) => {
    try {
      const db = getDatabase();

      // Récupérer la persona à dupliquer
      const original = await db.select().from(personas).where(eq(personas.id, id));

      if (original.length === 0) {
        return { success: false, error: 'Persona not found' };
      }

      // Créer une copie avec un nouveau ID
      const duplicate: NewPersona = {
        ...original[0],
        id: randomUUID(),
        name: `${original[0].name} (Copie)`,
        usageCount: 0,
        isDefault: false,
        isFavorite: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.insert(personas).values(duplicate);

      return { success: true, data: duplicate };
    } catch (error) {
      console.error('[Personas] Error duplicating persona:', error);
      return { success: false, error: String(error) };
    }
  });

  /**
   * Récupère toutes les catégories uniques
   */
  ipcMain.handle('personas:getCategories', async () => {
    try {
      const db = getDatabase();
      const allPersonas = await db.select().from(personas);

      // Extraire les catégories uniques
      const categories = new Set<string>();
      allPersonas.forEach((p) => {
        if (p.category) {
          categories.add(p.category);
        }
      });

      return { success: true, data: Array.from(categories).sort() };
    } catch (error) {
      console.error('[Personas] Error fetching categories:', error);
      return { success: false, error: String(error) };
    }
  });

  console.log('[IPC] Persona handlers registered');
}
