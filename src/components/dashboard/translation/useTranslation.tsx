
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { grokService } from '@/services/grokService';
import { hasGrokApiKey } from '@/services/apiKeyService';

export const useTranslation = () => {
  const [content, setContent] = useState<string>('');
  const [sourceLanguage, setSourceLanguage] = useState<'en' | 'zh'>('en');
  const [targetLanguage, setTargetLanguage] = useState<'zh' | 'en'>('zh');
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  const handleTranslate = async () => {
    if (!content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter text to translate.",
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

    if (!hasGrokApiKey()) {
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
      // Use actual content without any prefixes
      const contentToTranslate = content.trim();
      
      const response = await grokService.translateContent({
        content: contentToTranslate,
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

  return {
    content,
    setContent,
    sourceLanguage,
    setSourceLanguage,
    targetLanguage,
    setTargetLanguage,
    translatedContent,
    isTranslating,
    handleTranslate
  };
};
