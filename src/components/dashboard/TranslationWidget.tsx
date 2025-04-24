
import { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Globe } from 'lucide-react';
import { grokService } from '@/services/grokService';
import { hasGrokApiKey } from '@/services/apiKeyService';
import { useNavigate } from 'react-router-dom';
import { LanguageSelector } from './translation/LanguageSelector';
import { TranslationInput } from './translation/TranslationInput';
import { TranslationOutput } from './translation/TranslationOutput';
import { TranslationActions } from './translation/TranslationActions';

const TranslationWidget = () => {
  const [content, setContent] = useState<string>('');
  const [sourceLanguage, setSourceLanguage] = useState<'en' | 'zh'>('en');
  const [targetLanguage, setTargetLanguage] = useState<'zh' | 'en'>('zh');
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleDragEnter = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      
      if (file.type === 'text/plain') {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && typeof event.target.result === 'string') {
            setContent(event.target.result);
          }
        };
        reader.readAsText(file);
      } else {
        toast({
          title: "Unsupported file type",
          description: "Only text files (.txt) can be dropped here. For other document types, please use the full Translator page.",
          variant: "destructive",
        });
      }
    } else if (e.dataTransfer.getData('text')) {
      setContent(e.dataTransfer.getData('text'));
    }
  };

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

  const handleFullTranslator = () => {
    navigate('/documents');
  };

  return (
    <Card className="finance-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe size={18} className="text-finance-medium-blue" />
          Quick Translation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-row gap-4 items-center">
          <LanguageSelector
            label="From"
            value={sourceLanguage}
            onChange={setSourceLanguage}
            id="source"
          />
          <LanguageSelector
            label="To"
            value={targetLanguage}
            onChange={setTargetLanguage}
            id="target"
          />
        </div>
        <TranslationInput
          content={content}
          setContent={setContent}
          isDragging={isDragging}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />
        <TranslationOutput translatedContent={translatedContent} />
      </CardContent>
      <CardFooter>
        <TranslationActions
          onTranslate={handleTranslate}
          onFullTranslator={handleFullTranslator}
          isTranslating={isTranslating}
          isTranslateDisabled={!content.trim()}
        />
      </CardFooter>
    </Card>
  );
};

export default TranslationWidget;
