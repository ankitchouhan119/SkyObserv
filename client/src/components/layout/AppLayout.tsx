import React from 'react';
import { Link, useLocation } from 'wouter';
import { Activity, Layers, GitBranch, Database } from 'lucide-react';
import { DurationSelector } from '@/components/common/DurationSelector';
import { CustomRangePicker } from '../common/CustomRangePicker';
import { MessageThreadCollapsible } from '../tambo/message-thread-collapsible';

// 🔥 Tambo Imports
import { TamboThreadProvider, useTamboContextHelpers } from "@tambo-ai/react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location] = useLocation();
  const { addContextHelper, removeContextHelper } = useTamboContextHelpers();
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    const handleNavigation = (e: any) => {
      if (e.detail?.path) {
        setLocation(e.detail.path); // 🔥 AI ne path bheja, humne navigate kar diya!
      }
    };

    window.addEventListener("tambo:navigate", handleNavigation);
    return () => window.removeEventListener("tambo:navigate", handleNavigation);
  }, [setLocation]);

  // 🔥 AI Global Context Bridge
  React.useEffect(() => {
    const helperId = "global_observability";
    
    addContextHelper(helperId, () => ({
      currentPath: location,
      appName: "SkyObserv",
      status: "connected",
      instruction: "User is on " + location + ". Analyze metrics if on service page."
    }));

    return () => removeContextHelper(helperId);
  }, [location, addContextHelper, removeContextHelper]);

  const navItems = [
    { label: 'Services', href: '/', icon: Layers },
    { label: 'Traces', href: '/traces', icon: GitBranch },
    { label: 'Topology', href: '/topology', icon: Activity },
    { label: 'Databases', href: '/databases', icon: Database },
  ];

  return (
    <TamboThreadProvider contextKey="sky-observ-v5">
      <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
        {/* Sidebar */}
        <aside className="w-full md:w-64 border-r border-white/5 bg-card/50 flex-shrink-0 flex flex-col h-screen sticky top-0 z-20">
          <div className="p-6 border-b border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg">
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
                    ? 'bg-primary/10 text-primary shadow-[0_0_20px_-5px_rgba(var(--primary-rgb),0.3)]' 
                    : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}
                `}>
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 px-3 py-2 text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse" />
              AI Agent Active
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-background/50 backdrop-blur-md sticky top-0 z-10">
            <h1 className="text-xl font-semibold text-white">Dashboard</h1>
            <div className="flex items-center gap-4">
              <CustomRangePicker />
              <DurationSelector />
              <div className="w-8 h-8 rounded-full bg-secondary border border-white/10 flex items-center justify-center text-xs font-bold text-muted-foreground">
                AD
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-6 bg-[#0a0a0a]">
            {children}
          </div>
        </main>
      </div>
      {/* AI Chat Widget */}
      <MessageThreadCollapsible />
    </TamboThreadProvider>
  );
}