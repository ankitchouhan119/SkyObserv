"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { Loader2Icon, Sparkles } from "lucide-react";

import { MessageGenerationStage } from "./message-generation-stage";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Suggestion, TamboThread } from "@tambo-ai/react";
import { useTambo, useTamboSuggestions } from "@tambo-ai/react";

/**
 * Context Value Interface
 */
interface MessageSuggestionsContextValue {
  suggestions: Suggestion[];
  selectedSuggestionId: string | null;
  accept: (options: { suggestion: Suggestion }) => void;
  isGenerating: boolean;
  error: Error | null;
  thread: TamboThread;
  isMac: boolean;
}

const MessageSuggestionsContext = React.createContext<MessageSuggestionsContextValue | null>(null);

const useMessageSuggestionsContext = () => {
  const context = React.useContext(MessageSuggestionsContext);
  if (!context) {
    throw new Error("Sub-components must be used within a MessageSuggestions");
  }
  return context;
};

export interface MessageSuggestionsProps extends React.HTMLAttributes<HTMLDivElement> {
  maxSuggestions?: number;
  initialSuggestions?: Suggestion[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

const MessageSuggestions = React.forwardRef<HTMLDivElement, MessageSuggestionsProps>(
  ({ children, className, maxSuggestions = 3, initialSuggestions = [], autoRefresh = true, refreshInterval = 10000, ...props }, ref) => {
    const { thread } = useTambo();
    const {
      suggestions: generatedSuggestions,
      selectedSuggestionId,
      accept,
      generateResult: { isPending: isGenerating, error },
      regenerate,
    } = useTamboSuggestions({ maxSuggestions });

    const lastMessageIdRef = useRef<string | null>(null);

    const suggestions = React.useMemo(() => {
      const messages = thread?.messages || [];
      const hasMessages = messages.length > 0;


      if (generatedSuggestions && generatedSuggestions.length > 0) {
        console.log("RECEIVING FROM AI:", generatedSuggestions);
        return generatedSuggestions;
      }

      if (hasMessages) {
        const lastMessage = messages[messages.length - 1];
        let lastContent = "";

        if (typeof lastMessage.content === "string") {
          lastContent = lastMessage.content.toLowerCase();
        } else if (Array.isArray(lastMessage.content)) {
          lastContent = lastMessage.content
            .map((c: any) => c.text || "")
            .join(" ")
            .toLowerCase();
        }

        if (lastContent.includes("service") || lastContent.includes("health")) {
          return [
            { id: "f-1", title: "Show all services", detailedSuggestion: "Get full service health", messageId: "m1" },
            { id: "f-2", title: "Show abnormal only", detailedSuggestion: "Filter unhealthy services", messageId: "m2" },
            { id: "f-3", title: "Check Instances", detailedSuggestion: "Show service pods", messageId: "m3" }
          ];
        }

        if (lastContent.includes("trace") || lastContent.includes("error")) {
          return [
            { id: "f-4", title: "Find slow traces", detailedSuggestion: "Show high latency traces", messageId: "m4" },
            { id: "f-5", title: "Show error logs", detailedSuggestion: "Get logs for errors", messageId: "m5" }
          ];
        }

        if (lastContent.includes("topology") || lastContent.includes("dependency")) {
          return [
            { id: "f-6", title: "Global topology", detailedSuggestion: "View system map", messageId: "m6" },
            { id: "f-7", title: "Show downstream", detailedSuggestion: "Check service dependencies", messageId: "m7" }
          ];
        }
      }

      // 3. Static Fallback
      return initialSuggestions.slice(0, maxSuggestions);
    }, [thread?.messages, generatedSuggestions, initialSuggestions, maxSuggestions]);


    useEffect(() => {
      if (!thread?.messages || thread.messages.length === 0) return;

      const lastMessage = thread.messages[thread.messages.length - 1];
      if (lastMessage.id !== lastMessageIdRef.current && !isGenerating) {
        lastMessageIdRef.current = lastMessage.id;

        const timer = setTimeout(() => {
          if (regenerate) {
            console.log("Context updated. Requesting AI for dynamic suggestions...");
            regenerate();
          }
        }, 1200);
        return () => clearTimeout(timer);
      }
    }, [thread?.messages, regenerate, isGenerating]);

    const isMac = typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");

    const contextValue = React.useMemo(
      () => ({ suggestions, selectedSuggestionId, accept, isGenerating, error, thread, isMac }),
      [suggestions, selectedSuggestionId, accept, isGenerating, error, thread, isMac]
    );

    return (
      <MessageSuggestionsContext.Provider value={contextValue}>
        <div ref={ref} className={cn("w-full transition-all", className)} {...props}>
          {children}
        </div>
      </MessageSuggestionsContext.Provider>
    );
  }
);
MessageSuggestions.displayName = "MessageSuggestions";

/**
 * Status Component
 */
const MessageSuggestionsStatus = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { error, isGenerating, thread } = useMessageSuggestionsContext();

    return (
      <div ref={ref} className={cn("px-4 py-2 text-sm", className)} {...props}>
        {error && <div className="text-destructive font-medium">{error.message}</div>}
        <div className="min-h-[24px]">
          {thread?.generationStage && thread.generationStage !== "COMPLETE" ? (
            <MessageGenerationStage />
          ) : isGenerating ? (
            <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
              <Loader2Icon className="h-4 w-4 animate-spin" />
              <span>Syncing dynamic suggestions...</span>
            </div>
          ) : null}
        </div>
      </div>
    );
  }
);
MessageSuggestionsStatus.displayName = "MessageSuggestions.Status";

/**
 * List Component
 */
const MessageSuggestionsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { suggestions, selectedSuggestionId, accept, isGenerating, isMac } = useMessageSuggestionsContext();
    const modKey = isMac ? "⌘" : "Ctrl";
    const altKey = isMac ? "⌥" : "Alt";

    return (
      <div ref={ref} className={cn("flex flex-wrap gap-2 px-4 pb-4", className)} {...props}>
        {suggestions.length > 0 ? (
          suggestions.map((suggestion, index) => (
            <TooltipProvider key={suggestion.id || index}>
              <Tooltip content={`${modKey}+${altKey}+${index + 1}`} side="top">
                <button
                  className={cn(
                    "rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs transition-all",
                    "hover:bg-blue-500/20 hover:border-blue-500/40 text-slate-300 hover:text-white",
                    "disabled:opacity-50 disabled:cursor-not-allowed text-left",
                    selectedSuggestionId === suggestion.id && "bg-blue-500/30 border-blue-500 text-white shadow-lg"
                  )}
                  onClick={async () => !isGenerating && (await accept({ suggestion }))}
                  disabled={isGenerating}
                >
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3 text-blue-400" />
                    <span>{suggestion.title}</span>
                  </div>
                </button>
              </Tooltip>
            </TooltipProvider>
          ))
        ) : (
          [1, 2, 3].map((i) => (
            <div key={i} className="h-8 w-28 rounded-full bg-white/5 animate-pulse border border-white/5" />
          ))
        )}
      </div>
    );
  }
);
MessageSuggestionsList.displayName = "MessageSuggestions.List";

export { MessageSuggestions, MessageSuggestionsStatus, MessageSuggestionsList };