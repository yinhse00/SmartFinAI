
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFileDropHandler } from '@/hooks/useFileDropHandler';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageSelector from '../translation/LanguageSelector';
import TranslationInput from '../translation/TranslationInput';
import TranslationOutput from '../translation/TranslationOutput';

const TranslationWidget = () => {
  const navigate = useNavigate();
  const {
    content,
    setContent,
    sourceLanguage,
    setSourceLanguage,
    targetLanguage,
    setTargetLanguage,
    translatedContent,
    isTranslating,
    handleTranslate
  } = useTranslation();

  const { isDragging, handleDrop, handleDragEnter, handleDragOver, handleDragLeave } = useFileDropHandler({
    onContentChange: setContent
  });

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
