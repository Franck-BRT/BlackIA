"""
Late Interaction Matching (MaxSim)
Implémentation de l'algorithme MaxSim utilisé par ColPali
pour la recherche multi-vecteurs
"""

import sys
import json
from typing import List, Dict, Any, Tuple
import numpy as np


class LateInteractionMatcher:
    """
    Implémente Late Interaction Matching avec MaxSim

    ColPali Architecture:
    1. Query: embeddings multi-vecteurs [Q patches, dims]
    2. Documents: embeddings multi-vecteurs [D patches, dims] par doc
    3. MaxSim score: Pour chaque query patch, max similarity avec doc patches
    4. Score final: somme des MaxSim sur tous les query patches

    Formule:
    score(Q, D) = Σ_i max_j cos_sim(q_i, d_j)
    où q_i sont les query patches et d_j les document patches
    """

    def __init__(self, verbose: bool = False):
        """
        Args:
            verbose: Activer les logs détaillés
        """
        self.verbose = verbose

    def compute_similarity(
        self,
        query_embeddings: np.ndarray,
        document_embeddings: np.ndarray,
    ) -> float:
        """
        Calcule le score MaxSim entre une query et un document

        Args:
            query_embeddings: Embeddings query [num_query_patches, embed_dim]
            document_embeddings: Embeddings document [num_doc_patches, embed_dim]

        Returns:
            Score de similarité (float)
        """
        try:
            # Normaliser les vecteurs (pour cosine similarity)
            query_norm = query_embeddings / (
                np.linalg.norm(query_embeddings, axis=1, keepdims=True) + 1e-8
            )
            doc_norm = document_embeddings / (
                np.linalg.norm(document_embeddings, axis=1, keepdims=True) + 1e-8
            )

            # Matrice de similarité [num_query_patches, num_doc_patches]
            # similarity_matrix[i, j] = cosine_sim(query_patch_i, doc_patch_j)
            similarity_matrix = np.dot(query_norm, doc_norm.T)

            # MaxSim: pour chaque query patch, prendre max similarity avec doc patches
            max_similarities = np.max(similarity_matrix, axis=1)

            # Score final: somme des max similarities
            score = np.sum(max_similarities)

            if self.verbose:
                print(f"[LateInteraction] MaxSim score: {score:.4f}", file=sys.stderr)
                print(f"[LateInteraction] Query patches: {query_embeddings.shape[0]}", file=sys.stderr)
                print(f"[LateInteraction] Doc patches: {document_embeddings.shape[0]}", file=sys.stderr)

            return float(score)

        except Exception as e:
            if self.verbose:
                print(f"[LateInteraction] Error computing similarity: {e}", file=sys.stderr)
            return 0.0

    def rank_documents(
        self,
        query_embeddings: np.ndarray,
        documents_embeddings: List[np.ndarray],
        document_ids: List[str],
        top_k: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Classe plusieurs documents par score MaxSim décroissant

        Args:
            query_embeddings: Embeddings query [num_query_patches, embed_dim]
            documents_embeddings: Liste d'embeddings par document
            document_ids: IDs correspondants des documents
            top_k: Nombre de résultats à retourner

        Returns:
            Liste de dicts avec documentId et score, triée par score décroissant
        """
        try:
            scores = []

            for doc_id, doc_emb in zip(document_ids, documents_embeddings):
                score = self.compute_similarity(query_embeddings, doc_emb)
                scores.append({
                    "documentId": doc_id,
                    "score": score,
                })

            # Trier par score décroissant
            scores.sort(key=lambda x: x["score"], reverse=True)

            # Retourner top-k
            return scores[:top_k]

        except Exception as e:
            if self.verbose:
                print(f"[LateInteraction] Error ranking documents: {e}", file=sys.stderr)
            return []

    def compute_similarity_matrix(
        self,
        query_embeddings: np.ndarray,
        documents_embeddings: List[np.ndarray],
    ) -> np.ndarray:
        """
        Calcule une matrice de similarité [num_docs]

        Args:
            query_embeddings: Embeddings query
            documents_embeddings: Liste d'embeddings documents

        Returns:
            Array de scores [num_docs]
        """
        scores = np.array([
            self.compute_similarity(query_embeddings, doc_emb)
            for doc_emb in documents_embeddings
        ])
        return scores

    def batch_compute_similarities(
        self,
        queries_embeddings: List[np.ndarray],
        documents_embeddings: List[np.ndarray],
    ) -> np.ndarray:
        """
        Calcule une matrice de similarité [num_queries, num_docs]

        Args:
            queries_embeddings: Liste d'embeddings queries
            documents_embeddings: Liste d'embeddings documents

        Returns:
            Matrice [num_queries, num_docs] de scores
        """
        num_queries = len(queries_embeddings)
        num_docs = len(documents_embeddings)

        scores = np.zeros((num_queries, num_docs))

        for i, query_emb in enumerate(queries_embeddings):
            for j, doc_emb in enumerate(documents_embeddings):
                scores[i, j] = self.compute_similarity(query_emb, doc_emb)

        return scores


def maxsim_score(
    query: np.ndarray,
    document: np.ndarray,
    normalize: bool = True,
) -> float:
    """
    Fonction utilitaire pour calculer rapidement un score MaxSim

    Args:
        query: Query embeddings [num_patches, dim]
        document: Document embeddings [num_patches, dim]
        normalize: Normaliser les vecteurs

    Returns:
        Score MaxSim
    """
    matcher = LateInteractionMatcher()
    return matcher.compute_similarity(query, document)


def main():
    """
    Point d'entrée CLI pour tester le module
    Usage: python late_interaction.py --query query.npy --documents doc1.npy doc2.npy
    """
    import argparse

    parser = argparse.ArgumentParser(description="Late Interaction Matching with MaxSim")
    parser.add_argument("--query", required=True, help="Path to query embeddings (.npy)")
    parser.add_argument("--documents", nargs="+", required=True, help="Paths to document embeddings (.npy)")
    parser.add_argument("--top-k", type=int, default=10, help="Number of top results")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose logging")
    parser.add_argument("--output", help="Output JSON file path")

    args = parser.parse_args()

    # Charger les embeddings
    try:
        query_embeddings = np.load(args.query)
        documents_embeddings = [np.load(doc_path) for doc_path in args.documents]
        document_ids = [f"doc_{i}" for i in range(len(args.documents))]

        if args.verbose:
            print(f"[LateInteraction] Loaded query: {query_embeddings.shape}", file=sys.stderr)
            print(f"[LateInteraction] Loaded {len(documents_embeddings)} documents", file=sys.stderr)

    except Exception as e:
        result = {
            "success": False,
            "error": f"Failed to load embeddings: {e}",
        }
        print(json.dumps(result, indent=2))
        sys.exit(1)

    # Créer le matcher et classer les documents
    matcher = LateInteractionMatcher(verbose=args.verbose)
    ranked = matcher.rank_documents(
        query_embeddings,
        documents_embeddings,
        document_ids,
        top_k=args.top_k,
    )

    # Résultat
    result = {
        "success": True,
        "rankedDocuments": ranked,
        "queryPatchCount": int(query_embeddings.shape[0]),
        "documentPatchCounts": [int(doc.shape[0]) for doc in documents_embeddings],
    }

    # Sortir le résultat en JSON
    output = json.dumps(result, indent=2)

    if args.output:
        with open(args.output, 'w') as f:
            f.write(output)
        print(f"Results saved to {args.output}", file=sys.stderr)
    else:
        print(output)

    sys.exit(0)


if __name__ == "__main__":
    main()
