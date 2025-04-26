
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileInput, Camera } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FileUploadButtonProps {
  onFileSelect: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  icon?: 'file-input' | 'camera';
  tooltip?: string;
}

const FileUploadButton: React.FC<FileUploadButtonProps> = ({
  onFileSelect,
  accept = '.pdf,.doc,.docx,.xls,.xlsx,image/*',
  multiple = true,
  icon = 'file-input',
  tooltip = 'Upload files'
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

  const renderIcon = () => {
    switch(icon) {
      case 'file-input': return <FileInput size={18} />;
      case 'camera': return <Camera size={18} />;
      default: return <FileInput size={18} />;
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
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
              className="h-9 w-9"
            >
              {renderIcon()}
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default FileUploadButton;
