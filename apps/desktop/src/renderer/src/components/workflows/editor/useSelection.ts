import { useState, useCallback } from 'react';
import type { WorkflowNode, WorkflowEdge, Position } from './types';

/**
 * Hook pour gérer la sélection multiple et le copy/paste
 */

interface ClipboardData {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export function useSelection() {
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [clipboard, setClipboard] = useState<ClipboardData | null>(null);

  const selectNode = useCallback((nodeId: string, multiSelect = false) => {
    setSelectedNodes((prev) => {
      if (multiSelect) {
        const newSet = new Set(prev);
        if (newSet.has(nodeId)) {
          newSet.delete(nodeId);
        } else {
          newSet.add(nodeId);
        }
        return newSet;
      } else {
        return new Set([nodeId]);
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedNodes(new Set());
  }, []);

  const selectAll = useCallback((nodeIds: string[]) => {
    setSelectedNodes(new Set(nodeIds));
  }, []);

  const selectArea = useCallback(
    (start: Position, end: Position, nodes: WorkflowNode[], nodeWidth: number, nodeHeight: number) => {
      const minX = Math.min(start.x, end.x);
      const maxX = Math.max(start.x, end.x);
      const minY = Math.min(start.y, end.y);
      const maxY = Math.max(start.y, end.y);

      const selectedIds = nodes
        .filter((node) => {
          const nodeRight = node.position.x + nodeWidth;
          const nodeBottom = node.position.y + nodeHeight;

          return (
            node.position.x < maxX &&
            nodeRight > minX &&
            node.position.y < maxY &&
            nodeBottom > minY
          );
        })
        .map((node) => node.id);

      setSelectedNodes(new Set(selectedIds));
    },
    []
  );

  const copyNodes = useCallback(
    (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
      const selectedNodeIds = Array.from(selectedNodes);
      if (selectedNodeIds.length === 0) return;

      const nodesToCopy = nodes.filter((node) => selectedNodeIds.includes(node.id));
      const edgesToCopy = edges.filter(
        (edge) => selectedNodeIds.includes(edge.source) && selectedNodeIds.includes(edge.target)
      );

      setClipboard({ nodes: nodesToCopy, edges: edgesToCopy });
    },
    [selectedNodes]
  );

  const pasteNodes = useCallback(
    (
      currentNodes: WorkflowNode[],
      currentEdges: WorkflowEdge[],
      offsetX = 50,
      offsetY = 50
    ): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } => {
      if (!clipboard || clipboard.nodes.length === 0) {
        return { nodes: currentNodes, edges: currentEdges };
      }

      // Créer un mapping des anciens IDs vers les nouveaux
      const idMap = new Map<string, string>();

      const newNodes = clipboard.nodes.map((node) => {
        const newId = `${node.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        idMap.set(node.id, newId);

        return {
          ...node,
          id: newId,
          position: {
            x: node.position.x + offsetX,
            y: node.position.y + offsetY,
          },
        };
      });

      const newEdges = clipboard.edges.map((edge) => {
        const newSource = idMap.get(edge.source);
        const newTarget = idMap.get(edge.target);

        if (!newSource || !newTarget) return null;

        return {
          ...edge,
          id: `edge-${newSource}-${newTarget}`,
          source: newSource,
          target: newTarget,
        };
      }).filter((edge): edge is WorkflowEdge => edge !== null);

      // Sélectionner les nouveaux nodes
      setSelectedNodes(new Set(newNodes.map((n) => n.id)));

      return {
        nodes: [...currentNodes, ...newNodes],
        edges: [...currentEdges, ...newEdges],
      };
    },
    [clipboard]
  );

  const duplicateNodes = useCallback(
    (nodes: WorkflowNode[], edges: WorkflowEdge[]): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } => {
      copyNodes(nodes, edges);
      return pasteNodes(nodes, edges);
    },
    [copyNodes, pasteNodes]
  );

  const deleteSelectedNodes = useCallback(
    (nodes: WorkflowNode[], edges: WorkflowEdge[]): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } => {
      const selectedNodeIds = Array.from(selectedNodes);
      if (selectedNodeIds.length === 0) {
        return { nodes, edges };
      }

      const remainingNodes = nodes.filter((node) => !selectedNodeIds.includes(node.id));
      const remainingEdges = edges.filter(
        (edge) => !selectedNodeIds.includes(edge.source) && !selectedNodeIds.includes(edge.target)
      );

      setSelectedNodes(new Set());

      return { nodes: remainingNodes, edges: remainingEdges };
    },
    [selectedNodes]
  );

  return {
    selectedNodes,
    selectNode,
    clearSelection,
    selectAll,
    selectArea,
    copyNodes,
    pasteNodes,
    duplicateNodes,
    deleteSelectedNodes,
    hasSelection: selectedNodes.size > 0,
    hasClipboard: clipboard !== null && clipboard.nodes.length > 0,
  };
}
