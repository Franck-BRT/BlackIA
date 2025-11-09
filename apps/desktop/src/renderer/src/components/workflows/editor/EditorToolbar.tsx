import {
  Save,
  Play,
  Undo,
  Redo,
  Download,
  Upload,
  Maximize2,
  Copy,
  Scissors,
  Grid3x3,
  AlignLeft,
  AlignRight,
  AlignCenterHorizontal,
  AlignTop,
  AlignBottom,
  AlignCenterVertical,
  LayoutGrid,
} from 'lucide-react';

interface EditorToolbarProps {
  workflowName?: string;
  nodeCount: number;
  selectedCount: number;
  canUndo: boolean;
  canRedo: boolean;
  hasClipboard: boolean;
  isSaving: boolean;
  onSave: () => void;
  onCancel?: () => void;
  onExecute?: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onExport: () => void;
  onImport: () => void;
  onFitToView: () => void;
  onAutoLayout: () => void;
  onAlign?: (direction: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v') => void;
  onDistribute?: (direction: 'horizontal' | 'vertical') => void;
}

export function EditorToolbar({
  workflowName,
  nodeCount,
  selectedCount,
  canUndo,
  canRedo,
  hasClipboard,
  isSaving,
  onSave,
  onCancel,
  onExecute,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDelete,
  onExport,
  onImport,
  onFitToView,
  onAutoLayout,
  onAlign,
  onDistribute,
}: EditorToolbarProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-gray-900/50 border-b border-white/10">
      {/* Left section - Title & Info */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">
            {workflowName || 'Nouveau Workflow'}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-400">
              {nodeCount} nœud{nodeCount > 1 ? 's' : ''}
            </span>
            {selectedCount > 0 && (
              <>
                <span className="text-gray-600">•</span>
                <span className="text-xs text-purple-400">
                  {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Center section - Tools */}
      <div className="flex items-center gap-2">
        {/* Undo/Redo */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white
                     transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Annuler (Ctrl+Z)"
          >
            <Undo size={16} />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white
                     transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Refaire (Ctrl+Y)"
          >
            <Redo size={16} />
          </button>
        </div>

        {/* Copy/Paste */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
          <button
            onClick={onCopy}
            disabled={selectedCount === 0}
            className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white
                     transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Copier (Ctrl+C)"
          >
            <Copy size={16} />
          </button>
          <button
            onClick={onPaste}
            disabled={!hasClipboard}
            className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white
                     transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Coller (Ctrl+V)"
          >
            <Scissors size={16} className="rotate-180" />
          </button>
        </div>

        {/* Alignment (only when multiple nodes selected) */}
        {selectedCount >= 2 && onAlign && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
            <button
              onClick={() => onAlign('left')}
              className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Aligner à gauche"
            >
              <AlignLeft size={16} />
            </button>
            <button
              onClick={() => onAlign('center-h')}
              className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Centrer horizontalement"
            >
              <AlignCenterHorizontal size={16} />
            </button>
            <button
              onClick={() => onAlign('right')}
              className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Aligner à droite"
            >
              <AlignRight size={16} />
            </button>
            <div className="w-px h-4 bg-white/20" />
            <button
              onClick={() => onAlign('top')}
              className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Aligner en haut"
            >
              <AlignTop size={16} />
            </button>
            <button
              onClick={() => onAlign('center-v')}
              className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Centrer verticalement"
            >
              <AlignCenterVertical size={16} />
            </button>
            <button
              onClick={() => onAlign('bottom')}
              className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Aligner en bas"
            >
              <AlignBottom size={16} />
            </button>
          </div>
        )}

        {/* View & Layout */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
          <button
            onClick={onFitToView}
            className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Ajuster à la vue"
          >
            <Maximize2 size={16} />
          </button>
          <button
            onClick={onAutoLayout}
            className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Auto-layout"
          >
            <LayoutGrid size={16} />
          </button>
        </div>

        {/* Export/Import */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-white/10">
          <button
            onClick={onExport}
            className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Exporter JSON"
          >
            <Download size={16} />
          </button>
          <button
            onClick={onImport}
            className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Importer JSON"
          >
            <Upload size={16} />
          </button>
        </div>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-white/10 text-gray-400
                     hover:bg-white/5 transition-colors text-sm"
          >
            Annuler
          </button>
        )}
        {onExecute && (
          <button
            onClick={onExecute}
            className="px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30
                     border border-green-500/30 text-green-400 transition-colors
                     flex items-center gap-2 text-sm"
          >
            <Play size={16} />
            Exécuter
          </button>
        )}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600
                   text-white transition-colors flex items-center gap-2
                   disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
        >
          <Save size={16} />
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </div>
  );
}
