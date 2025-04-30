
import * as React from "react"
import { useEffect, useRef } from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, onChange, ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement | null>(null);
    
    // Auto-resize function
    const autoResize = (element: HTMLTextAreaElement) => {
      element.style.height = 'auto';
      const newHeight = Math.min(element.scrollHeight, 80); // Max height of 80px (about 3 lines)
      element.style.height = `${newHeight}px`;
    };
    
    // Combine refs
    const handleRef = (element: HTMLTextAreaElement | null) => {
      textareaRef.current = element;
      
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    };
    
    // Handle onChange with auto-resize
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (onChange) {
        onChange(e);
      }
      
      if (textareaRef.current) {
        autoResize(textareaRef.current);
      }
    };
    
    // Initial resize when content changes
    useEffect(() => {
      if (textareaRef.current) {
        autoResize(textareaRef.current);
      }
    }, [props.value]);
    
    return (
      <textarea
        className={cn(
          "flex min-h-[40px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={handleRef}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
