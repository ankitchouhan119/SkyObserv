"use client";

import {
  MessageInput,
  MessageInputTextarea,
  MessageInputToolbar,
  MessageInputSubmitButton,
  MessageInputError,
} from "./message-input";
import {
  MessageSuggestions,
  MessageSuggestionsStatus,
  MessageSuggestionsList,
} from "./message-suggestions";
import type { messageVariants } from "./message";
import {
  ThreadContent,
  ThreadContentMessages,
} from "./thread-content";
import { ScrollableMessageContainer } from "./scrollable-message-container";
import { cn } from "@/lib/utils";
import { Collapsible } from "radix-ui";
import { Sparkles, XIcon } from "lucide-react";
import * as React from "react";
import { type VariantProps } from "class-variance-authority";
import type { Suggestion } from "@tambo-ai/react";

export interface MessageThreadCollapsibleProps
  extends React.HTMLAttributes<HTMLDivElement> {
  contextKey?: string;
  defaultOpen?: boolean;
  variant?: VariantProps<typeof messageVariants>["variant"];
}

const useCollapsibleState = (defaultOpen = false) => {
  const [isOpen, setIsOpen] = React.useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("skyobserv_chat_open");
      return saved !== null ? JSON.parse(saved) : defaultOpen;
    }
    return defaultOpen;
  });

  const isMac =
    typeof navigator !== "undefined" && navigator.platform.startsWith("Mac");
  const shortcutText = isMac ? "⌘K" : "Ctrl+K";

  React.useEffect(() => {
    localStorage.setItem("skyobserv_chat_open", JSON.stringify(isOpen));
  }, [isOpen]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        setIsOpen((prev: boolean) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen, shortcutText };
};

interface CollapsibleContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const CollapsibleContainer = React.forwardRef<HTMLDivElement, CollapsibleContainerProps>(
  ({ className, isOpen, onOpenChange, children, ...props }, ref) => (
    <Collapsible.Root
      ref={ref}
      open={isOpen}
      onOpenChange={onOpenChange}
      className={cn(
        "fixed bottom-5 right-5 z-50 transition-all duration-300 ease-out",
        isOpen
          ? "w-[min(calc(100vw-2.5rem),24rem)] rounded-xl so-card shadow-xl border-border"
          : "w-auto",
        className,
      )}
      {...props}
    >
      {children}
    </Collapsible.Root>
  ),
);
CollapsibleContainer.displayName = "CollapsibleContainer";

interface CollapsibleTriggerProps {
  isOpen: boolean;
  shortcutText: string;
  onClose: () => void;
}

const CollapsibleTrigger = ({
  isOpen,
  shortcutText,
  onClose,
}: CollapsibleTriggerProps) => (
  <>
    {!isOpen && (
      <Collapsible.Trigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 h-10 pl-3 pr-2.5 rounded-full",
            "so-card text-sm font-medium text-foreground",
            "hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer",
          )}
          aria-expanded={isOpen}
          aria-controls="message-thread-content"
        >
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/15">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </span>
          <span>Ask AI</span>
          <kbd className="hidden sm:inline-flex items-center rounded border border-border/80 bg-background/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {shortcutText}
          </kbd>
        </button>
      </Collapsible.Trigger>
    )}
    {isOpen && (
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-card/95">
        <div className="flex items-center gap-2.5">
          <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/15">
            <Sparkles className="h-4 w-4 text-primary" />
          </span>
          <div>
            <p className="text-sm font-semibold leading-none">AI Assistant</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Ask about your services</p>
          </div>
        </div>
        <button
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    )}
  </>
);
CollapsibleTrigger.displayName = "CollapsibleTrigger";

export const MessageThreadCollapsible = React.forwardRef<
  HTMLDivElement,
  MessageThreadCollapsibleProps
>(({ className, contextKey, defaultOpen = false, variant, ...props }, ref) => {
  const { isOpen, setIsOpen, shortcutText } = useCollapsibleState(defaultOpen);

  const defaultSuggestions: Suggestion[] = [
    {
      id: "s-1",
      title: "Check Service Health",
      detailedSuggestion: "Show me the health status of all running services.",
      messageId: "health-check",
    },
    {
      id: "s-2",
      title: "Show Abnormal Traces",
      detailedSuggestion: "List all traces that have errors or high latency in the last hour.",
      messageId: "trace-check",
    },
    {
      id: "s-3",
      title: "View Global Topology",
      detailedSuggestion: "Render the dependency graph for the entire system.",
      messageId: "topo-check",
    },
  ];

  return (
    <CollapsibleContainer
      ref={ref}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      className={className}
      {...props}
    >
      <CollapsibleTrigger
        isOpen={isOpen}
        shortcutText={shortcutText}
        onClose={() => setIsOpen(false)}
      />
      <Collapsible.Content>
        <div className="h-[min(70vh,32rem)] flex flex-col bg-card">
          <ScrollableMessageContainer className="p-3 flex-1">
            <ThreadContent variant={variant}>
              <ThreadContentMessages />
            </ThreadContent>
          </ScrollableMessageContainer>

          <MessageSuggestions>
            <MessageSuggestionsStatus />
          </MessageSuggestions>

          <MessageSuggestions initialSuggestions={defaultSuggestions} autoRefresh={true}>
            <MessageSuggestionsList />
          </MessageSuggestions>

          <div className="p-3 border-t border-border/60 bg-card/95">
            <MessageInput contextKey={contextKey}>
              <MessageInputTextarea />
              <MessageInputToolbar>
                <MessageInputSubmitButton />
              </MessageInputToolbar>
              <MessageInputError />
            </MessageInput>
          </div>
        </div>
      </Collapsible.Content>
    </CollapsibleContainer>
  );
});
MessageThreadCollapsible.displayName = "MessageThreadCollapsible";
