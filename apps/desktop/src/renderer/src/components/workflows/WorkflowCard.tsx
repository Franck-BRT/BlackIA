import { Play } from 'lucide-react';
import type { ParsedWorkflow } from '../../hooks/useWorkflows';
import { LibraryCard } from '../common/LibraryCard';

interface WorkflowCardProps {
  workflow: ParsedWorkflow;
  onSelect: (workflow: ParsedWorkflow) => void;
  onToggleFavorite: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onExecute?: (id: string) => void;
}

export function WorkflowCard({
  workflow,
  onSelect,
  onToggleFavorite,
  onDuplicate,
  onDelete,
  onExecute,
}: WorkflowCardProps) {
  // Mapping des couleurs vers les gradients Tailwind
  const colorGradients: Record<string, string> = {
    purple: 'from-purple-500 to-purple-600',
    blue: 'from-blue-500 to-blue-600',
    pink: 'from-pink-500 to-pink-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
  };

  const colorGradient = colorGradients[workflow.color] || colorGradients.purple;

  // Badges
  const badges = [];
  if (workflow.isTemplate) {
    badges.push({ label: 'Template', variant: 'primary' as const });
  }

  // Metadata : nodes, edges, tags
  const metadata = (
    <div className="space-y-3">
      {/* Info nodes/edges */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{workflow.nodes.length} nœuds</span>
        <span>{workflow.edges.length} connexions</span>
      </div>

      {/* Tags */}
      {workflow.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {workflow.tags.slice(0, 3).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 rounded-lg glass-card text-xs text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
          {workflow.tags.length > 3 && (
            <span className="px-2 py-1 text-xs text-muted-foreground">
              +{workflow.tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );

  // Stats pour le footer
  const stats = [];
  if (workflow.category) {
    stats.push({ label: 'Catégorie', value: workflow.category });
  }
  if (workflow.usageCount > 0) {
    stats.push({
      label: 'Exécutions',
      value: `${workflow.usageCount}`,
    });
  }

  // Action principale : Exécuter
  const primaryAction = onExecute
    ? {
        label: 'Exécuter',
        icon: Play,
        onClick: () => onExecute(workflow.id),
        variant: 'primary' as const,
      }
    : undefined;

  // Fonction d'export pour ce workflow
  const handleExport = () => {
    try {
      const exportData = {
        ...workflow,
        // Sérialiser les nodes/edges pour l'export
        nodes: JSON.stringify(workflow.nodes),
        edges: JSON.stringify(workflow.edges),
      };
      const jsonData = JSON.stringify([exportData], null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `workflow-${workflow.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[WorkflowCard] Error exporting workflow:', error);
      alert("Erreur lors de l'export du workflow");
    }
  };

  return (
    <LibraryCard
      icon={workflow.icon}
      iconColor={colorGradient}
      title={workflow.name}
      badges={badges}
      description={workflow.description}
      metadata={metadata}
      stats={stats}
      primaryAction={primaryAction}
      isFavorite={workflow.isFavorite}
      onToggleFavorite={() => onToggleFavorite(workflow.id)}
      onEdit={() => onSelect(workflow)}
      onDuplicate={() => onDuplicate(workflow.id)}
      onDelete={() => onDelete(workflow.id)}
      onExport={handleExport}
      onClick={() => onSelect(workflow)}
    />
  );
}
