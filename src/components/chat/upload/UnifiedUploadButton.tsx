
import React from 'react';
import { Plus, Camera, Image, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';

interface UnifiedUploadButtonProps {
  onFileSelect: (files: FileList) => void;
  isProcessing?: boolean;
}

const UnifiedUploadButton: React.FC<UnifiedUploadButtonProps> = ({
  onFileSelect,
  isProcessing = false
}) => {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const documentInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFileSelect(files);
      // Reset the input value so the same file can be selected again
      event.target.value = '';
    }
  };

  const handleOptionClick = (inputRef: React.RefObject<HTMLInputElement>) => {
    if (!isProcessing && inputRef.current) {
      inputRef.current.click();
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start" side="top">
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost" 
            className="justify-start" 
            onClick={() => handleOptionClick(cameraInputRef)}
            disabled={isProcessing}
          >
            <Camera className="mr-2" size={16} />
            Images from Camera
          </Button>
          <Button
            variant="ghost" 
            className="justify-start" 
            onClick={() => handleOptionClick(fileInputRef)}
            disabled={isProcessing}
          >
            <Image className="mr-2" size={16} />
            Images from Device
          </Button>
          <Button
            variant="ghost" 
            className="justify-start" 
            onClick={() => handleOptionClick(documentInputRef)}
            disabled={isProcessing}
          >
            <FileText className="mr-2" size={16} />
            Documents
          </Button>
        </div>
      </PopoverContent>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        accept="image/*"
        capture="environment"
      />
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        accept="image/*"
        multiple
      />
      <input
        type="file"
        ref={documentInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        multiple
      />
    </Popover>
  );
};

export default UnifiedUploadButton;
