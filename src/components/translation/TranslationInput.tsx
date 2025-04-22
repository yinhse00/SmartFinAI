
import { Textarea } from '@/components/ui/textarea';

interface TranslationInputProps {
  content: string;
  onChange: (value: string) => void;
  isDragging: boolean;
  onDragEnter: (e: React.DragEvent<HTMLTextAreaElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLTextAreaElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLTextAreaElement>) => void;
  onDrop: (e: React.DragEvent<HTMLTextAreaElement>) => void;
}

const TranslationInput = ({
  content,
  onChange,
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
      onChange={(e) => onChange(e.target.value)}
      className={`resize-none ${isDragging ? 'border-finance-medium-blue bg-gray-50 dark:bg-finance-dark-blue/20' : ''}`}
      rows={2}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    />
  );
};

export default TranslationInput;
