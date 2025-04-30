
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface TranslationLanguageSelectorProps {
  sourceLanguage: 'en' | 'zh';
  targetLanguage: 'zh' | 'en';
  setSourceLanguage: (value: 'en' | 'zh') => void;
  setTargetLanguage: (value: 'zh' | 'en') => void;
}

const TranslationLanguageSelector = ({
  sourceLanguage,
  targetLanguage,
  setSourceLanguage,
  setTargetLanguage
}: TranslationLanguageSelectorProps) => {
  return (
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
  );
};

export default TranslationLanguageSelector;
