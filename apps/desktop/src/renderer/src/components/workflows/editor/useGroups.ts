import { useState, useCallback } from 'react';
import type { NodeGroup, WorkflowNode, Position, Size } from './types';

/**
 * Hook pour gérer les groupes de nœuds
 */
export function useGroups() {
  const [groups, setGroups] = useState<NodeGroup[]>([]);

  // Créer un groupe à partir de nœuds sélectionnés
  const createGroup = useCallback(
    (nodeIds: string[], nodes: WorkflowNode[], label = 'Nouveau groupe') => {
      if (nodeIds.length < 2) return;

      const selectedNodes = nodes.filter((n) => nodeIds.includes(n.id));

      // Calculer les bounds du groupe
      const NODE_WIDTH = 200;
      const NODE_HEIGHT = 80;
      const PADDING = 20;

      const minX = Math.min(...selectedNodes.map((n) => n.position.x));
      const minY = Math.min(...selectedNodes.map((n) => n.position.y));
      const maxX = Math.max(...selectedNodes.map((n) => n.position.x + NODE_WIDTH));
      const maxY = Math.max(...selectedNodes.map((n) => n.position.y + NODE_HEIGHT));

      const newGroup: NodeGroup = {
        id: `group-${Date.now()}`,
        label,
        nodeIds: [...nodeIds],
        position: {
          x: minX - PADDING,
          y: minY - PADDING,
        },
        size: {
          width: maxX - minX + PADDING * 2,
          height: maxY - minY + PADDING * 2,
        },
        color: `hsl(${Math.random() * 360}, 70%, 60%)`,
        collapsed: false,
      };

      setGroups((prev) => [...prev, newGroup]);
      return newGroup;
    },
    []
  );

  // Dissoudre un groupe
  const dissolveGroup = useCallback((groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }, []);

  // Ajouter des nœuds à un groupe
  const addNodesToGroup = useCallback((groupId: string, nodeIds: string[]) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, nodeIds: [...new Set([...group.nodeIds, ...nodeIds])] }
          : group
      )
    );
  }, []);

  // Retirer des nœuds d'un groupe
  const removeNodesFromGroup = useCallback((groupId: string, nodeIds: string[]) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, nodeIds: group.nodeIds.filter((id) => !nodeIds.includes(id)) }
          : group
      ).filter((g) => g.nodeIds.length > 0) // Supprimer les groupes vides
    );
  }, []);

  // Mettre à jour un groupe
  const updateGroup = useCallback(
    (groupId: string, updates: Partial<NodeGroup>) => {
      setGroups((prev) =>
        prev.map((group) => (group.id === groupId ? { ...group, ...updates } : group))
      );
    },
    []
  );

  // Redimensionner un groupe automatiquement
  const resizeGroupToFit = useCallback(
    (groupId: string, nodes: WorkflowNode[]) => {
      const group = groups.find((g) => g.id === groupId);
      if (!group) return;

      const groupNodes = nodes.filter((n) => group.nodeIds.includes(n.id));
      if (groupNodes.length === 0) return;

      const NODE_WIDTH = 200;
      const NODE_HEIGHT = 80;
      const PADDING = 20;

      const minX = Math.min(...groupNodes.map((n) => n.position.x));
      const minY = Math.min(...groupNodes.map((n) => n.position.y));
      const maxX = Math.max(...groupNodes.map((n) => n.position.x + NODE_WIDTH));
      const maxY = Math.max(...groupNodes.map((n) => n.position.y + NODE_HEIGHT));

      updateGroup(groupId, {
        position: {
          x: minX - PADDING,
          y: minY - PADDING,
        },
        size: {
          width: maxX - minX + PADDING * 2,
          height: maxY - minY + PADDING * 2,
        },
      });
    },
    [groups, updateGroup]
  );

  // Collapse/Expand un groupe
  const toggleGroupCollapse = useCallback((groupId: string) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, collapsed: !group.collapsed } : group
      )
    );
  }, []);

  // Obtenir tous les nœuds d'un groupe
  const getGroupNodes = useCallback(
    (groupId: string): string[] => {
      const group = groups.find((g) => g.id === groupId);
      return group?.nodeIds || [];
    },
    [groups]
  );

  // Vérifier si un nœud est dans un groupe
  const isNodeInGroup = useCallback(
    (nodeId: string): string | null => {
      const group = groups.find((g) => g.nodeIds.includes(nodeId));
      return group?.id || null;
    },
    [groups]
  );

  // Définir tous les groupes
  const setAllGroups = useCallback((newGroups: NodeGroup[]) => {
    setGroups(newGroups);
  }, []);

  return {
    groups,
    createGroup,
    dissolveGroup,
    addNodesToGroup,
    removeNodesFromGroup,
    updateGroup,
    resizeGroupToFit,
    toggleGroupCollapse,
    getGroupNodes,
    isNodeInGroup,
    setAllGroups,
  };
}
