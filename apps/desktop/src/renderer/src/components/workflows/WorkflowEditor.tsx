import { useCallback, useState } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Play, Zap } from 'lucide-react';
import type { ParsedWorkflow } from '../../hooks/useWorkflows';

// Import des composants de nœuds personnalisés
import { InputNode } from './nodes/InputNode';
import { OutputNode } from './nodes/OutputNode';
import { AIPromptNode } from './nodes/AIPromptNode';
import { ConditionNode } from './nodes/ConditionNode';
import { LoopNode } from './nodes/LoopNode';
import { TransformNode } from './nodes/TransformNode';
import { SwitchNode } from './nodes/SwitchNode';

const nodeTypes = {
  input: InputNode,
  output: OutputNode,
  aiPrompt: AIPromptNode,
  condition: ConditionNode,
  loop: LoopNode,
  transform: TransformNode,
  switch: SwitchNode,
};

interface WorkflowEditorProps {
  workflow: ParsedWorkflow;
  onSave: (nodes: Node[], edges: Edge[]) => Promise<void>;
  onExecute?: () => void;
}

export function WorkflowEditor({ workflow, onSave, onExecute }: WorkflowEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow.nodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow.edges as Edge[]);
  const [isSaving, setIsSaving] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(nodes, edges);
    } catch (error) {
      console.error('Error saving workflow:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Ajout de nœuds depuis la palette
  const addNode = useCallback(
    (type: string) => {
      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position: { x: Math.random() * 500, y: Math.random() * 500 },
        data: { label: `${type} node` },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes]
  );

  return (
    <div className="h-full flex flex-col bg-gray-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 bg-gray-900/50 border-b border-white/10">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-white">{workflow.name}</h2>
          <span className="px-3 py-1 rounded-full bg-white/5 text-sm text-gray-400">
            {nodes.length} nœuds
          </span>
        </div>

        <div className="flex items-center gap-3">
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
        <div className="w-64 bg-gray-900/50 border-r border-white/10 p-4 overflow-y-auto">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
            Palette de nœuds
          </h3>

          <div className="space-y-2">
            <NodePaletteButton
              icon="📥"
              label="Entrée"
              description="Nœud d'entrée"
              onClick={() => addNode('input')}
            />
            <NodePaletteButton
              icon="📤"
              label="Sortie"
              description="Nœud de sortie"
              onClick={() => addNode('output')}
            />
            <NodePaletteButton
              icon="🤖"
              label="IA Prompt"
              description="Génération IA"
              onClick={() => addNode('aiPrompt')}
            />
            <NodePaletteButton
              icon="❓"
              label="Condition"
              description="If/Else"
              onClick={() => addNode('condition')}
            />
            <NodePaletteButton
              icon="🔁"
              label="Boucle"
              description="Loop/ForEach"
              onClick={() => addNode('loop')}
            />
            <NodePaletteButton
              icon="⚙️"
              label="Transform"
              description="Transformation"
              onClick={() => addNode('transform')}
            />
            <NodePaletteButton
              icon="🔀"
              label="Switch"
              description="Multi-branches"
              onClick={() => addNode('switch')}
            />
          </div>
        </div>

        {/* React Flow Canvas */}
        <div className="flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#ffffff10" />
            <Controls className="bg-gray-900/90 border border-white/10 rounded-lg" />
            <MiniMap
              className="bg-gray-900/90 border border-white/10 rounded-lg"
              nodeColor="#8b5cf6"
              maskColor="#00000050"
            />
            <Panel position="top-right" className="bg-gray-900/90 border border-white/10 rounded-lg p-3">
              <div className="text-xs text-gray-400 space-y-1">
                <div>💡 Glissez-déposez pour ajouter des nœuds</div>
                <div>🔗 Connectez les nœuds entre eux</div>
                <div>⌘ + Molette pour zoomer</div>
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

// Composant pour les boutons de la palette
interface NodePaletteButtonProps {
  icon: string;
  label: string;
  description: string;
  onClick: () => void;
}

function NodePaletteButton({ icon, label, description, onClick }: NodePaletteButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10
               hover:border-purple-500/30 transition-all text-left group"
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">
            {label}
          </div>
          <div className="text-xs text-gray-500">{description}</div>
        </div>
      </div>
    </button>
  );
}
