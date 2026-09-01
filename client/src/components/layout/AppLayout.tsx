"use client";

import React from 'react';
import { Link, useLocation } from 'wouter';
import { Activity, Layers, GitBranch, Database, Box, LogOut, BookOpen } from 'lucide-react';
import { DurationSelector } from '@/components/common/DurationSelector';
import { CustomRangePicker } from '../common/CustomRangePicker';
import { MessageThreadCollapsible } from '../tambo/message-thread-collapsible';
import { TamboThreadProvider, useTamboContextHelpers } from "@tambo-ai/react";
import { TAMBO_SYSTEM_PROMPT } from '../tambo/prompt';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [location, setLocation] = useLocation();
  const { addContextHelper, removeContextHelper } = useTamboContextHelpers();
  const { user, logout } = useAuth();

  const displayName = user?.fullName?.trim() || user?.email || "SkyObserv";
  const initials = displayName.slice(0, 2).toUpperCase();

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
    { label: 'Services', href: '/dashboard', icon: Layers },
    { label: 'Traces', href: '/traces', icon: GitBranch },
    { label: 'Topology', href: '/topology', icon: Activity },
    { label: 'Databases', href: '/databases', icon: Database },
    { label: 'Kubernetes', href: '/kubernetes', icon: Box },
    { label: 'Docs', href: '/docs/overview', icon: BookOpen },
  ];

  const pageTitle = location.startsWith('/docs')
    ? 'Documentation'
    : navItems.find((i) => i.href === location || (i.href !== '/' && location.startsWith(i.href)))?.label || 'Dashboard';

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
      <div className="min-h-screen bg-muted/40 text-foreground flex flex-col md:flex-row">
        <aside className="w-full md:w-[var(--sidebar-width)] border-r border-border bg-card flex-shrink-0 flex flex-col h-screen sticky top-0 z-20">
          <div className="p-4 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-3 cursor-pointer">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                <Activity className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <span className="font-semibold text-base tracking-tight text-foreground block leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  SkyObserv
                </span>
                <span className="text-[11px] text-muted-foreground">Observability</span>
              </div>
            </Link>
          </div>

          <nav className="flex-1 p-3 space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href
                || (item.href !== '/' && location.startsWith(item.href))
                || (item.href === '/docs/overview' && location.startsWith('/docs'));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-3 border-t border-border">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/80 text-xs text-muted-foreground">
              <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
              All systems operational
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-[var(--header-height)] border-b border-border flex items-center justify-between px-5 bg-card sticky top-0 z-10 shadow-sm">
            <h1 className="text-base font-semibold text-foreground" style={{ fontFamily: 'Outfit, sans-serif' }}>
              {pageTitle}
            </h1>
            <div className="flex items-center gap-2">
              <CustomRangePicker />
              <DurationSelector />
              <ThemeToggle />
              <div className="hidden md:flex flex-col items-end mx-1">
                <span className="text-xs font-medium text-foreground">{displayName}</span>
                <Link href="/profile" className="text-[11px] text-primary hover:underline cursor-pointer">
                  Profile
                </Link>
              </div>
              <Link href="/profile">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[11px] font-semibold text-primary hover:bg-primary/15 transition-colors cursor-pointer">
                  {initials}
                </div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout()}
                title="Logout"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-auto p-4 md:p-5">
            {children}
          </div>
        </main>
      </div>
      <MessageThreadCollapsible />
    </TamboThreadProvider>
  );
}