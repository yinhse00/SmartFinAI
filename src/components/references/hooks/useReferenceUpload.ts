
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DocumentCategory } from '@/types/references';
import { FileWithError } from './useFileSelection';

interface UploadOptions {
  files: FileWithError[];
  category: DocumentCategory;
  description: string;
}

interface UseReferenceUploadOptions {
  onComplete?: () => void;
}

export const useReferenceUpload = (options: UseReferenceUploadOptions = {}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const uploadFiles = async ({ files, category, description }: UploadOptions) => {
    setIsUploading(true);
    setUploadError('');
    
    try {
      if (files.length === 0) {
        throw new Error('No files selected');
      }
      
      // Process each file
      for (const file of files) {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const fileType = file.type || `application/${fileExt}`;
        
        // Create temporary URL for file preview
        const fileUrl = URL.createObjectURL(file);
        
        // Insert reference document record
        const { error } = await supabase
          .from('reference_documents')
          .insert({
            title: file.name,
            description,
            category,
            file_path: file.name,
            file_url: fileUrl,
            file_type: fileType,
            file_size: file.size
          });
        
        if (error) {
          throw new Error(`Upload error: ${error.message}`);
        }
      }
      
      toast({
        title: "Upload Successful",
        description: `${files.length} document${files.length > 1 ? 's' : ''} uploaded successfully.`,
      });
      
      if (options.onComplete) {
        options.onComplete();
      }
    } catch (error) {
      console.error('Upload error:', error);
      const message = error instanceof Error ? error.message : 'Unknown upload error';
      
      setUploadError(message);
      
      toast({
        title: "Upload Failed",
        description: message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isUploading,
    uploadError,
    setUploadError,
    uploadFiles
  };
};
