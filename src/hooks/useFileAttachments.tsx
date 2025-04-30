
import { useState } from 'react';

/**
 * Hook to manage file attachments for chat
 */
export const useFileAttachments = () => {
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  /**
   * Handle file selection
   */
  const handleFileSelect = (files: FileList) => {
    if (!files.length) return;
    
    // Convert FileList to array and append to existing files
    const newFiles = Array.from(files);
    setAttachedFiles(prevFiles => [...prevFiles, ...newFiles]);
  };

  /**
   * Clear all attached files
   */
  const clearAttachedFiles = () => {
    setAttachedFiles([]);
  };

  /**
   * Remove a specific file by index
   */
  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  /**
   * Check if there are any attached files
   */
  const hasAttachedFiles = attachedFiles.length > 0;

  return {
    attachedFiles,
    handleFileSelect,
    clearAttachedFiles,
    removeAttachedFile,
    hasAttachedFiles
  };
};
