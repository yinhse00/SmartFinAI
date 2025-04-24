
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface LanguageSelectorProps {
  label: string;
  value: 'en' | 'zh';
  onChange: (value: 'en' | 'zh') => void;
  id: string;
}

export const LanguageSelector = ({ label, value, onChange, id }: LanguageSelectorProps) => {
  return (
    <div>
      <Label>{label}:</Label>
      <RadioGroup 
        value={value} 
        onValueChange={(value) => onChange(value as 'en' | 'zh')}
        className="flex space-x-4 mt-1"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="en" id={`${id}-en`} />
          <Label htmlFor={`${id}-en`} className="cursor-pointer">English</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="zh" id={`${id}-zh`} />
          <Label htmlFor={`${id}-zh`} className="cursor-pointer">Chinese</Label>
        </div>
      </RadioGroup>
    </div>
  );
};
