
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import FileDropZone from './FileDropZone';
import FileList from './FileList';
import MetadataForm from './MetadataForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useFileSelection, allowedExtensions } from './hooks/useFileSelection';
import { useReferenceUpload } from './hooks/useReferenceUpload';

interface ReferenceUploaderProps {
  onUploadComplete?: () => void;
}

const ReferenceUploader: React.FC<ReferenceUploaderProps> = ({ onUploadComplete }) => {
  const {
    files,
    setFiles,
    handleFileChange,
    removeFile,
    validateFiles,
  } = useFileSelection();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const {
    isUploading,
    uploadError,
    setUploadError,
    handleUpload,
  } = useReferenceUpload(
    files,
    category,
    description,
    validateFiles,
    () => {
      setFiles([]);
      setCategory('');
      setDescription('');
      if (onUploadComplete) onUploadComplete();
    }
  );

  // Check for invalid files
  const hasInvalidFiles = !validateFiles();

  return (
    <Card className="finance-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Upload References</CardTitle>
        <CardDescription>
          Add regulatory documents, guidance notes, or precedent cases to enhance the system's knowledge base.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FileDropZone 
          onFileChange={handleFileChange} 
          isUploading={isUploading}
          allowedExtensions={allowedExtensions}
        />

        <FileList 
          files={files} 
          onRemoveFile={removeFile}
          disabled={isUploading} 
          allowedExtensions={allowedExtensions}
        />

        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Upload failed</AlertTitle>
            <AlertDescription>
              {uploadError}
              {uploadError.includes('bucket does not exist') && (
                <p className="mt-2 text-sm">
                  This application requires a Supabase storage bucket named 'references'. 
                  Please ask your administrator to set up the required storage bucket.
                </p>
              )}
            </AlertDescription>
          </Alert>
        )}

        <MetadataForm 
          category={category}
          setCategory={setCategory}
          description={description}
          setDescription={setDescription}
          isUploading={isUploading}
        />
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleUpload} 
          className="bg-finance-medium-blue hover:bg-finance-dark-blue"
          disabled={isUploading || files.length === 0 || !category || !validateFiles()}
        >
          {isUploading ? (
            <>
              <span className="mr-2">Uploading...</span>
              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
            </>
          ) : (
            <>Upload References</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ReferenceUploader;

