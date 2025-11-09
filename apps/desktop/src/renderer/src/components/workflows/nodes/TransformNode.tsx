import { memo } from 'react';
import { Handle, Position } from 'reactflow';

export const TransformNode = memo(({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 rounded-lg bg-cyan-500/20 border-2 border-cyan-500/50 min-w-[220px]">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-cyan-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">⚙️</span>
        <span className="font-semibold text-white">Transform</span>
      </div>
      <div className="text-xs text-gray-300 mb-2">{data.label || 'Transformation'}</div>

      {data.transformType && (
        <div className="text-xs text-gray-400 bg-black/20 rounded px-2 py-1 mb-2">
          Type: {data.transformType}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-cyan-500 border-2 border-white"
      />
    </div>
  );
});

TransformNode.displayName = 'TransformNode';
