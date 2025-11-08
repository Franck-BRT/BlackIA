import { memo } from 'react';
import { Handle, Position } from 'reactflow';

export const InputNode = memo(({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 rounded-lg bg-blue-500/20 border-2 border-blue-500/50 min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">📥</span>
        <span className="font-semibold text-white">Entrée</span>
      </div>
      <div className="text-xs text-gray-300">{data.label || 'Nœud d\'entrée'}</div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  );
});

InputNode.displayName = 'InputNode';
