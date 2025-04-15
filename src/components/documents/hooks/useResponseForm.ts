
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

export function useResponseForm(): UseResponseFormReturn {
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
        regulatoryContext: regulatoryContext || undefined
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
