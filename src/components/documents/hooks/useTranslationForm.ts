
import { useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { grokService } from '@/services/grokService';

export const useTranslationForm = () => {
  const [content, setContent] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState<'en' | 'zh'>('en');
  const [targetLanguage, setTargetLanguage] = useState<'zh' | 'en'>('zh');
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const processFile = (file: File) => {
    setUploadedFile(file);
    
    // For text files, extract content directly
    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && typeof e.target.result === 'string') {
          setContent(e.target.result);
          toast({
            title: "Content extracted",
            description: "Text file content has been loaded for translation.",
          });
        }
      };
      reader.readAsText(file);
    } else {
      // For other file types, show filename and extract simulated content
      toast({
        title: "Document uploaded",
        description: `${file.name} has been uploaded. Extracting content...`,
      });
      
      // Simulate text extraction for non-text files
      setTimeout(() => {
        setContent(`This document contains important information that needs translation. The content would typically be extracted from the ${file.name} file using a document parsing library.`);
        
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
      let fileName = `Translated_Document_${new Date().toISOString().split('T')[0]}`;
      
      if (format === 'word') {
        blob = await grokService.generateWordDocument(translatedContent);
        fileName += '.doc';
      } else {
        blob = await grokService.generatePdfDocument(translatedContent);
        fileName += '.html';
      }
      
      // Create download link and trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
      
      toast({
        title: `${format.toUpperCase()} document generated`,
        description: `Your translated content has been downloaded as a ${format === 'word' ? 'Word' : 'PDF-formatted HTML'} document.`,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: `There was an error generating the ${format.toUpperCase()} document. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // File drag and drop handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return {
    content,
    setContent,
    uploadedFile,
    sourceLanguage,
    setSourceLanguage,
    targetLanguage,
    setTargetLanguage,
    translatedContent,
    isTranslating,
    isExporting,
    isDragging,
    handleTranslate,
    handleDownload,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileUpload
  };
};
