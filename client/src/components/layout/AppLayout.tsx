import React from 'react';
import { Link, useLocation } from 'wouter';
import { Activity, Layers, GitBranch, Settings, Database } from 'lucide-react';
import { DurationSelector } from '@/components/common/DurationSelector';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { label: 'Services', href: '/', icon: Layers },
    { label: 'Traces', href: '/traces', icon: GitBranch },
    { label: 'Topology', href: '/topology', icon: Activity },
    { label: 'Databases', href: '/databases', icon: Database },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full md:w-64 border-r border-white/5 bg-card/50 flex-shrink-0 flex flex-col h-screen sticky top-0">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">SkyObserv</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== '/' && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-primary/10 text-primary shadow-[0_0_20px_-5px_var(--primary)]' 
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}
              `}>
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
            Connected to SkyWalking
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
          <h1 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <DurationSelector />
            <div className="w-8 h-8 rounded-full bg-secondary border border-white/10 flex items-center justify-center text-xs font-bold text-muted-foreground">
              AD
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-auto p-6 scroll-smooth">
          {children}
        </div>
      </main>
    </div>
  );
}
