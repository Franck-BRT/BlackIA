import type { Position } from './types';

/**
 * Utilitaires pour générer les chemins SVG des connexions
 */

/**
 * Calculer le chemin d'une courbe de Bézier entre deux points
 */
export function getBezierPath(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): string {
  const centerX = (sourceX + targetX) / 2;

  // Points de contrôle pour une courbe horizontale
  const controlPoint1X = centerX;
  const controlPoint1Y = sourceY;
  const controlPoint2X = centerX;
  const controlPoint2Y = targetY;

  return `M ${sourceX},${sourceY} C ${controlPoint1X},${controlPoint1Y} ${controlPoint2X},${controlPoint2Y} ${targetX},${targetY}`;
}

/**
 * Calculer la position du milieu d'une courbe de Bézier
 * (pour afficher un label sur la connexion)
 */
export function getEdgeLabelPosition(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): Position {
  return {
    x: (sourceX + targetX) / 2,
    y: (sourceY + targetY) / 2,
  };
}

/**
 * Vérifier si un point est proche d'une courbe de Bézier
 * (pour détecter les clics sur une connexion)
 */
export function isPointNearBezier(
  point: Position,
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  threshold: number = 10
): boolean {
  // Simplifié: on vérifie la distance au centre de la courbe
  const labelPos = getEdgeLabelPosition(sourceX, sourceY, targetX, targetY);
  const distance = Math.sqrt(
    Math.pow(point.x - labelPos.x, 2) + Math.pow(point.y - labelPos.y, 2)
  );

  return distance <= threshold;
}

/**
 * Calculer la position d'un handle de connexion sur un nœud
 */
export function getHandlePosition(
  nodeX: number,
  nodeY: number,
  nodeWidth: number,
  nodeHeight: number,
  handleType: 'source' | 'target'
): Position {
  if (handleType === 'source') {
    // Handle à droite du nœud
    return {
      x: nodeX + nodeWidth,
      y: nodeY + nodeHeight / 2,
    };
  } else {
    // Handle à gauche du nœud
    return {
      x: nodeX,
      y: nodeY + nodeHeight / 2,
    };
  }
}

/**
 * Générer un ID unique pour une connexion
 */
export function generateEdgeId(sourceId: string, targetId: string): string {
  return `edge-${sourceId}-${targetId}`;
}

/**
 * Trouver le nœud à une position donnée
 */
export function findNodeAtPosition(
  nodes: Array<{ id: string; position: Position }>,
  point: Position,
  nodeWidth: number = 200,
  nodeHeight: number = 80
): string | null {
  for (const node of nodes) {
    if (
      point.x >= node.position.x &&
      point.x <= node.position.x + nodeWidth &&
      point.y >= node.position.y &&
      point.y <= node.position.y + nodeHeight
    ) {
      return node.id;
    }
  }
  return null;
}

/**
 * Calculer la distance entre deux points
 */
export function distance(p1: Position, p2: Position): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}
