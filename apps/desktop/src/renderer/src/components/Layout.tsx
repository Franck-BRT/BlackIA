import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useApplyAppearance } from '../hooks/useApplyAppearance';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  // Apply appearance settings to the interface
  useApplyAppearance();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 animated-gradient">
      {/* Drag region for window movement - Zone de 40px pour faciliter le déplacement */}
      <div
        className="absolute top-0 left-0 right-0 h-10 z-50"
        style={{
          WebkitAppRegion: 'drag',
          userSelect: 'none',
          pointerEvents: 'auto'
        } as React.CSSProperties}
      />

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
  );
}
