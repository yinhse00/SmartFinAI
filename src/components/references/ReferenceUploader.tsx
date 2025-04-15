
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

import FileDropZone from './FileDropZone';
import FileList from './FileList';
import MetadataForm from './MetadataForm';
import { uploadFilesToSupabase } from '@/utils/referenceUploadUtils';

const ReferenceUploader = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
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
    
    setIsUploading(true);
    
    try {
      console.log('Starting upload process');
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
      } else {
        toast({
          title: "Upload failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Unhandled error during upload:', error);
      toast({
        title: "Upload error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

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
          disabled={isUploading || files.length === 0 || !category}
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
