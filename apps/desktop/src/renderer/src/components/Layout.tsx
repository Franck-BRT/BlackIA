import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 animated-gradient">
      {/* Barre de titre personnalisée draggable */}
      <div
        className="h-8 w-full flex items-center justify-center relative z-50 border-b border-white/5"
        style={{
          WebkitAppRegion: 'drag',
          userSelect: 'none'
        } as React.CSSProperties}
      >
        <span className="text-xs text-muted-foreground/50">BlackIA</span>
      </div>

      {/* Contenu principal */}
      <div className="flex flex-1 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main
          className="flex-1 overflow-auto relative z-10"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
