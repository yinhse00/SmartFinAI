
import { useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { uploadFilesToSupabase } from '@/utils/referenceUploadUtils';
import { FileWithError } from './useFileSelection';

export function useReferenceUpload(files: FileWithError[], category: string, description: string, validateFiles: () => boolean, onSuccess?: () => void) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = useCallback(async () => {
    setUploadError(null);

    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!category) {
      toast({
        title: "Category required",
        description: "Please select a category for the documents.",
        variant: "destructive",
      });
      return;
    }

    if (!validateFiles()) {
      toast({
        title: "Invalid files",
        description: "Please remove invalid files before uploading.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const result = await uploadFilesToSupabase(files, category, description);

      if (result.success) {
        toast({
          title: "Upload successful",
          description: result.message,
        });
        if (onSuccess) onSuccess();
      } else {
        setUploadError(result.message);
        toast({
          title: "Upload failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setUploadError(errorMessage);
      toast({
        title: "Upload error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [files, category, description, validateFiles, onSuccess]);

  return {
    isUploading,
    uploadError,
    setUploadError,
    handleUpload,
  };
}
