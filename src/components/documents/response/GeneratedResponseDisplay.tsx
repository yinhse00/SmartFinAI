
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import detectAndFormatTables from '@/utils/tableFormatter';

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
        dangerouslySetInnerHTML={{ __html: formattedResponse }}
      />
      <style>{`
        .response-container h1, .response-container h2, .response-container h3 {
          font-weight: bold;
          margin: 1rem 0 0.5rem 0;
        }
        
        .response-container h1 {
          font-size: 1.25rem;
        }
        
        .response-container h2 {
          font-size: 1.125rem;
        }
        
        .response-container h3 {
          font-size: 1rem;
        }
        
        .response-container p {
          margin-bottom: 1rem;
          line-height: 1.5;
        }
        
        .response-container strong {
          font-weight: bold;
        }
        
        .response-container em {
          font-style: italic;
        }
        
        .response-container u {
          text-decoration: underline;
        }
        
        .response-container p.bullet-point {
          margin: 0.25rem 0 0.25rem 1.5rem;
          position: relative;
          padding-left: 1rem;
        }
        
        .response-container .bullet-point:before {
          content: "•";
          position: absolute;
          left: -0.5rem;
        }
        
        .response-container table {
          border-collapse: collapse;
          margin: 1rem 0;
          width: 100%;
        }
        
        .response-container table th,
        .response-container table td {
          border: 1px solid #ddd;
          padding: 8px;
        }
        
        .response-container table th {
          background-color: #f2f2f2;
          font-weight: bold;
          text-align: left;
        }
      `}</style>
    </div>
  );
};

export default GeneratedResponseDisplay;
