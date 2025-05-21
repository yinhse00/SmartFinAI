
import { useState, useCallback } from 'react';

export interface FileWithError extends File {
  error?: string;
}

export const allowedExtensions = ['pdf', 'docx', 'txt', 'xlsx', 'xls'];

export function useFileSelection() {
  const [selectedFiles, setSelectedFiles] = useState<FileWithError[]>([]);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const filesToAdd = Array.from(newFiles).map(file => {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      
      if (!allowedExtensions.includes(fileExt || '')) {
        return { ...file, error: 'Invalid file type' };
      }
      
      if (file.size > 20971520) { // 20MB
        return { ...file, error: 'File exceeds 20MB limit' };
      }
      
      return file as FileWithError;
    });

    setSelectedFiles(prev => [...prev, ...filesToAdd]);
  }, []);

  const removeFile = useCallback((fileName: string) => {
    setSelectedFiles(prev => prev.filter(file => file.name !== fileName));
  }, []);

  const clearFiles = useCallback(() => {
    setSelectedFiles([]);
  }, []);

  return {
    selectedFiles,
    addFiles,
    removeFile,
    clearFiles,
  };
}
