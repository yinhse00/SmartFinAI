
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Image, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DocumentUploadButtonProps {
  onFileSelect: (files: FileList) => void;
  type: 'document' | 'image';
  accept: string;
  isProcessing?: boolean;
}

const DocumentUploadButton: React.FC<DocumentUploadButtonProps> = ({
  onFileSelect,
  type,
  accept,
  isProcessing = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileSelect(files);
      // Reset the input value so the same file can be selected again
      event.target.value = '';
    }
  };

  const getIcon = () => {
    if (isProcessing) {
      return <Loader2 size={18} className="animate-spin" />;
    }
    return type === 'document' ? <FileText size={18} /> : <Image size={18} />;
  };

  const getTooltipText = () => {
    if (isProcessing) {
      return 'Processing files...';
    }
    return type === 'document' ? 'Upload documents (PDF, Word, Excel)' : 'Upload images';
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
              className="hidden"
              multiple={true}
              disabled={isProcessing}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleClick}
              className="h-9 w-9"
              disabled={isProcessing}
            >
              {getIcon()}
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DocumentUploadButton;
