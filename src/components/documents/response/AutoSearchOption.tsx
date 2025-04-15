
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { BookOpen, Loader2 } from 'lucide-react';

interface AutoSearchOptionProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onSearch: () => void;
  isSearching: boolean;
  promptEmpty: boolean;
}

const AutoSearchOption = ({ 
  checked, 
  onCheckedChange, 
  onSearch, 
  isSearching,
  promptEmpty 
}: AutoSearchOptionProps) => {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
      <div className="flex items-center space-x-2">
        <Checkbox 
          id="auto-search" 
          checked={checked} 
          onCheckedChange={(checked) => onCheckedChange(checked as boolean)}
        />
        <Label htmlFor="auto-search" className="text-sm cursor-pointer">
          Automatically search regulatory database
        </Label>
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onSearch}
        disabled={isSearching || promptEmpty}
        className="flex items-center gap-1 ml-auto"
      >
        {isSearching ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span>Searching...</span>
          </>
        ) : (
          <>
            <BookOpen className="h-3.5 w-3.5" />
            <span>Search Regulations</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default AutoSearchOption;
