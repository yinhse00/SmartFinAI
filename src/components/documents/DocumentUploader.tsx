
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Upload, File, X, Database } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { databaseService } from '@/services/databaseService';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

const DocumentUploader = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState('');
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [addToDatabase, setAddToDatabase] = useState(false);

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
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }

    if (!documentType) {
      toast({
        title: "Document type required",
        description: "Please select a document type.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload files to Supabase storage
      const uploadedFiles = [];
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${documentType}/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (error) {
          console.error('Error uploading file:', error);
          throw new Error(`Error uploading ${file.name}: ${error.message}`);
        }
        
        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);
          
        uploadedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          path: filePath,
          url: urlData.publicUrl,
        });
      }
      
      // Create metadata records in the database if needed
      if (addToDatabase) {
        try {
          const importCount = await databaseService.importFromFiles(files);
          toast({
            title: "Files added to regulatory database",
            description: `${importCount} entries were successfully added to the database.`,
          });
        } catch (error) {
          console.error("Error adding to database:", error);
          toast({
            title: "Database import failed",
            description: "There was an error adding the files to the database, but the upload was successful.",
            variant: "destructive",
          });
        }
      }
      
      // Success message
      toast({
        title: "Documents uploaded successfully",
        description: `${files.length} document(s) have been uploaded to Supabase storage.`,
      });
      
      // Reset form
      setFiles([]);
      setDocumentType('');
      setNotes('');
      setAddToDatabase(false);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="finance-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Upload Documents</CardTitle>
        <CardDescription>
          Upload regulatory documents that need review or comments from regulators.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Drop Area */}
        <div 
          className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-finance-dark-blue/30 hover:bg-gray-100 dark:hover:bg-finance-dark-blue/40 transition-colors cursor-pointer"
          onClick={() => document.getElementById('document-upload')?.click()}
        >
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            Drag and drop your files here, or <span className="text-finance-light-blue dark:text-finance-accent-blue">browse</span>
          </p>
          <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-1">
            Supports PDF, DOCX (max 20MB per file)
          </p>
          <Input
            id="document-upload"
            type="file"
            className="hidden"
            multiple
            onChange={handleFileChange}
            accept=".pdf,.docx,.doc,.txt"
          />
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Selected Files</h4>
            <div className="border rounded-md divide-y">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3">
                  <div className="flex items-center space-x-2">
                    <File className="h-5 w-5 text-finance-medium-blue dark:text-finance-accent-blue" />
                    <div>
                      <p className="text-sm font-medium truncate max-w-[200px] sm:max-w-[300px]">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-type">Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="document-type">
                <SelectValue placeholder="Select a document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="listing_application">Listing Application</SelectItem>
                <SelectItem value="prospectus">Prospectus</SelectItem>
                <SelectItem value="circular">Circular</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="takeover_document">Takeover Document</SelectItem>
                <SelectItem value="regulator_comment">Regulator Comment</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea 
              id="notes" 
              placeholder="Add any context or specific questions about these documents..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="add-to-database" 
              checked={addToDatabase} 
              onCheckedChange={(checked) => setAddToDatabase(checked as boolean)}
            />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="add-to-database" className="text-sm cursor-pointer">
                Also add to regulatory database
              </Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                The document will be processed and its content added to the knowledge base
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleUpload} 
          className="bg-finance-medium-blue hover:bg-finance-dark-blue"
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <span className="mr-2">Processing...</span>
              <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
            </>
          ) : (
            <>Upload Documents</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default DocumentUploader;
