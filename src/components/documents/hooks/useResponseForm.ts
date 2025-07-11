
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { grokService } from '@/services/grokService';

export interface UseResponseFormReturn {
  responseType: string;
  setResponseType: (value: string) => void;
  promptText: string;
  setPromptText: (value: string) => void;
  isGenerating: boolean;
  isSearchingRegulations: boolean;
  generatedResponse: string | null;
  useAutoRegSearch: boolean;
  setUseAutoRegSearch: (value: boolean) => void;
  regulatoryContext: string | null;
  isExporting: boolean;
  handleSearchRegulations: () => Promise<void>;
  handleGenerateResponse: () => Promise<void>;
  handleDownloadWord: () => Promise<void>;
  handleDownloadExcel: () => Promise<void>;
  handleDownloadPdf: () => Promise<void>;
}

// Cache for document responses
const documentResponseCache = new Map<string, {
  response: string,
  timestamp: number,
  type: string
}>();

// Cache expiration (15 minutes)
const DOCUMENT_CACHE_EXPIRATION = 15 * 60 * 1000;

export function useResponseForm(): UseResponseFormReturn {
  const [responseType, setResponseType] = useState('');
  const [promptText, setPromptText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSearchingRegulations, setIsSearchingRegulations] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState<string | null>(null);
  const [useAutoRegSearch, setUseAutoRegSearch] = useState(true);
  const [regulatoryContext, setRegulatoryContext] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Generate cache key
  const generateCacheKey = (prompt: string, type: string, context?: string) => {
    return `${prompt.substring(0, 100).toLowerCase()}-${type}-${context ? 'with-context' : 'no-context'}`;
  };

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
      // OPTIMIZATION: Always use full-quality model
      const context = await grokService.getRegulatoryContext(promptText, {
        metadata: {
          processingStage: 'document-preparation',
          specializationLevel: 'high'
        }
      });
      
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
    
    // Check cache for this prompt and response type
    const cacheKey = generateCacheKey(promptText, responseType, regulatoryContext || undefined);
    const cachedResponse = documentResponseCache.get(cacheKey);
    
    if (cachedResponse && (Date.now() - cachedResponse.timestamp < DOCUMENT_CACHE_EXPIRATION)) {
      console.log('Using cached document response');
      setGeneratedResponse(cachedResponse.response);
      setIsGenerating(false);
      
      toast({
        title: "Response generated",
        description: "Your regulatory response has been loaded from cache.",
      });
      
      return;
    }

    try {
      if (useAutoRegSearch && !regulatoryContext) {
        try {
          // OPTIMIZATION: Always use full-quality model for context retrieval
          const context = await grokService.getRegulatoryContext(promptText, {
            metadata: {
              processingStage: 'document-preparation',
              specializationLevel: 'high'
            }
          });
          
          setRegulatoryContext(context);
        } catch (error) {
          console.error("Error auto-searching regulations:", error);
        }
      }
      
      // Format prompt based on document type
      let formattedPrompt = promptText;
      
      if (responseType === 'timetable') {
        formattedPrompt = `${promptText}\n\nGenerate a comprehensive timetable with all relevant dates and requirements.`;
      } else if (responseType === 'comparison') {
        formattedPrompt = `${promptText}\n\nCreate a detailed comparison with clear structure and formatting.`;
      } else if (responseType === 'checklist') {
        formattedPrompt = `${promptText}\n\nProvide a comprehensive checklist with clear structure and step-by-step format.`;
      }
      
      // OPTIMIZATION: Always use full-quality model
      const response = await grokService.generateResponse({
        prompt: formattedPrompt,
        regulatoryContext: regulatoryContext || undefined,
        model: 'grok-4-0709',
        maxTokens: 25000, // Higher token limit for comprehensive document responses
        temperature: 0.4  // Lower temperature for more consistent formatting
      });
      
      setGeneratedResponse(response.text);
      
      // Cache the response
      documentResponseCache.set(cacheKey, {
        response: response.text,
        timestamp: Date.now(),
        type: responseType
      });
      
      // Limit cache size
      if (documentResponseCache.size > 15) {
        const oldestKey = Array.from(documentResponseCache.keys())[0];
        documentResponseCache.delete(oldestKey);
      }
      
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
      a.download = `Regulatory_Response_${new Date().toISOString().split('T')[0]}.doc`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast({
        title: "Word document generated",
        description: "Your response has been downloaded as a Word document.",
      });
    } catch (error) {
      console.error("Word download error:", error);
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
      a.download = `Regulatory_Response_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast({
        title: "Excel document generated",
        description: "Your response has been downloaded as a CSV spreadsheet.",
      });
    } catch (error) {
      console.error("Excel download error:", error);
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
      a.download = `Regulatory_Response_${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast({
        title: "PDF document generated",
        description: "Your response has been downloaded as an HTML document formatted for printing.",
      });
    } catch (error) {
      console.error("PDF download error:", error);
      toast({
        title: "Download failed",
        description: "There was an error generating the PDF document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    responseType,
    setResponseType,
    promptText,
    setPromptText,
    isGenerating,
    isSearchingRegulations,
    generatedResponse,
    useAutoRegSearch,
    setUseAutoRegSearch,
    regulatoryContext,
    isExporting,
    handleSearchRegulations,
    handleGenerateResponse,
    handleDownloadWord,
    handleDownloadExcel,
    handleDownloadPdf
  };
}
