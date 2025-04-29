
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Upload, FileText, AlertCircle, List, BookOpen } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import FileDropZone from '../references/FileDropZone';
import FileList from '../references/FileList';
import { useFileSelection } from '../references/hooks/useFileSelection';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { enhancedFileProcessingService } from '@/services/documents/enhancedFileProcessingService';
import { useStructuredDatabase } from '@/hooks/useStructuredDatabase';
import { DocumentCategory } from '@/types/references';
import { Badge } from '@/components/ui/badge';

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
      const fileName = `${chapterCategory.replace('chapter_', 'Chapter ')}.txt`;
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

  // Sample data for quick import of chapters
  const sampleChapter13 = `
Chapter 13 - Connected Transactions

13.01 The connected transaction rules ensure that the interests of shareholders as a whole are taken into account by a listed issuer when the listed issuer enters into connected transactions.

13.02 The rules set out in this Chapter also provide certain safeguards against listed issuers' directors, chief executives or substantial shareholders (or their associates) taking advantage of their positions.

13.03 This Chapter applies to connected transactions entered into by:
(1) a listed issuer's group; and
(2) a "connected person" at the listed issuer level.

13.04 This Chapter also applies to connected transactions entered into by:
(1) a listed issuer's group with third parties where the transaction involves assets in which a director, chief executive, substantial shareholder of the listed issuer (or an associate of any of them) has an interest; and
(2) a listed issuer's group with third parties who are connected with the listed issuer's subsidiary or holding company.
`;

  const sampleChapter14 = `
Chapter 14 - Notifiable Transactions

14.01 This Chapter deals with certain transactions, principally acquisitions and disposals, by a listed issuer. It describes how they are classified, the details that are required to be disclosed in respect of them and whether shareholders' approval is required. It also sets out provisions to deter circumvention of new listing requirements and considers additional requirements in respect of takeovers and mergers.

14.02 If any transaction for the purposes of this Chapter is also a connected transaction for the purposes of Chapter 14A, the listed issuer will, in addition to complying with the provisions of this Chapter, have to comply with the provisions of Chapter 14A.

14.03 Listed issuers should note that even if a transaction is not required to be disclosed pursuant to the provisions of this Chapter, they will still be required to disclose details of the transaction under rule 13.09 if it falls within the ambit of that rule.
`;

  const sampleChapter14A = `
Chapter 14A - Connected Transactions

14A.01 This Chapter applies to connected transactions entered into by a listed issuer or its subsidiaries.

14A.02 The connected transaction rules ensure that the interests of shareholders as a whole are taken into account by a listed issuer when the listed issuer's group enters into a connected transaction.

14A.03 The rules set out in this Chapter also provide certain safeguards against the directors, chief executives and substantial shareholders (or their associates) taking advantage of their positions.

Definitions
14A.04 In this Chapter:

(1) "30%-controlled company" means a company held by a person who can:
(a) exercise or control the exercise of 30% (or an amount for triggering a mandatory general offer under the Takeovers Code, or for PRC issuers only, an amount for triggering a mandatory general offer or establishing legal or management control over a business enterprise under the PRC law) or more of the voting power at general meetings; or
(b) control the composition of a majority of the board of directors;
`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import Regulatory Content</CardTitle>
        <CardDescription>
          Upload regulatory documents or manually enter content to be processed and added to the database
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-muted p-4 rounded-lg mb-6">
          <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
            <BookOpen size={16} /> 
            Currently Imported Chapters
          </h3>
          <div className="flex flex-wrap gap-2">
            {importedChapters.length > 0 ? (
              importedChapters.map((chapter) => (
                <Badge key={chapter} variant="outline" className="bg-finance-light-blue/10">
                  Chapter {chapter}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">No chapters imported yet</span>
            )}
          </div>
        </div>
        
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
          <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
            <List size={16} /> 
            Quick Import
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Quickly import sample content for key chapters:
          </p>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              disabled={isImporting || importedChapters.includes('13')}
              onClick={() => handleQuickImport('chapter_13', sampleChapter13)}
              className={importedChapters.includes('13') ? "opacity-50 cursor-not-allowed" : ""}
            >
              {importedChapters.includes('13') ? "Chapter 13 ✓" : "Import Chapter 13"}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              disabled={isImporting || importedChapters.includes('14')}
              onClick={() => handleQuickImport('chapter_14', sampleChapter14)}
              className={importedChapters.includes('14') ? "opacity-50 cursor-not-allowed" : ""}
            >
              {importedChapters.includes('14') ? "Chapter 14 ✓" : "Import Chapter 14"}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              disabled={isImporting || importedChapters.includes('14A')}
              onClick={() => handleQuickImport('chapter_14a', sampleChapter14A)}
              className={importedChapters.includes('14A') ? "opacity-50 cursor-not-allowed" : ""}
            >
              {importedChapters.includes('14A') ? "Chapter 14A ✓" : "Import Chapter 14A"}
            </Button>
          </div>
        </div>

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
              <SelectItem value="listing_rules">Listing Rules (General)</SelectItem>
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
