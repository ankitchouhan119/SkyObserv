"use client";

import { useState } from "react";
import { Link, useParams, Redirect } from "wouter";
import { PublicLayout } from "@/components/layout/PublicLayout";
import { ChevronRight, Copy, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import {
  DOC_CATEGORIES,
  DOC_TOPICS,
  getDocTopic,
  type CalloutKind,
  type DocBlock,
  type DocTopic,
} from "./docsContent";

function CodeBlock({ language, content, caption }: { language: string; content: string; caption?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <figure className="my-4">
      <div className="rounded-md border border-border overflow-hidden">
        <div className="px-3 py-2 bg-muted/80 border-b border-border flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{language}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label={copied ? "Copied" : "Copy code"}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
        <pre className="so-code-surface p-4 text-[13px] leading-relaxed overflow-x-auto font-mono">
          <code>{content}</code>
        </pre>
      </div>
      {caption && (
        <figcaption className="mt-2 text-xs text-muted-foreground">{caption}</figcaption>
      )}
    </figure>
  );
}

function Callout({ kind, text }: { kind: CalloutKind; text: string }) {
  const styles: Record<CalloutKind, string> = {
    note: "border-border bg-muted/50 text-foreground",
    info: "border-primary/20 bg-primary/5 text-foreground",
    warning:
      "border-amber-300/60 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100",
  };
  const labels: Record<CalloutKind, string> = {
    note: "Note",
    info: "Info",
    warning: "Warning",
  };

  return (
    <aside className={cn("my-4 rounded-md border px-4 py-3 text-sm leading-relaxed", styles[kind])}>
      <span className="font-semibold">{labels[kind]}: </span>
      {text}
    </aside>
  );
}

function DocBlockView({ block, index }: { block: DocBlock; index: number }) {
  const id = `section-${index}`;

  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-lg font-semibold text-foreground tracking-tight border-b border-border pb-2 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>
        {block.title}
      </h2>
      {block.body && (
        <p className="text-[15px] text-foreground/85 leading-7 mb-4">{block.body}</p>
      )}
      {block.ordered && (
        <ol className="list-decimal pl-6 space-y-2 text-[15px] text-foreground/85 leading-7 mb-4">
          {block.ordered.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      )}
      {block.bullets && (
        <ul className="list-disc pl-6 space-y-2 text-[15px] text-foreground/85 leading-7 mb-4">
          {block.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}
      {block.code?.map((snippet) => (
        <CodeBlock
          key={snippet.content.slice(0, 48)}
          language={snippet.language}
          content={snippet.content}
          caption={snippet.caption}
        />
      ))}
      {block.callout && <Callout kind={block.callout.kind} text={block.callout.text} />}
    </section>
  );
}

function TopicCard({ topic }: { topic: DocTopic }) {
  return (
    <Link href={`/docs/${topic.slug}`}>
      <article className="group rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors cursor-pointer h-full">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
            {topic.title}
          </h3>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 mt-0.5" />
        </div>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{topic.description}</p>
      </article>
    </Link>
  );
}

function DocsSidebar({ activeSlug, blocks }: { activeSlug?: string; blocks?: DocBlock[] }) {
  return (
    <aside className="w-full lg:w-52 shrink-0 space-y-8 lg:sticky lg:top-20 lg:self-start">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          On this page
        </p>
        {blocks && blocks.length > 0 ? (
          <nav className="space-y-1 border-l border-border">
            {blocks.map((block, i) => (
              <a
                key={block.title}
                href={`#section-${i}`}
                className="block pl-3 py-1 text-sm text-muted-foreground hover:text-primary border-l-2 border-transparent hover:border-primary -ml-px transition-colors"
              >
                {block.title}
              </a>
            ))}
          </nav>
        ) : (
          <p className="text-sm text-muted-foreground">Select a guide</p>
        )}
      </div>

      <div className="pt-4 border-t border-border space-y-5">
        {DOC_CATEGORIES.map((cat) => {
          const topics = DOC_TOPICS.filter((t) => t.category === cat.id);
          return (
            <div key={cat.id}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {cat.label}
              </p>
              <nav className="space-y-0.5">
                {topics.map((topic) => (
                  <Link key={topic.slug} href={`/docs/${topic.slug}`}>
                    <span
                      className={cn(
                        "block px-2 py-1.5 rounded text-sm transition-colors cursor-pointer",
                        activeSlug === topic.slug
                          ? "text-primary font-medium bg-primary/5"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                      )}
                    >
                      {topic.title}
                    </span>
                  </Link>
                ))}
              </nav>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export default function DocsPage() {
  const params = useParams<{ topic?: string }>();
  const slug = params.topic || "overview";
  const { user } = useAuth();

  if (slug === "react") {
    return <Redirect to="/docs/overview" />;
  }

  const topic = getDocTopic(slug);

  if (!topic) {
    return (
      <PublicLayout>
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h1 className="text-lg font-semibold">Page not found</h1>
          <Link href="/docs/overview" className="text-primary text-sm mt-2 inline-block hover:underline">
            Return to documentation
          </Link>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-6 py-10 pb-20">
        <nav className="text-sm text-muted-foreground mb-6">
          <Link href="/docs/overview" className="hover:text-primary">Documentation</Link>
          <span className="mx-2 text-border">/</span>
          <span className="text-foreground">{topic.title}</span>
        </nav>

        <header className="mb-10 max-w-2xl">
          <h1 className="text-3xl font-bold text-foreground tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
            {topic.title}
          </h1>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">{topic.description}</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-14">
          <DocsSidebar activeSlug={slug} blocks={topic.blocks} />

          <article className="flex-1 min-w-0 max-w-2xl space-y-10">
            {topic.blocks.map((block, i) => (
              <DocBlockView key={block.title} block={block} index={i} />
            ))}

            {topic.slug === "overview" && (
              <section className="pt-8 border-t border-border space-y-8">
                {DOC_CATEGORIES.filter((c) => c.id !== "start").map((cat) => (
                  <div key={cat.id}>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                      {cat.label}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {DOC_TOPICS.filter((t) => t.category === cat.id).map((t) => (
                        <TopicCard key={t.slug} topic={t} />
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            )}

            <footer className="pt-8 border-t border-border text-sm text-muted-foreground">
              {user ? (
                <p>
                  API token and register URL are on your{" "}
                  <Link href="/profile" className="text-primary hover:underline inline-flex items-center gap-1">
                    Profile <ExternalLink className="w-3 h-3" />
                  </Link>
                  .
                </p>
              ) : (
                <p>
                  <Link href="/login" className="text-primary hover:underline">Sign in</Link>
                  {" "}to obtain your SKYOBSERV_USER_TOKEN and register URL.
                </p>
              )}
            </footer>
          </article>
        </div>
      </div>
    </PublicLayout>
  );
}
