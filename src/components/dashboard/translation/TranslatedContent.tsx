
interface TranslatedContentProps {
  content: string | null;
}

const TranslatedContent = ({ content }: TranslatedContentProps) => {
  if (!content) return null;
  
  return (
    <div className="p-3 rounded-md bg-gray-50 dark:bg-finance-dark-blue/20 text-sm whitespace-pre-line">
      {content}
    </div>
  );
};

export default TranslatedContent;
