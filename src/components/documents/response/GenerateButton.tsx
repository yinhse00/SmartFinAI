
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface GenerateButtonProps {
  onClick: () => void;
  isGenerating: boolean;
}

const GenerateButton = ({ onClick, isGenerating }: GenerateButtonProps) => {
  return (
    <div className="flex justify-end mt-6">
      <Button 
        onClick={onClick} 
        className="bg-finance-medium-blue hover:bg-finance-dark-blue"
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>Generating...</span>
          </>
        ) : (
          <>Generate Response</>
        )}
      </Button>
    </div>
  );
};

export default GenerateButton;
