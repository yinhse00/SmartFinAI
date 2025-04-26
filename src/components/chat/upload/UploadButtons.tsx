
import React from 'react';
import FileUploadButton from './FileUploadButton';

interface UploadButtonsProps {
  onFileSelect: (files: FileList) => void;
}

const UploadButtons: React.FC<UploadButtonsProps> = ({ onFileSelect }) => {
  return (
    <div className="flex gap-2">
      <FileUploadButton 
        onFileSelect={onFileSelect}
        icon="upload"
      />
      <FileUploadButton 
        onFileSelect={onFileSelect}
        accept="image/*"
        icon="camera"
        multiple={false}
      />
    </div>
  );
};

export default UploadButtons;
