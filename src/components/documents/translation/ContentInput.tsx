
import { Textarea } from '@/components/ui/textarea';

interface ContentInputProps {
  content: string;
  setContent: (value: string) => void;
}

const ContentInput = ({ content, setContent }: ContentInputProps) => {
  return (
    <Textarea 
      id="content" 
      placeholder="Enter text to translate or upload a document..."
      value={content}
      onChange={(e) => setContent(e.target.value)}
      className="resize-none mt-2"
      rows={5}
    />
  );
};

export default ContentInput;
