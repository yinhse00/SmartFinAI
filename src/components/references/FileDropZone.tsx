
import React from 'react';
import { Input } from '@/components/ui/input';
import { Upload } from 'lucide-react';

interface FileDropZoneProps {
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({ onFileChange }) => {
  return (
    <div 
      className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-finance-dark-blue/30 hover:bg-gray-100 dark:hover:bg-finance-dark-blue/40 transition-colors cursor-pointer"
      onClick={() => document.getElementById('file-upload')?.click()}
    >
      <Upload className="h-10 w-10 text-gray-400 mb-2" />
      <p className="text-sm text-center text-gray-600 dark:text-gray-400">
        Drag and drop your files here, or <span className="text-finance-light-blue dark:text-finance-accent-blue">browse</span>
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
      />
    </div>
  );
};

export default FileDropZone;
