
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface PromptInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const PromptInput = ({ value, onChange }: PromptInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="prompt">Response Details</Label>
      <Textarea 
        id="prompt" 
        placeholder="Describe the regulatory comment or issue that needs a response..."
        value={value}
        onChange={onChange}
        className="resize-none"
        rows={5}
      />
    </div>
  );
};

export default PromptInput;
