
import { Button } from '@/components/ui/button';
import { Download, FileText, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface TranslatedOutputProps {
  translatedContent: string | null;
  isExporting: boolean;
  handleDownload: (format: 'word' | 'pdf') => Promise<void>;
}

const TranslatedOutput = ({ 
  translatedContent, 
  isExporting, 
  handleDownload
}: TranslatedOutputProps) => {
  if (!translatedContent) return null;

  return (
    <div className="space-y-2 mt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Translated Content</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex items-center gap-1"
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  <span>Export As</span>
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleDownload('word')} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Word Document</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload('pdf')} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>PDF Document</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="p-4 rounded-md bg-gray-50 dark:bg-finance-dark-blue/20 text-sm whitespace-pre-line">
        {translatedContent}
      </div>
    </div>
  );
};

export default TranslatedOutput;
