import { memo } from 'react';
import { Handle, Position } from 'reactflow';

export const SwitchNode = memo(({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 rounded-lg bg-pink-500/20 border-2 border-pink-500/50 min-w-[220px]">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-pink-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🔀</span>
        <span className="font-semibold text-white">Switch</span>
      </div>
      <div className="text-xs text-gray-300 mb-2">{data.label || 'Multi-branches'}</div>

      {data.cases && (
        <div className="text-xs text-gray-400 bg-black/20 rounded px-2 py-1 mb-2">
          {data.cases.length} branches
        </div>
      )}

      <div className="flex flex-col gap-1 mt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-end gap-2">
            <span className="text-xs text-gray-400">Case {i}</span>
            <Handle
              type="source"
              position={Position.Right}
              id={`case-${i}`}
              className="w-3 h-3 bg-pink-500 border-2 border-white relative"
              style={{ top: `${(i - 2) * 15}px` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
});

SwitchNode.displayName = 'SwitchNode';
