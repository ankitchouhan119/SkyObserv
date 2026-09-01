"use client";

import * as React from "react";
import { createMarkdownComponents } from "./markdownComponents";
import { getSafeContent, isHiddenAssistantContent } from "@/lib/thread-hooks";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";

export const Message = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className={cn("flex flex-col w-full mb-3 group", className)} {...props}>
      {children}
    </div>
  );
};

export const MessageContent = ({
  message,
  isLoading,
  role,
  className,
}: {
  message: { content: unknown; renderedComponent?: React.ReactNode };
  isLoading?: boolean;
  role?: string;
  className?: string;
}) => {
  const [copied, setCopied] = React.useState(false);
  const safeContent = getSafeContent(message.content as never);
  const contentStr = typeof safeContent === "string" ? safeContent.trim() : "";
  const hasComponent = Boolean(message.renderedComponent);

  const shouldHideText = role === "assistant" && isHiddenAssistantContent(contentStr);
  const shouldShowContent = contentStr.length > 0 && !shouldHideText;
  const showBubble = shouldShowContent || (isLoading && role === "assistant");

  if (role === "assistant" && !showBubble && !hasComponent) return null;

  const handleCopy = () => {
    if (contentStr) {
      navigator.clipboard.writeText(contentStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={cn("flex flex-col gap-1 w-full", role === "user" ? "items-end" : "items-start")}>
      {showBubble && (
        <div
          className={cn(
            "rounded-lg px-3 py-2 text-[13px] leading-relaxed max-w-[95%]",
            role === "assistant"
              ? "bg-muted border border-border text-foreground"
              : "bg-primary/10 border border-primary/25 text-foreground",
            className,
          )}
        >
          <div className="break-words w-full prose-sm">
            {isLoading && !shouldShowContent ? (
              <span className="text-muted-foreground">Thinking...</span>
            ) : (
              <ReactMarkdown components={createMarkdownComponents()}>{contentStr}</ReactMarkdown>
            )}
          </div>
        </div>
      )}

      {shouldShowContent && (
        <button
          onClick={handleCopy}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent transition-all"
          aria-label="Copy message"
        >
          {copied ? (
            <Check className="w-3 h-3 text-primary" />
          ) : (
            <Copy className="w-3 h-3 text-muted-foreground" />
          )}
        </button>
      )}
    </div>
  );
};

export const MessageRenderedComponentArea = ({
  message,
  role,
  className,
}: {
  message: { renderedComponent?: React.ReactNode };
  role?: string;
  className?: string;
}) => {
  if (!message.renderedComponent || role !== "assistant") return null;
  return (
    <div className={cn("w-full mt-2", className)}>
      <div className="w-full rounded-lg border border-border/60 bg-card/60 p-3 overflow-x-auto">
        {message.renderedComponent}
      </div>
    </div>
  );
};
