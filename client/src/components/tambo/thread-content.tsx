"use client";

import React, { useMemo } from 'react';
import { cn } from "@/lib/utils";
import { useTambo } from "@tambo-ai/react";
import { Message, MessageContent, MessageRenderedComponentArea } from "./message";

export const ThreadContent = React.forwardRef<HTMLDivElement, any>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {children}
      </div>
    );
  }
);

export const ThreadContentMessages = React.forwardRef<HTMLDivElement, any>(
  ({ className, ...props }, ref) => {
    const { thread, isIdle } = useTambo();
    const messages = thread?.messages ?? [];

    const visibleMessages = useMemo(() => {
      return messages.filter((m) => {
        if (m.role === "user") return true;
        const content = String(m.content || "").trim();
        const isPureJson = content.startsWith("{") && content.endsWith("}") && content.length > 100;
        const hasComponent = !!m.renderedComponent;
        const hasText = content.length > 0 && !isPureJson;
        return hasText || hasComponent;
      });
    }, [messages]);

    return (
      <div ref={ref} className={cn("flex flex-col gap-4", className)} {...props}>
        {visibleMessages.map((message, index) => {
          const isAssistant = message.role === "assistant";
          const isLast = index === visibleMessages.length - 1;

          return (
            <div key={message.id ?? index}>
              <Message
                role={isAssistant ? "assistant" : "user"}
                message={message}
                isLoading={!isIdle && isLast}
                className={cn("flex w-full", isAssistant ? "justify-start" : "justify-end")}
              >
                <div className={cn("flex flex-col", isAssistant ? "w-full" : "max-w-3xl")}>
                  <MessageContent
                    message={message}
                    role={message.role}
                    isLoading={!isIdle && isLast}
                  />
                  <MessageRenderedComponentArea 
                    message={message} 
                    role={message.role} 
                    className="w-full" 
                  />
                </div>
              </Message>
            </div>
          );
        })}
      </div>
    );
  }
);