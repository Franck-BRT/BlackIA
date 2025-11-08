import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

// Composant qui rend la page de démarrage configurée
function StartupPage() {
  const { settings } = useSettings();
  const startupPage = settings.general.startupPage || 'home';

  switch (startupPage) {
    case 'chat':
      return <ChatPage />;
    case 'workflows':
      return <WorkflowsPage />;
    case 'prompts':
      return <PromptsPage />;
    case 'personas':
      return <PersonasPage />;
    case 'projects':
      return <ProjectsPage />;
    case 'logs':
      return <LogsPage />;
    case 'settings':
      return <SettingsPage />;
    case 'home':
    default:
      return <HomePage />;
  }
}

function AppContent() {
  // Applique les paramètres d'apparence au DOM
  useApplyAppearance();

  return (
    <BrowserRouter>
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
    </BrowserRouter>
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
