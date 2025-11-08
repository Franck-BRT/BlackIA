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
} from 'lucide-react';
import { cn } from '@blackia/ui';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Accueil', path: '/home' },
  { icon: MessageSquare, label: 'Chat', path: '/chat' },
  { icon: Workflow, label: 'Workflows', path: '/workflows' },
  { icon: FileText, label: 'Prompts', path: '/prompts' },
  { icon: User, label: 'Personas', path: '/personas' },
  { icon: FolderOpen, label: 'Projets', path: '/projects' },
  { icon: ScrollText, label: 'Logs', path: '/logs' },
];

export function Sidebar() {
  return (
    <aside
      className="w-64 glass-sidebar flex flex-col relative z-20"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl glass-card flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gradient">BlackIA</h1>
            <p className="text-xs text-muted-foreground">AI Assistant Suite</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium',
                'glass-hover',
                isActive
                  ? 'glass-lg text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-white/10">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium',
              'glass-hover',
              isActive
                ? 'glass-lg text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )
          }
        >
          <Settings className="w-5 h-5" />
          <span>Paramètres</span>
        </NavLink>
      </div>

      {/* Version info */}
      <div className="p-4 text-xs text-muted-foreground text-center border-t border-white/10">
        <p>Version 0.1.0</p>
        <p className="mt-1">Black Room Technologies</p>
      </div>
    </aside>
  );
}
