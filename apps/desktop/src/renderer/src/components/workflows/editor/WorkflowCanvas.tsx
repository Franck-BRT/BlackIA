import { Trash2 } from 'lucide-react';
import type { WorkflowNode, WorkflowEdge, Position, NodeGroup, Annotation, ExecutionState } from './types';
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
  selectedNodes?: Set<string>;
  draggingNode: string | null;
  connecting: boolean;
  connectionStart: string | null;
  connectionPos: Position;
  isSelecting?: boolean;
  selectionStart?: Position;
  selectionEnd?: Position;
  groups?: NodeGroup[];
  annotations?: Annotation[];
  executionState?: ExecutionState;
  editingAnnotation?: string | null;
  onNodeMouseDown: (nodeId: string, e: React.MouseEvent) => void;
  onNodeDoubleClick: (nodeId: string) => void;
  onStartConnection: (nodeId: string, e: React.MouseEvent) => void;
  onEndConnection: (nodeId: string) => void;
  onDeleteEdge: (edgeId: string) => void;
  onEdgeDoubleClick?: (edge: WorkflowEdge) => void;
  onAnnotationMouseDown?: (annotationId: string, e: React.MouseEvent) => void;
  onAnnotationDoubleClick?: (annotationId: string) => void;
  onAnnotationContentChange?: (annotationId: string, content: string) => void;
  onDeleteAnnotation?: (annotationId: string, e: React.MouseEvent) => void;
  onToggleBreakpoint?: (nodeId: string) => void;
}

