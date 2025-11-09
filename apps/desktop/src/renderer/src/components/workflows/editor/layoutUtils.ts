import type { WorkflowNode, WorkflowEdge, Position } from './types';

/**
 * Utilitaires pour l'auto-layout des workflows
 */

const HORIZONTAL_SPACING = 250;
const VERTICAL_SPACING = 120;
const LAYER_START_Y = 100;
const LAYER_START_X = 100;

/**
 * Algorithme de layout hiérarchique (Sugiyama-style)
 */
export function autoLayout(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  if (nodes.length === 0) return nodes;

  // 1. Construire le graphe de dépendances
  const graph = buildGraph(nodes, edges);

  // 2. Déterminer les couches (layering)
  const layers = assignLayers(nodes, graph);

  // 3. Réduire les croisements
  const orderedLayers = reduceCrossings(layers, edges);

  // 4. Assigner les positions
  return assignPositions(orderedLayers, nodes);
}

interface Graph {
  [nodeId: string]: {
    incoming: string[];
    outgoing: string[];
  };
}

function buildGraph(nodes: WorkflowNode[], edges: WorkflowEdge[]): Graph {
  const graph: Graph = {};

  nodes.forEach((node) => {
    graph[node.id] = { incoming: [], outgoing: [] };
  });

  edges.forEach((edge) => {
    if (graph[edge.source] && graph[edge.target]) {
      graph[edge.source].outgoing.push(edge.target);
      graph[edge.target].incoming.push(edge.source);
    }
  });

  return graph;
}

function assignLayers(nodes: WorkflowNode[], graph: Graph): Map<number, string[]> {
  const layers = new Map<number, string[]>();
  const nodeLayer = new Map<string, number>();

  // Trouver les nœuds de départ (sans incoming edges)
  const startNodes = nodes.filter((node) => graph[node.id].incoming.length === 0);

  if (startNodes.length === 0) {
    // Graphe circulaire, on prend le premier nœud
    if (nodes.length > 0) {
      startNodes.push(nodes[0]);
    }
  }

  // BFS pour assigner les couches
  const queue: Array<{ nodeId: string; layer: number }> = startNodes.map((node) => ({
    nodeId: node.id,
    layer: 0,
  }));

  const visited = new Set<string>();

  while (queue.length > 0) {
    const { nodeId, layer } = queue.shift()!;

    if (visited.has(nodeId)) continue;
    visited.add(nodeId);

    // Assigner la couche
    const currentLayer = nodeLayer.get(nodeId) ?? layer;
    nodeLayer.set(nodeId, Math.max(currentLayer, layer));

    // Ajouter les nœuds suivants
    graph[nodeId].outgoing.forEach((targetId) => {
      if (!visited.has(targetId)) {
        queue.push({ nodeId: targetId, layer: layer + 1 });
      }
    });
  }

  // Regrouper par couche
  nodeLayer.forEach((layer, nodeId) => {
    if (!layers.has(layer)) {
      layers.set(layer, []);
    }
    layers.get(layer)!.push(nodeId);
  });

  // Ajouter les nœuds non visités (isolés) à la fin
  nodes.forEach((node) => {
    if (!visited.has(node.id)) {
      const maxLayer = Math.max(...Array.from(layers.keys()), -1) + 1;
      if (!layers.has(maxLayer)) {
        layers.set(maxLayer, []);
      }
      layers.get(maxLayer)!.push(node.id);
    }
  });

  return layers;
}

function reduceCrossings(
  layers: Map<number, string[]>,
  edges: WorkflowEdge[]
): Map<number, string[]> {
  // Algorithme simple de barycenter pour réduire les croisements
  const orderedLayers = new Map(layers);

  // Plusieurs passes pour améliorer l'ordre
  for (let i = 0; i < 3; i++) {
    // Passe descendante
    const layerNumbers = Array.from(orderedLayers.keys()).sort((a, b) => a - b);

    for (let l = 1; l < layerNumbers.length; l++) {
      const currentLayer = orderedLayers.get(layerNumbers[l])!;
      const previousLayer = orderedLayers.get(layerNumbers[l - 1])!;

      const positions = new Map(previousLayer.map((id, index) => [id, index]));

      const barycenters = currentLayer.map((nodeId) => {
        const incomingEdges = edges.filter((e) => e.target === nodeId);
        if (incomingEdges.length === 0) return { nodeId, barycenter: 0 };

        const sum = incomingEdges.reduce((acc, edge) => {
          return acc + (positions.get(edge.source) ?? 0);
        }, 0);

        return { nodeId, barycenter: sum / incomingEdges.length };
      });

      barycenters.sort((a, b) => a.barycenter - b.barycenter);
      orderedLayers.set(layerNumbers[l], barycenters.map((b) => b.nodeId));
    }
  }

  return orderedLayers;
}

