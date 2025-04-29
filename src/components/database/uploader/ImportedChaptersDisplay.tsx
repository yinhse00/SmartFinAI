
import { BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ImportedChaptersDisplayProps {
  importedChapters: string[];
}

const ImportedChaptersDisplay = ({ importedChapters }: ImportedChaptersDisplayProps) => {
  return (
    <div className="bg-muted p-4 rounded-lg mb-6">
      <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
        <BookOpen size={16} /> 
        Currently Imported Chapters
      </h3>
      <div className="flex flex-wrap gap-2">
        {importedChapters.length > 0 ? (
          importedChapters.map((chapter) => (
            <Badge key={chapter} variant="outline" className="bg-finance-light-blue/10">
              Chapter {chapter}
            </Badge>
          ))
        ) : (
          <span className="text-sm text-muted-foreground">No chapters imported yet</span>
        )}
      </div>
    </div>
  );
};

export default ImportedChaptersDisplay;
