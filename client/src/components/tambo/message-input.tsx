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
      solid: "[&_textarea]:bg-muted/50",
      bordered: "[&_textarea]:border [&_textarea]:border-border",
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

        const lowPrompt = prompt.toLowerCase();
        if (lowPrompt.includes("trace")) setLocation("/traces");
        else if (lowPrompt.includes("service")) setLocation("/dashboard");
        else if (lowPrompt.includes("topology")) setLocation("/topology");
        else if (lowPrompt.includes("database")) setLocation("/databases");

        window.dispatchEvent(new CustomEvent("skyobserv:query-update", { detail: { query: prompt } }));
        setValue("");
      } catch (err) {
        console.error("Submit error:", err);
      }
    };

    return (
      <form
        ref={ref}
        onSubmit={handleSubmit}
        className={cn(messageInputVariants({ variant }), className)}
        {...props}
      >
        <div className="flex items-end gap-2 rounded-lg border border-border/70 bg-background/80 p-1.5">
          {children}
        </div>
      </form>
    );
  },
);
MessageInput.displayName = "MessageInput";

export const MessageInputTextarea = ({
  className,
  placeholder = "Ask a question...",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => {
  const { value, setValue, isPending } = useTamboThreadInput();
  return (
    <textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          (e.target as HTMLTextAreaElement).form?.requestSubmit();
        }
      }}
      disabled={isPending}
      placeholder={placeholder}
      rows={1}
      className={cn(
        "flex-1 resize-none bg-transparent px-2 py-1.5 text-[13px] leading-5 text-foreground",
        "focus:outline-none min-h-[32px] max-h-[100px] placeholder:text-muted-foreground/70",
        className,
      )}
      {...props}
    />
  );
};

export const MessageInputSubmitButton = ({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { isPending, value } = useTamboThreadInput();
  const { thread } = useTambo();
  const isStreaming = thread?.generationStage === "STREAMING_RESPONSE";

  return (
    <button
      type={isStreaming ? "button" : "submit"}
      onClick={isStreaming ? () => (thread as { stopGeneration?: () => void })?.stopGeneration?.() : undefined}
      disabled={!isStreaming && (isPending || !value.trim())}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors",
        isStreaming
          ? "bg-destructive/90 text-destructive-foreground hover:bg-destructive"
          : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed",
        className,
      )}
      {...props}
    >
      {isStreaming ? (
        <Square className="h-3.5 w-3.5 fill-current" />
      ) : isPending ? (
        <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
      ) : (
        <ArrowUp className="h-4 w-4" />
      )}
    </button>
  );
};

const MessageInputToolbar = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex shrink-0 items-center", className)} {...props}>
    {children}
  </div>
);

export const MessageInputError = () => null;

export { MessageInput, MessageInputToolbar };
