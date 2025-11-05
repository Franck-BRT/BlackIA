import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Workflow, FileText, User, FolderOpen, Zap } from 'lucide-react';

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
      <div className="max-w-6xl mx-auto">
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

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <Link
              key={index}
              to={feature.path}
              className={`glass-card rounded-2xl p-6 glass-hover group ${
                feature.path === '#' ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={e => feature.path === '#' && e.preventDefault()}
            >
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
              >
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Link>
          ))}
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="font-semibold">Système</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Tous les services sont opérationnels
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <h3 className="font-semibold">Ollama</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Configuration requise
            </p>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <h3 className="font-semibold">MLX</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Configuration requise
            </p>
          </div>
        </div>

        {/* Quick start */}
        <div className="mt-12 glass-card rounded-2xl p-8">
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
