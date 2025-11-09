import { Trash2, Circle } from 'lucide-react';
import type { WorkflowNode, WorkflowEdge, Position } from './types';
import { getBezierPath, getHandlePosition } from './edgeUtils';
import { getNodeColor, getNodeIcon } from './defaultNodes';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const HANDLE_SIZE = 12;

interface WorkflowCanvasProps {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  zoom: number;
  pan: Position;
  selectedNode: string | null;
  draggingNode: string | null;
  connecting: boolean;
  connectionStart: string | null;
  connectionPos: Position;
  onNodeMouseDown: (nodeId: string, e: React.MouseEvent) => void;
  onNodeDoubleClick: (nodeId: string) => void;
  onStartConnection: (nodeId: string, e: React.MouseEvent) => void;
  onEndConnection: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
}

export function WorkflowCanvas({
  nodes,
  edges,
  zoom,
  pan,
  selectedNode,
  draggingNode,
  connecting,
  connectionStart,
  connectionPos,
  onNodeMouseDown,
  onNodeDoubleClick,
  onStartConnection,
  onEndConnection,
  onDeleteEdge,
}: WorkflowCanvasProps) {
  return (
    <svg
      className="w-full h-full"
      style={{
        cursor: connecting ? 'crosshair' : 'grab',
      }}
    >
      {/* Grid pattern */}
      <defs>
        <pattern
          id="grid"
          width={20 * zoom}
          height={20 * zoom}
          patternUnits="userSpaceOnUse"
          x={pan.x}
          y={pan.y}
        >
          <circle cx={1} cy={1} r={1} fill="rgba(255, 255, 255, 0.05)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* Transform group pour zoom et pan */}
      <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
        {/* Edges (connexions) */}
        <g className="edges">
          {edges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);

            if (!sourceNode || !targetNode) return null;

            const sourcePos = getHandlePosition(
              sourceNode.position.x,
              sourceNode.position.y,
              NODE_WIDTH,
              NODE_HEIGHT,
              'source'
            );

            const targetPos = getHandlePosition(
              targetNode.position.x,
              targetNode.position.y,
              NODE_WIDTH,
              NODE_HEIGHT,
              'target'
            );

            const path = getBezierPath(
              sourcePos.x,
              sourcePos.y,
              targetPos.x,
              targetPos.y
            );

            return (
              <g key={edge.id} className="edge group">
                {/* Path invisible pour faciliter le clic */}
                <path
                  d={path}
                  fill="none"
                  stroke="transparent"
                  strokeWidth={20}
                  style={{ cursor: 'pointer' }}
                />

                {/* Path visible */}
                <path
                  d={path}
                  fill="none"
                  stroke="rgba(139, 92, 246, 0.5)"
                  strokeWidth={2}
                  className="group-hover:stroke-purple-400 transition-colors"
                  markerEnd="url(#arrowhead)"
                />

                {/* Bouton de suppression au milieu de la connexion */}
                <g
                  transform={`translate(${(sourcePos.x + targetPos.x) / 2}, ${(sourcePos.y + targetPos.y) / 2})`}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <circle r={12} fill="rgb(239, 68, 68)" className="cursor-pointer" />
                  <foreignObject x={-8} y={-8} width={16} height={16}>
                    <div
                      className="flex items-center justify-center cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteEdge(edge.id);
                      }}
                    >
                      <Trash2 size={12} color="white" />
                    </div>
                  </foreignObject>
                </g>
              </g>
            );
          })}
        </g>

        {/* Connexion en cours */}
        {connecting && connectionStart && (
          <g className="connecting-edge">
            {(() => {
              const sourceNode = nodes.find((n) => n.id === connectionStart);
              if (!sourceNode) return null;

              const sourcePos = getHandlePosition(
                sourceNode.position.x,
                sourceNode.position.y,
                NODE_WIDTH,
                NODE_HEIGHT,
                'source'
              );

              const path = getBezierPath(
                sourcePos.x,
                sourcePos.y,
                connectionPos.x,
                connectionPos.y
              );

              return (
                <path
                  d={path}
                  fill="none"
                  stroke="rgba(139, 92, 246, 0.5)"
                  strokeWidth={2}
                  strokeDasharray="5,5"
                  className="animate-pulse"
                />
              );
            })()}
          </g>
        )}

        {/* Nodes */}
        <g className="nodes">
          {nodes.map((node) => {
            const isSelected = selectedNode === node.id;
            const isDragging = draggingNode === node.id;
            const nodeColor = getNodeColor(node.type);
            const nodeIcon = getNodeIcon(node.type);

            return (
              <g
                key={node.id}
                transform={`translate(${node.position.x}, ${node.position.y})`}
                className={isDragging ? 'opacity-80' : ''}
              >
                {/* Fond du nœud */}
                <rect
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  rx={12}
                  fill="rgb(31, 41, 55)"
                  stroke={isSelected ? nodeColor : 'rgba(255, 255, 255, 0.1)'}
                  strokeWidth={isSelected ? 2 : 1}
                  className="transition-all cursor-move"
                  onMouseDown={(e) => onNodeMouseDown(node.id, e)}
                  onDoubleClick={() => onNodeDoubleClick(node.id)}
                />

                {/* Barre de couleur à gauche */}
                <rect width={4} height={NODE_HEIGHT} rx={12} fill={nodeColor} />

                {/* Contenu du nœud */}
                <foreignObject x={16} y={0} width={NODE_WIDTH - 32} height={NODE_HEIGHT}>
                  <div className="h-full flex items-center gap-3 px-2">
                    <div className="text-2xl flex-shrink-0">{nodeIcon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {(node.data.label as string) || node.type}
                      </div>
                      <div className="text-xs text-gray-400 truncate">{node.type}</div>
                    </div>
                  </div>
                </foreignObject>

                {/* Handle de sortie (à droite) */}
                <g
                  transform={`translate(${NODE_WIDTH}, ${NODE_HEIGHT / 2})`}
                  className="cursor-crosshair"
                  onMouseDown={(e) => onStartConnection(node.id, e)}
                >
                  <circle
                    r={HANDLE_SIZE / 2}
                    fill={nodeColor}
                    stroke="white"
                    strokeWidth={2}
                    className="hover:r-8 transition-all"
                  />
                </g>

                {/* Handle d'entrée (à gauche) */}
                <g
                  transform={`translate(0, ${NODE_HEIGHT / 2})`}
                  className="cursor-crosshair"
                  onMouseUp={() => onEndConnection(node.id)}
                >
                  <circle
                    r={HANDLE_SIZE / 2}
                    fill={nodeColor}
                    stroke="white"
                    strokeWidth={2}
                    className="hover:r-8 transition-all"
                  />
                </g>
              </g>
            );
          })}
        </g>

        {/* Marker pour les flèches */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth={10}
            markerHeight={10}
            refX={9}
            refY={3}
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="rgba(139, 92, 246, 0.5)" />
          </marker>
        </defs>
      </g>
    </svg>
  );
}
