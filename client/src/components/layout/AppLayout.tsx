"use client";

import React from 'react';
import { Link, useLocation } from 'wouter';
import { Activity, Layers, GitBranch, Database } from 'lucide-react';
import { DurationSelector } from '@/components/common/DurationSelector';
import { CustomRangePicker } from '../common/CustomRangePicker';
import { MessageThreadCollapsible } from '../tambo/message-thread-collapsible';
import { TamboThreadProvider, useTamboContextHelpers } from "@tambo-ai/react";
import { TAMBO_SYSTEM_PROMPT } from '../tambo/prompt';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const { addContextHelper, removeContextHelper } = useTamboContextHelpers();

  // AI Navigation & Filter Sync Bridge
  React.useEffect(() => {
    const handleNavigation = (e: any) => {
      const { path, filters } = e.detail || {};

      if (path) {
        setLocation(path);
      }

      // if navigation has filter, then wait and re-send
      if (filters) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("skyobserv:query-update", {
            detail: { filters }
          }));
        }, 600);
      }
    };

    window.addEventListener("tambo:navigate", handleNavigation);
    return () => window.removeEventListener("tambo:navigate", handleNavigation);
  }, [setLocation]);

  // AI Global Context Bridge with LIVE TIME
  React.useEffect(() => {
    const helperId = "global_observability";

    const updateContext = () => {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');

      // UTC Time
      const utcTime = `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())} ${pad(now.getUTCHours())}:${pad(now.getUTCMinutes())}:${pad(now.getUTCSeconds())}`;

      // IST Time (UTC + 5:30)
      const istDate = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      const istTime = `${istDate.getUTCFullYear()}-${pad(istDate.getUTCMonth() + 1)}-${pad(istDate.getUTCDate())} ${pad(istDate.getUTCHours())}:${pad(istDate.getUTCMinutes())}:${pad(istDate.getUTCSeconds())}`;

      addContextHelper(helperId, () => ({
        currentPath: location,
        appName: "SkyObserv",
        status: "connected",
        currentTimeIST: istTime,
        currentTimeUTC: utcTime,
        instruction: `Current IST: ${istTime}, UTC: ${utcTime}. User is on ${location}.`
      }));
    };

    updateContext();
    const interval = setInterval(updateContext, 60000);

    return () => {
      clearInterval(interval);
      removeContextHelper(helperId);
    };
  }, [location, addContextHelper, removeContextHelper]);

  const navItems = [
    { label: 'Services', href: '/', icon: Layers },
    { label: 'Traces', href: '/traces', icon: GitBranch },
    { label: 'Topology', href: '/topology', icon: Activity },
    { label: 'Databases', href: '/databases', icon: Database },
  ];

  // Generate Dynamic Prompt with LIVE TIME
  const getDynamicPrompt = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');

    // UTC Time
    const utcYear = now.getUTCFullYear();
    const utcMonth = pad(now.getUTCMonth() + 1);
    const utcDate = pad(now.getUTCDate());
    const utcHours = pad(now.getUTCHours());
    const utcMinutes = pad(now.getUTCMinutes());
    const utcSeconds = pad(now.getUTCSeconds());

    const utcTime = `${utcYear}-${utcMonth}-${utcDate} ${utcHours}:${utcMinutes}:${utcSeconds}`;

    // IST Time (UTC + 5:30)
    const istDate = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const istYear = istDate.getUTCFullYear();
    const istMonth = pad(istDate.getUTCMonth() + 1);
    const istDay = pad(istDate.getUTCDate());
    const istHours = pad(istDate.getUTCHours());
    const istMinutes = pad(istDate.getUTCMinutes());
    const istSeconds = pad(istDate.getUTCSeconds());

    const istTime = `${istYear}-${istMonth}-${istDay} ${istHours}:${istMinutes}:${istSeconds}`;

    // console.log('Current Time:', { IST: istTime, UTC: utcTime });

    // Replace placeholders
    let dynamicPrompt = TAMBO_SYSTEM_PROMPT
      .replaceAll("{{IST_NOW}}", istTime)
      .replaceAll("{{UTC_NOW}}", utcTime);

    // Force inject at start
    dynamicPrompt = `LIVE SYSTEM TIME:
IST: ${istTime}
UTC: ${utcTime}

${dynamicPrompt}`;

    return dynamicPrompt;
  };

  // Use state to force re-render with updated time
  const [dynamicPrompt, setDynamicPrompt] = React.useState(getDynamicPrompt());

  // Update prompt every 30 seconds
  React.useEffect(() => {
    const interval = setInterval(() => {
      setDynamicPrompt(getDynamicPrompt());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <TamboThreadProvider contextKey="sky-observ-v5" systemPrompt={dynamicPrompt}>
      <div className="min-h-screen bg-[#0a0a0a] text-foreground flex flex-col md:flex-row font-sans">
        {/* Sidebar */}
        <aside className="w-full md:w-64 border-r border-white/5 bg-card/50 flex-shrink-0 flex flex-col h-screen sticky top-0 z-20">
          <div className="p-6 border-b border-white/5 cursor-pointer">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg flex-shrink-0">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white">
                SkyObserv
              </span>
            </Link>
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

          <div className="p-4 border-t border-white/5 cursor-pointer">
            <Link href="/">
              <div className="flex items-center gap-3 px-3 py-2 text-[10px] text-muted-foreground font-mono tracking-widest cursor-pointer hover:text-white transition-colors group">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e] animate-pulse group-hover:scale-110 transition-transform" />
                SkyObserv Observability
              </div>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 border-b border-white/5 flex items-center justify-between px-6 bg-background/50 backdrop-blur-md sticky top-0 z-10">
            <h1 className="text-xl font-semibold text-white">
              {navItems.find(i => i.href === location)?.label || 'Dashboard'}
            </h1>
            <div className="flex items-center gap-4 text-white">
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
      <MessageThreadCollapsible />
    </TamboThreadProvider>
  );
}