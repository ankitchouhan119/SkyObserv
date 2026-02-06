"use client";

import { createMarkdownComponents } from "./markdownComponents";
import { checkHasContent, getSafeContent } from "@/lib/thread-hooks";
import { cn } from "@/lib/utils";
import type { TamboThreadMessage } from "@tambo-ai/react";
import type TamboAI from "@tambo-ai/typescript-sdk";
import { cva, type VariantProps } from "class-variance-authority";
import stringify from "json-stringify-pretty-compact";
import { Check, ChevronDown, ExternalLink, Loader2, X } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

// 🔥 Message container ko role ke basis par align karne ke liye variants
const messageVariants = cva("flex flex-col w-full mb-4", {
  variants: {
    variant: {
      default: "",
      solid: [],
    },
    role: {
      user: "items-end", // User message right side
      assistant: "items-start", // Assistant message left side
    }
  },
  defaultVariants: {
    variant: "default",
  },
});

interface MessageContextValue {
  role: "user" | "assistant";
  variant?: VariantProps<typeof messageVariants>["variant"];
  message: TamboThreadMessage;
  isLoading?: boolean;
}

const MessageContext = React.createContext<MessageContextValue | null>(null);

const useMessageContext = () => {
  const context = React.useContext(MessageContext);
  if (!context) throw new Error("Message sub-components must be used within a Message");
  return context;
};

// --- Main Components ---

export interface MessageProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "content"> {
  role: "user" | "assistant";
  message: TamboThreadMessage;
  variant?: VariantProps<typeof messageVariants>["variant"];
  isLoading?: boolean;
  children: React.ReactNode;
}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ children, className, role, variant, isLoading, message, ...props }, ref) => {
    const contextValue = React.useMemo(() => ({ role, variant, isLoading, message }), [role, variant, isLoading, message]);

    return (
      <MessageContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn(messageVariants({ variant, role }), className)}
          data-message-role={role}
        >
          {children}
        </div>
      </MessageContext.Provider>
    );
  },
);
Message.displayName = "Message";

const LoadingIndicator = () => (
  <div className="flex items-center gap-1">
    <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
    <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.2s]"></span>
    <span className="w-1 h-1 bg-current rounded-full animate-bounce [animation-delay:-0.1s]"></span>
  </div>
);

const MessageContent = React.forwardRef<HTMLDivElement, any>(({ className, markdown = true, ...props }, ref) => {
  const { message, isLoading, role } = useMessageContext();
  const [isToolExpanded, setIsToolExpanded] = useState(false);
  const contentToRender = message.content;
  const safeContent = getSafeContent(contentToRender as any);
  const hasContent = checkHasContent(contentToRender as any);
  const showLoading = isLoading && !hasContent;

  return (
    <div className={cn("flex flex-col gap-1 max-w-[85%]", role === "user" ? "items-end" : "items-start")}>
      {/* Label: User (Right) / Response (Left) */}
      <span className={cn(
        "text-[10px] font-bold uppercase tracking-widest px-2",
        role === "user" ? "text-blue-500" : "text-emerald-500"
      )}>
        {role === "user" ? "User" : "Response"}
      </span>

      {/* Bubble Container */}
      <div
        ref={ref}
        className={cn(
          "rounded-2xl px-4 py-2 text-[15px] leading-relaxed shadow-sm transition-all",
          role === "user" 
            ? "bg-primary text-primary-foreground rounded-tr-none" // User Bubble Styling
            : "bg-muted text-foreground rounded-tl-none", // Assistant Bubble Styling
          className
        )}
      >
        {showLoading ? <LoadingIndicator /> : (
          <div className={cn("break-words", !markdown && "whitespace-pre-wrap")}>
            {markdown ? (
              <ReactMarkdown components={createMarkdownComponents()}>
                {typeof safeContent === "string" ? safeContent : ""}
              </ReactMarkdown>
            ) : safeContent}
          </div>
        )}
      </div>
    </div>
  );
});

const MessageRenderedComponentArea = React.forwardRef<HTMLDivElement, any>(({ className, ...props }, ref) => {
  const { message, role } = useMessageContext();
  if (!message.renderedComponent || role !== "assistant") return null;

  return (
    <div ref={ref} className={cn("w-full mt-4 flex flex-col items-start", className)}>
      <div className="text-[10px] font-bold text-muted-foreground uppercase mb-2 px-2">Visualization</div>
      <div className="w-full bg-card/30 rounded-xl border border-white/5 p-4">
        {message.renderedComponent}
      </div>
    </div>
  );
});

export { Message, MessageContent, MessageRenderedComponentArea };