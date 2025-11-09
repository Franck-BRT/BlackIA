/**
 * Configuration de test Vitest pour les services workflow
 *
 * Ce fichier configure l'environnement de test avant l'exécution des tests.
 */

import { beforeAll, afterAll, afterEach } from 'vitest';

// Configuration globale avant tous les tests
beforeAll(() => {
  console.log('🧪 Initialisation des tests workflow services...');
});

// Nettoyage après tous les tests
afterAll(() => {
  console.log('✅ Tests workflow services terminés');
});

// Nettoyage après chaque test
afterEach(() => {
  // Réinitialiser les mocks si nécessaire
});
