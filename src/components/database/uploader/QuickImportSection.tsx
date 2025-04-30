
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { List } from 'lucide-react';
import { DocumentCategory } from '@/types/references';

interface QuickImportSectionProps {
  importedChapters: string[];
  isImporting: boolean;
  onQuickImport: (category: DocumentCategory, content: string) => Promise<void>;
  sampleChapter13: string;
  sampleChapter14: string;
  sampleChapter14A: string;
}

const QuickImportSection = ({
  importedChapters,
  isImporting,
  onQuickImport,
  sampleChapter13,
  sampleChapter14,
  sampleChapter14A
}: QuickImportSectionProps) => {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
      <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
        <List size={16} /> 
        Quick Import
      </h3>
      <p className="text-sm text-muted-foreground mb-3">
        Quickly import sample content for key chapters:
      </p>
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm"
          disabled={isImporting || importedChapters.includes('13')}
          onClick={() => onQuickImport('listing_rules', sampleChapter13)}
          className={importedChapters.includes('13') ? "opacity-50 cursor-not-allowed" : ""}
        >
          {importedChapters.includes('13') ? "Chapter 13 ✓" : "Import Chapter 13"}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          disabled={isImporting || importedChapters.includes('14')}
          onClick={() => onQuickImport('listing_rules', sampleChapter14)}
          className={importedChapters.includes('14') ? "opacity-50 cursor-not-allowed" : ""}
        >
          {importedChapters.includes('14') ? "Chapter 14 ✓" : "Import Chapter 14"}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          disabled={isImporting || importedChapters.includes('14A')}
          onClick={() => onQuickImport('listing_rules', sampleChapter14A)}
          className={importedChapters.includes('14A') ? "opacity-50 cursor-not-allowed" : ""}
        >
          {importedChapters.includes('14A') ? "Chapter 14A ✓" : "Import Chapter 14A"}
        </Button>
      </div>
    </div>
  );
};

export default QuickImportSection;
