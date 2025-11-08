import { memo } from 'react';
import { Handle, Position } from 'reactflow';

export const LoopNode = memo(({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 rounded-lg bg-orange-500/20 border-2 border-orange-500/50 min-w-[220px]">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🔁</span>
        <span className="font-semibold text-white">Boucle</span>
      </div>
      <div className="text-xs text-gray-300 mb-2">{data.label || 'Loop/ForEach'}</div>

      {data.loopType && (
        <div className="text-xs text-gray-400 bg-black/20 rounded px-2 py-1 mb-2">
          Type: {data.loopType}
          {data.loopCount && ` (${data.loopCount}x)`}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-orange-500 border-2 border-white"
      />
    </div>
  );
});

LoopNode.displayName = 'LoopNode';