export function WorkflowCanvas({
  nodes,
  edges,
  zoom,
  pan,
  selectedNode,
  selectedNodes = new Set(),
  draggingNode,
  connecting,
  connectionStart,
  connectionPos,
  isSelecting = false,
  selectionStart = { x: 0, y: 0 },
  selectionEnd = { x: 0, y: 0 },
  groups = [],
  annotations = [],
  executionState,
  editingAnnotation,
  onNodeMouseDown,
  onNodeDoubleClick,
  onStartConnection,
  onEndConnection,
  onDeleteEdge,
  onEdgeDoubleClick,
  onAnnotationMouseDown,
  onAnnotationDoubleClick,
  onAnnotationContentChange,
  onDeleteAnnotation,
  onToggleBreakpoint,
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
        {/* Node Groups (en arrière-plan) */}
        <g className="groups">
          {groups.map((group) => (
            <g key={group.id}>
              <rect
                x={group.position.x - 10}
                y={group.position.y - 10}
                width={group.size.width + 20}
                height={group.size.height + 20}
                rx={8}
                fill={group.color || 'rgba(139, 92, 246, 0.1)'}
                stroke={group.color || 'rgba(139, 92, 246, 0.3)'}
                strokeWidth={2}
                strokeDasharray={group.collapsed ? '5,5' : '0'}
                className="transition-all"
              />
              {/* Group label */}
              <text
                x={group.position.x}
                y={group.position.y - 15}
                fill="rgba(255, 255, 255, 0.7)"
                fontSize={12}
                fontWeight="600"
              >
                {group.label}
              </text>
              {/* Collapse indicator */}
              {group.collapsed && (
                <text
                  x={group.position.x + group.size.width - 20}
                  y={group.position.y - 15}
                  fill="rgba(255, 255, 255, 0.5)"
                  fontSize={12}
                >
                  [collapsed]
                </text>
              )}
            </g>
          ))}
        </g>

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
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onEdgeDoubleClick?.(edge);
                  }}
                />

                {/* Path visible */}
                <path
                  d={path}
                  fill="none"
                  stroke="rgba(139, 92, 246, 0.5)"
                  strokeWidth={2}
                  className="group-hover:stroke-purple-400 transition-colors"
                  markerEnd="url(#arrowhead)"
                  style={{ pointerEvents: 'none' }}
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
            const isSelected = selectedNode === node.id || selectedNodes.has(node.id);
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

                {/* Badge de sélection (multi-select) */}
                {isSelected && selectedNodes.size > 1 && (
                  <g transform={`translate(${NODE_WIDTH - 24}, 8)`}>
                    <circle r={10} fill={nodeColor} stroke="white" strokeWidth={2} />
                    <text
                      x={0}
                      y={0}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize={10}
                      fontWeight="bold"
                    >
                      ✓
                    </text>
                  </g>
                )}

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

                {/* Debug indicators */}
                {executionState && (
                  <>
                    {/* Breakpoint indicator */}
                    {executionState.breakpoints.some((bp) => bp.nodeId === node.id && bp.enabled) && (
                      <g
                        transform={`translate(8, 8)`}
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBreakpoint?.(node.id);
                        }}
                      >
                        <circle r={8} fill="#ef4444" stroke="white" strokeWidth={2} />
                        <text
                          x={0}
                          y={0}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize={10}
                          fontWeight="bold"
                        >
                          ●
                        </text>
                      </g>
                    )}

                    {/* Current execution node highlight */}
                    {executionState.currentNodeId === node.id && (
                      <>
                        {/* Glow effect */}
                        <rect
                          x={-4}
                          y={-4}
                          width={NODE_WIDTH + 8}
                          height={NODE_HEIGHT + 8}
                          rx={14}
                          fill="none"
                          stroke="#a78bfa"
                          strokeWidth={3}
                          className="animate-pulse"
                          opacity={0.7}
                        />
                        {/* Executing badge */}
                        <g transform={`translate(${NODE_WIDTH / 2}, -20)`}>
                          <rect
                            x={-30}
                            y={-10}
                            width={60}
                            height={20}
                            rx={4}
                            fill="#8b5cf6"
                          />
                          <text
                            x={0}
                            y={0}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="white"
                            fontSize={10}
                            fontWeight="bold"
                          >
                            {executionState.status === 'running' ? '▶ RUNNING' : '⏸ PAUSED'}
                          </text>
                        </g>
                      </>
                    )}

                    {/* Error indicator */}
                    {executionState.status === 'error' && executionState.currentNodeId === node.id && (
                      <g transform={`translate(${NODE_WIDTH - 8}, 8)`}>
                        <circle r={8} fill="#ef4444" stroke="white" strokeWidth={2} />
                        <text
                          x={0}
                          y={0}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize={12}
                          fontWeight="bold"
                        >
                          ✕
                        </text>
                      </g>
                    )}
                  </>
                )}
              </g>
            );
          })}
        </g>

        {/* Annotations */}
        <g className="annotations">
          {annotations.map((annotation) => {
            if (annotation.type === 'note' || annotation.type === 'comment') {
              const width = annotation.size?.width || 200;
              const height = annotation.size?.height || 100;
              const bgColor = annotation.color || (annotation.type === 'note' ? '#fef3c7' : '#ddd6fe');
              const isEditing = editingAnnotation === annotation.id;

              return (
                <g key={annotation.id} transform={`translate(${annotation.position.x}, ${annotation.position.y})`}>
                  {/* Background */}
                  <rect
                    width={width}
                    height={height}
                    rx={4}
                    fill={bgColor}
                    stroke={isEditing ? 'rgba(139, 92, 246, 0.5)' : 'rgba(0, 0, 0, 0.1)'}
                    strokeWidth={isEditing ? 2 : 1}
                    className="cursor-move opacity-90 hover:opacity-100 transition-opacity"
                    onMouseDown={(e) => onAnnotationMouseDown?.(annotation.id, e as any)}
                    onDoubleClick={() => onAnnotationDoubleClick?.(annotation.id)}
                  />
                  {/* Content */}
                  <foreignObject x={8} y={8} width={width - 16} height={height - 40}>
                    {isEditing ? (
                      <textarea
                        className="w-full h-full text-gray-800 text-sm p-2 resize-none bg-transparent border-none outline-none"
                        style={{ fontSize: annotation.fontSize || 14 }}
                        value={annotation.content}
                        onChange={(e) => onAnnotationContentChange?.(annotation.id, e.target.value)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div
                        className="text-gray-800 text-sm p-2 overflow-auto h-full"
                        style={{ fontSize: annotation.fontSize || 14 }}
                      >
                        {annotation.content || 'Empty note'}
                      </div>
                    )}
                  </foreignObject>
                  {/* Delete button */}
                  <g
                    className="opacity-0 hover:opacity-100 transition-opacity"
                    transform={`translate(${width - 20}, 4)`}
                  >
                    <circle r={8} fill="#ef4444" className="cursor-pointer" />
                    <foreignObject x={-6} y={-6} width={12} height={12}>
                      <div
                        className="flex items-center justify-center cursor-pointer"
                        onClick={(e) => onDeleteAnnotation?.(annotation.id, e as any)}
                      >
                        <Trash2 size={8} color="white" />
                      </div>
                    </foreignObject>
                  </g>
                  {/* Type indicator */}
                  <text
                    x={width - 8}
                    y={height - 8}
                    textAnchor="end"
                    fill="rgba(0, 0, 0, 0.3)"
                    fontSize={10}
                  >
                    {annotation.type === 'note' ? '📝' : '💬'}
                  </text>
                </g>
              );
            } else if (annotation.type === 'arrow') {
              // Simple arrow annotation
              const targetX = annotation.position.x + 100;
              const targetY = annotation.position.y + 100;

              return (
                <g key={annotation.id}>
                  <line
                    x1={annotation.position.x}
                    y1={annotation.position.y}
                    x2={targetX}
                    y2={targetY}
                    stroke={annotation.color || '#93c5fd'}
                    strokeWidth={2}
                    markerEnd="url(#annotation-arrow)"
                    className="cursor-move"
                  />
                  <text
                    x={annotation.position.x}
                    y={annotation.position.y - 5}
                    fill="rgba(255, 255, 255, 0.7)"
                    fontSize={12}
                  >
                    {annotation.content}
                  </text>
                </g>
              );
            }
            return null;
          })}
        </g>

        {/* Box selection */}
        {isSelecting && (
          <rect
            x={Math.min(selectionStart.x, selectionEnd.x)}
            y={Math.min(selectionStart.y, selectionEnd.y)}
            width={Math.abs(selectionEnd.x - selectionStart.x)}
            height={Math.abs(selectionEnd.y - selectionStart.y)}
            fill="rgba(139, 92, 246, 0.1)"
            stroke="rgb(139, 92, 246)"
            strokeWidth={2 / zoom}
            strokeDasharray={`${5 / zoom},${5 / zoom}`}
            rx={4}
            className="pointer-events-none"
          />
        )}

        {/* Markers pour les flèches */}
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
          <marker
            id="annotation-arrow"
            markerWidth={10}
            markerHeight={10}
            refX={9}
            refY={3}
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#93c5fd" />
          </marker>
        </defs>
      </g>
    </svg>
  );
}
