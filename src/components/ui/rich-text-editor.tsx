import React, { useMemo } from 'react';
import JoditEditor from 'jodit-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: number;
  disabled?: boolean;
}

export const RichTextEditor = React.forwardRef<
  HTMLDivElement,
  RichTextEditorProps
>(({ value, onChange, placeholder, className, height = 400, disabled = false }, ref) => {
  const config = useMemo(() => ({
    readonly: disabled,
    placeholder: placeholder || 'Start typing...',
    height: height,
    showCharsCounter: false,
    showWordsCounter: false,
    showXPathInStatusbar: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    beautyHTML: true,
    
    // Toolbar configuration for IPO documents
    buttons: [
      'source', '|',
      'bold', 'italic', 'underline', '|',
      'ul', 'ol', '|',
      'outdent', 'indent', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'left', 'center', 'right', 'justify', '|',
      'table', 'link', '|',
      'undo', 'redo', '|',
      'hr', 'eraser', 'fullsize'
    ],
    
    // Custom CSS for Word-compatible styling
    iframeStyle: `
      body { 
        font-family: 'Times New Roman', serif !important; 
        font-size: 12pt !important; 
        line-height: 1.6 !important; 
        margin: 1in !important;
        color: #000 !important;
        background: #fff !important;
      }
      h1 { 
        font-size: 18pt !important; 
        font-weight: bold !important; 
        margin: 24pt 0 12pt 0 !important;
        page-break-after: avoid !important;
      }
      h2 { 
        font-size: 16pt !important; 
        font-weight: bold !important; 
        margin: 18pt 0 6pt 0 !important;
        page-break-after: avoid !important;
      }
      h3 { 
        font-size: 14pt !important; 
        font-weight: bold !important; 
        margin: 12pt 0 6pt 0 !important;
        page-break-after: avoid !important;
      }
      p { 
        margin: 6pt 0 !important; 
        text-align: justify !important;
      }
      table { 
        border-collapse: collapse !important; 
        width: 100% !important; 
        margin: 12pt 0 !important;
      }
      table, th, td { 
        border: 1px solid #000 !important; 
      }
      th, td { 
        padding: 6pt !important; 
        text-align: left !important;
      }
      th { 
        background-color: #f0f0f0 !important; 
        font-weight: bold !important;
      }
      ul, ol { 
        margin: 6pt 0 !important; 
        padding-left: 24pt !important;
      }
      li { 
        margin: 3pt 0 !important;
      }
    `
  }), [disabled, placeholder, height]);

  return (
    <div ref={ref} className={cn("rich-text-editor", className)}>
      <JoditEditor
        value={value}
        config={config}
        onBlur={onChange}
        onChange={() => {}} // We use onBlur for better performance
      />
    </div>
  );
});

RichTextEditor.displayName = "RichTextEditor";