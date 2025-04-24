
import { Textarea } from '@/components/ui/textarea';

interface TranslationInputProps {
  content: string;
  setContent: (content: string) => void;
  isDragging: boolean;
  onDragEnter: (e: React.DragEvent<HTMLTextAreaElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLTextAreaElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLTextAreaElement>) => void;
  onDrop: (e: React.DragEvent<HTMLTextAreaElement>) => void;
}

export const TranslationInput = ({
  content,
  setContent,
  isDragging,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop
}: TranslationInputProps) => {
  return (
    <Textarea 
      placeholder="Enter text to translate or drop a text file..."
      value={content}
      onChange={(e) => setContent(e.target.value)}
      className={`resize-none ${isDragging ? 'border-finance-medium-blue bg-gray-50 dark:bg-finance-dark-blue/20' : ''}`}
      rows={2}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    />
  );
};
