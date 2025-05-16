
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { detectAndFormatTables } from '@/utils/tableFormatter';

interface GeneratedResponseDisplayProps {
  response: string | null;
  isExporting: boolean;
  onDownloadWord: () => Promise<void>;
  onDownloadPdf: () => Promise<void>;
  onDownloadExcel: () => Promise<void>;
}

const GeneratedResponseDisplay = ({
  response,
  isExporting,
  onDownloadWord,
  onDownloadPdf,
  onDownloadExcel,
}: GeneratedResponseDisplayProps) => {
  if (!response) return null;

  // Format response with tables and enhanced paragraph/bullet point formatting
  const formattedResponse = detectAndFormatTables(response);
  
  // Additional formatting for proper bullet point spacing
  const enhancedResponse = formattedResponse
    // Ensure bullet points have proper spacing and structure
    .replace(/<p>([•\-\*])\s+/g, '<p class="bullet-point">$1 ')
    // Add extra paragraph breaks before and after bullet point lists for better readability
    .replace(/(<\/p>)(\s*<p class="bullet-point">)/g, '$1<div class="bullet-list-spacing"></div>$2')
    .replace(/(<\/p class="bullet-point">)(\s*<p[^>]*>)/g, '$1<div class="bullet-list-spacing"></div>$2');

  return (
    <div className="space-y-2 mt-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Generated Response</h4>
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
            <DropdownMenuItem onClick={onDownloadWord} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Word Document</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDownloadPdf} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>PDF Document</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDownloadExcel} className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              <span>Excel Spreadsheet</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div 
        className="p-4 rounded-md bg-gray-50 dark:bg-finance-dark-blue/20 text-sm response-container"
        dangerouslySetInnerHTML={{ __html: enhancedResponse }}
      />
      <style jsx global>{`
        .response-container p {
          margin-bottom: 1rem;
        }
        .response-container p.bullet-point {
          margin-bottom: 0.5rem;
          margin-left: 1rem;
          position: relative;
        }
        .response-container .bullet-point:before {
          content: "•";
          position: absolute;
          left: -1rem;
        }
        .response-container .bullet-list-spacing {
          height: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default GeneratedResponseDisplay;
