
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface MetadataFormProps {
  category: string;
  setCategory: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  isUploading?: boolean;
}

const MetadataForm: React.FC<MetadataFormProps> = ({
  category,
  setCategory,
  description,
  setDescription,
  isUploading = false
}) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">
          Document Category <span className="text-red-500">*</span>
        </Label>
        <Select 
          value={category} 
          onValueChange={setCategory} 
          disabled={isUploading}
        >
          <SelectTrigger id="category" className={!category ? 'text-muted-foreground' : ''}>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="listing_rules">Listing Rules</SelectItem>
            <SelectItem value="takeovers">Takeovers Code</SelectItem>
            <SelectItem value="guidance">Interpretation and Guidance</SelectItem>
            <SelectItem value="decisions">Listing Review Committee Decisions</SelectItem>
            <SelectItem value="checklists">Checklists, Forms and Templates</SelectItem>
            <SelectItem value="other">Others</SelectItem>
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
          disabled={isUploading}
        />
      </div>
    </div>
  );
};

export default MetadataForm;
