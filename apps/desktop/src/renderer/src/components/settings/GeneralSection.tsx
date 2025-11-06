import { useSettings } from '../../contexts/SettingsContext';

export function GeneralSection() {
  const { settings, updateGeneralSettings } = useSettings();
  const { general } = settings;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Paramètres généraux</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configurez les paramètres de base de l'application
        </p>
      </div>

      {/* Theme */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Thème</label>
        <select
          value={general.theme}
          onChange={(e) =>
            updateGeneralSettings({
              theme: e.target.value as 'light' | 'dark' | 'system',
            })
          }
          className="w-full px-3 py-2 glass-card rounded-lg border border-border/50 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="system">Système</option>
          <option value="light">Clair</option>
          <option value="dark">Sombre</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Choisissez le thème de l'interface
        </p>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Langue</label>
        <select
          value={general.language}
          onChange={(e) => updateGeneralSettings({ language: e.target.value })}
          className="w-full px-3 py-2 glass-card rounded-lg border border-border/50 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
        <p className="text-xs text-muted-foreground">
          Langue de l'interface utilisateur
        </p>
      </div>

      {/* Auto-save */}
      <div className="flex items-center justify-between p-4 glass-card rounded-lg">
        <div>
          <div className="text-sm font-medium">Sauvegarde automatique</div>
          <p className="text-xs text-muted-foreground">
            Sauvegarder automatiquement les modifications
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={general.autoSave}
            onChange={(e) => updateGeneralSettings({ autoSave: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>

      {/* Notifications */}
      <div className="flex items-center justify-between p-4 glass-card rounded-lg">
        <div>
          <div className="text-sm font-medium">Notifications</div>
          <p className="text-xs text-muted-foreground">
            Afficher les notifications système
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={general.notifications}
            onChange={(e) =>
              updateGeneralSettings({ notifications: e.target.checked })
            }
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>
    </div>
  );
}
