import { getDatabase } from '../database/client';
import { personaSuggestionKeywords } from '../database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

/**
 * Service pour gérer les suggestions intelligentes de personas
 */
export class PersonaSuggestionService {
  /**
   * Récupère tous les keywords
   */
  async getAllKeywords() {
    try {
      const db = getDatabase();
      const keywords = await db.select().from(personaSuggestionKeywords).all();
      return keywords;
    } catch (error) {
      console.error('Error fetching all keywords:', error);
      throw error;
    }
  }

  /**
   * Récupère uniquement les keywords actifs
   */
  async getActiveKeywords() {
    try {
      const db = getDatabase();
      const keywords = await db
        .select()
        .from(personaSuggestionKeywords)
        .where(eq(personaSuggestionKeywords.isActive, true))
        .all();
      return keywords;
    } catch (error) {
      console.error('Error fetching active keywords:', error);
      throw error;
    }
  }

  /**
   * Récupère un keyword par ID
   */
  async getKeywordById(id: string) {
    try {
      const db = getDatabase();
      const keyword = await db
        .select()
        .from(personaSuggestionKeywords)
        .where(eq(personaSuggestionKeywords.id, id))
        .get();
      return keyword || null;
    } catch (error) {
      console.error('Error fetching keyword by ID:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau keyword
   */
  async createKeyword(data: {
    keyword: string;
    categories: string[];
    isActive?: boolean;
    isDefault?: boolean;
  }) {
    try {
      const db = getDatabase();
      const id = randomUUID();
      const now = new Date();

      const newKeyword = {
        id,
        keyword: data.keyword.toLowerCase(),
        categories: JSON.stringify(data.categories),
        isActive: data.isActive ?? true,
        isDefault: data.isDefault ?? false,
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(personaSuggestionKeywords).values(newKeyword).run();

      return this.getKeywordById(id);
    } catch (error) {
      console.error('Error creating keyword:', error);
      throw error;
    }
  }

  /**
   * Met à jour un keyword
   */
  async updateKeyword(
    id: string,
    data: {
      keyword?: string;
      categories?: string[];
      isActive?: boolean;
    }
  ) {
    try {
      const db = getDatabase();
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (data.keyword !== undefined) {
        updateData.keyword = data.keyword.toLowerCase();
      }
      if (data.categories !== undefined) {
        updateData.categories = JSON.stringify(data.categories);
      }
      if (data.isActive !== undefined) {
        updateData.isActive = data.isActive;
      }

      await db
        .update(personaSuggestionKeywords)
        .set(updateData)
        .where(eq(personaSuggestionKeywords.id, id))
        .run();

      return this.getKeywordById(id);
    } catch (error) {
      console.error('Error updating keyword:', error);
      throw error;
    }
  }

  /**
   * Supprime un keyword
   */
  async deleteKeyword(id: string) {
    try {
      const db = getDatabase();
      // Vérifier si c'est un keyword par défaut
      const keyword = await this.getKeywordById(id);
      if (!keyword) {
        throw new Error('Keyword not found');
      }

      if (keyword.isDefault) {
        throw new Error('Cannot delete default keyword');
      }

      await db
        .delete(personaSuggestionKeywords)
        .where(eq(personaSuggestionKeywords.id, id))
        .run();

      return true;
    } catch (error) {
      console.error('Error deleting keyword:', error);
      throw error;
    }
  }

  /**
   * Bascule l'état actif/inactif d'un keyword
   */
  async toggleKeywordActive(id: string) {
    try {
      const keyword = await this.getKeywordById(id);
      if (!keyword) {
        throw new Error('Keyword not found');
      }

      return this.updateKeyword(id, { isActive: !keyword.isActive });
    } catch (error) {
      console.error('Error toggling keyword active:', error);
      throw error;
    }
  }

  /**
   * Recherche des keywords par texte
   */
  async searchKeywords(query: string) {
    try {
      const db = getDatabase();
      const lowerQuery = query.toLowerCase();
      const keywords = await db
        .select()
        .from(personaSuggestionKeywords)
        .where(sql`lower(${personaSuggestionKeywords.keyword}) LIKE ${`%${lowerQuery}%`}`)
        .all();
      return keywords;
    } catch (error) {
      console.error('Error searching keywords:', error);
      throw error;
    }
  }

  /**
   * Initialise les keywords par défaut
   */
  async initializeDefaultKeywords(defaultKeywords: Array<{
    keyword: string;
    categories: string[];
    isDefault?: boolean;
  }>) {
    try {
      // Vérifier si des keywords existent déjà
      const existing = await this.getAllKeywords();
      if (existing.length > 0) {
        console.log('Keywords already initialized, skipping...');
        return;
      }

      console.log(`Initializing ${defaultKeywords.length} default keywords...`);

      // Insérer tous les keywords par défaut
      for (const keywordData of defaultKeywords) {
        await this.createKeyword({
          ...keywordData,
          isDefault: true,
          isActive: true,
        });
      }

      console.log('Default keywords initialized successfully');
    } catch (error) {
      console.error('Error initializing default keywords:', error);
      throw error;
    }
  }

  /**
   * Réinitialise les keywords par défaut (supprime les customs et réinitialise les defaults)
   */
  async resetToDefaults(defaultKeywords: Array<{
    keyword: string;
    categories: string[];
  }>) {
    try {
      const db = getDatabase();
      // Supprimer tous les keywords non-default
      await db
        .delete(personaSuggestionKeywords)
        .where(eq(personaSuggestionKeywords.isDefault, false))
        .run();

      // Supprimer tous les keywords default
      await db
        .delete(personaSuggestionKeywords)
        .where(eq(personaSuggestionKeywords.isDefault, true))
        .run();

      // Réinsérer les keywords par défaut
      await this.initializeDefaultKeywords(defaultKeywords);

      return true;
    } catch (error) {
      console.error('Error resetting to defaults:', error);
      throw error;
    }
  }

  /**
   * Compte le nombre de keywords
   */
  async countKeywords() {
    try {
      const db = getDatabase();
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(personaSuggestionKeywords)
        .get();
      return result?.count || 0;
    } catch (error) {
      console.error('Error counting keywords:', error);
      throw error;
    }
  }

  /**
   * Compte le nombre de keywords actifs
   */
  async countActiveKeywords() {
    try {
      const db = getDatabase();
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(personaSuggestionKeywords)
        .where(eq(personaSuggestionKeywords.isActive, true))
        .get();
      return result?.count || 0;
    } catch (error) {
      console.error('Error counting active keywords:', error);
      throw error;
    }
  }

  /**
   * Récupère les statistiques des keywords
   */
  async getKeywordStats() {
    try {
      const total = await this.countKeywords();
      const active = await this.countActiveKeywords();
      const keywords = await this.getAllKeywords();

      // Compter par catégorie
      const categoryCounts: Record<string, number> = {};
      keywords.forEach((keyword: { categories: string }) => {
        try {
          const categories: string[] = JSON.parse(keyword.categories);
          categories.forEach((cat: string) => {
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
          });
        } catch (e) {
          // ignore
        }
      });

      return {
        total,
        active,
        inactive: total - active,
        defaultKeywords: keywords.filter((k: { isDefault: boolean }) => k.isDefault).length,
        customKeywords: keywords.filter((k: { isDefault: boolean }) => !k.isDefault).length,
        categoryCounts,
      };
    } catch (error) {
      console.error('Error getting keyword stats:', error);
      throw error;
    }
  }
}

// Instance singleton
export const personaSuggestionService = new PersonaSuggestionService();
