import { useState } from 'react';
import { Server, Cpu } from 'lucide-react';
import { OllamaSettings } from './OllamaSettings';
import { MLXSettings } from './MLXSettings';

type TabType = 'ollama' | 'mlx';

export function AILocalSettings() {
  const [activeTab, setActiveTab] = useState<TabType>('ollama');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">AI Locale</h2>
        <p className="text-muted-foreground">
          Configuration des backends d'IA locale (Ollama pour le chat, MLX pour les embeddings)
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 glass-card rounded-xl p-2">
        <button
          onClick={() => setActiveTab('ollama')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'ollama'
              ? 'glass-lg text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          <Server className="w-5 h-5" />
          <span>Ollama</span>
          <span className="text-xs opacity-60">(Chat)</span>
        </button>
        <button
          onClick={() => setActiveTab('mlx')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
            activeTab === 'mlx'
              ? 'glass-lg text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }`}
        >
          <Cpu className="w-5 h-5" />
          <span>MLX</span>
          <span className="text-xs opacity-60">(Embeddings)</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'ollama' && <OllamaSettings />}
        {activeTab === 'mlx' && <MLXSettings />}
      </div>
    </div>
  );
}
