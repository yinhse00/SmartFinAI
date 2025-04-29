
import React from 'react';
import DocumentUploadButton from './DocumentUploadButton';

interface UploadButtonsProps {
  onFileSelect: (files: FileList) => void;
  isProcessing?: boolean;
}

const UploadButtons: React.FC<UploadButtonsProps> = ({ onFileSelect, isProcessing = false }) => {
  return (
    <div className="flex items-center gap-2">
      <DocumentUploadButton 
        onFileSelect={onFileSelect}
        type="document"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
        isProcessing={isProcessing}
      />
      <DocumentUploadButton 
        onFileSelect={onFileSelect}
        type="image"
        accept="image/*"
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default UploadButtons;
