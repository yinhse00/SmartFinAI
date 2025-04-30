
import { useState } from 'react';
import { Textarea } from "@/components/ui/textarea";

interface TranslationInputProps {
  content: string;
  setContent: (value: string) => void;
}

const TranslationInput = ({ content, setContent }: TranslationInputProps) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const handleDragEnter = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && typeof event.target.result === 'string') {
            setContent(event.target.result);
          }
        };
        reader.readAsText(file);
      } else {
        // Toast will be handled in the parent component
      }
    } else if (e.dataTransfer.getData('text')) {
      setContent(e.dataTransfer.getData('text'));
    }
  };

  return (
    <Textarea 
      placeholder="Enter text to translate or drop a text file..."
      value={content}
      onChange={(e) => setContent(e.target.value)}
      className={`resize-none ${isDragging ? 'border-finance-medium-blue bg-gray-50 dark:bg-finance-dark-blue/20' : ''}`}
      rows={2}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    />
  );
};

export default TranslationInput;
