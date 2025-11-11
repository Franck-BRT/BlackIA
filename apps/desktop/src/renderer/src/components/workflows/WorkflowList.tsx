import { WorkflowCard } from './WorkflowCard';
import type { ParsedWorkflow } from '../../hooks/useWorkflows';

interface WorkflowListProps {
  workflows: ParsedWorkflow[];
  onSelect: (workflow: ParsedWorkflow) => void;
  onToggleFavorite: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onExecute?: (id: string) => void;
  emptyMessage?: string;
}

export function WorkflowList({
  workflows,
  onSelect,
  onToggleFavorite,
  onDuplicate,
  onDelete,
  onExecute,
  emptyMessage = 'Aucun workflow trouvé',
}: WorkflowListProps) {
  if (workflows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-6xl mb-4">🔄</div>
        <p className="text-gray-400 text-lg">{emptyMessage}</p>
        <p className="text-gray-500 text-sm mt-2">
          Créez votre premier workflow pour automatiser vos tâches
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-6 justify-center xl:justify-start">
      {workflows.map((workflow) => (
        <WorkflowCard
          key={workflow.id}
          workflow={workflow}
          onSelect={onSelect}
          onToggleFavorite={onToggleFavorite}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onExecute={onExecute}
        />
      ))}
    </div>
  );
}
