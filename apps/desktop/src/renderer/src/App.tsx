import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { useApplyAppearance } from './hooks/useApplyAppearance';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ChatPage } from './pages/ChatPage';
import { WorkflowsPage } from './pages/WorkflowsPage';
import { PromptsPage } from './pages/PromptsPage';
import { PersonasPage } from './pages/PersonasPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { LogsPage } from './pages/LogsPage';
import { SettingsPage } from './pages/SettingsPage';

// Map des composants de pages (défini en dehors pour éviter les re-créations)
const PAGE_COMPONENTS: Record<string, React.ComponentType> = {
  'home': HomePage,
  'chat': ChatPage,
  'workflows': WorkflowsPage,
  'prompts': PromptsPage,
  'personas': PersonasPage,
  'projects': ProjectsPage,
  'logs': LogsPage,
  'settings': SettingsPage,
};

// Composant qui rend la page de démarrage configurée
function StartupPage() {
  const { settings } = useSettings();

  // Vérification de sécurité
  if (!settings || !settings.general) {
    return <HomePage />;
  }

  const startupPage = settings.general.startupPage || 'home';

  // Obtenir le composant correspondant
  const PageComponent = PAGE_COMPONENTS[startupPage] || HomePage;

  return <PageComponent />;
}

function AppContent() {
  // Applique les paramètres d'apparence au DOM
  useApplyAppearance();

  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<StartupPage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/workflows" element={<WorkflowsPage />} />
          <Route path="/prompts" element={<PromptsPage />} />
          <Route path="/personas" element={<PersonasPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;
