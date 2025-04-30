
import React, { useRef } from 'react';
import { PaperclipIcon, Loader2, AlertTriangle, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UnifiedUploadButtonProps {
  onFileSelect: (files: FileList) => void;
  isProcessing?: boolean;
  isOfflineMode?: boolean; // New prop to indicate offline mode
}

const UnifiedUploadButton: React.FC<UnifiedUploadButtonProps> = ({ 
  onFileSelect, 
  isProcessing = false,
  isOfflineMode = false 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files);
      // Reset the input so the same file can be selected again
      e.target.value = '';
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={handleButtonClick}
            disabled={isProcessing}
            className={isOfflineMode ? "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20" : ""}
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isOfflineMode ? (
              <div className="relative">
                <PaperclipIcon className="h-4 w-4" />
                <WifiOff className="h-3 w-3 absolute -top-1 -right-1 text-amber-500" />
              </div>
            ) : (
              <PaperclipIcon className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {isOfflineMode ? (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-500" />
              <span>Attach files (Limited processing in offline mode)</span>
            </div>
          ) : (
            <span>Attach files</span>
          )}
        </TooltipContent>
      </Tooltip>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        multiple
        accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.png,.jpg,.jpeg"
      />
    </TooltipProvider>
  );
};

export default UnifiedUploadButton;
