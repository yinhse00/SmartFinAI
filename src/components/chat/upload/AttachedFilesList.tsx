
import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFileTypeFromName, getFileIcon } from '@/utils/fileContentFormatter';

interface AttachedFilesListProps {
  files: File[];
  onRemove: (index: number) => void;
}

const AttachedFilesList: React.FC<AttachedFilesListProps> = ({ files, onRemove }) => {
  if (files.length === 0) return null;

  return (
    <div className="px-4 pb-2">
      <div className="flex flex-wrap gap-2 items-center">
        {files.map((file, index) => {
          const fileType = getFileTypeFromName(file.name);
          const icon = getFileIcon(fileType);
          
          return (
            <div 
              key={`${file.name}-${index}`}
              className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-sm"
            >
              <span className="mr-1">{icon}</span>
              <span className="truncate max-w-[100px]">{file.name}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 rounded-full" 
                onClick={() => onRemove(index)}
              >
                <X size={12} />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AttachedFilesList;
