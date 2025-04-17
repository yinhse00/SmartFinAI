
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';

import FileDropZone from './FileDropZone';
import FileList from './FileList';
import MetadataForm from './MetadataForm';
import { uploadFilesToSupabase } from '@/utils/referenceUploadUtils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface FileWithError extends File {
  error?: string;
}

interface ReferenceUploaderProps {
  onUploadComplete?: () => void;
}

const ReferenceUploader: React.FC<ReferenceUploaderProps> = ({ onUploadComplete }) => {
  const [files, setFiles] = useState<FileWithError[]>([]);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files) as FileWithError[];
      
      // Validate files before adding them
      const validatedFiles = newFiles.map(file => {
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        
        if (!['pdf', 'docx', 'txt'].includes(fileExt || '')) {
          return { ...file, error: 'Invalid file type. Only PDF, DOCX, and TXT are supported.' };
        }
        
        if (file.size > 20971520) { // 20MB
          return { ...file, error: 'File exceeds 20MB limit' };
        }
        
        return file;
      });
      
      setFiles(prev => [...prev, ...validatedFiles]);
      setUploadError(null);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const validateFiles = useCallback(() => {
    const invalidFiles = files.filter(file => {
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      return !['pdf', 'docx', 'txt'].includes(fileExt || '') || file.size > 20971520;
    });
    
    return invalidFiles.length === 0;
  }, [files]);

  const handleUpload = useCallback(async () => {
    // Reset error state
    setUploadError(null);
    
    // Basic validation
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!category) {
      toast({
        title: "Category required",
        description: "Please select a category for the documents.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file types and sizes
    if (!validateFiles()) {
      toast({
        title: "Invalid files",
        description: "Please remove invalid files before uploading.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      console.log('Starting upload process with', files.length, 'files');
      const result = await uploadFilesToSupabase(files, category, description);
      
      if (result.success) {
        toast({
          title: "Upload successful",
          description: result.message,
        });
        
        // Reset form
        setFiles([]);
        setCategory('');
        setDescription('');
        
        // Notify parent component that upload is complete
        if (onUploadComplete) {
          onUploadComplete();
        }
      } else {
        console.error('Upload failed:', result.error || result.message);
        setUploadError(result.message);
        toast({
          title: "Upload failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Unhandled error during upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setUploadError(errorMessage);
      toast({
        title: "Upload error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [files, category, description, validateFiles, onUploadComplete]);

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
        {/* File Drop Area */}
        <FileDropZone 
          onFileChange={handleFileChange} 
          isUploading={isUploading}
        />

        {/* Selected Files */}
        <FileList 
          files={files} 
          onRemoveFile={removeFile}
          disabled={isUploading} 
        />

        {/* Error Message */}
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

        {/* Metadata */}
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
          disabled={isUploading || files.length === 0 || !category || hasInvalidFiles}
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
