
import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Upload, Loader2 } from 'lucide-react';

interface FileDropZoneProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploading?: boolean;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ onFileChange, isUploading = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUploading) return;
    setIsDragging(true);
  }, [isUploading]);
  
  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (isUploading) return;
    if (!isDragging) {
      setIsDragging(true);
    }
  }, [isDragging, isUploading]);
  
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (isUploading) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      try {
        // Create a synthetic event to pass to the onFileChange handler
        const dataTransfer = new DataTransfer();
        
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          dataTransfer.items.add(e.dataTransfer.files[i]);
        }
        
        const inputElement = document.getElementById('file-upload') as HTMLInputElement;
        if (inputElement) {
          // Update the input's files
          inputElement.files = dataTransfer.files;
          
          // Trigger the onChange event
          const event = new Event('change', { bubbles: true });
          inputElement.dispatchEvent(event);
          
          // Also manually call the handler to ensure it works
          onFileChange({ target: { files: dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>);
        }
      } catch (error) {
        console.error('Error handling file drop:', error);
      }
    }
  }, [isUploading, onFileChange]);

  const handleClick = useCallback(() => {
    if (!isUploading) {
      document.getElementById('file-upload')?.click();
    }
  }, [isUploading]);

  return (
    <div 
      className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-finance-dark-blue/30 transition-colors ${
        isUploading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-finance-dark-blue/40'
      } ${
        isDragging ? 'border-finance-medium-blue bg-gray-100 dark:bg-finance-dark-blue/40' : ''
      }`}
      onClick={handleClick}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      aria-label="Upload file dropzone"
    >
      {isUploading ? (
        <Loader2 className="h-10 w-10 text-gray-400 mb-2 animate-spin" />
      ) : (
        <Upload className="h-10 w-10 text-gray-400 mb-2" />
      )}
      
      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        {isUploading ? 'Uploading files...' : (
          <>Drag and drop your files here, or <span className="text-finance-light-blue dark:text-finance-accent-blue">browse</span></>
        )}
      </p>
      <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-1">
        Supports PDF, DOCX, TXT (max 20MB per file)
      </p>
      <Input
        id="file-upload"
        type="file"
        className="hidden"
        multiple
        onChange={onFileChange}
        accept=".pdf,.docx,.txt"
        disabled={isUploading}
      />
    </div>
  );
};

export default FileDropZone;
