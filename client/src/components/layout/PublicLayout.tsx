"use client";

import { Link, useLocation } from "wouter";
import { Activity, BookOpen, LogIn, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/common/ThemeToggle";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

type PublicLayoutProps = {
  children: React.ReactNode;
  /** Hide marketing nav links on login page */
  minimal?: boolean;
};

const FOOTER_LINKS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Documentation",
    links: [
      { label: "Introduction", href: "/docs/overview" },
      { label: "Node.js agent", href: "/docs/node" },
      { label: "Java agent", href: "/docs/java" },
    ],
  },
  {
    heading: "Guides",
    links: [
      { label: "Python agent", href: "/docs/python" },
      { label: "Prisma", href: "/docs/prisma" },
      { label: "Redis", href: "/docs/redis" },
    ],
  },
  {
    heading: "Data stores",
    links: [
      { label: "Databases", href: "/docs/databases" },
      { label: "ORMs & frameworks", href: "/docs/orm-frameworks" },
    ],
  },
];

export function PublicLayout({ children, minimal = false }: PublicLayoutProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const onDocs = location.startsWith("/docs");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm ring-1 ring-primary/20 transition-transform group-hover:scale-105">
              <Activity className="w-4 h-4 text-primary-foreground" aria-hidden="true" />
            </div>
            <span
              className="font-semibold text-foreground tracking-tight"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              SkyObserv
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            {!minimal && (
              <Link href="/docs/overview">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer",
                    onDocs
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <BookOpen className="w-4 h-4" aria-hidden="true" />
                  Docs
                </span>
              </Link>
            )}

            <ThemeToggle />

            {!minimal &&
              (user ? (
                <Link href="/dashboard">
                  <Button size="sm" className="gap-1.5">
                    <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                    Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" className="hidden sm:block">
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <LogIn className="w-4 h-4" aria-hidden="true" />
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="sm">Get started</Button>
                  </Link>
                </>
              ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {!minimal && (
        <footer className="border-t border-border bg-muted/30">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              <div className="col-span-2 sm:col-span-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                    <Activity className="w-3.5 h-3.5 text-primary-foreground" aria-hidden="true" />
                  </div>
                  <span
                    className="font-semibold text-foreground"
                    style={{ fontFamily: "Outfit, sans-serif" }}
                  >
                    SkyObserv
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs">
                  Distributed tracing, topology, and storage insights on Apache SkyWalking.
                </p>
              </div>

              {FOOTER_LINKS.map((group) => (
                <div key={group.heading}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground mb-3">
                    {group.heading}
                  </p>
                  <ul className="space-y-2">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
              <p>© {new Date().getFullYear()} SkyObserv — built on Apache SkyWalking</p>
              <Link href="/login" className="hover:text-primary transition-colors">
                Sign in
              </Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
