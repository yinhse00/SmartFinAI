import React, { useMemo } from 'react';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { cn } from '@/lib/utils';
import { TextSelection } from '@/types/textSelection';

interface WordLikeEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSelectionChange?: (selection: TextSelection | null) => void;
  showTrackChanges?: boolean;
  zoom?: number;
  viewMode?: 'print' | 'web' | 'outline';
  sectionType?: string;
  className?: string;
}

export const WordLikeEditor: React.FC<WordLikeEditorProps> = ({
  content,
  onChange,
  onSelectionChange,
  showTrackChanges = false,
  zoom = 100,
  viewMode = 'print',
  sectionType,
  className
}) => {
  const editorConfig = useMemo(() => ({
    readonly: false,
    placeholder: 'Start typing your document...',
    height: '100%',
    showCharsCounter: true,
    showWordsCounter: true,
    showXPathInStatusbar: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    beautyHTML: true,
    
    // Enhanced toolbar for Word-like experience
    buttons: [
      'source', '|',
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'superscript', 'subscript', '|',
      'ul', 'ol', '|',
      'outdent', 'indent', '|',
      'font', 'fontsize', 'brush', 'paragraph', '|',
      'left', 'center', 'right', 'justify', '|',
      'table', 'link', 'image', '|',
      'undo', 'redo', '|',
      'find', 'replace', '|',
      'hr', 'eraser', 'fullsize', '|',
      'print', 'preview'
    ],
    
    // Word-compatible styling with enhanced features
    iframeStyle: `
      body { 
        font-family: 'Times New Roman', serif !important; 
        font-size: 12pt !important; 
        line-height: 1.6 !important; 
        margin: ${viewMode === 'print' ? '1in' : '20px'} !important;
        color: #000 !important;
        background: #fff !important;
        ${viewMode === 'print' ? `
          max-width: 8.5in !important;
          min-height: 11in !important;
          box-shadow: 0 0 10px rgba(0,0,0,0.1) !important;
          margin: 20px auto !important;
          padding: 1in !important;
        ` : ''}
        zoom: ${zoom}% !important;
      }
      
      /* Track changes styling */
      ${showTrackChanges ? `
        .track-insert { 
          background-color: #e6ffed !important; 
          text-decoration: underline !important;
          color: #28a745 !important;
        }
        .track-delete { 
          background-color: #ffebee !important; 
          text-decoration: line-through !important;
          color: #dc3545 !important;
        }
        .track-comment {
          background-color: #fff3cd !important;
          border-left: 3px solid #ffc107 !important;
          padding-left: 8px !important;
        }
      ` : ''}
      
      /* Enhanced typography */
      h1 { 
        font-size: 18pt !important; 
        font-weight: bold !important; 
        margin: 24pt 0 12pt 0 !important;
        page-break-after: avoid !important;
        border-bottom: 2px solid #000 !important;
        padding-bottom: 6pt !important;
      }
      h2 { 
        font-size: 16pt !important; 
        font-weight: bold !important; 
        margin: 18pt 0 6pt 0 !important;
        page-break-after: avoid !important;
        border-bottom: 1px solid #666 !important;
        padding-bottom: 3pt !important;
      }
      h3 { 
        font-size: 14pt !important; 
        font-weight: bold !important; 
        margin: 12pt 0 6pt 0 !important;
        page-break-after: avoid !important;
      }
      
      /* Paragraph styling */
      p { 
        margin: 6pt 0 !important; 
        text-align: justify !important;
        text-indent: 0.5in !important;
      }
      p.no-indent {
        text-indent: 0 !important;
      }
      
      /* Table styling */
      table { 
        border-collapse: collapse !important; 
        width: 100% !important; 
        margin: 12pt 0 !important;
        font-size: 11pt !important;
      }
      table, th, td { 
        border: 1px solid #000 !important; 
      }
      th, td { 
        padding: 6pt !important; 
        text-align: left !important;
        vertical-align: top !important;
      }
      th { 
        background-color: #f8f9fa !important; 
        font-weight: bold !important;
      }
      
      /* List styling */
      ul, ol { 
        margin: 6pt 0 !important; 
        padding-left: 24pt !important;
      }
      li { 
        margin: 3pt 0 !important;
        line-height: 1.4 !important;
      }
      
      /* Page break styling */
      .page-break {
        page-break-before: always !important;
        border-top: 1px dashed #ccc !important;
        margin-top: 20pt !important;
        padding-top: 20pt !important;
      }
      
      /* Print-specific styles */
      @media print {
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: white !important;
          box-shadow: none !important;
        }
        .page-break {
          border-top: none !important;
          margin-top: 0 !important;
          padding-top: 0 !important;
        }
      }
      
      /* Comments and annotations */
      .comment-highlight {
        background-color: #fff3cd !important;
        border-left: 3px solid #ffc107 !important;
        padding-left: 8px !important;
        position: relative !important;
      }
      
      .comment-highlight::after {
        content: "💬" !important;
        position: absolute !important;
        right: -20px !important;
        top: 0 !important;
        color: #ffc107 !important;
        font-size: 14px !important;
      }
    `,
    
    // Custom plugins and configurations
    extraPlugins: ['table', 'image', 'link', 'print'],
    
    // Word-like keyboard shortcuts
    commandToHotkeys: {
      'bold': 'ctrl+b',
      'italic': 'ctrl+i',
      'underline': 'ctrl+u',
      'undo': 'ctrl+z',
      'redo': 'ctrl+y',
      'selectall': 'ctrl+a',
      'find': 'ctrl+f',
      'replace': 'ctrl+h',
      'save': 'ctrl+s',
      'print': 'ctrl+p'
    }
  }), [showTrackChanges, zoom, viewMode]);

  return (
    <div className={cn(
      "h-full w-full bg-gray-50",
      viewMode === 'print' && "bg-gray-200 p-4",
      className
    )}>
      <div className={cn(
        "h-full w-full",
        viewMode === 'print' && "bg-white shadow-lg rounded-lg overflow-hidden"
      )}>
        <RichTextEditor
          value={content}
          onChange={onChange}
          onSelectionChange={onSelectionChange}
          height={viewMode === 'print' ? 600 : undefined}
          className="h-full w-full"
          placeholder={editorConfig.placeholder}
        />
      </div>
    </div>
  );
};