function assignPositions(layers: Map<number, string[]>, nodes: WorkflowNode[]): WorkflowNode[] {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const updatedNodes: WorkflowNode[] = [];

  const layerNumbers = Array.from(layers.keys()).sort((a, b) => a - b);

  layerNumbers.forEach((layerNum, index) => {
    const layerNodes = layers.get(layerNum)!;
    const layerHeight = layerNodes.length * VERTICAL_SPACING;
    const startY = LAYER_START_Y - layerHeight / 2;

    layerNodes.forEach((nodeId, nodeIndex) => {
      const node = nodeMap.get(nodeId);
      if (!node) return;

      updatedNodes.push({
        ...node,
        position: {
          x: LAYER_START_X + index * HORIZONTAL_SPACING,
          y: startY + nodeIndex * VERTICAL_SPACING,
        },
      });
    });
  });

  // Ajouter les nœuds qui n'ont pas été repositionnés
  nodes.forEach((node) => {
    if (!updatedNodes.find((n) => n.id === node.id)) {
      updatedNodes.push(node);
    }
  });

  return updatedNodes;
}

/**
 * Centrer le workflow dans le viewport
 */
export function fitToView(
  nodes: WorkflowNode[],
  viewportWidth: number,
  viewportHeight: number,
  nodeWidth = 200,
  nodeHeight = 80,
  padding = 50
): { zoom: number; pan: Position } {
  if (nodes.length === 0) {
    return { zoom: 1, pan: { x: 0, y: 0 } };
  }

  // Calculer les limites
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

  const workflowWidth = maxX - minX;
  const workflowHeight = maxY - minY;

  // Calculer le zoom pour que tout rentre
  const zoomX = (viewportWidth - padding * 2) / workflowWidth;
  const zoomY = (viewportHeight - padding * 2) / workflowHeight;
  const zoom = Math.min(Math.min(zoomX, zoomY), 1); // Max 1x pour ne pas agrandir

  // Calculer le pan pour centrer
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const pan = {
    x: viewportWidth / 2 - centerX * zoom,
    y: viewportHeight / 2 - centerY * zoom,
  };

  return { zoom, pan };
}

/**
 * Aligner les nœuds sélectionnés
 */
export function alignNodes(
  nodes: WorkflowNode[],
  selectedIds: string[],
  direction: 'left' | 'right' | 'top' | 'bottom' | 'center-h' | 'center-v',
  nodeWidth = 200,
  nodeHeight = 80
): WorkflowNode[] {
  const selectedNodes = nodes.filter((n) => selectedIds.includes(n.id));
  if (selectedNodes.length < 2) return nodes;

  let referenceValue: number;

  switch (direction) {
    case 'left':
      referenceValue = Math.min(...selectedNodes.map((n) => n.position.x));
      return nodes.map((node) =>
        selectedIds.includes(node.id)
          ? { ...node, position: { ...node.position, x: referenceValue } }
          : node
      );

    case 'right':
      referenceValue = Math.max(...selectedNodes.map((n) => n.position.x + nodeWidth)) - nodeWidth;
      return nodes.map((node) =>
        selectedIds.includes(node.id)
          ? { ...node, position: { ...node.position, x: referenceValue } }
          : node
      );

    case 'top':
      referenceValue = Math.min(...selectedNodes.map((n) => n.position.y));
      return nodes.map((node) =>
        selectedIds.includes(node.id)
          ? { ...node, position: { ...node.position, y: referenceValue } }
          : node
      );

    case 'bottom':
      referenceValue = Math.max(...selectedNodes.map((n) => n.position.y + nodeHeight)) - nodeHeight;
      return nodes.map((node) =>
        selectedIds.includes(node.id)
          ? { ...node, position: { ...node.position, y: referenceValue } }
          : node
      );

    case 'center-h':
      const avgX = selectedNodes.reduce((sum, n) => sum + n.position.x + nodeWidth / 2, 0) / selectedNodes.length;
      return nodes.map((node) =>
        selectedIds.includes(node.id)
          ? { ...node, position: { ...node.position, x: avgX - nodeWidth / 2 } }
          : node
      );

    case 'center-v':
      const avgY = selectedNodes.reduce((sum, n) => sum + n.position.y + nodeHeight / 2, 0) / selectedNodes.length;
      return nodes.map((node) =>
        selectedIds.includes(node.id)
          ? { ...node, position: { ...node.position, y: avgY - nodeHeight / 2 } }
          : node
      );

    default:
      return nodes;
  }
}

/**
 * Distribuer uniformément les nœuds sélectionnés
 */
export function distributeNodes(
  nodes: WorkflowNode[],
  selectedIds: string[],
  direction: 'horizontal' | 'vertical',
  nodeWidth = 200,
  nodeHeight = 80
): WorkflowNode[] {
  const selectedNodes = nodes.filter((n) => selectedIds.includes(n.id));
  if (selectedNodes.length < 3) return nodes;

  if (direction === 'horizontal') {
    const sorted = [...selectedNodes].sort((a, b) => a.position.x - b.position.x);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalSpace = last.position.x - first.position.x;
    const spacing = totalSpace / (sorted.length - 1);

    return nodes.map((node) => {
      const index = sorted.findIndex((n) => n.id === node.id);
      if (index === -1) return node;
      return {
        ...node,
        position: {
          ...node.position,
          x: first.position.x + index * spacing,
        },
      };
    });
  } else {
    const sorted = [...selectedNodes].sort((a, b) => a.position.y - b.position.y);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalSpace = last.position.y - first.position.y;
    const spacing = totalSpace / (sorted.length - 1);

    return nodes.map((node) => {
      const index = sorted.findIndex((n) => n.id === node.id);
      if (index === -1) return node;
      return {
        ...node,
        position: {
          ...node.position,
          y: first.position.y + index * spacing,
        },
      };
    });
  }
}
