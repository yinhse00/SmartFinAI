
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useTranslationForm } from './hooks/useTranslationForm';
import LanguageSelector from './translation/LanguageSelector';
import UploadArea from './translation/UploadArea';
import ContentInput from './translation/ContentInput';
import TranslatedOutput from './translation/TranslatedOutput';

const TranslationForm = () => {
  const {
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
  } = useTranslationForm();

  return (
    <Card className="finance-card mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Translate Document</CardTitle>
        <CardDescription>
          Translate documents between English and Chinese
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <LanguageSelector
          sourceLanguage={sourceLanguage}
          targetLanguage={targetLanguage}
          setSourceLanguage={setSourceLanguage}
          setTargetLanguage={setTargetLanguage}
        />

        <UploadArea
          isDragging={isDragging}
          uploadedFile={uploadedFile}
          handleDragEnter={handleDragEnter}
          handleDragOver={handleDragOver}
          handleDragLeave={handleDragLeave}
          handleDrop={handleDrop}
          handleFileUpload={handleFileUpload}
        />
        
        <ContentInput
          content={content}
          setContent={setContent}
        />

        <TranslatedOutput
          translatedContent={translatedContent}
          isExporting={isExporting}
          handleDownload={handleDownload}
        />
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleTranslate} 
          className="bg-finance-medium-blue hover:bg-finance-dark-blue"
          disabled={isTranslating || !content.trim()}
        >
          {isTranslating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

export default TranslationForm;
