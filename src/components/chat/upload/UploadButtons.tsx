
import React from 'react';
import FileUploadButton from './FileUploadButton';
import { FileInput } from 'lucide-react';

interface UploadButtonsProps {
  onFileSelect: (files: FileList) => void;
}

const UploadButtons: React.FC<UploadButtonsProps> = ({ onFileSelect }) => {
  return (
    <div className="flex items-center gap-2">
      <FileUploadButton 
        onFileSelect={onFileSelect}
        icon="file-input"
        tooltip="Upload documents (PDF, Word, Excel) or images"
        multiple={true}
      />
    </div>
  );
};

export default UploadButtons;
