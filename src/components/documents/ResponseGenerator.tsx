
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Download, FileText, Loader2, BookOpen } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { perplexityService } from '@/services/perplexityService';
import { grokService } from '@/services/grokService';
import { databaseService } from '@/services/databaseService';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const ResponseGenerator = () => {
  const [responseType, setResponseType] = useState('');
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSearchingRegulations, setIsSearchingRegulations] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState<string | null>(null);
  const [useAutoRegSearch, setUseAutoRegSearch] = useState(true);
  const [regulatoryContext, setRegulatoryContext] = useState<string | null>(null);
  // Add AI provider selection state
  const [aiProvider, setAiProvider] = useState<'perplexity' | 'grok'>('perplexity');

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
      // Use the selected AI service for searching regulations
      const service = aiProvider === 'grok' ? grokService : perplexityService;
      const context = await service.getRegulatoryContext(promptText);
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

    // Check if API key is set for the selected service
    const service = aiProvider === 'grok' ? grokService : perplexityService;
    if (!service.hasApiKey()) {
      toast({
        title: "API Key Required",
        description: `Please set your ${aiProvider === 'grok' ? 'Grok' : 'Perplexity'} API key in the Chat interface first.`,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedResponse(null);

    try {
      // If auto-search is enabled but we haven't searched yet, get the regulatory context
      if (useAutoRegSearch && !regulatoryContext) {
        try {
          const context = await service.getRegulatoryContext(promptText);
          setRegulatoryContext(context);
        } catch (error) {
          console.error("Error auto-searching regulations:", error);
          // Continue without regulatory context if search fails
        }
      }

      // Generate response using the selected AI service
      const response = await service.generateResponse({
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
    
    try {
      // Use the selected AI service for document generation
      const service = aiProvider === 'grok' ? grokService : perplexityService;
      const blob = await service.generateWordDocument(generatedResponse);
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Regulatory_Response_${new Date().toISOString().split('T')[0]}.docx`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
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
    }
  };

  return (
    <Card className="finance-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Generate Regulatory Response</CardTitle>
        <CardDescription>
          Create professional responses to regulatory inquiries or comments
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Provider Selection */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Select AI Provider</Label>
          <RadioGroup 
            value={aiProvider} 
            onValueChange={(value) => setAiProvider(value as 'perplexity' | 'grok')}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="perplexity" id="perplexity" />
              <Label htmlFor="perplexity" className="cursor-pointer">Perplexity AI</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="grok" id="grok" />
              <Label htmlFor="grok" className="cursor-pointer">Grok AI</Label>
            </div>
          </RadioGroup>
        </div>

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
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={handleDownloadWord}
              >
                <Download className="h-3.5 w-3.5" />
                <span>Download as Word</span>
              </Button>
            </div>
            <div className="p-4 rounded-md bg-gray-50 dark:bg-finance-dark-blue/20 text-sm whitespace-pre-line">
              {generatedResponse}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
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
      </CardFooter>
    </Card>
  );
};

export default ResponseGenerator;
