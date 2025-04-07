
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Download, FileText, Loader2, BookOpen, FileSpreadsheet } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { grokService } from '@/services/grokService';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const ResponseForm = () => {
  const [responseType, setResponseType] = useState('');
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSearchingRegulations, setIsSearchingRegulations] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState<string | null>(null);
  const [useAutoRegSearch, setUseAutoRegSearch] = useState(true);
  const [regulatoryContext, setRegulatoryContext] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const handleSearchRegulations = async () => {
    if (!promptText.trim()) {
      toast({
        title: "Prompt required",
        description: "Please provide details about what you're looking for in regulations.",
        variant: "destructive",
      });
      return;
    }

    setIsSearchingRegulations(true);
    setRegulatoryContext(null);

    try {
      const context = await grokService.getRegulatoryContext(promptText);
      setRegulatoryContext(context);
      
      toast({
        title: "Regulations found",
        description: "Relevant regulatory content has been identified for your query.",
      });
    } catch (error) {
      toast({
        title: "Search failed",
        description: "There was an error searching for relevant regulations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearchingRegulations(false);
    }
  };

  const handleGenerateResponse = async () => {
    if (!responseType) {
      toast({
        title: "Response type required",
        description: "Please select a response type.",
        variant: "destructive",
      });
      return;
    }

    if (!promptText.trim()) {
      toast({
        title: "Prompt required",
        description: "Please provide details about what response you need.",
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

    setIsGenerating(true);
    setGeneratedResponse(null);

    try {
      if (useAutoRegSearch && !regulatoryContext) {
        try {
          const context = await grokService.getRegulatoryContext(promptText);
          setRegulatoryContext(context);
        } catch (error) {
          console.error("Error auto-searching regulations:", error);
        }
      }

      const response = await grokService.generateResponse({
        prompt: promptText,
        regulatoryContext: regulatoryContext || undefined,
        responseFormat: 'text'
      });
      
      setGeneratedResponse(response.text);
      
      toast({
        title: "Response generated",
        description: "Your regulatory response has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Generation failed",
        description: "There was an error generating your response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadWord = async () => {
    if (!generatedResponse) return;
    setIsExporting(true);
    
    try {
      const blob = await grokService.generateWordDocument(generatedResponse);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Regulatory_Response_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Word document generated",
        description: "Your response has been downloaded as a Word document.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error generating the Word document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!generatedResponse) return;
    setIsExporting(true);
    
    try {
      const blob = await grokService.generateExcelDocument(generatedResponse);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Regulatory_Response_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Excel document generated",
        description: "Your response has been downloaded as an Excel spreadsheet.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error generating the Excel document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!generatedResponse) return;
    setIsExporting(true);
    
    try {
      const blob = await grokService.generatePdfDocument(generatedResponse);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Regulatory_Response_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF document generated",
        description: "Your response has been downloaded as a PDF document.",
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "There was an error generating the PDF document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="response-type">Response Type</Label>
          <Select value={responseType} onValueChange={setResponseType}>
            <SelectTrigger id="response-type">
              <SelectValue placeholder="Select a response type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="listing_comment_response">Listing Comment Response</SelectItem>
              <SelectItem value="takeover_comment_response">Takeover Comment Response</SelectItem>
              <SelectItem value="compliance_explanation">Compliance Explanation</SelectItem>
              <SelectItem value="disclosure_enhancement">Disclosure Enhancement</SelectItem>
              <SelectItem value="waiver_application">Waiver Application</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="prompt">Response Details</Label>
          <Textarea 
            id="prompt" 
            placeholder="Describe the regulatory comment or issue that needs a response..."
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            className="resize-none"
            rows={5}
          />
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="auto-search" 
              checked={useAutoRegSearch} 
              onCheckedChange={(checked) => setUseAutoRegSearch(checked as boolean)}
            />
            <Label htmlFor="auto-search" className="text-sm cursor-pointer">
              Automatically search regulatory database
            </Label>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleSearchRegulations}
            disabled={isSearchingRegulations || !promptText.trim()}
            className="flex items-center gap-1 ml-auto"
          >
            {isSearchingRegulations ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <BookOpen className="h-3.5 w-3.5" />
                <span>Search Regulations</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {regulatoryContext && (
        <div className="space-y-2 mt-4">
          <h4 className="text-sm font-medium">Relevant Regulatory Context</h4>
          <div className="p-3 rounded-md text-xs bg-gray-50 dark:bg-finance-dark-blue/20 max-h-32 overflow-y-auto">
            <pre className="whitespace-pre-wrap font-mono">{regulatoryContext}</pre>
          </div>
        </div>
      )}

      {generatedResponse && (
        <div className="space-y-2 mt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Generated Response</h4>
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
                <DropdownMenuItem onClick={handleDownloadWord} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>Word Document</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadPdf} className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>PDF Document</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownloadExcel} className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Excel Spreadsheet</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="p-4 rounded-md bg-gray-50 dark:bg-finance-dark-blue/20 text-sm whitespace-pre-line">
            {generatedResponse}
          </div>
        </div>
      )}

      <div className="flex justify-end mt-6">
        <Button 
          onClick={handleGenerateResponse} 
          className="bg-finance-medium-blue hover:bg-finance-dark-blue"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>Generate Response</>
          )}
        </Button>
      </div>
    </>
  );
};

export default ResponseForm;
