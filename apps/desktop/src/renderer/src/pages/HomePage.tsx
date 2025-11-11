import React, { useEffect, useState } from 'react';
import { MessageSquare, Workflow, FileText, User, FolderOpen, Zap, FileEdit } from 'lucide-react';
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
      description: 'Conversations intelligentes avec vos modèles locaux Ollama et MLX',
      path: '/chat',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Workflow,
      title: 'Workflows',
      description: 'Automatisez vos tâches avec des flux personnalisés et visuels',
      path: '/workflows',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: FileText,
      title: 'Prompts',
      description: 'Gérez votre bibliothèque de prompts avec variables et catégories',
      path: '/prompts',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: User,
      title: 'Personas',
      description: 'Créez des assistants IA spécialisés avec des personnalités uniques',
      path: '/personas',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: FileEdit,
      title: 'Éditeur',
      description: 'Éditeur Markdown avec aperçu en temps réel et assistant IA intégré',
      path: '/editor',
      color: 'from-teal-500 to-cyan-500',
    },
    {
      icon: FolderOpen,
      title: 'Projets',
      description: 'Organisez et gérez vos projets avec l\'aide de l\'IA (Prochainement)',
      path: '/projects',
      color: 'from-indigo-500 to-blue-500',
    },
    {
      icon: Zap,
      title: 'Et plus encore',
      description: 'Générateurs de code, MCP Server, agents autonomes...',
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
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Votre suite complète d'assistance IA, 100% locale et privée. Créez, automatisez et innovez avec vos propres modèles d'IA.
          </p>
          {version && (
            <div className="mt-6 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <span className="px-3 py-1 glass-card rounded-full">Version {version}</span>
              <span className="px-3 py-1 glass-card rounded-full">{platform}</span>
              <span className="px-3 py-1 glass-card rounded-full">Ollama + MLX</span>
            </div>
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
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">État des services</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatusCard
              title="Application"
              description="Base de données, workflows et paramètres opérationnels"
              status="online"
            />
            <StatusCard
              title="Ollama"
              description="Configurez dans Paramètres > IA Locale pour utiliser vos modèles"
              status="warning"
            />
            <StatusCard
              title="MLX"
              description="Support natif des modèles Apple Silicon (optionnel)"
              status="warning"
            />
          </div>
        </div>

        {/* Quick start */}
        <div className="glass-card rounded-xl p-8 hover:scale-[1.005] transition-all duration-200">
          <h2 className="text-2xl font-bold mb-6">Démarrage rapide</h2>
          <div className="space-y-6 text-sm">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white font-bold">
                1
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-base mb-1">Configurez Ollama</p>
                <p className="text-muted-foreground">
                  Installez Ollama depuis <span className="text-purple-400">ollama.ai</span>, puis configurez-le dans <span className="font-medium">Paramètres → IA Locale</span>. Téléchargez vos modèles préférés (Llama, Mistral, etc.).
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 text-white font-bold">
                2
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-base mb-1">Explorez les Personas</p>
                <p className="text-muted-foreground">
                  Allez dans <span className="font-medium">Personas</span> pour découvrir les assistants pré-configurés ou créez le vôtre avec un system prompt personnalisé et des paramètres ajustés.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 text-white font-bold">
                3
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-base mb-1">Créez vos Prompts et Workflows</p>
                <p className="text-muted-foreground">
                  Construisez votre bibliothèque de <span className="font-medium">Prompts</span> réutilisables avec variables, puis automatisez vos tâches avec des <span className="font-medium">Workflows</span> visuels.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 text-white font-bold">
                4
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground text-base mb-1">Lancez votre premier Chat</p>
                <p className="text-muted-foreground">
                  Ouvrez le <span className="font-medium">Chat</span>, sélectionnez un persona, et commencez à converser avec votre IA locale. Vos données restent 100% privées sur votre machine.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features highlight */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-semibold mb-2">100% Local</h3>
            <p className="text-sm text-muted-foreground">
              Vos conversations et données restent sur votre machine. Aucune fuite vers le cloud.
            </p>
          </div>
          <div className="glass-card rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">🚀</div>
            <h3 className="font-semibold mb-2">Performant</h3>
            <p className="text-sm text-muted-foreground">
              Optimisé pour Apple Silicon avec MLX et compatible avec tous les modèles Ollama.
            </p>
          </div>
          <div className="glass-card rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">🎨</div>
            <h3 className="font-semibold mb-2">Personnalisable</h3>
            <p className="text-sm text-muted-foreground">
              Interface moderne avec thèmes, tailles de cartes ajustables et workflows sur mesure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
