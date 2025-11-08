import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function AppContent() {
  // Applique les paramètres d'apparence au DOM
  useApplyAppearance();
  const { settings } = useSettings();

  // Déterminer la route de démarrage depuis les settings
  const startupRoute = settings.general.startupPage === 'home' ? '/' : `/${settings.general.startupPage}`;

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={settings.general.startupPage === 'home' ? <HomePage /> : <Navigate to={startupRoute} replace />} />
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
