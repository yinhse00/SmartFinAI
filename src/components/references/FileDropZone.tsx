
import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Upload, Loader2 } from 'lucide-react';

interface FileDropZoneProps {
  onFilesAdded: (files: FileList | File[]) => void;
  isUploading?: boolean;
  allowedExtensions?: string[];
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ 
  onFilesAdded, 
  isUploading = false, 
  allowedExtensions = ['pdf', 'docx', 'txt', 'xlsx', 'xls'] 
}) => {
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
        const files = e.dataTransfer.files;
        onFilesAdded(files);
      } catch (error) {
        console.error('Error handling file drop:', error);
      }
    }
  }, [isUploading, onFilesAdded]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(e.target.files);
    }
  }, [onFilesAdded]);

  const handleClick = useCallback(() => {
    if (!isUploading) {
      document.getElementById('file-upload')?.click();
    }
  }, [isUploading]);

  const acceptString = allowedExtensions.map(ext => `.${ext}`).join(',');

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
        Supports PDF, DOCX, TXT, XLSX, XLS (max 20MB per file)
      </p>
      <Input
        id="file-upload"
        type="file"
        className="hidden"
        multiple
        onChange={handleInputChange}
        accept={acceptString}
        disabled={isUploading}
      />
    </div>
  );
};

export default FileDropZone;
