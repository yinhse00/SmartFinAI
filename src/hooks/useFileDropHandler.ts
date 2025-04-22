
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface UseFileDropHandlerParams {
  onContentChange: (content: string) => void;
}

export const useFileDropHandler = ({ onContentChange }: UseFileDropHandlerParams) => {
  const [isDragging, setIsDragging] = useState(false);

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
            onContentChange(event.target.result);
          }
        };
        reader.readAsText(file);
      } else {
        toast({
          title: "Unsupported file type",
          description: "Only text files (.txt) can be dropped here. For other document types, please use the full Translator page.",
          variant: "destructive",
        });
      }
    } else if (e.dataTransfer.getData('text')) {
      onContentChange(e.dataTransfer.getData('text'));
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  return {
    isDragging,
    handleDrop,
    handleDragEnter,
    handleDragOver,
    handleDragLeave
  };
};
