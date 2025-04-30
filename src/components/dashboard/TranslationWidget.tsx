
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe } from 'lucide-react';
import { useTranslation } from './translation/useTranslation';
import TranslationLanguageSelector from './translation/TranslationLanguageSelector';
import TranslationInput from './translation/TranslationInput';
import TranslatedContent from './translation/TranslatedContent';
import TranslationActions from './translation/TranslationActions';

const TranslationWidget = () => {
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

  return (
    <Card className="finance-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe size={18} className="text-finance-medium-blue" />
          Quick Translation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <TranslationLanguageSelector 
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          setSourceLanguage={setSourceLanguage}
          setTargetLanguage={setTargetLanguage}
        />

        <div>
          <TranslationInput 
            content={content}
            setContent={setContent}
          />
        </div>

        <TranslatedContent content={translatedContent} />
      </CardContent>
      <CardFooter className="flex justify-between">
        <TranslationActions 
          isTranslating={isTranslating} 
          handleTranslate={handleTranslate}
          isContentEmpty={!content.trim()}
        />
      </CardFooter>
    </Card>
  );
};

export default TranslationWidget;
