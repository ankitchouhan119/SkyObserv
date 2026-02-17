"use client";

import { createMarkdownComponents } from "./markdownComponents";
import { getSafeContent, checkHasContent } from "@/lib/thread-hooks";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import * as React from "react";
import ReactMarkdown from "react-markdown";

export const Message = ({ children, className, role, ...props }: any) => {
  return (
    <div className={cn("flex flex-col w-full mb-4 group", className)}>
      {children}
    </div>
  );
};

export const MessageContent = ({ message, isLoading, role, className, markdown = true }: any) => {
  const [copied, setCopied] = React.useState(false);
  const contentToRender = message.content;
  const safeContent = getSafeContent(contentToRender as any);
  const contentStr = typeof safeContent === "string" ? safeContent.trim() : "";

  const isPureJson = contentStr.startsWith("{") && contentStr.endsWith("}") && contentStr.length > 100;
  const shouldShowContent = contentStr.length > 0 && !isPureJson;

  if (role === "assistant" && !shouldShowContent && !isLoading) return null;

  const handleCopy = () => {
    if (contentStr) {
      navigator.clipboard.writeText(contentStr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={cn("flex flex-col gap-1", role === "user" ? "items-end" : "items-start")}>
      <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2", 
        role === "user" ? "text-green-500" : "text-blue-500")}>
        {role === "user" ? "USER" : "RESPONSE"}
      </span>
      
      {shouldShowContent && (
        <div className={cn(
          "rounded-xl px-4 py-2 text-[15px] leading-relaxed shadow-sm min-h-[40px] flex items-center overflow-hidden",
          role === "assistant" 
            ? "text-white border border-gray-500/20 bg-gray-600/20" 
            : "text-white border border-green-500/20 bg-green-600/20",
          className
        )}>
          <div className="break-words w-full">
            {isLoading && !shouldShowContent ? "..." : (
              <ReactMarkdown components={createMarkdownComponents()}>
                {contentStr}
              </ReactMarkdown>
            )}
          </div>
        </div>
      )}

      {shouldShowContent && (
        <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity px-2">
          <button onClick={handleCopy} className="p-1 hover:bg-white/10 rounded cursor-pointer transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
        </div>
      )}
    </div>
  );
};

export const MessageRenderedComponentArea = ({ message, role, className }: any) => {
  if (!message.renderedComponent || role !== "assistant") return null;
  return (
    <div className={cn("w-full mt-4 flex flex-col items-start px-2", className)}>
      <div className="text-[10px] font-bold text-muted-foreground uppercase mb-2 italic">Visualization</div>
      <div className="w-full bg-card/30 rounded-xl border border-white/5 p-4 overflow-x-auto shadow-inner">
        {message.renderedComponent}
      </div>
    </div>
  );
};