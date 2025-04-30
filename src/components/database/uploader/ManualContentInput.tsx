
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ManualContentInputProps {
  customInput: string;
  setCustomInput: (value: string) => void;
  isImporting: boolean;
}

const ManualContentInput = ({ customInput, setCustomInput, isImporting }: ManualContentInputProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="custom-content">Regulatory Content</Label>
      <Textarea
        id="custom-content"
        value={customInput}
        onChange={(e) => setCustomInput(e.target.value)}
        placeholder="Enter regulatory content here (e.g., rules, provisions, definitions)..."
        className="min-h-[200px]"
        disabled={isImporting}
      />
    </div>
  );
};

export default ManualContentInput;
