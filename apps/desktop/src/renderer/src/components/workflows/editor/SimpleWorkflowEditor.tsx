import { useState, useRef, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';
import type { SimpleWorkflowEditorProps, WorkflowNode, WorkflowEdge, Position, ExecutionState } from './types';
import { createNode } from './defaultNodes';
import { generateEdgeId } from './edgeUtils';
import { useHistory } from './useHistory';
import { useSelection } from './useSelection';
import { useGroups } from './useGroups';
import { useAnnotations } from './useAnnotations';
import { autoLayout, fitToView, alignNodes, distributeNodes } from './layoutUtils';
import { NodePalette } from './NodePalette';
import { WorkflowCanvas } from './WorkflowCanvas';
import { NodeConfigModal } from './NodeConfigModal';
import { MiniMap } from './MiniMap';
import { EditorToolbar } from './EditorToolbar';
import { TemplateManager } from './TemplateManager';
import { VersionManager } from './VersionManager';
import { VariablesManager } from './VariablesManager';
import { DebugPanel } from './DebugPanel';

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const GRID_SIZE = 20;

interface WorkflowState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export function SimpleWorkflowEditor({ workflow, onSave, onCancel, onExecute }: SimpleWorkflowEditorProps) {
  // History management (Undo/Redo)
  const {
    state: workflowState,
    setState: setWorkflowState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory<WorkflowState>({
    nodes: workflow?.nodes || [],
    edges: workflow?.edges || [],
  });

  const { nodes, edges } = workflowState;

  // Selection management (Multi-select, Copy/Paste)
  const {
    selectedNodes,
    selectNode,
    clearSelection,
    selectArea,
    copyNodes,
    pasteNodes,
    deleteSelectedNodes,
    hasSelection,
    hasClipboard,
  } = useSelection();

  // Groups management
  const {
    groups,
    createGroup,
    setAllGroups,
  } = useGroups();

  // Annotations management
  const {
    annotations,
    createAnnotation,
    setAllAnnotations,
  } = useAnnotations();

  // Modal states for advanced features
  const [showTemplates, setShowTemplates] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [showVariables, setShowVariables] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  // Debug execution state
  const [executionState, setExecutionState] = useState<ExecutionState>({
    currentNodeId: null,
    status: 'idle',
    breakpoints: [],
    variables: {},
    stepMode: false,
    callStack: [],
    logs: [],
  });

  // Canvas state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Position>({ x: 0, y: 0 });
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  // Drag state
  const [draggingNodes, setDraggingNodes] = useState<Set<string>>(new Set());
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState<Map<string, Position>>(new Map());

  // Selection area (box selection)
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<Position>({ x: 0, y: 0 });
  const [selectionEnd, setSelectionEnd] = useState<Position>({ x: 0, y: 0 });

  // Connection state
  const [connecting, setConnecting] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [connectionPos, setConnectionPos] = useState<Position>({ x: 0, y: 0 });

  // Configuration modal
  const [configuringNode, setConfiguringNode] = useState<WorkflowNode | null>(null);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Update viewport size
  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setViewportSize({ width: rect.width, height: rect.height });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Add node from palette
  const handleAddNode = useCallback(
    (type: string) => {
      const newNode = createNode(type, {
        x: (viewportSize.width / 2 - pan.x) / zoom,
        y: (viewportSize.height / 2 - pan.y) / zoom,
      });

      if (newNode) {
        setWorkflowState({
          nodes: [...nodes, newNode],
          edges,
        });
      }
    },
    [nodes, edges, pan, zoom, viewportSize, setWorkflowState]
  );

  // Start dragging nodes
  const handleNodeMouseDown = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      const isMultiSelect = e.shiftKey || e.ctrlKey || e.metaKey;
      const isNodeSelected = selectedNodes.has(nodeId);

      // Update selection
      if (!isNodeSelected || !isMultiSelect) {
        selectNode(nodeId, isMultiSelect);
      }

      const canvasBounds = canvasRef.current?.getBoundingClientRect();
      if (!canvasBounds) return;

      const mouseX = (e.clientX - canvasBounds.left - pan.x) / zoom;
      const mouseY = (e.clientY - canvasBounds.top - pan.y) / zoom;

      // Determine which nodes to drag
      const nodesToDrag = isNodeSelected && selectedNodes.size > 1
        ? Array.from(selectedNodes)
        : [nodeId];

      setDraggingNodes(new Set(nodesToDrag));
      setDragStart({ x: mouseX, y: mouseY });

      // Calculate offset for each node
      const offsets = new Map<string, Position>();
      nodesToDrag.forEach((id) => {
        const node = nodes.find((n) => n.id === id);
        if (node) {
          offsets.set(id, {
            x: mouseX - node.position.x,
            y: mouseY - node.position.y,
          });
        }
      });
      setDragOffset(offsets);
    },
    [nodes, selectedNodes, selectNode, pan, zoom]
  );

  // Double-click to configure
  const handleNodeDoubleClick = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setConfiguringNode(node);
      }
    },
    [nodes]
  );

  // Start connection
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

  // End connection
  const handleEndConnection = useCallback(
    (targetNodeId: string) => {
      if (connecting && connectionStart && connectionStart !== targetNodeId) {
        const existingEdge = edges.find(
          (e) => e.source === connectionStart && e.target === targetNodeId
        );

        if (!existingEdge) {
          const newEdge: WorkflowEdge = {
            id: generateEdgeId(connectionStart, targetNodeId),
            source: connectionStart,
            target: targetNodeId,
          };

          setWorkflowState({
            nodes,
            edges: [...edges, newEdge],
          });
        }
      }

      setConnecting(false);
      setConnectionStart(null);
    },
    [connecting, connectionStart, edges, nodes, setWorkflowState]
  );

  // Mouse move handler
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const canvasBounds = canvasRef.current?.getBoundingClientRect();
      if (!canvasBounds) return;

      const mouseX = (e.clientX - canvasBounds.left - pan.x) / zoom;
      const mouseY = (e.clientY - canvasBounds.top - pan.y) / zoom;

      // Drag nodes
      if (draggingNodes.size > 0) {
        setWorkflowState({
          nodes: nodes.map((node) => {
            if (!draggingNodes.has(node.id)) return node;

            const offset = dragOffset.get(node.id);
            if (!offset) return node;

            return {
              ...node,
              position: {
                x: Math.round((mouseX - offset.x) / GRID_SIZE) * GRID_SIZE,
                y: Math.round((mouseY - offset.y) / GRID_SIZE) * GRID_SIZE,
              },
            };
          }),
          edges,
        }, true); // Skip history during drag
      }

      // Connection in progress
      if (connecting) {
        setConnectionPos({ x: mouseX, y: mouseY });
      }

      // Pan canvas
      if (isPanning) {
        setPan({
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
      }

      // Box selection
      if (isSelecting) {
        setSelectionEnd({ x: mouseX, y: mouseY });
      }
    },
    [draggingNodes, dragOffset, connecting, isPanning, panStart, isSelecting, pan, zoom, nodes, edges, setWorkflowState]
  );

  // Mouse up handler
  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (draggingNodes.size > 0) {
        // Finalize drag - add to history
        setWorkflowState({
          nodes,
          edges,
        });
        setDraggingNodes(new Set());
        setDragOffset(new Map());
      }

      if (connecting) {
        setConnecting(false);
        setConnectionStart(null);
      }

      if (isPanning) {
        setIsPanning(false);
      }

      if (isSelecting) {
        selectArea(selectionStart, selectionEnd, nodes, NODE_WIDTH, NODE_HEIGHT);
        setIsSelecting(false);
      }
    },
    [draggingNodes, connecting, isPanning, isSelecting, nodes, edges, selectionStart, selectionEnd, setWorkflowState, selectArea]
  );

  // Canvas mouse down (pan or box select)
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0 && !draggingNodes.size && !connecting) {
        const canvasBounds = canvasRef.current?.getBoundingClientRect();
        if (!canvasBounds) return;

        const mouseX = (e.clientX - canvasBounds.left - pan.x) / zoom;
        const mouseY = (e.clientY - canvasBounds.top - pan.y) / zoom;

        if (e.shiftKey) {
          // Box selection
          setIsSelecting(true);
          setSelectionStart({ x: mouseX, y: mouseY });
          setSelectionEnd({ x: mouseX, y: mouseY });
        } else {
          // Pan
          setIsPanning(true);
          setPanStart({
            x: e.clientX - pan.x,
            y: e.clientY - pan.y,
          });
          clearSelection();
        }
      }
    },
    [draggingNodes, connecting, pan, zoom, clearSelection]
  );

  // Zoom with mouse wheel
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.1, Math.min(2, prev * delta)));
  }, []);

  // Delete edge
  const handleDeleteEdge = useCallback(
    (edgeId: string) => {
      setWorkflowState({
        nodes,
        edges: edges.filter((e) => e.id !== edgeId),
      });
    },
    [nodes, edges, setWorkflowState]
  );

  // Copy nodes
  const handleCopy = useCallback(() => {
    copyNodes(nodes, edges);
  }, [nodes, edges, copyNodes]);

  // Paste nodes
  const handlePaste = useCallback(() => {
    const result = pasteNodes(nodes, edges);
    setWorkflowState(result);
  }, [nodes, edges, pasteNodes, setWorkflowState]);

  // Delete selected nodes
  const handleDelete = useCallback(() => {
    const result = deleteSelectedNodes(nodes, edges);
    setWorkflowState(result);
  }, [nodes, edges, deleteSelectedNodes, setWorkflowState]);

  // Fit to view
  const handleFitToView = useCallback(() => {
    const { zoom: newZoom, pan: newPan } = fitToView(
      nodes,
      viewportSize.width,
      viewportSize.height,
      NODE_WIDTH,
      NODE_HEIGHT
    );
    setZoom(newZoom);
    setPan(newPan);
  }, [nodes, viewportSize]);

  // Auto layout
  const handleAutoLayout = useCallback(() => {
    const layoutedNodes = autoLayout(nodes, edges);
    setWorkflowState({
      nodes: layoutedNodes,
      edges,
    });
    handleFitToView();
  }, [nodes, edges, setWorkflowState, handleFitToView]);

  // Align nodes
  const handleAlign = useCallback(
    (direction: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v') => {
      const alignedNodes = alignNodes(nodes, Array.from(selectedNodes), direction, NODE_WIDTH, NODE_HEIGHT);
      setWorkflowState({
        nodes: alignedNodes,
        edges,
      });
    },
    [nodes, edges, selectedNodes, setWorkflowState]
  );

  // Distribute nodes
  const handleDistribute = useCallback(
    (direction: 'horizontal' | 'vertical') => {
      const distributedNodes = distributeNodes(nodes, Array.from(selectedNodes), direction, NODE_WIDTH, NODE_HEIGHT);
      setWorkflowState({
        nodes: distributedNodes,
        edges,
      });
    },
    [nodes, edges, selectedNodes, setWorkflowState]
  );

  // Export workflow as JSON
  const handleExport = useCallback(() => {
    const data = {
      nodes,
      edges,
      groups,
      annotations,
      metadata: {
        name: workflow?.name,
        exportedAt: new Date().toISOString(),
        version: '1.0',
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflow?.name || 'workflow'}-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, groups, annotations, workflow]);

  // Import workflow from JSON
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          setWorkflowState({
            nodes: data.nodes || [],
            edges: data.edges || [],
          });
          // Restore groups and annotations if present
          if (data.groups) setAllGroups(data.groups);
          if (data.annotations) setAllAnnotations(data.annotations);
        } catch (error) {
          console.error('Failed to import workflow:', error);
          alert('Erreur lors de l\'importation du workflow');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [setWorkflowState, setAllGroups, setAllAnnotations]);

  // Advanced features handlers
  const handleOpenTemplates = useCallback(() => {
    setShowTemplates(true);
  }, []);

  const handleOpenVersions = useCallback(() => {
    setShowVersions(true);
  }, []);

  const handleOpenVariables = useCallback(() => {
    setShowVariables(true);
  }, []);

  const handleToggleDebug = useCallback(() => {
    setShowDebugPanel((prev) => !prev);
  }, []);

  const handleCreateGroup = useCallback(() => {
    if (selectedNodes.size >= 2) {
      createGroup(Array.from(selectedNodes), nodes);
    }
  }, [selectedNodes, nodes, createGroup]);

  const handleAddAnnotation = useCallback(
    (type: 'note' | 'comment') => {
      // Add annotation at center of viewport
      createAnnotation(type, {
        x: (viewportSize.width / 2 - pan.x) / zoom,
        y: (viewportSize.height / 2 - pan.y) / zoom,
      }, type === 'note' ? 'Nouvelle note' : 'Nouveau commentaire');
    },
    [createAnnotation, viewportSize, pan, zoom]
  );

  // Debug handlers
  const handleToggleBreakpoint = useCallback(
    (nodeId: string) => {
      setExecutionState((prev) => {
        const existingIndex = prev.breakpoints.findIndex((bp) => bp.nodeId === nodeId);
        if (existingIndex >= 0) {
          // Toggle existing breakpoint
          const updated = [...prev.breakpoints];
          updated[existingIndex] = {
            ...updated[existingIndex],
            enabled: !updated[existingIndex].enabled,
          };
          return { ...prev, breakpoints: updated };
        } else {
          // Add new breakpoint
          return {
            ...prev,
            breakpoints: [
              ...prev.breakpoints,
              {
                id: `bp-${Date.now()}`,
                nodeId,
                enabled: true,
              },
            ],
          };
        }
      });
    },
    []
  );

  const handleStartDebug = useCallback(() => {
    setExecutionState((prev) => ({
      ...prev,
      status: 'running',
      stepMode: true,
      currentNodeId: nodes[0]?.id || null,
      callStack: [],
      logs: [
        {
          nodeId: 'system',
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Debug session started',
        },
      ],
    }));
  }, [nodes]);

  const handleStopDebug = useCallback(() => {
    setExecutionState((prev) => ({
      ...prev,
      status: 'idle',
      currentNodeId: null,
      stepMode: false,
      callStack: [],
      logs: [
        ...prev.logs,
        {
          nodeId: 'system',
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'Debug session stopped',
        },
      ],
    }));
  }, []);

  const handleStepNext = useCallback(() => {
    setExecutionState((prev) => {
      const currentIndex = nodes.findIndex((n) => n.id === prev.currentNodeId);
      const nextNode = nodes[currentIndex + 1];

      return {
        ...prev,
        currentNodeId: nextNode?.id || null,
        status: nextNode ? 'paused' : 'completed',
        callStack: nextNode ? [...prev.callStack, nextNode.id] : prev.callStack,
        logs: [
          ...prev.logs,
          {
            nodeId: prev.currentNodeId || 'system',
            timestamp: new Date().toISOString(),
            level: 'info',
            message: nextNode ? `Stepping to ${nextNode.type}` : 'Execution completed',
          },
        ],
      };
    });
  }, [nodes]);

  const handleContinue = useCallback(() => {
    setExecutionState((prev) => ({
      ...prev,
      status: 'running',
    }));
  }, []);

  const handlePause = useCallback(() => {
    setExecutionState((prev) => ({
      ...prev,
      status: 'paused',
    }));
  }, []);

  // Save workflow
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isModifier = e.ctrlKey || e.metaKey;

      // Delete/Backspace - Delete selected nodes
      if ((e.key === 'Delete' || e.key === 'Backspace') && hasSelection && !configuringNode) {
        e.preventDefault();
        handleDelete();
      }

      // Ctrl+Z - Undo
      if (isModifier && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }

      // Ctrl+Y or Ctrl+Shift+Z - Redo
      if ((isModifier && e.key === 'y') || (isModifier && e.key === 'z' && e.shiftKey)) {
        e.preventDefault();
        redo();
      }

      // Ctrl+C - Copy
      if (isModifier && e.key === 'c' && hasSelection) {
        e.preventDefault();
        handleCopy();
      }

      // Ctrl+V - Paste
      if (isModifier && e.key === 'v' && hasClipboard) {
        e.preventDefault();
        handlePaste();
      }

      // Ctrl+A - Select all
      if (isModifier && e.key === 'a') {
        e.preventDefault();
        selectNode(nodes[0]?.id, false);
        nodes.forEach((node) => selectNode(node.id, true));
      }

      // Ctrl+S - Save
      if (isModifier && e.key === 's') {
        e.preventDefault();
        handleSave();
      }

      // Escape - Clear selection or cancel
      if (e.key === 'Escape') {
        if (configuringNode) {
          setConfiguringNode(null);
        } else if (hasSelection) {
          clearSelection();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    hasSelection,
    hasClipboard,
    configuringNode,
    nodes,
    undo,
    redo,
    handleCopy,
    handlePaste,
    handleDelete,
    handleSave,
    selectNode,
    clearSelection,
  ]);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(2, prev * 1.2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => Math.max(0.1, prev / 1.2));
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Toolbar */}
      <EditorToolbar
        workflowName={workflow?.name}
        nodeCount={nodes.length}
        selectedCount={selectedNodes.size}
        canUndo={canUndo}
        canRedo={canRedo}
        hasClipboard={hasClipboard}
        isSaving={isSaving}
        onSave={handleSave}
        onCancel={onCancel}
        onExecute={onExecute}
        onUndo={undo}
        onRedo={redo}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onDelete={handleDelete}
        onExport={handleExport}
        onImport={handleImport}
        onFitToView={handleFitToView}
        onAutoLayout={handleAutoLayout}
        onAlign={handleAlign}
        onDistribute={handleDistribute}
        onOpenTemplates={handleOpenTemplates}
        onOpenVersions={handleOpenVersions}
        onOpenVariables={handleOpenVariables}
        onToggleDebug={handleToggleDebug}
        onCreateGroup={handleCreateGroup}
        onAddAnnotation={handleAddAnnotation}
        debugActive={showDebugPanel}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Node Palette */}
        <NodePalette onAddNode={handleAddNode} />

        {/* Canvas */}
        <div className="flex-1 relative">
          <div
            ref={canvasRef}
            className="w-full h-full relative overflow-hidden bg-gray-950"
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
              selectedNode={selectedNodes.size === 1 ? Array.from(selectedNodes)[0] : null}
              selectedNodes={selectedNodes}
              draggingNode={draggingNodes.size > 0 ? Array.from(draggingNodes)[0] : null}
              connecting={connecting}
              connectionStart={connectionStart}
              connectionPos={connectionPos}
              isSelecting={isSelecting}
              selectionStart={selectionStart}
              selectionEnd={selectionEnd}
              groups={groups}
              annotations={annotations}
              executionState={executionState}
              onNodeMouseDown={handleNodeMouseDown}
              onNodeDoubleClick={handleNodeDoubleClick}
              onStartConnection={handleStartConnection}
              onEndConnection={handleEndConnection}
              onDeleteEdge={handleDeleteEdge}
            />
          </div>

          {/* Mini-map */}
          <MiniMap
            nodes={nodes}
            viewportWidth={viewportSize.width}
            viewportHeight={viewportSize.height}
            zoom={zoom}
            pan={pan}
            nodeWidth={NODE_WIDTH}
            nodeHeight={NODE_HEIGHT}
            onViewportChange={(newPan) => setPan(newPan)}
          />

          {/* Zoom controls overlay */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <div className="flex flex-col gap-1 p-2 rounded-lg bg-gray-900/90 backdrop-blur-sm border border-white/20 shadow-lg">
              <button
                onClick={handleZoomIn}
                className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Zoom avant"
              >
                <ZoomIn size={16} />
              </button>
              <div className="text-xs text-center text-gray-400 py-1">
                {Math.round(zoom * 100)}%
              </div>
              <button
                onClick={handleZoomOut}
                className="p-2 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Zoom arrière"
              >
                <ZoomOut size={16} />
              </button>
            </div>
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="absolute bottom-4 left-4 p-3 rounded-lg bg-gray-900/90 backdrop-blur-sm border border-white/20 shadow-lg">
            <div className="text-xs text-gray-400 space-y-1">
              <div><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-300">Shift</kbd> + Drag pour sélectionner</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-300">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-300">Z</kbd> Annuler</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-300">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-300">C/V</kbd> Copier/Coller</div>
              <div><kbd className="px-1.5 py-0.5 rounded bg-white/10 text-gray-300">Suppr</kbd> Effacer</div>
            </div>
          </div>
        </div>
      </div>

      {/* Node Configuration Modal */}
      {configuringNode && (
        <NodeConfigModal
          node={configuringNode}
          onUpdate={(data) => {
            setWorkflowState({
              nodes: nodes.map((n) =>
                n.id === configuringNode.id ? { ...n, data: { ...n.data, ...data } } : n
              ),
              edges,
            });
            setConfiguringNode(null);
          }}
          onClose={() => setConfiguringNode(null)}
        />
      )}

      {/* Template Manager Modal */}
      {showTemplates && (
        <TemplateManager
          currentNodes={nodes}
          currentEdges={edges}
          onApplyTemplate={(template) => {
            setWorkflowState({
              nodes: template.nodes,
              edges: template.edges,
            });
          }}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {/* Version Manager Modal */}
      {showVersions && (
        <VersionManager
          workflowId={workflow?.id || 'temp-workflow'}
          currentNodes={nodes}
          currentEdges={edges}
          currentGroups={groups}
          currentAnnotations={annotations}
          onRestoreVersion={(version) => {
            setWorkflowState({
              nodes: version.nodes,
              edges: version.edges,
            });
            if (version.groups) setAllGroups(version.groups);
            if (version.annotations) setAllAnnotations(version.annotations);
          }}
          onClose={() => setShowVersions(false)}
        />
      )}

      {/* Variables Manager Modal */}
      {showVariables && (
        <VariablesManager
          workflowId={workflow?.id || 'temp-workflow'}
          onClose={() => setShowVariables(false)}
        />
      )}

      {/* Debug Panel (Side panel, not modal) */}
      {showDebugPanel && (
        <div className="fixed right-0 top-0 bottom-0 w-96 z-50 shadow-2xl">
          <DebugPanel
            nodes={nodes}
            executionState={executionState}
            onToggleBreakpoint={handleToggleBreakpoint}
            onStartDebug={handleStartDebug}
            onStopDebug={handleStopDebug}
            onStepNext={handleStepNext}
            onContinue={handleContinue}
            onPause={handlePause}
          />
        </div>
      )}
    </div>
  );
}
