
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import FileDropZone from './FileDropZone';
import FileList from './FileList';
import MetadataForm from './MetadataForm';
import { useFileSelection } from './hooks/useFileSelection';
import { useReferenceUpload } from './hooks/useReferenceUpload';
import { DocumentCategory } from '@/types/references';
import { mappingExcelProcessor } from '@/services/regulatory/mappingExcelProcessor';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle } from 'lucide-react';

interface ReferenceUploaderProps {
  onUploadComplete?: () => void;
}

const ReferenceUploader = ({ onUploadComplete }: ReferenceUploaderProps) => {
  const { toast } = useToast();
  const { selectedFiles, addFiles, removeFile, clearFiles } = useFileSelection();
  const [category, setCategory] = useState<DocumentCategory>('guidance');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [mappingResult, setMappingResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  
  const { uploadFiles } = useReferenceUpload({
    onComplete: () => {
      clearFiles();
      setDescription('');
      if (onUploadComplete) {
        onUploadComplete();
      }
    }
  });

  const handleUpload = async () => {
    setIsUploading(true);
    setMappingResult(null);
    
    try {
      // Check if any file is a mapping schedule Excel
      const mappingFile = selectedFiles.find(file => 
        file.name.toLowerCase().includes('mapping_schedule') &&
        (file.name.toLowerCase().includes('.xlsx') || file.name.toLowerCase().includes('.xls'))
      );
      
      if (mappingFile) {
        // Special handling for mapping schedule files
        const result = await mappingExcelProcessor.processExcelFile(mappingFile);
        
        if (result.success) {
          toast({
            title: "Mapping Schedule Processed",
            description: `Successfully processed ${mappingFile.name}`,
            variant: "default",
          });
          
          setMappingResult({
            success: true,
            message: "Mapping schedule processed successfully"
          });
          
          // Remove the mapping file from the selected files
          removeFile(mappingFile.name);
          
          // Call onUploadComplete to refresh the document list
          if (onUploadComplete) {
            onUploadComplete();
          }
        } else {
          toast({
            title: "Error Processing Mapping Schedule",
            description: result.error || "Unknown error",
            variant: "destructive",
          });
          
          setMappingResult({
            success: false,
            message: result.error || "Failed to process mapping schedule"
          });
        }
      }
      
      // Upload remaining files if any
      if (selectedFiles && selectedFiles.length > 0) {
        await uploadFiles({
          files: selectedFiles,
          category,
          description
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Upload Reference Documents</CardTitle>
        <CardDescription>
          Add regulatory materials to enhance SmartFinAI's knowledge
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FileDropZone onFilesAdded={addFiles} isUploading={isUploading} />
        
        {mappingResult && (
          <div className={`mt-4 p-3 rounded-md ${mappingResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <div className="flex items-center gap-2">
              {mappingResult.success 
                ? <CheckCircle className="text-green-600 h-5 w-5" /> 
                : <AlertTriangle className="text-red-600 h-5 w-5" />
              }
              <span className={mappingResult.success ? 'text-green-700' : 'text-red-700'}>
                {mappingResult.message}
              </span>
            </div>
          </div>
        )}
        
        {selectedFiles && selectedFiles.length > 0 && (
          <div className="mt-4">
            <FileList files={selectedFiles} onRemove={removeFile} disabled={isUploading} />
          </div>
        )}
        
        <div className="mt-6">
          <MetadataForm
            category={category}
            setCategory={(value) => setCategory(value as DocumentCategory)}
            description={description}
            setDescription={setDescription}
            isUploading={isUploading}
          />
        </div>
        
        {/* Special handling for mapping files */}
        {selectedFiles && selectedFiles.some(file => 
          file.name.toLowerCase().includes('mapping_schedule') &&
          (file.name.toLowerCase().includes('.xlsx') || file.name.toLowerCase().includes('.xls'))
        ) && (
          <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-200">
            <Badge variant="outline" className="bg-blue-100 text-blue-800">
              Mapping Schedule Detected
            </Badge>
            <p className="text-sm text-blue-700 mt-2">
              This appears to be a regulatory mapping file. 
              It will be processed with special handling to optimize response validation.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={clearFiles} disabled={!selectedFiles || selectedFiles.length === 0 || isUploading}>
          Clear
        </Button>
        <Button 
          onClick={handleUpload} 
          disabled={!selectedFiles || selectedFiles.length === 0 || isUploading}
          className="bg-finance-accent-blue hover:bg-finance-dark-blue"
        >
          {isUploading ? 'Processing...' : 'Upload'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ReferenceUploader;
