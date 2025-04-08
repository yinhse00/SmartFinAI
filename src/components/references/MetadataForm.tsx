
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface MetadataFormProps {
  category: string;
  setCategory: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
}

const MetadataForm: React.FC<MetadataFormProps> = ({
  category,
  setCategory,
  description,
  setDescription
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Document Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="listing_rules">Listing Rules</SelectItem>
            <SelectItem value="takeovers">Takeovers Code</SelectItem>
            <SelectItem value="guidance">Guidance Notes</SelectItem>
            <SelectItem value="decisions">Executive Decisions</SelectItem>
            <SelectItem value="precedents">Precedent Cases</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea 
          id="description" 
          placeholder="Add a brief description of these documents..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="resize-none"
          rows={3}
        />
      </div>
    </div>
  );
};

export default MetadataForm;
