
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Camera } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface FileUploadButtonProps {
  onFileSelect: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  icon?: 'upload' | 'camera';
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFileSelect,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,image/*',
  multiple = true,
  icon = 'upload'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // Validate file types
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif'
      ];

      const invalidFiles = Array.from(files).filter(
        file => !allowedTypes.includes(file.type)
      );

      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid file type",
          description: "Please upload only PDF, Word, Excel documents or images.",
          variant: "destructive"
        });
        return;
      }

      // Check file sizes (max 20MB per file)
      const maxSize = 20 * 1024 * 1024; // 20MB in bytes
      const oversizedFiles = Array.from(files).filter(
        file => file.size > maxSize
      );

      if (oversizedFiles.length > 0) {
        toast({
          title: "File too large",
          description: "Each file must be less than 20MB",
          variant: "destructive"
        });
        return;
      }

      onFileSelect(files);
      
      // Reset input value to allow selecting the same file again
      event.target.value = '';
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        multiple={multiple}
        className="hidden"
      />
      <Button
        variant="outline"
        size="icon"
        onClick={handleClick}
        className="h-10 w-10"
      >
        {icon === 'upload' ? <Upload size={18} /> : <Camera size={18} />}
      </Button>
    </>
  );
};

export default FileUploadButton;
