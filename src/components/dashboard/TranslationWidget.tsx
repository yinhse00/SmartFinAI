
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Globe } from 'lucide-react';
import { grokService } from '@/services/grokService';
import { hasGrokApiKey } from '@/services/apiKeyService';
import { useNavigate } from 'react-router-dom';
import { useFileDropHandler } from '@/hooks/useFileDropHandler';
import LanguageSelector from '../translation/LanguageSelector';
import TranslationInput from '../translation/TranslationInput';
import TranslationOutput from '../translation/TranslationOutput';

const TranslationWidget = () => {
  const [content, setContent] = useState<string>('');
  const [sourceLanguage, setSourceLanguage] = useState<'en' | 'zh'>('en');
  const [targetLanguage, setTargetLanguage] = useState<'zh' | 'en'>('zh');
  const [translatedContent, setTranslatedContent] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const navigate = useNavigate();

  const { isDragging, handleDrop, handleDragEnter, handleDragOver, handleDragLeave } = useFileDropHandler({
    onContentChange: setContent
  });

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
            label="From:"
            value={sourceLanguage}
            onChange={setSourceLanguage}
            id="source"
          />
          <LanguageSelector
            label="To:"
            value={targetLanguage}
            onChange={setTargetLanguage}
            id="target"
          />
        </div>

        <TranslationInput
          content={content}
          onChange={setContent}
          isDragging={isDragging}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        />

        <TranslationOutput translatedContent={translatedContent} />
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/documents')}
        >
          Full Translator
        </Button>
        <Button 
          onClick={handleTranslate} 
          className="bg-finance-medium-blue hover:bg-finance-dark-blue"
          disabled={isTranslating || !content.trim()}
          size="sm"
        >
          {isTranslating ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
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

export default TranslationWidget;
