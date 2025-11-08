import { memo } from 'react';
import { Handle, Position } from 'reactflow';

export const AIPromptNode = memo(({ data }: { data: any }) => {
  return (
    <div className="px-4 py-3 rounded-lg bg-purple-500/20 border-2 border-purple-500/50 min-w-[250px]">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />

      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">🤖</span>
        <span className="font-semibold text-white">IA Prompt</span>
      </div>
      <div className="text-xs text-gray-300 mb-2">{data.label || 'Génération IA'}</div>

      {data.promptTemplate && (
        <div className="text-xs text-gray-400 bg-black/20 rounded px-2 py-1 mb-2 line-clamp-2">
          {data.promptTemplate}
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-400">
        {data.temperature && <span>Temp: {data.temperature}</span>}
        {data.maxTokens && <span>Max: {data.maxTokens}</span>}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />
    </div>
  );
});

AIPromptNode.displayName = 'AIPromptNode';
