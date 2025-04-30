
import { Button } from '@/components/ui/button';
import { Upload, FileUp } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface UploadAreaProps {
  isDragging: boolean;
  uploadedFile: File | null;
  handleDragEnter: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const UploadArea = ({
  isDragging,
  uploadedFile,
  handleDragEnter,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileUpload
}: UploadAreaProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="content">Content to Translate</Label>
        <div className="relative">
          <input
            type="file"
            id="document-upload"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
          />
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Document</span>
          </Button>
        </div>
      </div>
      
      <div 
        className={`border-2 border-dashed rounded-lg p-4 mt-2 transition-colors ${
          isDragging ? 'bg-gray-50 dark:bg-finance-dark-blue/30 border-finance-medium-blue' : ''
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploadedFile ? (
          <div className="text-sm text-gray-500 flex items-center gap-1 py-1">
            <FileUp className="h-3.5 w-3.5" /> {uploadedFile.name}
          </div>
        ) : (
          <p className="text-sm text-center text-gray-500 py-2">
            Drag and drop a document here (.pdf, .doc, .docx, .txt)
          </p>
        )}
      </div>
    </div>
  );
};

export default UploadArea;
