
import React from 'react';
import DocumentUploadButton from './DocumentUploadButton';

interface UploadButtonsProps {
  onFileSelect: (files: FileList) => void;
}

const UploadButtons: React.FC<UploadButtonsProps> = ({ onFileSelect }) => {
  return (
    <div className="flex items-center gap-2">
      <DocumentUploadButton 
        onFileSelect={onFileSelect}
        type="document"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
      />
      <DocumentUploadButton 
        onFileSelect={onFileSelect}
        type="image"
        accept="image/*"
      />
    </div>
  );
};

export default UploadButtons;
