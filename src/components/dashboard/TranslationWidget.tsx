
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { Loader2, Globe } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { grokService } from '@/services/grokService';
import { hasGrokApiKey } from '@/services/apiKeyService';
import { useNavigate } from 'react-router-dom';

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
      
      // Check if the file is text
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
      // Handle dropped text
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
          <div>
            <Label>From:</Label>
            <RadioGroup 
              value={sourceLanguage} 
              onValueChange={(value) => setSourceLanguage(value as 'en' | 'zh')}
              className="flex space-x-4 mt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="en" id="source-en" />
                <Label htmlFor="source-en" className="cursor-pointer">English</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="zh" id="source-zh" />
                <Label htmlFor="source-zh" className="cursor-pointer">Chinese</Label>
              </div>
            </RadioGroup>
          </div>
          <div>
            <Label>To:</Label>
            <RadioGroup 
              value={targetLanguage} 
              onValueChange={(value) => setTargetLanguage(value as 'zh' | 'en')}
              className="flex space-x-4 mt-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="en" id="target-en" />
                <Label htmlFor="target-en" className="cursor-pointer">English</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="zh" id="target-zh" />
                <Label htmlFor="target-zh" className="cursor-pointer">Chinese</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div>
          <Textarea 
            placeholder="Enter text to translate or drop a text file..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`resize-none ${isDragging ? 'border-finance-medium-blue bg-gray-50 dark:bg-finance-dark-blue/20' : ''}`}
            rows={2}
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          />
        </div>

        {translatedContent && (
          <div className="p-3 rounded-md bg-gray-50 dark:bg-finance-dark-blue/20 text-sm whitespace-pre-line">
            {translatedContent}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleFullTranslator}
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
