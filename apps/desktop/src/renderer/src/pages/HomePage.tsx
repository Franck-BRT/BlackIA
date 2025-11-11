import React, { useEffect, useState } from 'react';
import { MessageSquare, Workflow, FileText, User, FolderOpen, Zap } from 'lucide-react';
import { FeatureCard } from '../components/home/FeatureCard';
import { StatusCard } from '../components/home/StatusCard';

export function HomePage() {
  const [version, setVersion] = useState('');
  const [platform, setPlatform] = useState('');

  useEffect(() => {
    // Test IPC connection
    if (window.electronAPI) {
      window.electronAPI.getVersion().then(setVersion);
      window.electronAPI.getPlatform().then(setPlatform);
    }
  }, []);

  const features = [
    {
      icon: MessageSquare,
      title: 'Chat IA',
      description: 'Conversations intelligentes avec des modèles locaux',
      path: '/chat',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Workflow,
      title: 'Workflows',
      description: 'Créez des flux d\'automatisation puissants',
      path: '/workflows',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: FileText,
      title: 'Prompts',
      description: 'Bibliothèque de prompts réutilisables',
      path: '/prompts',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: User,
      title: 'Personas',
      description: 'Personnalités IA personnalisables',
      path: '/personas',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: FolderOpen,
      title: 'Projets',
      description: 'Gestion de projets assistée par IA',
      path: '/projects',
      color: 'from-indigo-500 to-blue-500',
    },
    {
      icon: Zap,
      title: 'Plus à venir',
      description: 'Générateurs, MCP Server, et plus...',
      path: '#',
      color: 'from-yellow-500 to-orange-500',
    },
  ];

  return (
    <div className="h-full overflow-auto p-8">
      {/* Header */}
      <div className="max-w-6xl xl:max-w-7xl 2xl:max-w-none 2xl:px-16 mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gradient">
            Bienvenue sur BlackIA
          </h1>
          <p className="text-xl text-muted-foreground">
            Votre suite complète d'assistance IA, 100% locale et privée
          </p>
          {version && (
            <p className="text-sm text-muted-foreground mt-4">
              Version {version} • {platform} • Ollama + MLX
            </p>
          )}
        </div>

        {/* Features grid - Flex wrap with dynamic card size */}
        <div className="flex flex-wrap gap-6 justify-center xl:justify-start mb-12">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              path={feature.path}
              color={feature.color}
              disabled={feature.path === '#'}
            />
          ))}
        </div>

        {/* Status cards - Responsive 1/2/3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatusCard
            title="Système"
            description="Tous les services sont opérationnels"
            status="online"
          />
          <StatusCard
            title="Ollama"
            description="Configuration requise"
            status="warning"
          />
          <StatusCard
            title="MLX"
            description="Configuration requise"
            status="warning"
          />
        </div>

        {/* Quick start */}
        <div className="mt-12 glass-card rounded-xl p-8 hover:scale-[1.005] transition-all duration-200">
          <h2 className="text-2xl font-bold mb-4">Démarrage rapide</h2>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full glass-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium text-foreground">Configurez Ollama</p>
                <p>Installez et configurez Ollama pour utiliser les modèles locaux</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full glass-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium text-foreground">Créez votre premier persona</p>
                <p>Définissez une personnalité IA adaptée à vos besoins</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full glass-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium text-foreground">Commencez à chatter</p>
                <p>Lancez votre première conversation ou créez un workflow</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
