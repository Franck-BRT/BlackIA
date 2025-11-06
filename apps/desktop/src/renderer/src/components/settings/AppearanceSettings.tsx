import { useSettings } from '../../contexts/SettingsContext';
import { Palette, Type, Layout, Sparkles, Circle, Eye } from 'lucide-react';

export function AppearanceSettings() {
  const { settings, updateAppearanceSettings } = useSettings();
  const { appearance } = settings;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Apparence</h2>
        <p className="text-muted-foreground">
          Personnalisez l'apparence et le style de l'interface
        </p>
      </div>

      {/* Font Size */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg glass-lg flex items-center justify-center">
            <Type className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Taille de police</h3>
            <p className="text-sm text-muted-foreground">
              Ajustez la taille du texte dans l'interface
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(['small', 'medium', 'large'] as const).map((size) => (
            <button
              key={size}
              onClick={() => updateAppearanceSettings({ fontSize: size })}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                appearance.fontSize === size
                  ? 'glass-lg text-foreground ring-2 ring-purple-500/50'
                  : 'glass text-muted-foreground hover:text-foreground hover:glass-lg'
              }`}
            >
              {size === 'small' && 'Petit'}
              {size === 'medium' && 'Moyen'}
              {size === 'large' && 'Grand'}
            </button>
          ))}
        </div>
      </div>

      {/* Density */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg glass-lg flex items-center justify-center">
            <Layout className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Densité de l'interface</h3>
            <p className="text-sm text-muted-foreground">
              Contrôlez l'espacement des éléments
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(['compact', 'comfortable', 'spacious'] as const).map((density) => (
            <button
              key={density}
              onClick={() => updateAppearanceSettings({ density })}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                appearance.density === density
                  ? 'glass-lg text-foreground ring-2 ring-blue-500/50'
                  : 'glass text-muted-foreground hover:text-foreground hover:glass-lg'
              }`}
            >
              {density === 'compact' && 'Compact'}
              {density === 'comfortable' && 'Confortable'}
              {density === 'spacious' && 'Spacieux'}
            </button>
          ))}
        </div>
      </div>

      {/* Glass Effect */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg glass-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Effet glassmorphism</h3>
            <p className="text-sm text-muted-foreground">
              Intensité de l'effet de verre dépoli
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(['subtle', 'medium', 'intense'] as const).map((effect) => (
            <button
              key={effect}
              onClick={() => updateAppearanceSettings({ glassEffect: effect })}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                appearance.glassEffect === effect
                  ? 'glass-lg text-foreground ring-2 ring-pink-500/50'
                  : 'glass text-muted-foreground hover:text-foreground hover:glass-lg'
              }`}
            >
              {effect === 'subtle' && 'Subtil'}
              {effect === 'medium' && 'Moyen'}
              {effect === 'intense' && 'Intense'}
            </button>
          ))}
        </div>
      </div>

      {/* Accent Color */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg glass-lg flex items-center justify-center">
            <Palette className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Couleur d'accent</h3>
            <p className="text-sm text-muted-foreground">
              Choisissez la couleur principale de l'interface
            </p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-3">
          {([
            { value: 'purple', label: 'Violet', color: 'bg-purple-500' },
            { value: 'blue', label: 'Bleu', color: 'bg-blue-500' },
            { value: 'pink', label: 'Rose', color: 'bg-pink-500' },
            { value: 'green', label: 'Vert', color: 'bg-green-500' },
            { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
          ] as const).map((color) => (
            <button
              key={color.value}
              onClick={() => updateAppearanceSettings({ accentColor: color.value })}
              className={`flex flex-col items-center gap-2 px-3 py-3 rounded-lg font-medium transition-all ${
                appearance.accentColor === color.value
                  ? 'glass-lg text-foreground ring-2 ring-white/50'
                  : 'glass text-muted-foreground hover:text-foreground hover:glass-lg'
              }`}
            >
              <div className={`w-8 h-8 rounded-full ${color.color}`} />
              <span className="text-xs">{color.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg glass-lg flex items-center justify-center">
            <Circle className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Arrondis</h3>
            <p className="text-sm text-muted-foreground">
              Style des coins des éléments
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(['sharp', 'medium', 'round'] as const).map((radius) => (
            <button
              key={radius}
              onClick={() => updateAppearanceSettings({ borderRadius: radius })}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                appearance.borderRadius === radius
                  ? 'glass-lg text-foreground ring-2 ring-orange-500/50'
                  : 'glass text-muted-foreground hover:text-foreground hover:glass-lg'
              }`}
            >
              {radius === 'sharp' && 'Aigus'}
              {radius === 'medium' && 'Moyens'}
              {radius === 'round' && 'Arrondis'}
            </button>
          ))}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        {/* Animations */}
        <div className="flex items-center justify-between p-4 glass-card rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg glass-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="text-sm font-medium">Animations</div>
              <p className="text-xs text-muted-foreground">
                Activer les animations de l'interface
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={appearance.animations}
              onChange={(e) =>
                updateAppearanceSettings({ animations: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
          </label>
        </div>

        {/* Reduced Motion */}
        <div className="flex items-center justify-between p-4 glass-card rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg glass-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="text-sm font-medium">Mouvement réduit</div>
              <p className="text-xs text-muted-foreground">
                Réduire les mouvements pour l'accessibilité
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={appearance.reducedMotion}
              onChange={(e) =>
                updateAppearanceSettings({ reducedMotion: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
          </label>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 glass-card rounded-lg bg-blue-500/10 border border-blue-500/20">
        <p className="text-xs text-blue-400">
          💡 Les changements d'apparence sont sauvegardés automatiquement et prennent effet
          immédiatement.
        </p>
      </div>
    </div>
  );
}
