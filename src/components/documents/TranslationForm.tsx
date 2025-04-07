
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { FileText, Loader2, Upload, FileUp, Download } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { grokService } from '@/services/grokService';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const TranslationForm = () => {
  const [content, setContent] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState<'en' | 'zh'>('en');
  const [targetLanguage, setTargetLanguage] = useState<'zh' | 'en'>('zh');
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      
      // In a real implementation, we would extract text from the document
      // For now, we'll just show the filename and simulate content extraction
      toast({
        title: "Document uploaded",
        description: `${file.name} has been uploaded. Extracting content...`,
      });
      
      // Simulate text extraction
      setTimeout(() => {
        setContent(`Content extracted from ${file.name}\n\nThis is a placeholder for the actual content that would be extracted from the document. In a real implementation, we would use a library to extract text from PDF and Word documents.`);
        
        toast({
          title: "Content extracted",
          description: "Document content has been extracted and is ready for translation.",
        });
      }, 1500);
    }
  };

  const handleTranslate = async () => {
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please provide content to translate or upload a document.",
        variant: "destructive",
      });
      return;
    }

    if (sourceLanguage === targetLanguage) {
      toast({
        title: "Same language",
        description: "Source and target languages are the same. Please select different languages.",
        variant: "destructive",
      });
      return;
    }

    if (!grokService.hasApiKey()) {
      toast({
        title: "API Key Required",
        description: "Please set your Grok API key in the Chat interface first.",
        variant: "destructive",
      });
      return;
    }

    setIsTranslating(true);
    setTranslatedContent(null);

    try {
      const response = await grokService.translateContent({
        content,
        sourceLanguage,
        targetLanguage
      });
      
      setTranslatedContent(response.text);
      
      toast({
        title: "Translation completed",
        description: "Your content has been translated successfully.",
      });
    } catch (error) {
      toast({
        title: "Translation failed",
        description: "There was an error translating your content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDownload = async (format: 'word' | 'pdf') => {
    if (!translatedContent) return;
    setIsExporting(true);
    
    try {
      let blob: Blob;
      let fileExtension: string;
      let mimeType: string;
      
      if (format === 'word') {
        blob = await grokService.generateWordDocument(translatedContent);
        fileExtension = 'docx';
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else {
        blob = await grokService.generatePdfDocument(translatedContent);
        fileExtension = 'pdf';
        mimeType = 'application/pdf';
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Translated_Document_${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: `${format.toUpperCase()} document generated`,
        description: `Your translated content has been downloaded as a ${format.toUpperCase()} document.`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: `There was an error generating the ${format.toUpperCase()} document. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="finance-card mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Translate Document</CardTitle>
        <CardDescription>
          Translate documents between English and Chinese
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Select Language Direction</Label>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <Label>From:</Label>
              <RadioGroup 
                value={sourceLanguage} 
                onValueChange={(value) => setSourceLanguage(value as 'en' | 'zh')}
                className="flex space-x-4 mt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="source-en" />
                  <Label htmlFor="source-en" className="cursor-pointer">English</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="zh" id="source-zh" />
                  <Label htmlFor="source-zh" className="cursor-pointer">Chinese</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex-1">
              <Label>To:</Label>
              <RadioGroup 
                value={targetLanguage} 
                onValueChange={(value) => setTargetLanguage(value as 'zh' | 'en')}
                className="flex space-x-4 mt-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="en" id="target-en" />
                  <Label htmlFor="target-en" className="cursor-pointer">English</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="zh" id="target-zh" />
                  <Label htmlFor="target-zh" className="cursor-pointer">Chinese</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </div>

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
          {uploadedFile && (
            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <FileUp className="h-3.5 w-3.5" /> {uploadedFile.name}
            </div>
          )}
          <Textarea 
            id="content" 
            placeholder="Enter text to translate or upload a document..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="resize-none"
            rows={5}
          />
        </div>

        {translatedContent && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Translated Content</h4>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        <span>Export As</span>
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleDownload('word')} className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Word Document</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload('pdf')} className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>PDF Document</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="p-4 rounded-md bg-gray-50 dark:bg-finance-dark-blue/20 text-sm whitespace-pre-line">
              {translatedContent}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleTranslate} 
          className="bg-finance-medium-blue hover:bg-finance-dark-blue"
          disabled={isTranslating || !content.trim()}
        >
          {isTranslating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Translating...</span>
            </>
          ) : (
            <>Translate</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TranslationForm;
