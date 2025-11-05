import React from 'react';
import { Settings } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-6xl mx-auto">
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-20 h-20 rounded-2xl glass-lg flex items-center justify-center mx-auto mb-6">
            <Settings className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Paramètres</h1>
          <p className="text-muted-foreground mb-8">
            Configurez votre application BlackIA
          </p>
          <div className="inline-block px-6 py-3 glass-lg rounded-xl text-sm">
            🚧 En cours de développement
          </div>
        </div>
      </div>
    </div>
  );
}
