
import { toast } from '@/components/ui/use-toast';

interface FileValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
}

export const useFileUpload = (options: FileValidationOptions = {}) => {
  const {
    maxSize = 20 * 1024 * 1024, // 20MB default
    allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif'
    ]
  } = options;

  const validateFiles = (files: FileList): boolean => {
    const invalidFiles = Array.from(files).filter(
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

    const oversizedFiles = Array.from(files).filter(
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

  return { validateFiles };
};
