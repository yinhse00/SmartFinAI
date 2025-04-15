
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, FileType, X } from 'lucide-react';

interface FileListProps {
  files: File[];
  onRemoveFile: (index: number) => void;
  disabled?: boolean;
}

const FileList: React.FC<FileListProps> = ({ files, onRemoveFile, disabled = false }) => {
  if (files.length === 0) {
    return null;
  }
  
  // Helper function to determine file icon based on file extension
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'docx':
      case 'doc':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'txt':
        return <FileText className="h-5 w-5 text-gray-500" />;
      default:
        return <FileType className="h-5 w-5 text-finance-medium-blue dark:text-finance-accent-blue" />;
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Selected Files</h4>
      <div className="border rounded-md divide-y">
        {files.map((file, index) => (
          <div key={index} className="flex items-center justify-between p-3">
            <div className="flex items-center space-x-2">
              {getFileIcon(file.name)}
              <div>
                <p className="text-sm font-medium truncate max-w-[200px] sm:max-w-[300px]">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFile(index);
              }}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;
