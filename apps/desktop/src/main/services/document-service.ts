import { eq } from 'drizzle-orm';
import { getDatabase } from '../database/client';
import { documents, type Document, type NewDocument } from '../database/schema';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service pour gérer les documents généraux de l'éditeur
 * (séparés de la documentation du projet)
 */
export class DocumentService {
  /**
   * Créer un nouveau document
   */
  async create(data: Omit<NewDocument, 'id' | 'createdAt' | 'updatedAt'>): Promise<Document> {
    const db = getDatabase();
    const now = new Date();

    const newDocument: NewDocument = {
      id: uuidv4(),
      title: data.title,
      content: data.content,
      tags: data.tags || '[]',
      isFavorite: data.isFavorite || false,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(documents).values(newDocument);

    return newDocument as Document;
  }

  /**
   * Récupérer un document par son ID
   */
  async getById(id: string): Promise<Document | null> {
    const db = getDatabase();
    const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
    return result[0] || null;
  }

  /**
   * Récupérer tous les documents
   */
  async getAll(): Promise<Document[]> {
    const db = getDatabase();
    return await db.select().from(documents).orderBy(documents.updatedAt);
  }

  /**
   * Mettre à jour un document
   */
  async update(
    id: string,
    data: Partial<Omit<Document, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Document> {
    const db = getDatabase();
    const now = new Date();

    const updateData: any = {
      ...data,
      updatedAt: now,
    };

    await db.update(documents).set(updateData).where(eq(documents.id, id));

    const updated = await this.getById(id);
    if (!updated) {
      throw new Error(`Document not found: ${id}`);
    }

    return updated;
  }

  /**
   * Supprimer un document
   */
  async delete(id: string): Promise<void> {
    const db = getDatabase();
    await db.delete(documents).where(eq(documents.id, id));
  }

  /**
   * Toggle favori
   */
  async toggleFavorite(id: string): Promise<Document> {
    const doc = await this.getById(id);
    if (!doc) {
      throw new Error(`Document not found: ${id}`);
    }

    return await this.update(id, {
      isFavorite: !doc.isFavorite,
    });
  }

  /**
   * Rechercher des documents par titre ou contenu
   */
  async search(query: string): Promise<Document[]> {
    const db = getDatabase();
    const allDocs = await db.select().from(documents);

    const lowerQuery = query.toLowerCase();
    return allDocs.filter(
      (doc) =>
        doc.title.toLowerCase().includes(lowerQuery) ||
        doc.content.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Récupérer les documents favoris
   */
  async getFavorites(): Promise<Document[]> {
    const db = getDatabase();
    return await db.select().from(documents).where(eq(documents.isFavorite, true));
  }
}

// Export une instance singleton
export const documentService = new DocumentService();
