import { textRAGService } from './text-rag-service';
import { coletteVisionRAGService } from './colette-vision-rag-service';
import { visionRAGService } from './vision-rag-service';
import {
  reciprocalRankFusion,
  type RAGSearchParams,
  type HybridRAGResult,
  type RAGMode,
  type TextRAGResult,
  type VisionRAGResult,
} from '../types/rag';

/**
 * Hybrid RAG Service
 * Combine Text RAG et Vision RAG avec Reciprocal Rank Fusion
 *
 * Features:
 * - Auto-mode: Décision intelligente text/vision/hybrid
 * - Hybrid search: RRF fusion des résultats text + vision
 * - Fallback gracieux si un mode échoue
 */
export class HybridRAGService {
  private defaultK: number = 60; // RRF constant

  /**
   * Recherche hybride combinant text et vision RAG
   */
  async search(params: RAGSearchParams): Promise<{
    success: boolean;
    results: HybridRAGResult[];
    mode: RAGMode;
    error?: string;
  }> {
    try {
      const startTime = Date.now();

      console.log('[HybridRAG] Starting search:', {
        query: params.query.substring(0, 100),
        mode: params.mode || 'auto',
        topK: params.topK || 10,
      });

      // 1. Déterminer le mode effectif
      const effectiveMode = params.mode || 'auto';

      // 2. Exécuter les recherches selon le mode
      let textResults: TextRAGResult[] = [];
      let visionResults: VisionRAGResult[] = [];
      let actualMode: RAGMode = effectiveMode;

      if (effectiveMode === 'auto') {
        // Auto-mode: essayer les deux et voir ce qui fonctionne
        actualMode = await this.decideRAGMode(params);
        console.log('[HybridRAG] Auto-mode decided:', actualMode);
      }

      // Exécuter les recherches appropriées
      if (actualMode === 'text' || actualMode === 'hybrid') {
        try {
          textResults = await textRAGService.search(params);
        } catch (error) {
          console.warn('[HybridRAG] Text search failed:', error);
        }
      }

      if (actualMode === 'vision' || actualMode === 'hybrid') {
        try {
          // Détecter le backend vision à utiliser basé sur les documents
          const visionBackend = await this.detectVisionBackend(params.filters?.attachmentIds);
          console.log('[HybridRAG] Using vision backend:', visionBackend);

          let visionSearch;
          if (visionBackend === 'mlx') {
            visionSearch = await visionRAGService.search(params);
          } else {
            // Default to Colette for ColPali models
            visionSearch = await coletteVisionRAGService.search(params);
          }

          if (visionSearch.success) {
            visionResults = visionSearch.results;
          } else {
            console.warn('[HybridRAG] Vision search failed:', visionSearch.error);
          }
        } catch (error) {
          console.warn('[HybridRAG] Vision search failed:', error);
        }
      }

      // 3. Fusionner les résultats si mode hybrid
      let hybridResults: HybridRAGResult[];

      if (actualMode === 'hybrid') {
        hybridResults = this.fuseResults(textResults, visionResults, params.topK || 10);
      } else if (actualMode === 'text') {
        // Convertir text results en hybrid results
        hybridResults = textResults.map((r) => ({
          id: r.chunkId,
          attachmentId: r.attachmentId,
          score: r.score,
          source: 'text' as const,
          textResult: r,
          metadata: r.metadata,
        }));
      } else {
        // Vision only
        hybridResults = visionResults.map((r) => ({
          id: r.patchId,
          attachmentId: r.attachmentId,
          score: r.score,
          source: 'vision' as const,
          visionResult: r,
          metadata: r.metadata,
        }));
      }

      const duration = Date.now() - startTime;

      console.log('[HybridRAG] Search completed:', {
        resultsCount: hybridResults.length,
        mode: actualMode,
        textResultsCount: textResults.length,
        visionResultsCount: visionResults.length,
        duration: `${duration}ms`,
      });

      return {
        success: true,
        results: hybridResults,
        mode: actualMode,
      };
    } catch (error) {
      console.error('[HybridRAG] Search error:', error);
      return {
        success: false,
        results: [],
        mode: 'text',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Fusion des résultats text et vision avec RRF
   */
  private fuseResults(
    textResults: TextRAGResult[],
    visionResults: VisionRAGResult[],
    topK: number
  ): HybridRAGResult[] {
    console.log('[HybridRAG] Fusing results with RRF:', {
      textCount: textResults.length,
      visionCount: visionResults.length,
      k: this.defaultK,
    });

    // Convertir en format commun pour RRF
    type RRFItem = { id: string; score: number; original: TextRAGResult | VisionRAGResult };

    const textItems: RRFItem[] = textResults.map((r) => ({
      id: `text:${r.chunkId}`,
      score: r.score,
      original: r,
    }));

    const visionItems: RRFItem[] = visionResults.map((r) => ({
      id: `vision:${r.patchId}`,
      score: r.score,
      original: r,
    }));

    // Appliquer RRF avec type assertion
    const fusedItems = reciprocalRankFusion<RRFItem>(textItems as any, visionItems as any, this.defaultK);

    // Convertir en HybridRAGResult
    const hybridResults: HybridRAGResult[] = fusedItems.slice(0, topK).map((item) => {
      const isText = item.id.startsWith('text:');

      if (isText) {
        // Vérifier que c'est bien un TextRAGResult
        if ('chunkId' in item.original) {
          const textResult = item.original as TextRAGResult;
          return {
            id: item.id,
            attachmentId: textResult.attachmentId,
            score: item.score, // RRF score
            source: 'text' as const,
            textResult,
            metadata: textResult.metadata,
          };
        }
      }

      // C'est un VisionRAGResult
      if ('patchId' in item.original) {
        const visionResult = item.original as VisionRAGResult;
        return {
          id: item.id,
          attachmentId: visionResult.attachmentId,
          score: item.score, // RRF score
          source: 'vision' as const,
          visionResult,
          metadata: visionResult.metadata,
        };
      }

      // Fallback (ne devrait jamais arriver)
      throw new Error('Invalid fusion item type');
    });

    console.log('[HybridRAG] RRF fusion completed:', {
      fusedCount: hybridResults.length,
      topScore: hybridResults[0]?.score,
    });

    return hybridResults;
  }

  /**
   * Décision intelligente du mode RAG à utiliser (auto-mode)
   *
   * Logique:
   * 1. Si filters.attachmentIds spécifié, analyser les attachments
   * 2. Calculer ratio text/visual documents
   * 3. Si ratio > 0.9 → text
   * 4. Si ratio < 0.1 → vision
   * 5. Sinon → hybrid
   */
  private async decideRAGMode(params: RAGSearchParams): Promise<RAGMode> {
    try {
      // Si pas de filtres attachmentIds, analyser par mots-clés
      if (!params.filters?.attachmentIds || params.filters.attachmentIds.length === 0) {
        console.log('[HybridRAG] No attachment filters, using keyword-based detection');

        // Heuristique basée sur les mots-clés de la query
        const visualKeywords = ['image', 'photo', 'diagram', 'chart', 'graph', 'figure', 'screenshot', 'page'];
        const queryLower = params.query.toLowerCase();
        const hasVisualKeywords = visualKeywords.some((kw) => queryLower.includes(kw));

        if (hasVisualKeywords) {
          console.log('[HybridRAG] Visual keywords detected → hybrid mode (to include vision)');
          return 'hybrid';
        }

        // Par défaut text si pas de mots-clés visuels
        console.log('[HybridRAG] No visual keywords → text mode');
        return 'text';
      }

      // Analyser les attachments pour déterminer le meilleur mode
      const analysis = await this.analyzeAttachments(params.filters.attachmentIds);

      console.log('[HybridRAG] Attachment analysis:', {
        textRatio: analysis.textRatio,
        visionRatio: analysis.visionRatio,
        recommendedMode: analysis.recommendedMode,
      });

      return analysis.recommendedMode;
    } catch (error) {
      console.warn('[HybridRAG] Error in auto-mode decision:', error);
      return 'hybrid'; // Fallback sûr
    }
  }

  /**
   * Analyser les attachments pour déterminer le mode optimal
   */
  private async analyzeAttachments(attachmentIds: string[]): Promise<{
    textRatio: number;
    visionRatio: number;
    recommendedMode: RAGMode;
  }> {
    try {
      const { attachmentService } = await import('./attachment-service');

      let textCount = 0;
      let visionCount = 0;

      // Analyser chaque attachment
      for (const id of attachmentIds) {
        const attachment = await attachmentService.getById(id);
        if (!attachment) continue;

        if (attachment.isIndexedText) textCount++;
        if (attachment.isIndexedVision) visionCount++;
      }

      const total = attachmentIds.length;
      const textRatio = total > 0 ? textCount / total : 0;
      const visionRatio = total > 0 ? visionCount / total : 0;

      console.log('[HybridRAG] Attachment indexing status:', {
        total,
        textCount,
        visionCount,
        textRatio,
        visionRatio,
      });

      // Déterminer le mode recommandé
      let recommendedMode: RAGMode;

      if (visionRatio >= 0.5 && textRatio >= 0.5) {
        // Les deux types d'index sont présents
        recommendedMode = 'hybrid';
      } else if (visionRatio > textRatio) {
        // Principalement vision
        recommendedMode = 'vision';
      } else if (textRatio > 0) {
        // Principalement text
        recommendedMode = 'text';
      } else {
        // Aucun index, fallback sur text
        recommendedMode = 'text';
      }

      return {
        textRatio,
        visionRatio,
        recommendedMode,
      };
    } catch (error) {
      console.error('[HybridRAG] Error analyzing attachments:', error);
      // Fallback sûr
      return {
        textRatio: 0.5,
        visionRatio: 0.5,
        recommendedMode: 'hybrid',
      };
    }
  }

  /**
   * Obtenir des statistiques sur l'utilisation du RAG hybride
   */
  async getStats(): Promise<{
    textIndexedCount: number;
    visionIndexedCount: number;
    hybridIndexedCount: number;
    totalStorageSize: number;
  }> {
    try {
      // TODO: Implémenter les vraies stats depuis la DB et le vector store
      return {
        textIndexedCount: 0,
        visionIndexedCount: 0,
        hybridIndexedCount: 0,
        totalStorageSize: 0,
      };
    } catch (error) {
      console.error('[HybridRAG] Error getting stats:', error);
      return {
        textIndexedCount: 0,
        visionIndexedCount: 0,
        hybridIndexedCount: 0,
        totalStorageSize: 0,
      };
    }
  }

  /**
   * Détecter le backend vision à utiliser basé sur les modèles d'indexation des documents
   * Si les documents sont indexés avec MLX, utiliser le service MLX
   * Sinon utiliser Colette (défaut pour ColPali)
   */
  private async detectVisionBackend(attachmentIds?: string[]): Promise<'mlx' | 'colette'> {
    try {
      if (!attachmentIds || attachmentIds.length === 0) {
        // Pas de filtres, utiliser Colette par défaut
        return 'colette';
      }

      const { attachmentService } = await import('./attachment-service');

      // Vérifier le modèle d'embedding vision des documents
      for (const id of attachmentIds) {
        const attachment = await attachmentService.getById(id);
        if (!attachment || !attachment.visionEmbeddingModel) continue;

        const model = attachment.visionEmbeddingModel.toLowerCase();

        // Détecter les modèles MLX
        if (model.includes('mlx') || model.includes('pixtral') || model.includes('qwen') || model.includes('paligemma')) {
          console.log('[HybridRAG] Detected MLX model:', attachment.visionEmbeddingModel);
          return 'mlx';
        }
      }

      // Par défaut utiliser Colette
      return 'colette';
    } catch (error) {
      console.warn('[HybridRAG] Error detecting vision backend:', error);
      return 'colette'; // Fallback sûr
    }
  }

  /**
   * Configurer le K constant pour RRF
   */
  setRRFConstant(k: number): void {
    if (k <= 0) {
      throw new Error('RRF constant K must be positive');
    }
    this.defaultK = k;
    console.log('[HybridRAG] RRF constant K updated:', k);
  }

  /**
   * Obtenir le K constant actuel
   */
  getRRFConstant(): number {
    return this.defaultK;
  }
}

// Export singleton instance
export const hybridRAGService = new HybridRAGService();
