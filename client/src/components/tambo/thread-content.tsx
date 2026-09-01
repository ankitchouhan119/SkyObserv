"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTambo } from "@tambo-ai/react";
import { getSafeContent, isHiddenAssistantContent } from "@/lib/thread-hooks";
import { Message, MessageContent, MessageRenderedComponentArea } from "./message";

export const ThreadContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {children}
      </div>
    );
  },
);
ThreadContent.displayName = "ThreadContent";

export const ThreadContentMessages = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { thread, isIdle } = useTambo();
    const messages = thread?.messages ?? [];

    const visibleMessages = useMemo(() => {
      return messages.filter((m) => {
        if (m.role === "user") return true;
        const content = getSafeContent(m.content);
        const contentStr = typeof content === "string" ? content.trim() : "";
        const hasComponent = !!m.renderedComponent;
        const hasVisibleText = contentStr.length > 0 && !isHiddenAssistantContent(contentStr);
        return hasVisibleText || hasComponent;
      });
    }, [messages]);

    return (
      <div ref={ref} className={cn("flex flex-col gap-3", className)} {...props}>
        {visibleMessages.map((message, index) => {
          const isAssistant = message.role === "assistant";
          const isLast = index === visibleMessages.length - 1;

          return (
            <div key={message.id ?? index}>
              <Message
                className={cn("flex w-full", isAssistant ? "justify-start" : "justify-end")}
              >
                <div className={cn("flex flex-col", isAssistant ? "w-full" : "max-w-[85%]")}>
                  <MessageContent
                    message={message}
                    role={message.role}
                    isLoading={!isIdle && isLast && isAssistant}
                  />
                  <MessageRenderedComponentArea message={message} role={message.role} className="w-full" />
                </div>
              </Message>
            </div>
          );
        })}
      </div>
    );
  },
);
ThreadContentMessages.displayName = "ThreadContentMessages";
