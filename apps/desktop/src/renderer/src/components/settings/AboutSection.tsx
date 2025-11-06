import { useSettings } from '../../contexts/SettingsContext';
import { Github, ExternalLink } from 'lucide-react';

export function AboutSection() {
  const { resetSettings } = useSettings();

  const handleReset = () => {
    if (
      window.confirm(
        'Êtes-vous sûr de vouloir réinitialiser tous les paramètres ? Cette action est irréversible.'
      )
    ) {
      resetSettings();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">À propos</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Informations sur BlackIA et gestion des paramètres
        </p>
      </div>

      {/* App Info */}
      <div className="glass-card rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 glass-card rounded-xl flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span className="text-3xl">🤖</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold">BlackIA</h3>
            <p className="text-sm text-muted-foreground">
              Assistant IA local et privé
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-border/50 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Build</span>
            <span className="font-medium">2025.01.06</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Electron</span>
            <span className="font-medium">{process.versions.electron}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Node.js</span>
            <span className="font-medium">{process.versions.node}</span>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="space-y-2">
        <a
          href="https://github.com/Franck-BRT/BlackIA"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-4 glass-card rounded-lg hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <Github className="w-5 h-5" />
            <span className="text-sm font-medium">Code source sur GitHub</span>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </a>

        <a
          href="https://github.com/Franck-BRT/BlackIA/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between p-4 glass-card rounded-lg hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg">🐛</span>
            <span className="text-sm font-medium">Signaler un bug</span>
          </div>
          <ExternalLink className="w-4 h-4 text-muted-foreground" />
        </a>
      </div>

      {/* License */}
      <div className="glass-card rounded-lg p-4">
        <h4 className="text-sm font-medium mb-2">Licence</h4>
        <p className="text-xs text-muted-foreground">
          BlackIA est un logiciel open-source distribué sous licence MIT.
        </p>
      </div>

      {/* Reset settings */}
      <div className="glass-card rounded-lg p-4 bg-destructive/5 border border-destructive/20">
        <h4 className="text-sm font-medium mb-2 text-destructive">
          Zone de danger
        </h4>
        <p className="text-xs text-muted-foreground mb-4">
          Réinitialisez tous les paramètres à leur valeur par défaut. Cette action
          est irréversible.
        </p>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors"
        >
          Réinitialiser les paramètres
        </button>
      </div>
    </div>
  );
}
