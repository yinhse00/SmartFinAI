
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ResponseTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const ResponseTypeSelector = ({ value, onChange }: ResponseTypeSelectorProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="response-type">Response Type</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="response-type">
          <SelectValue placeholder="Select a response type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="listing_comment_response">Listing Comment Response</SelectItem>
          <SelectItem value="takeover_comment_response">Takeover Comment Response</SelectItem>
          <SelectItem value="compliance_explanation">Compliance Explanation</SelectItem>
          <SelectItem value="disclosure_enhancement">Disclosure Enhancement</SelectItem>
          <SelectItem value="waiver_application">Waiver Application</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default ResponseTypeSelector;
