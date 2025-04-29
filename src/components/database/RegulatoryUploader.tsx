
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload } from 'lucide-react';
import FileDropZone from '../references/FileDropZone';
import FileList from '../references/FileList';
import { useFileSelection } from '../references/hooks/useFileSelection';
import { useStructuredDatabase } from '@/hooks/useStructuredDatabase';
import { DocumentCategory } from '@/types/references';

// Import refactored components
import ImportedChaptersDisplay from './uploader/ImportedChaptersDisplay';
import QuickImportSection from './uploader/QuickImportSection';
import ManualContentInput from './uploader/ManualContentInput';
import CategorySelector from './uploader/CategorySelector';
import ImportErrorDisplay from './uploader/ImportErrorDisplay';
import { sampleChapter13, sampleChapter14, sampleChapter14A } from './uploader/SampleChapterData';

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
  const [importedChapters, setImportedChapters] = useState<string[]>([]);
  
  const { processRegulatoryFiles, getImportedChapters } = useStructuredDatabase();

  // Load already imported chapters
  useEffect(() => {
    const loadChapters = async () => {
      const chapters = await getImportedChapters();
      setImportedChapters(chapters);
    };
    
    loadChapters();
  }, [getImportedChapters]);

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
        const result = await processRegulatoryFiles(files, category as DocumentCategory);
        
        if (result) {
          setFiles([]);
          setCategory('');
          // Refresh imported chapters
          const chapters = await getImportedChapters();
          setImportedChapters(chapters);
        }
      } else if (customInput) {
        // Process custom input as if it were a text file
        const textBlob = new Blob([customInput], { type: 'text/plain' });
        const textFile = new File([textBlob], 'custom-input.txt', { type: 'text/plain' });
        
        const result = await processRegulatoryFiles([textFile], category as DocumentCategory);
        
        if (result) {
          setCustomInput('');
          setCategory('');
          // Refresh imported chapters
          const chapters = await getImportedChapters();
          setImportedChapters(chapters);
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

  // Quick import for specific chapters
  const handleQuickImport = async (chapterCategory: DocumentCategory, chapterContent: string) => {
    setIsImporting(true);
    
    try {
      toast({
        title: `Importing ${chapterCategory}`,
        description: "Processing sample chapter data...",
      });

      const textBlob = new Blob([chapterContent], { type: 'text/plain' });
      const fileName = `${chapterCategory.replace('_', ' ').charAt(0).toUpperCase()}${chapterCategory.replace('_', ' ').slice(1)}.txt`;
      const textFile = new File([textBlob], fileName, { type: 'text/plain' });
      
      const result = await processRegulatoryFiles([textFile], chapterCategory);
      
      if (result) {
        // Refresh imported chapters
        const chapters = await getImportedChapters();
        setImportedChapters(chapters);
      }
    } catch (error) {
      console.error(`Error in quick import of ${chapterCategory}:`, error);
      
      toast({
        title: "Quick import failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
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
        <ImportedChaptersDisplay importedChapters={importedChapters} />
        
        <QuickImportSection 
          importedChapters={importedChapters}
          isImporting={isImporting}
          onQuickImport={handleQuickImport}
          sampleChapter13={sampleChapter13}
          sampleChapter14={sampleChapter14}
          sampleChapter14A={sampleChapter14A}
        />

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
            <ManualContentInput
              customInput={customInput}
              setCustomInput={setCustomInput}
              isImporting={isImporting}
            />
          </TabsContent>
        </Tabs>

        <CategorySelector
          category={category}
          setCategory={setCategory}
          isImporting={isImporting}
        />

        <ImportErrorDisplay error={importError} />
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
