import { useState } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Palette, Type, Layout, Sparkles, Circle, Eye, Droplet, Sun, Moon, Monitor, Maximize2 } from 'lucide-react';
import { CardSizePreview } from './CardSizePreview';

export function AppearanceSettings() {
  const { settings, updateAppearanceSettings } = useSettings();
  const { appearance } = settings;
  const { theme, setTheme } = useTheme();

  // État local pour le slider (pour l'aperçu en temps réel)
  const [tempCardSize, setTempCardSize] = useState(appearance.cardSize);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleCardSizeChange = (newSize: number) => {
    setTempCardSize(newSize);
    setHasUnsavedChanges(newSize !== appearance.cardSize);
  };

  const saveCardSize = () => {
    updateAppearanceSettings({ cardSize: tempCardSize });
    setHasUnsavedChanges(false);
  };

  const resetCardSize = () => {
    setTempCardSize(appearance.cardSize);
    setHasUnsavedChanges(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Apparence</h2>
        <p className="text-muted-foreground">
          Personnalisez l'apparence et le style de l'interface
        </p>
      </div>

      {/* Theme Mode */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg glass-lg flex items-center justify-center">
            {theme === 'light' ? <Sun className="w-5 h-5 text-yellow-400" /> :
             theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> :
             <Monitor className="w-5 h-5 text-blue-400" />}
          </div>
          <div>
            <h3 className="text-lg font-semibold">Thème</h3>
            <p className="text-sm text-muted-foreground">
              Choisissez le mode d'affichage de l'interface
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setTheme('light')}
            className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              theme === 'light'
                ? 'glass-lg text-foreground ring-2 ring-yellow-500/50'
                : 'glass text-muted-foreground hover:text-foreground hover:glass-lg'
            }`}
          >
            <Sun className="w-6 h-6" />
            <span className="text-sm">Clair</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              theme === 'dark'
                ? 'glass-lg text-foreground ring-2 ring-indigo-500/50'
                : 'glass text-muted-foreground hover:text-foreground hover:glass-lg'
            }`}
          >
            <Moon className="w-6 h-6" />
            <span className="text-sm">Sombre</span>
          </button>

          <button
            onClick={() => setTheme('auto')}
            className={`flex flex-col items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
              theme === 'auto'
                ? 'glass-lg text-foreground ring-2 ring-blue-500/50'
                : 'glass text-muted-foreground hover:text-foreground hover:glass-lg'
            }`}
          >
            <Monitor className="w-6 h-6" />
            <span className="text-sm">Auto</span>
          </button>
        </div>
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

      {/* Card Size */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg glass-lg flex items-center justify-center">
            <Maximize2 className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Taille des cartes</h3>
            <p className="text-sm text-muted-foreground">
              Ajustez la taille des cartes (Workflows, Prompts, Personas)
            </p>
          </div>
        </div>

        {/* Slider */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground min-w-[60px]">Petite</span>
            <input
              type="range"
              min="280"
              max="400"
              step="10"
              value={tempCardSize}
              onChange={(e) => handleCardSizeChange(parseInt(e.target.value))}
              className="flex-1 h-2 bg-glass rounded-lg appearance-none cursor-pointer
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-teal-500
                       [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all
                       [&::-webkit-slider-thumb]:hover:scale-110
                       [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4
                       [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-teal-500
                       [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
            />
            <span className="text-sm text-muted-foreground min-w-[60px] text-right">Grande</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Taille actuelle : <span className="font-semibold text-teal-400">{tempCardSize}px</span>
            </span>
            {hasUnsavedChanges && (
              <div className="flex items-center gap-2">
                <button
                  onClick={resetCardSize}
                  className="px-3 py-1.5 text-xs rounded-lg glass text-muted-foreground hover:text-foreground transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={saveCardSize}
                  className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-teal-500 to-teal-600 text-white font-medium hover:scale-105 transition-transform"
                >
                  Enregistrer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-4">Aperçu en temps réel :</p>
          <CardSizePreview cardSize={tempCardSize} />
        </div>
      </div>

      {/* Glass Effect */}
      <div className={`glass-card rounded-xl p-6 space-y-4 ${!appearance.enableGlassmorphism ? 'opacity-50' : ''}`}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg glass-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Intensité du glassmorphism</h3>
            <p className="text-sm text-muted-foreground">
              {appearance.enableGlassmorphism
                ? 'Intensité de l\'effet de verre dépoli'
                : 'Activez le glassmorphism pour configurer l\'intensité'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {(['subtle', 'medium', 'intense'] as const).map((effect) => (
            <button
              key={effect}
              onClick={() => appearance.enableGlassmorphism && updateAppearanceSettings({ glassEffect: effect })}
              disabled={!appearance.enableGlassmorphism}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                !appearance.enableGlassmorphism
                  ? 'glass cursor-not-allowed opacity-50'
                  : appearance.glassEffect === effect
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

        {/* Glassmorphism Toggle */}
        <div className="flex items-center justify-between p-4 glass-card rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg glass-lg flex items-center justify-center">
              <Droplet className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <div className="text-sm font-medium">Effet glassmorphism</div>
              <p className="text-xs text-muted-foreground">
                Activer les effets de transparence et flou (désactiver améliore les performances)
              </p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={appearance.enableGlassmorphism}
              onChange={(e) =>
                updateAppearanceSettings({ enableGlassmorphism: e.target.checked })
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
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
