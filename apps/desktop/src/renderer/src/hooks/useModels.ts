import { useState, useEffect } from 'react';

interface Model {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
}

interface UseModelsResult {
  models: Model[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook pour récupérer la liste des modèles Ollama disponibles
 */
export function useModels(): UseModelsResult {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);

      // Vérifier si Ollama est disponible
      const isAvailable = await window.electronAPI.ollama.isAvailable();
      if (!isAvailable) {
        setError('Ollama n\'est pas disponible');
        setModels([]);
        return;
      }

      // Récupérer la liste des modèles
      const response = await window.electronAPI.ollama.listModels();
      setModels(response.models || []);
    } catch (err: any) {
      console.error('Erreur lors du chargement des modèles:', err);
      setError(err.message || 'Erreur lors du chargement des modèles');
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  return {
    models,
    loading,
    error,
    refresh: loadModels,
  };
}
