import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useApplyAppearance } from './hooks/useApplyAppearance';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ChatPage } from './pages/ChatPage';
import { WorkflowsPage } from './pages/WorkflowsPage';
import { EditorPage } from './pages/EditorPage';
import { PromptsPage } from './pages/PromptsPage';
import { PersonasPage } from './pages/PersonasPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { LogsPage } from './pages/LogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { LibraryPage } from './pages/LibraryPage';
import { ToolsPage } from './pages/ToolsPage';

// Map des composants de pages (défini en dehors pour éviter les re-créations)
const PAGE_COMPONENTS: Record<string, React.ComponentType> = {
  'home': HomePage,
  'chat': ChatPage,
  'workflows': WorkflowsPage,
  'editor': EditorPage,
  'prompts': PromptsPage,
  'personas': PersonasPage,
  'projects': ProjectsPage,
  'library': LibraryPage,
  'tools': ToolsPage,
  'logs': LogsPage,
  'documentation': DocumentationPage,
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
          <Route path="/editor" element={<EditorPage />} />
          <Route path="/prompts" element={<PromptsPage />} />
          <Route path="/personas" element={<PersonasPage />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/logs" element={<LogsPage />} />
          <Route path="/documentation" element={<DocumentationPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
}

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
