
import { useState, useCallback } from 'react';

export interface FileWithError extends File {
  error?: string;
}

export const allowedExtensions = ['pdf', 'docx', 'txt', 'xlsx', 'xls'];

export function useFileSelection() {
  const [files, setFiles] = useState<FileWithError[]>([]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files) as FileWithError[];

      const validatedFiles = newFiles.map(file => {
        const fileExt = file.name.split('.').pop()?.toLowerCase();

        if (!allowedExtensions.includes(fileExt || '')) {
          return { ...file, error: 'Invalid file type. PDF, DOCX, TXT, XLSX, XLS' };
        }

        if (file.size > 20971520) {
          return { ...file, error: 'File exceeds 20MB limit' };
        }

        return file;
      });

      setFiles(prev => [...prev, ...validatedFiles]);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const validateFiles = useCallback(() => {
    const invalidFiles = files.filter(file => {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      return !allowedExtensions.includes(fileExt || '') || file.size > 20971520;
    });
    return invalidFiles.length === 0;
  }, [files]);

  return {
    files,
    setFiles,
    handleFileChange,
    removeFile,
    validateFiles,
  };
}
