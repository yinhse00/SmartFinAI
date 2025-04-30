
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DocumentCategory } from '@/types/references';

interface CategorySelectorProps {
  category: string;
  setCategory: (value: string) => void;
  isImporting: boolean;
}

const CategorySelector = ({ category, setCategory, isImporting }: CategorySelectorProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="category">
        Regulatory Category <span className="text-red-500">*</span>
      </Label>
      <Select 
        value={category} 
        onValueChange={setCategory} 
        disabled={isImporting}
      >
        <SelectTrigger id="category" className={!category ? 'text-muted-foreground' : ''}>
          <SelectValue placeholder="Select a regulatory category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="listing_rules">Listing Rules</SelectItem>
          <SelectItem value="listing_guidance">Listing Rules Guidance</SelectItem>
          <SelectItem value="guidance_new_listing">Guide for New Listing Applicants</SelectItem>
          <SelectItem value="guidance_listed_issuers">Guidance for Listed Issuers</SelectItem>
          <SelectItem value="takeovers">Takeovers Code</SelectItem>
          <SelectItem value="decisions">Listing Review Committee Decisions</SelectItem>
          <SelectItem value="checklists">Checklists, Forms and Templates</SelectItem>
          <SelectItem value="other">Other Regulations</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default CategorySelector;
