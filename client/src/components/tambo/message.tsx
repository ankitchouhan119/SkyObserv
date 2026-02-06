"use client";

import { createMarkdownComponents } from "./markdownComponents";
import { checkHasContent, getSafeContent } from "@/lib/thread-hooks";
import { cn } from "@/lib/utils";
import type { TamboThreadMessage } from "@tambo-ai/react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, Copy } from "lucide-react";
import * as React from "react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

const messageVariants = cva("flex flex-col w-full mb-4 group", {
  variants: {
    variant: { default: "", solid: [] },
    role: { user: "items-end", assistant: "items-start" }
  },
  defaultVariants: { variant: "default" },
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
        <div ref={ref} className={cn(messageVariants({ variant, role }), className)} data-message-role={role}>
          {children}
        </div>
      </MessageContext.Provider>
    );
  },
);
Message.displayName = "Message";

const LoadingIndicator = () => (
  <div className="flex items-center gap-1 py-1 px-2">
    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.2s]"></span>
    <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce [animation-delay:-0.1s]"></span>
  </div>
);

const MessageContent = React.forwardRef<HTMLDivElement, any>(({ className, markdown = true, ...props }, ref) => {
  const { message, isLoading, role } = useMessageContext();
  const [copied, setCopied] = useState(false);
  
  const contentToRender = message.content;
  const safeContent = getSafeContent(contentToRender as any);
  const hasContent = checkHasContent(contentToRender as any);
  const showLoading = isLoading && !hasContent;

  const handleCopy = () => {
    const text = typeof safeContent === "string" ? safeContent : "";
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={cn("flex flex-col gap-1 max-w-[85%]", role === "user" ? "items-end" : "items-start")}>
      <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2", role === "user" ? "text-blue-500" : "text-emerald-500")}>
        {role === "user" ? "User" : "Response"}
      </span>
      <div ref={ref} className={cn(
        "rounded-2xl px-4 py-2 text-[15px] leading-relaxed shadow-sm transition-all min-h-[40px] flex items-center",
        role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none",
        className
      )}>
        {showLoading ? <LoadingIndicator /> : (
          <div className="break-words w-full">
            {markdown ? (
              <ReactMarkdown components={createMarkdownComponents()}>
                {typeof safeContent === "string" ? safeContent : ""}
              </ReactMarkdown>
            ) : safeContent}
          </div>
        )}
      </div>
      <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity px-2">
        <button type="button" onClick={handleCopy} className="p-1 hover:bg-white/10 rounded cursor-pointer transition-colors">
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
        </button>
      </div>
    </div>
  );
});
MessageContent.displayName = "MessageContent";

const MessageRenderedComponentArea = React.forwardRef<HTMLDivElement, any>(({ className, ...props }, ref) => {
  const { message, role } = useMessageContext();
  if (!message.renderedComponent || role !== "assistant") return null;
  return (
    <div ref={ref} className={cn("w-full mt-4 flex flex-col items-start px-2", className)}>
      <div className="text-[10px] font-bold text-muted-foreground uppercase mb-2">Visualization</div>
      <div className="w-full bg-card/30 rounded-xl border border-white/5 p-4">{message.renderedComponent}</div>
    </div>
  );
});
MessageRenderedComponentArea.displayName = "MessageRenderedComponentArea";

export { Message, MessageContent, MessageRenderedComponentArea };