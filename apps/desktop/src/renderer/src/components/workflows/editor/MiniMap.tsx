import type { WorkflowNode, Position } from './types';
import { getNodeColor } from './defaultNodes';

interface MiniMapProps {
  nodes: WorkflowNode[];
  viewportWidth: number;
  viewportHeight: number;
  zoom: number;
  pan: Position;
  nodeWidth?: number;
  nodeHeight?: number;
  onViewportChange?: (pan: Position) => void;
}

const MINIMAP_WIDTH = 200;
const MINIMAP_HEIGHT = 150;
const MINIMAP_NODE_SCALE = 0.15;

export function MiniMap({
  nodes,
  viewportWidth,
  viewportHeight,
  zoom,
  pan,
  nodeWidth = 200,
  nodeHeight = 80,
  onViewportChange,
}: MiniMapProps) {
  if (nodes.length === 0) {
    return null;
  }

  // Calculer les limites du workflow
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + nodeWidth);
    maxY = Math.max(maxY, node.position.y + nodeHeight);
  });

  // Ajouter un padding
  const padding = 50;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const workflowWidth = maxX - minX;
  const workflowHeight = maxY - minY;

  // Calculer l'échelle pour la minimap
  const scaleX = MINIMAP_WIDTH / workflowWidth;
  const scaleY = MINIMAP_HEIGHT / workflowHeight;
  const scale = Math.min(scaleX, scaleY);

  // Calculer la position du viewport dans la minimap
  const viewportX = ((-pan.x / zoom - minX) * scale);
  const viewportY = ((-pan.y / zoom - minY) * scale);
  const viewportW = (viewportWidth / zoom) * scale;
  const viewportH = (viewportHeight / zoom) * scale;

  const handleMinimapClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onViewportChange) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Convertir la position de la minimap vers le canvas
    const canvasX = (x / scale + minX) * zoom;
    const canvasY = (y / scale + minY) * zoom;

    // Centrer le viewport sur cette position
    onViewportChange({
      x: -canvasX + viewportWidth / 2,
      y: -canvasY + viewportHeight / 2,
    });
  };

  return (
    <div className="absolute bottom-4 right-4 bg-gray-900/90 backdrop-blur-sm border border-white/20 rounded-lg shadow-2xl overflow-hidden">
      <div className="px-3 py-2 border-b border-white/10">
        <div className="text-xs font-medium text-gray-400">Mini-map</div>
      </div>
      <svg
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        className="cursor-pointer bg-gray-950/50"
        onClick={handleMinimapClick}
      >
        {/* Nodes */}
        {nodes.map((node) => {
          const x = (node.position.x - minX) * scale;
          const y = (node.position.y - minY) * scale;
          const w = nodeWidth * scale;
          const h = nodeHeight * scale;
          const color = getNodeColor(node.type);

          return (
            <rect
              key={node.id}
              x={x}
              y={y}
              width={w}
              height={h}
              rx={2}
              fill={color}
              opacity={0.8}
            />
          );
        })}

        {/* Viewport rectangle */}
        <rect
          x={viewportX}
          y={viewportY}
          width={viewportW}
          height={viewportH}
          fill="rgba(139, 92, 246, 0.2)"
          stroke="rgb(139, 92, 246)"
          strokeWidth={2}
          rx={4}
          className="pointer-events-none"
        />
      </svg>
    </div>
  );
}
