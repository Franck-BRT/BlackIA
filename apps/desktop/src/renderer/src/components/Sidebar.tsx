import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  MessageSquare,
  Workflow,
  FileText,
  User,
  Sparkles,
  FolderOpen,
  ScrollText,
  Settings,
  Home,
  BookOpen,
  PenSquare,
  X,
  Library,
  Zap,
} from 'lucide-react';
import { cn } from '@blackia/ui';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

interface SidebarProps {
  isCompact?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Accueil', path: '/home' },
  { icon: MessageSquare, label: 'Chat', path: '/chat' },
  { icon: Workflow, label: 'Workflows', path: '/workflows' },
  { icon: PenSquare, label: 'Éditeur', path: '/editor' },
  { icon: FileText, label: 'Prompts', path: '/prompts' },
  { icon: User, label: 'Personas', path: '/personas' },
  { icon: FolderOpen, label: 'Projets', path: '/projects' },
  { icon: Library, label: 'Bibliothèque', path: '/library' },
  { icon: Zap, label: 'Outils', path: '/tools' },
  { icon: ScrollText, label: 'Logs', path: '/logs' },
  { icon: BookOpen, label: 'Documentation', path: '/documentation' },
];

export function Sidebar({ isCompact = false, onToggle, isMobile = false }: SidebarProps) {
  // Sur mobile, sidebar en position fixe et pleine hauteur
  const sidebarClasses = cn(
    'glass-sidebar flex flex-col relative z-40',
    isMobile ? 'fixed top-0 left-0 bottom-0 w-64' : isCompact ? 'w-50' : 'w-64'
  );

  return (
    <aside
      className={sidebarClasses}
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {/* Logo avec bouton de fermeture sur mobile */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "rounded-xl glass-card flex items-center justify-center",
              isCompact ? "w-8 h-8" : "w-10 h-10"
            )}>
              <Sparkles className={cn(isCompact ? "w-4 h-4" : "w-6 h-6", "text-purple-400")} />
            </div>
            {!isCompact && (
              <div>
                <h1 className="text-xl font-bold text-gradient">BlackIA</h1>
                <p className="text-xs text-muted-foreground">AI Assistant Suite</p>
              </div>
            )}
          </div>
          {isMobile && onToggle && (
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-1", isCompact ? "p-2" : "p-4")}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-lg text-sm font-medium glass-hover',
                isCompact ? 'gap-0 px-2 py-2 justify-center' : 'gap-3 px-4 py-3',
                isActive
                  ? 'glass-lg text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
            title={isCompact ? item.label : undefined}
          >
            <item.icon className="w-5 h-5" />
            {!isCompact && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Settings */}
      <div className={cn("border-t border-white/10", isCompact ? "p-2" : "p-4")}>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center rounded-lg text-sm font-medium glass-hover',
              isCompact ? 'gap-0 px-2 py-2 justify-center' : 'gap-3 px-4 py-3',
              isActive
                ? 'glass-lg text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )
          }
          title={isCompact ? 'Paramètres' : undefined}
        >
          <Settings className="w-5 h-5" />
          {!isCompact && <span>Paramètres</span>}
        </NavLink>
      </div>

      {/* Version info (masqué en mode compact) */}
      {!isCompact && (
        <div className="p-4 text-xs text-muted-foreground text-center border-t border-white/10">
          <p>Version 0.1.0</p>
          <p className="mt-1">Black Room Technologies</p>
        </div>
      )}
    </aside>
  );
}
