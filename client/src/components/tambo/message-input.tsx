"use client";

import { cn } from "@/lib/utils";
import { useTamboThreadInput } from "@tambo-ai/react";
import { cva, type VariantProps } from "class-variance-authority";
import { ArrowUp } from "lucide-react";
import * as React from "react";

/* ---------------------------------- */
/* Variants */
/* ---------------------------------- */

const messageInputVariants = cva("w-full", {
  variants: {
    variant: {
      default: "",
      solid:
        "shadow shadow-zinc-900/10 dark:shadow-zinc-900/20 [&_textarea]:bg-muted",
      bordered: "[&_textarea]:border-2 [&_textarea]:border-border",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

/* ---------------------------------- */
/* Context */
/* ---------------------------------- */

interface MessageInputContextValue {
  value: string;
  setValue: (value: string) => void;
  submit: (options: {
    contextKey?: string;
    streamResponse?: boolean;
  }) => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  isPending: boolean;
  error: Error | null;
  contextKey?: string;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  submitError: string | null;
  setSubmitError: React.Dispatch<React.SetStateAction<string | null>>;
}

const MessageInputContext =
  React.createContext<MessageInputContextValue | null>(null);

const useMessageInputContext = () => {
  const context = React.useContext(MessageInputContext);
  if (!context) {
    throw new Error(
      "MessageInput sub-components must be used within a MessageInput",
    );
  }
  return context;
};

/* ---------------------------------- */
/* Root Component */
/* ---------------------------------- */

export interface MessageInputProps
  extends React.HTMLAttributes<HTMLFormElement> {
  contextKey?: string;
  variant?: VariantProps<typeof messageInputVariants>["variant"];
  children?: React.ReactNode;
}

const MessageInput = React.forwardRef<HTMLFormElement, MessageInputProps>(
  ({ children, className, contextKey, variant, ...props }, ref) => {
    const { value, setValue, submit, isPending, error } =
      useTamboThreadInput(contextKey);

    const [displayValue, setDisplayValue] = React.useState("");
    const [submitError, setSubmitError] = React.useState<string | null>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
      setDisplayValue(value);
      if (value && textareaRef.current) {
        textareaRef.current.focus();
      }
    }, [value]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!value.trim()) return;

      setSubmitError(null);
      setDisplayValue("");

      try {
        await submit({
          contextKey,
          streamResponse: true,
        });
        setValue("");
        textareaRef.current?.focus();
      } catch (err) {
        setDisplayValue(value);
        setSubmitError(
          err instanceof Error
            ? err.message
            : "Failed to send message. Please try again.",
        );
      }
    };

    const contextValue: MessageInputContextValue = {
      value: displayValue,
      setValue: (val) => {
        setValue(val);
        setDisplayValue(val);
      },
      submit,
      handleSubmit,
      isPending,
      error,
      contextKey,
      textareaRef,
      submitError,
      setSubmitError,
    };

    return (
      <MessageInputContext.Provider value={contextValue}>
        <form
          ref={ref}
          onSubmit={handleSubmit}
          className={cn(messageInputVariants({ variant }), className)}
          {...props}
        >
          <div className="flex flex-col rounded-xl bg-gradient-to-br from-gray-900 to-blue-900 border border-gray-500 shadow-md p-2 px-3">
            {children}
          </div>
        </form>
      </MessageInputContext.Provider>
    );
  },
);
MessageInput.displayName = "MessageInput";

/* ---------------------------------- */
/* Textarea */
/* ---------------------------------- */

export interface MessageInputTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  placeholder?: string;
}

const MessageInputTextarea = ({
  className,
  placeholder = "What do you want to do?",
  ...props
}: MessageInputTextareaProps) => {
  const { value, setValue, isPending, textareaRef, handleSubmit } =
    useMessageInputContext();

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          if (value.trim()) {
            handleSubmit(e as unknown as React.FormEvent);
          }
        }
      }}
      disabled={isPending}
      placeholder={placeholder}
      className={cn(
        "flex-1 resize-none rounded-t-lg bg-gradient-to-br from-gray-900 to-blue-900 border border-gray-500  p-3 text-sm text-foreground min-h-[20px] max-h-[40vh] focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50",
        className,
      )}
      aria-label="Chat Message Input"
      {...props}
    />
  );
};
MessageInputTextarea.displayName = "MessageInput.Textarea";

/* ---------------------------------- */
/* Submit Button */
/* ---------------------------------- */

export interface MessageInputSubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

const MessageInputSubmitButton = React.forwardRef<
  HTMLButtonElement,
  MessageInputSubmitButtonProps
>(({ className, children, ...props }, ref) => {
  const { isPending } = useMessageInputContext();
// bg-primary
// text-primary-foreground
  return (
    <button
      ref={ref}
      type="submit"
      disabled={isPending}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-900 to-blue-900 border border-gray-500 text-primary-foreground hover:bg-primary/90 disabled:opacity-50",
        className,
      )}
      aria-label="Send message"
      {...props}
    >
      {children ??
        (isPending ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
        ) : (
          <ArrowUp className="h-5 w-5" />
        ))}
    </button>
  );
});
MessageInputSubmitButton.displayName = "MessageInput.SubmitButton";

/* ---------------------------------- */
/* Toolbar */
/* ---------------------------------- */

const MessageInputToolbar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("mt-2 flex justify-end p-1", className)}
    {...props}
  >
    {children}
  </div>
));
MessageInputToolbar.displayName = "MessageInput.Toolbar";

/* ---------------------------------- */
/* Error */
/* ---------------------------------- */

const MessageInputError = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { error, submitError } = useMessageInputContext();

  if (!error && !submitError) return null;

  return (
    <p
      ref={ref}
      className={cn("mt-2 text-sm text-destructive", className)}
      {...props}
    >
      {error?.message ?? submitError}
    </p>
  );
});
MessageInputError.displayName = "MessageInput.Error";

/* ---------------------------------- */
/* Exports */
/* ---------------------------------- */

export {
  MessageInput,
  MessageInputTextarea,
  MessageInputSubmitButton,
  MessageInputToolbar,
  MessageInputError,
};
