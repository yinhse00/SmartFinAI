
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useFileUpload } from './useFileUpload';

export const useFileAttachments = () => {
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const { validateFiles } = useFileUpload();
  const { toast } = useToast();

  const handleFileSelect = (files: FileList) => {
    if (!validateFiles(files)) return;
    
    const newFiles = Array.from(files);
    setAttachedFiles(prev => [...prev, ...newFiles]);
    
    // Show toast notification
    const fileCount = newFiles.length;
    const fileText = fileCount === 1 ? 'file' : 'files';
    
    toast({
      title: "Files attached",
      description: `${fileCount} ${fileText} ready to be processed when you send your message.`,
    });
  };

  const clearAttachedFiles = () => {
    setAttachedFiles([]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  return {
    attachedFiles,
    handleFileSelect,
    clearAttachedFiles,
    removeAttachedFile,
    hasAttachedFiles: attachedFiles.length > 0
  };
};
