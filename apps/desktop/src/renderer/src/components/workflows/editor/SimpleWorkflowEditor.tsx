import { useState, useRef, useCallback, useEffect } from 'react';
import { Save, Play, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { SimpleWorkflowEditorProps, WorkflowNode, WorkflowEdge, Position } from './types';
import { WorkflowNodeRegistry } from './types';
import { createNode, getNodeColor, getNodeIcon } from './defaultNodes';
import { getBezierPath, getHandlePosition, generateEdgeId, findNodeAtPosition } from './edgeUtils';
import { NodePalette } from './NodePalette';
import { WorkflowCanvas } from './WorkflowCanvas';
import { NodeConfigModal } from './NodeConfigModal';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const GRID_SIZE = 20;

export function SimpleWorkflowEditor({ workflow, onSave, onCancel, onExecute }: SimpleWorkflowEditorProps) {
  // État des nodes et edges
  const [nodes, setNodes] = useState<WorkflowNode[]>(workflow?.nodes || []);
  const [edges, setEdges] = useState<WorkflowEdge[]>(workflow?.edges || []);

  // État du canvas
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });

  // État de la sélection et du drag
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });

  // État de la connexion
  const [connecting, setConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [connectionPos, setConnectionPos] = useState<Position>({ x: 0, y: 0 });

  // État de la configuration
  const [configuringNode, setConfiguringNode] = useState<WorkflowNode | null>(null);

  // État de sauvegarde
  const [isSaving, setIsSaving] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Ajouter un nœud depuis la palette
  const handleAddNode = useCallback(
    (type: string) => {
      const newNode = createNode(type, {
        x: 100 - pan.x / zoom,
        y: 100 - pan.y / zoom,
      });

      if (newNode) {
        setNodes((prev) => [...prev, newNode]);
      }
    },
    [pan, zoom]
  );

  // Démarrer le drag d'un nœud
  const handleNodeMouseDown = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      const canvasBounds = canvasRef.current?.getBoundingClientRect();
      if (!canvasBounds) return;

      const mouseX = (e.clientX - canvasBounds.left - pan.x) / zoom;
      const mouseY = (e.clientY - canvasBounds.top - pan.y) / zoom;

      setDraggingNode(nodeId);
      setSelectedNode(nodeId);
      setDragOffset({
        x: mouseX - node.position.x,
        y: mouseY - node.position.y,
      });
    },
    [nodes, pan, zoom]
  );

  // Double-clic sur un nœud pour le configurer
  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setConfiguringNode(node);
      }
    },
    [nodes]
  );

  // Commencer une connexion
  const handleStartConnection = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setConnecting(true);
      setConnectionStart(nodeId);

      const canvasBounds = canvasRef.current?.getBoundingClientRect();
      if (canvasBounds) {
        setConnectionPos({
          x: (e.clientX - canvasBounds.left - pan.x) / zoom,
          y: (e.clientY - canvasBounds.top - pan.y) / zoom,
        });
      }
    },
    [pan, zoom]
  );

  // Terminer une connexion
  const handleEndConnection = useCallback(
    (targetNodeId: string) => {
      if (connecting && connectionStart && connectionStart !== targetNodeId) {
        // Vérifier qu'une connexion n'existe pas déjà
        const existingEdge = edges.find(
          (e) => e.source === connectionStart && e.target === targetNodeId
        );

        if (!existingEdge) {
          const newEdge: WorkflowEdge = {
            id: generateEdgeId(connectionStart, targetNodeId),
            source: connectionStart,
            target: targetNodeId,
          };

          setEdges((prev) => [...prev, newEdge]);
        }
      }

      setConnecting(false);
      setConnectionStart(null);
    },
    [connecting, connectionStart, edges]
  );

  // Gestion du mouvement de la souris
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvasBounds = canvasRef.current?.getBoundingClientRect();
      if (!canvasBounds) return;

      const mouseX = (e.clientX - canvasBounds.left - pan.x) / zoom;
      const mouseY = (e.clientY - canvasBounds.top - pan.y) / zoom;

      // Drag de nœud
      if (draggingNode) {
        setNodes((prev) =>
          prev.map((node) =>
            node.id === draggingNode
              ? {
                  ...node,
                  position: {
                    x: Math.round((mouseX - dragOffset.x) / GRID_SIZE) * GRID_SIZE,
                    y: Math.round((mouseY - dragOffset.y) / GRID_SIZE) * GRID_SIZE,
                  },
                }
              : node
          )
        );
      }

      // Connexion en cours
      if (connecting) {
        setConnectionPos({ x: mouseX, y: mouseY });
      }

      // Pan du canvas
      if (isPanning) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }
    },
    [draggingNode, dragOffset, connecting, isPanning, panStart, pan, zoom]
  );

  // Gestion du relâchement de la souris
  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (draggingNode) {
        setDraggingNode(null);
      }

      if (connecting) {
        setConnecting(false);
        setConnectionStart(null);
      }

      if (isPanning) {
        setIsPanning(false);
      }
    },
    [draggingNode, connecting, isPanning]
  );

  // Commencer le pan
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0 && !draggingNode && !connecting) {
        // Clic gauche pour panner
        setIsPanning(true);
        setPanStart({
          x: e.clientX - pan.x,
          y: e.clientY - pan.y,
        });
        setSelectedNode(null);
      }
    },
    [draggingNode, connecting, pan]
  );

  // Gestion du zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.1, Math.min(2, prev * delta)));
  }, []);

  // Supprimer un nœud
  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((prev) => prev.filter((n) => n.id !== nodeId));
      setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
      setSelectedNode(null);
    },
    []
  );

  // Supprimer une connexion
  const handleDeleteEdge = useCallback((edgeId: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
  }, []);

  // Sauvegarder
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSave({
        nodes,
        edges,
        ...(workflow && {
          name: workflow.name,
        }),
      });
    } catch (error) {
      console.error('Error saving workflow:', error);
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, workflow, onSave]);

  // Réinitialiser la vue
  const handleResetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  // Zoom in/out
  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(2, prev * 1.2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(0.1, prev / 1.2));
  }, []);

  // Gestion du clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Supprimer avec Delete ou Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode) {
        handleDeleteNode(selectedNode);
      }

      // Sauvegarder avec Ctrl+S
      if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, handleDeleteNode, handleSave]);

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900/50 border-b border-white/10">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-white">
            {workflow?.name || 'Nouveau Workflow'}
          </h2>
          <span className="px-3 py-1 rounded-full bg-white/5 text-sm text-gray-400">
            {nodes.length} nœud{nodes.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom controls */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
            <button
              onClick={handleZoomOut}
              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Zoom arrière"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-sm text-gray-400 min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Zoom avant"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={handleResetView}
              className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Réinitialiser la vue"
            >
              <Maximize2 size={16} />
            </button>
          </div>

          {onCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-white/10 text-gray-400
                       hover:bg-white/5 transition-colors"
            >
              Annuler
            </button>
          )}
          {onExecute && (
            <button
              onClick={onExecute}
              className="px-4 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30
                       border border-green-500/30 text-green-400 transition-colors
                       flex items-center gap-2"
            >
              <Play size={16} />
              Exécuter
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-600
                     text-white transition-colors flex items-center gap-2
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Node Palette */}
        <NodePalette onAddNode={handleAddNode} />

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden bg-gray-950"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
        >
          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            zoom={zoom}
            pan={pan}
            selectedNode={selectedNode}
            draggingNode={draggingNode}
            connecting={connecting}
            connectionStart={connectionStart}
            connectionPos={connectionPos}
            onNodeMouseDown={handleNodeMouseDown}
            onNodeDoubleClick={handleNodeDoubleClick}
            onStartConnection={handleStartConnection}
            onEndConnection={handleEndConnection}
            onDeleteEdge={handleDeleteEdge}
          />
        </div>
      </div>

      {/* Node Configuration Modal */}
      {configuringNode && (
        <NodeConfigModal
          node={configuringNode}
          onUpdate={(data) => {
            setNodes((prev) =>
              prev.map((n) =>
                n.id === configuringNode.id
                  ? { ...n, data: { ...n.data, ...data } }
                  : n
              )
            );
            setConfiguringNode(null);
          }}
          onClose={() => setConfiguringNode(null)}
        />
      )}
    </div>
  );
}
