import { memo } from 'react';
import { Handle, Position } from 'reactflow';

export const OutputNode = memo(({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 rounded-lg bg-green-500/20 border-2 border-green-500/50 min-w-[200px]">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">📤</span>
        <span className="font-semibold text-white">Sortie</span>
      </div>
      <div className="text-xs text-gray-300">{data.label || 'Nœud de sortie'}</div>
    </div>
  );
});

OutputNode.displayName = 'OutputNode';
