import { memo } from 'react';
import { Handle, Position } from 'reactflow';

export const ConditionNode = memo(({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 rounded-lg bg-yellow-500/20 border-2 border-yellow-500/50 min-w-[220px]">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-yellow-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">❓</span>
        <span className="font-semibold text-white">Condition</span>
      </div>
      <div className="text-xs text-gray-300 mb-2">{data.label || 'If/Else'}</div>

      {data.condition && (
        <div className="text-xs text-gray-400 bg-black/20 rounded px-2 py-1 mb-2">
          {data.condition}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-green-400">Oui</span>
          <Handle
            type="source"
            position={Position.Right}
            id="yes"
            className="w-3 h-3 bg-green-500 border-2 border-white relative"
            style={{ top: '-10px' }}
          />
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-red-400">Non</span>
          <Handle
            type="source"
            position={Position.Right}
            id="no"
            className="w-3 h-3 bg-red-500 border-2 border-white relative"
            style={{ top: '10px' }}
          />
        </div>
      </div>
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
