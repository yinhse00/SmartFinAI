
interface TranslationOutputProps {
  translatedContent: string | null;
}

export const TranslationOutput = ({ translatedContent }: TranslationOutputProps) => {
  if (!translatedContent) return null;
  
  return (
    <div className="p-3 rounded-md bg-gray-50 dark:bg-finance-dark-blue/20 text-sm whitespace-pre-line">
      {translatedContent}
    </div>
  );
};
