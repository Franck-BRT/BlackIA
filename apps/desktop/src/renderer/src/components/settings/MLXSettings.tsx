import { useState } from 'react';
import {
  Settings2,
  Store,
  HardDrive,
  Cpu,
} from 'lucide-react';
import { MLXModelStore } from './MLXModelStore';
import { MLXModelManager } from './MLXModelManager';
import { MLXGeneralSettings } from './MLXGeneralSettings';

type TabType = 'general' | 'store' | 'models';

export function MLXSettings() {
  const [activeTab, setActiveTab] = useState<TabType>('general');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg glass-lg flex items-center justify-center">
            <Cpu className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">MLX (Apple Silicon)</h2>
            <p className="text-sm text-muted-foreground">
              Framework ML optimisé pour puces Apple - LLM locaux et embeddings
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-xl p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'general'
                ? 'glass-lg text-orange-400'
                : 'hover:glass-card text-muted-foreground'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Settings2 className="w-4 h-4" />
              <span>Général</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('store')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'store'
                ? 'glass-lg text-purple-400'
                : 'hover:glass-card text-muted-foreground'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Store className="w-4 h-4" />
              <span>Store</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === 'models'
                ? 'glass-lg text-blue-400'
                : 'hover:glass-card text-muted-foreground'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <HardDrive className="w-4 h-4" />
              <span>Modèles</span>
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'general' && <MLXGeneralSettings />}
        {activeTab === 'store' && <MLXModelStore />}
        {activeTab === 'models' && <MLXModelManager />}
      </div>
    </div>
  );
}
