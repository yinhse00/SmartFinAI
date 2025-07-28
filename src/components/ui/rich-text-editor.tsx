import React from 'react';
import { Editor } from '@tinymce/tinymce-react';
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
  return (
    <div ref={ref} className={cn("rich-text-editor", className)}>
      <Editor
        value={value}
        onEditorChange={onChange}
        disabled={disabled}
        init={{
          height: height,
          menubar: false,
          plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
            'paste', 'directionality'
          ],
          toolbar: 'undo redo | blocks | ' +
            'bold italic forecolor backcolor | alignleft aligncenter ' +
            'alignright alignjustify | bullist numlist outdent indent | ' +
            'removeformat | table | help',
          content_style: `
            body { 
              font-family: 'Times New Roman', serif; 
              font-size: 12pt; 
              line-height: 1.6; 
              margin: 1in;
              color: #000;
              background: #fff;
            }
            h1 { 
              font-size: 18pt; 
              font-weight: bold; 
              margin: 24pt 0 12pt 0;
              page-break-after: avoid;
            }
            h2 { 
              font-size: 16pt; 
              font-weight: bold; 
              margin: 18pt 0 6pt 0;
              page-break-after: avoid;
            }
            h3 { 
              font-size: 14pt; 
              font-weight: bold; 
              margin: 12pt 0 6pt 0;
              page-break-after: avoid;
            }
            p { 
              margin: 6pt 0; 
              text-align: justify;
            }
            table { 
              border-collapse: collapse; 
              width: 100%; 
              margin: 12pt 0;
            }
            table, th, td { 
              border: 1px solid #000; 
            }
            th, td { 
              padding: 6pt; 
              text-align: left;
            }
            th { 
              background-color: #f0f0f0; 
              font-weight: bold;
            }
            ul, ol { 
              margin: 6pt 0; 
              padding-left: 24pt;
            }
            li { 
              margin: 3pt 0;
            }
          `,
          placeholder: placeholder,
          paste_as_text: false,
          paste_retain_style_properties: "font-family font-size font-weight font-style text-decoration text-align",
          table_default_attributes: {
            border: '1'
          },
          table_default_styles: {
            'border-collapse': 'collapse'
          },
          formats: {
            h1: { block: 'h1', styles: { fontSize: '18pt', fontWeight: 'bold' } },
            h2: { block: 'h2', styles: { fontSize: '16pt', fontWeight: 'bold' } },
            h3: { block: 'h3', styles: { fontSize: '14pt', fontWeight: 'bold' } },
          },
          style_formats: [
            { title: 'Headings', items: [
              { title: 'Heading 1', format: 'h1' },
              { title: 'Heading 2', format: 'h2' },
              { title: 'Heading 3', format: 'h3' },
            ]},
            { title: 'Inline', items: [
              { title: 'Bold', format: 'bold' },
              { title: 'Italic', format: 'italic' },
            ]},
            { title: 'Blocks', items: [
              { title: 'Paragraph', format: 'p' },
            ]},
          ],
          block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3',
        }}
      />
    </div>
  );
});

RichTextEditor.displayName = "RichTextEditor";