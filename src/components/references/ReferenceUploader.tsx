
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Upload, File, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

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
      // Upload files to Supabase storage
      const uploadedFiles = [];
      
      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${category}/${fileName}`;
        
        const { data, error } = await supabase.storage
          .from('references')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (error) {
          console.error('Error uploading reference:', error);
          throw new Error(`Error uploading ${file.name}: ${error.message}`);
        }
        
        // Get public URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from('references')
          .getPublicUrl(filePath);
          
        uploadedFiles.push({
          name: file.name,
          category: category,
          description: description,
          path: filePath,
          url: urlData.publicUrl,
          size: file.size,
          type: file.type,
          uploadedAt: new Date()
        });
      }
      
      // Store metadata in Supabase using the correct method and type casting
      // We need to use the `from` method with a string parameter as a workaround
      // for the TypeScript error
      const { error: metadataError } = await supabase
        .from('reference_documents' as any)
        .insert(uploadedFiles.map(file => ({
          title: file.name,
          category: category,
          description: description,
          file_path: file.path,
          file_url: file.url,
          file_size: file.size,
          file_type: file.type
        })));
      
      if (metadataError) {
        console.error('Error storing metadata:', metadataError);
        throw new Error(`Error saving document metadata: ${metadataError.message}`);
      }
      
      // Success message
      toast({
        title: "Upload successful",
        description: `${files.length} document(s) have been uploaded and are being processed.`,
      });
      
      // Reset form
      setFiles([]);
      setCategory('');
      setDescription('');
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your references. Please try again.",
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
        <div 
          className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-finance-dark-blue/30 hover:bg-gray-100 dark:hover:bg-finance-dark-blue/40 transition-colors cursor-pointer"
          onClick={() => document.getElementById('file-upload')?.click()}
        >
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            Drag and drop your files here, or <span className="text-finance-light-blue dark:text-finance-accent-blue">browse</span>
          </p>
          <p className="text-xs text-center text-gray-500 dark:text-gray-500 mt-1">
            Supports PDF, DOCX, TXT (max 20MB per file)
          </p>
          <Input
            id="file-upload"
            type="file"
            className="hidden"
            multiple
            onChange={handleFileChange}
            accept=".pdf,.docx,.txt"
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
            <Label htmlFor="category">Document Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="listing_rules">Listing Rules</SelectItem>
                <SelectItem value="takeovers">Takeovers Code</SelectItem>
                <SelectItem value="guidance">Guidance Notes</SelectItem>
                <SelectItem value="decisions">Executive Decisions</SelectItem>
                <SelectItem value="precedents">Precedent Cases</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea 
              id="description" 
              placeholder="Add a brief description of these documents..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
              rows={3}
            />
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
