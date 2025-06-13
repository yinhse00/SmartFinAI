
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';

interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
}

export const useFileUpload = (options: FileValidationOptions = {}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const {
    maxSize = 20 * 1024 * 1024, // 20MB default
    allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
      'image/jpeg',
      'image/png',
      'image/gif'
    ]
  } = options;

  const validateFiles = (fileList: FileList): boolean => {
    // Validate file types
    const invalidFiles = Array.from(fileList).filter(
      file => !allowedTypes.includes(file.type)
    );

    if (invalidFiles.length > 0) {
      toast({
        title: "Invalid file type",
        description: "Please upload only PDF, Word, Excel documents or images.",
        variant: "destructive"
      });
      return false;
    }

    // Check file sizes
    const oversizedFiles = Array.from(fileList).filter(
      file => file.size > maxSize
    );

    if (oversizedFiles.length > 0) {
      toast({
        title: "File too large",
        description: "Each file must be less than 20MB",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const uploadFile = async (file: File): Promise<void> => {
    if (!validateFiles(new DataTransfer().files)) {
      const dt = new DataTransfer();
      dt.items.add(file);
      if (!validateFiles(dt.files)) return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setFiles(prev => [...prev, file]);
      
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been uploaded.`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (index: number): void => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "File removed",
      description: "File has been removed from upload list.",
    });
  };

  return {
    files,
    uploadFile,
    removeFile,
    isUploading,
    uploadProgress,
    validateFiles
  };
};
