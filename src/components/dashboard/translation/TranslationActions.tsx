
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface TranslationActionsProps {
  onTranslate: () => void;
  onFullTranslator: () => void;
  isTranslating: boolean;
  isTranslateDisabled: boolean;
}

export const TranslationActions = ({
  onTranslate,
  onFullTranslator,
  isTranslating,
  isTranslateDisabled
}: TranslationActionsProps) => {
  return (
    <div className="flex justify-between">
      <Button 
        variant="outline" 
        size="sm"
        onClick={onFullTranslator}
      >
        Full Translator
      </Button>
      <Button 
        onClick={onTranslate} 
        className="bg-finance-medium-blue hover:bg-finance-dark-blue"
        disabled={isTranslating || isTranslateDisabled}
        size="sm"
      >
        {isTranslating ? (
          <>
            <Loader2 className="mr-2 h-3 w-3 animate-spin" />
            <span>Translating...</span>
          </>
        ) : (
          <>Translate</>
        )}
      </Button>
    </div>
  );
};
