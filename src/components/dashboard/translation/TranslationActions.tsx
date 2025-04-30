
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TranslationActionsProps {
  isTranslating: boolean;
  handleTranslate: () => Promise<void>;
  isContentEmpty: boolean;
}

const TranslationActions = ({ isTranslating, handleTranslate, isContentEmpty }: TranslationActionsProps) => {
  const navigate = useNavigate();

  const handleFullTranslator = () => {
    navigate('/documents');
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleFullTranslator}
      >
        Full Translator
      </Button>
      <Button 
        onClick={handleTranslate} 
        className="bg-finance-medium-blue hover:bg-finance-dark-blue"
        disabled={isTranslating || isContentEmpty}
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
    </>
  );
};

export default TranslationActions;
