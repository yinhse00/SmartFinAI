
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Camera } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';

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
  const { validateFiles } = useFileUpload();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      if (validateFiles(files)) {
        onFileSelect(files);
      }
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
