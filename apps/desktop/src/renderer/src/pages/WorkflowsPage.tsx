import React from 'react';
import { Workflow } from 'lucide-react';

export function WorkflowsPage() {
  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-6xl mx-auto">
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="w-20 h-20 rounded-2xl glass-lg flex items-center justify-center mx-auto mb-6">
            <Workflow className="w-10 h-10 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Module Workflows</h1>
          <p className="text-muted-foreground mb-8">
            Créez et exécutez des flux d'automatisation complexes
          </p>
          <div className="inline-block px-6 py-3 glass-lg rounded-xl text-sm">
            🚧 En cours de développement
          </div>
        </div>
      </div>
    </div>
  );
}
