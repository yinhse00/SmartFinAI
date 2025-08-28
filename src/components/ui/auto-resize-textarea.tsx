import * as React from "react";
import { cn } from "@/lib/utils";

interface AutoResizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
}

const AutoResizeTextarea = React.forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ className, minRows = 1, maxRows = 5, onChange, ...props }, ref) => {
    const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const [textareaLineHeight, setTextareaLineHeight] = React.useState(20); // Default line height

    // Combine refs
    const handleRef = (textarea: HTMLTextAreaElement | null) => {
      textareaRef.current = textarea;
      if (typeof ref === 'function') {
        ref(textarea);
      } else if (ref) {
        ref.current = textarea;
      }
    };

    // Calculate line height on mount
    React.useEffect(() => {
      if (textareaRef.current) {
        // Create a single-line element to measure
        const style = window.getComputedStyle(textareaRef.current);
        const lineHeight = parseInt(style.lineHeight, 10) || 20;
        setTextareaLineHeight(lineHeight);
      }
    }, []);

    // Auto-resize function
    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate the height based on content
      const minHeight = minRows * textareaLineHeight;
      const maxHeight = maxRows * textareaLineHeight;
      const scrollHeight = textarea.scrollHeight;
      
      // Set the new height within constraints
      textarea.style.height = `${Math.min(Math.max(minHeight, scrollHeight), maxHeight)}px`;
      
      // Show/hide scrollbar based on content height
      textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }, [minRows, maxRows, textareaLineHeight]);

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) {
        onChange(e);
      }
      adjustHeight();
    };

    // Adjust height on mount and when content changes
    React.useEffect(() => {
      adjustHeight();
    }, [props.value, adjustHeight]);

    return (
      <textarea
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm resize-none overflow-hidden",
          className
        )}
        ref={handleRef}
        onChange={handleChange}
        rows={minRows}
        {...props}
      />
    );
  }
);

AutoResizeTextarea.displayName = "AutoResizeTextarea";

export { AutoResizeTextarea };