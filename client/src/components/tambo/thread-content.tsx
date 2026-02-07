"use client";

import {
  Message,
  MessageContent,
  MessageRenderedComponentArea,
  type messageVariants,
} from "./message";
import { cn } from "@/lib/utils";
import { type TamboThreadMessage, useTambo } from "@tambo-ai/react";
import { type VariantProps } from "class-variance-authority";
import * as React from "react";

/**
 * @typedef ThreadContentContextValue
 */
interface ThreadContentContextValue {
  messages: TamboThreadMessage[];
  isGenerating: boolean;
  generationStage?: string;
  variant?: VariantProps<typeof messageVariants>["variant"];
}

const ThreadContentContext =
  React.createContext<ThreadContentContextValue | null>(null);

const useThreadContentContext = () => {
  const context = React.useContext(ThreadContentContext);
  if (!context) {
    throw new Error(
      "ThreadContent sub-components must be used within a ThreadContent",
    );
  }
  return context;
};

export interface ThreadContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: VariantProps<typeof messageVariants>["variant"];
  children?: React.ReactNode;
}

const ThreadContent = React.forwardRef<HTMLDivElement, ThreadContentProps>(
  ({ children, className, variant, ...props }, ref) => {
    const { thread, generationStage, isIdle } = useTambo();
    const isGenerating = !isIdle;

    const contextValue = React.useMemo(
      () => ({
        messages: thread?.messages ?? [],
        isGenerating,
        generationStage,
        variant,
      }),
      [thread?.messages, isGenerating, generationStage, variant],
    );

    return (
      <ThreadContentContext.Provider value={contextValue}>
        <div
          ref={ref}
          className={cn("w-full", className)}
          data-slot="thread-content-container"
          {...props}
        >
          {children}
        </div>
      </ThreadContentContext.Provider>
    );
  },
);
ThreadContent.displayName = "ThreadContent";

export type ThreadContentMessagesProps = React.HTMLAttributes<HTMLDivElement>;

const ThreadContentMessages = React.forwardRef<
  HTMLDivElement,
  ThreadContentMessagesProps
>(({ className, ...props }, ref) => {
  const { messages, isGenerating, variant } = useThreadContentContext();

  const visibleMessages = React.useMemo(() => {
    return messages.filter((m) => m.role === "user" || m.role === "assistant");
  }, [messages]);

  return (
    <div
      ref={ref}
      className={cn("flex flex-col gap-4", className)}
      data-slot="thread-content-messages"
      {...props}
    >
      {visibleMessages.map((message, index) => {
        const isAssistant = message.role === "assistant";
        const isLastMessage = index === visibleMessages.length - 1;

        return (
          <div
            key={
              message.id ??
              `${message.role}-${
                message.createdAt ?? Date.now()
              }-${index}`
            }
            data-slot="thread-content-item"
          >
            <Message
              role={isAssistant ? "assistant" : "user"}
              message={message}
              variant={variant}
              // Spinner only shows on the last visible message while generating
              isLoading={isGenerating && isLastMessage}
              className={cn(
                "flex w-full",
                isAssistant ? "justify-start" : "justify-end",
              )}
            >
              <div
                className={cn(
                  "flex flex-col",
                  isAssistant ? "w-full" : "max-w-3xl",
                )}
              >
                <MessageContent
                  className={
                    isAssistant
                      ? "text-white border border-gray-500/20 bg-gray-600/20 to-transparent font-sans"
                      : "text-white border border-green-500/20 bg-green-600/20 to-transparent hover:bg-backdrop font-sans"
                  }
                />
                <MessageRenderedComponentArea className="w-full" />
              </div>
            </Message>
          </div>
        );
      })}
    </div>
  );
});
ThreadContentMessages.displayName = "ThreadContent.Messages";

export { ThreadContent, ThreadContentMessages };