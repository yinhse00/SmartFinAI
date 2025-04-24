
import { Textarea } from '@/components/ui/textarea';
import { useFileDropHandler } from '@/hooks/useFileDropHandler';

interface TranslationInputProps {
  content: string;
  setContent: (content: string) => void;
}

export const TranslationInput = ({
  content,
  setContent,
}: TranslationInputProps) => {
  const { isDragging, handlers } = useFileDropHandler({
    onContentSet: setContent
  });

  return (
    <Textarea 
      placeholder="Enter text to translate or drop a text file..."
      value={content}
      onChange={(e) => setContent(e.target.value)}
      className={`resize-none ${isDragging ? 'border-finance-medium-blue bg-gray-50 dark:bg-finance-dark-blue/20' : ''}`}
      rows={2}
      {...handlers}
    />
  );
};
