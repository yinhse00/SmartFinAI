
import React from 'react';
import { Button } from '@/components/ui/button';
import { File, X } from 'lucide-react';

interface FileListProps {
  files: File[];
  onRemoveFile: (index: number) => void;
}

const FileList: React.FC<FileListProps> = ({ files, onRemoveFile }) => {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Selected Files</h4>
      <div className="border rounded-md divide-y">
        {files.map((file, index) => (
          <div key={index} className="flex items-center justify-between p-3">
            <div className="flex items-center space-x-2">
              <File className="h-5 w-5 text-finance-medium-blue dark:text-finance-accent-blue" />
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
