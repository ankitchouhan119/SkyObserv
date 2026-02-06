"use client";

import { cn } from "@/lib/utils";
import { useTamboThreadInput, useTambo } from "@tambo-ai/react";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowUp, Square } from "lucide-react";
import * as React from "react";
import { useLocation } from "wouter";

const messageInputVariants = cva("w-full", {
  variants: {
    variant: {
      default: "",
      solid: "shadow shadow-zinc-900/10 dark:shadow-zinc-900/20 [&_textarea]:bg-muted",
      bordered: "[&_textarea]:border-2 [&_textarea]:border-border",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface MessageInputProps extends React.HTMLAttributes<HTMLFormElement> {
  contextKey?: string;
  variant?: VariantProps<typeof messageInputVariants>["variant"];
  children?: React.ReactNode;
}

const MessageInput = React.forwardRef<HTMLFormElement, MessageInputProps>(
  ({ children, className, contextKey, variant, ...props }, ref) => {
    const { value, setValue, submit, isPending } = useTamboThreadInput(contextKey);
    const [, setLocation] = useLocation();

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const prompt = value.trim();
      if (!prompt) return;

      try {
        await submit({ contextKey, streamResponse: true });
        
        // Navigation Logic based on query
        const lowPrompt = prompt.toLowerCase();
        if (lowPrompt.includes("trace")) setLocation("/traces");
        else if (lowPrompt.includes("service")) setLocation("/");
        else if (lowPrompt.includes("topology")) setLocation("/topology");
        else if (lowPrompt.includes("database")) setLocation("/databases");

        // Sync Event for UI Update
        window.dispatchEvent(new CustomEvent("skyobserv:query-update", { detail: { query: prompt } }));

        setValue("");
      } catch (err) {
        console.error("Submit error:", err);
      }
    };

    return (
      <form ref={ref} onSubmit={handleSubmit} className={cn(messageInputVariants({ variant }), className)} {...props}>
        <div className="flex flex-col rounded-xl bg-gradient-to-br from-gray-900 to-blue-900 border border-gray-500 shadow-md p-2 px-3">
          {children}
        </div>
      </form>
    );
  },
);
MessageInput.displayName = "MessageInput";

export const MessageInputTextarea = ({ className, placeholder = "Ask SkyObserv anything...", ...props }: any) => {
  const { value, setValue, isPending } = useTamboThreadInput();
  return (
    <textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => { 
        if (e.key === "Enter" && !e.shiftKey) { 
          e.preventDefault(); 
          (e.target as any).form.requestSubmit(); 
        } 
      }}
      disabled={isPending}
      placeholder={placeholder}
      className={cn("flex-1 resize-none rounded-t-lg bg-transparent p-3 text-sm text-white focus:outline-none min-h-[20px] max-h-[40vh] placeholder:text-muted-foreground/50", className)}
      {...props}
    />
  );
};

export const MessageInputSubmitButton = ({ className, ...props }: any) => {
  const { isPending, value } = useTamboThreadInput();
  const { thread, stopGeneration } = useTambo();
  const isStreaming = thread?.generationStage === "STREAMING_RESPONSE";

  return (
    <button 
      type={isStreaming ? "button" : "submit"} 
      onClick={isStreaming ? () => (thread as any)?.stopGeneration?.() || stopGeneration?.() : undefined}
      disabled={!isStreaming && (isPending || !value.trim())} 
      className={cn("flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-900 to-blue-900 border border-gray-500 text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer", isStreaming && "bg-red-500 animate-pulse", className)} 
      {...props}
    >
      {isStreaming ? <Square className="h-4 w-4 fill-current text-white" /> : isPending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" /> : <ArrowUp className="h-5 w-5 text-white" />}
    </button>
  );
};


const MessageInputToolbar = ({ className, children, ...props }: any) => (
  <div className={cn("mt-2 flex justify-end p-1", className)} {...props}>{children}</div>
);

export const MessageInputError = () => null;

export { MessageInput, MessageInputToolbar };