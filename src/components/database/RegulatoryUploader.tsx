
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRef } from 'react';
import { Loader2, Upload, FileText, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FileDropZone from '../references/FileDropZone';
import FileList from '../references/FileList';
import { useFileSelection } from '../references/hooks/useFileSelection';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { enhancedFileProcessingService } from '@/services/documents/enhancedFileProcessingService';
import { useStructuredDatabase } from '@/hooks/useStructuredDatabase';

const RegulatoryUploader = () => {
  const {
    files,
    setFiles,
    handleFileChange,
    removeFile,
    validateFiles,
  } = useFileSelection();
  
  const [category, setCategory] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  
  const { processRegulatoryFiles } = useStructuredDatabase();

  const handleImport = async () => {
    if (files.length === 0 && !customInput) {
      toast({
        title: "No content to import",
        description: "Please either upload files or enter custom content to import.",
        variant: "destructive",
      });
      return;
    }

    if (!category) {
      toast({
        title: "Category required",
        description: "Please select a regulatory category.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      if (files.length > 0) {
        const result = await processRegulatoryFiles(files);
        
        if (result) {
          setFiles([]);
          setCategory('');
        }
      } else if (customInput) {
        // Process custom input as if it were a text file
        const textBlob = new Blob([customInput], { type: 'text/plain' });
        const textFile = new File([textBlob], 'custom-input.txt', { type: 'text/plain' });
        
        const result = await processRegulatoryFiles([textFile]);
        
        if (result) {
          setCustomInput('');
          setCategory('');
        }
      }
    } catch (error) {
      console.error('Error importing regulatory content:', error);
      setImportError(error instanceof Error ? error.message : 'An unexpected error occurred');
      
      toast({
        title: "Import failed",
        description: "There was an error importing the regulatory content.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Regulatory Content</CardTitle>
        <CardDescription>
          Upload regulatory documents or manually enter content to be processed and added to the database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="file" className="w-full">
          <TabsList className="mb-4 grid w-full grid-cols-2">
            <TabsTrigger value="file">Upload Files</TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            <FileDropZone 
              onFileChange={handleFileChange} 
              isUploading={isImporting}
              allowedExtensions={['pdf', 'docx', 'txt', 'xlsx', 'xls']}
            />

            <FileList 
              files={files} 
              onRemoveFile={removeFile}
              disabled={isImporting} 
              allowedExtensions={['pdf', 'docx', 'txt', 'xlsx', 'xls']}
            />
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-content">Regulatory Content</Label>
              <Textarea
                id="custom-content"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="Enter regulatory content here (e.g., rules, provisions, definitions)..."
                className="min-h-[200px]"
                disabled={isImporting}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-2">
          <Label htmlFor="category">
            Regulatory Category <span className="text-red-500">*</span>
          </Label>
          <Select 
            value={category} 
            onValueChange={setCategory} 
            disabled={isImporting}
          >
            <SelectTrigger id="category" className={!category ? 'text-muted-foreground' : ''}>
              <SelectValue placeholder="Select a regulatory category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="listing_rules">Listing Rules</SelectItem>
              <SelectItem value="chapter_13">Chapter 13 - Connected Transactions</SelectItem>
              <SelectItem value="chapter_14">Chapter 14 - Notifiable Transactions</SelectItem>
              <SelectItem value="chapter_14a">Chapter 14A - Connected Transactions</SelectItem>
              <SelectItem value="takeovers">Takeovers Code</SelectItem>
              <SelectItem value="share_repurchases">Share Repurchases Code</SelectItem>
              <SelectItem value="guidance">Interpretation and Guidance</SelectItem>
              <SelectItem value="decisions">Listing Review Committee Decisions</SelectItem>
              <SelectItem value="other">Other Regulations</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {importError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{importError}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleImport} 
          className="bg-finance-medium-blue hover:bg-finance-dark-blue"
          disabled={isImporting || (!files.length && !customInput) || !category}
        >
          {isImporting ? (
            <>
              <span className="mr-2">Processing...</span>
              <Loader2 className="h-4 w-4 animate-spin" />
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Import Content
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RegulatoryUploader;
