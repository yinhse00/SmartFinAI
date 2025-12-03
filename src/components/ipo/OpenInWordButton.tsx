import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WordExportService } from '@/services/wordExportService';
import { toast } from 'sonner';

interface OpenInWordButtonProps {
  content: string;
  sectionTitle: string;
  companyName: string;
  sectionType: string;
}

export const OpenInWordButton: React.FC<OpenInWordButtonProps> = ({
  content,
  sectionTitle,
  companyName,
  sectionType,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleExportToWord = async () => {
    if (!content || content.trim().length === 0) {
      toast.error('No content to export');
      return;
    }

    setIsExporting(true);
    try {
      const blob = await WordExportService.exportSectionToWord(
        content,
        sectionTitle,
        companyName
      );
      const filename = WordExportService.generateFilename(companyName, sectionType);
      WordExportService.downloadBlob(blob, filename);
      toast.success('Document exported successfully');
      setShowInstructions(true);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export document');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={isExporting}>
            <FileText className="h-4 w-4 mr-2" />
            {isExporting ? 'Exporting...' : 'Open in Word'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExportToWord}>
            <Download className="h-4 w-4 mr-2" />
            Export & Download .docx
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowInstructions(true)}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Word Add-in Instructions
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Using IPO AI Assistant in Word
            </DialogTitle>
            <DialogDescription>
              Continue editing with AI assistance directly in Microsoft Word
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Setup Instructions:</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Open the downloaded document in Microsoft Word</li>
                <li>Go to <strong>Insert → Get Add-ins → My Add-ins</strong></li>
                <li>Click <strong>"Upload My Add-in"</strong></li>
                <li>Select the <code className="bg-muted px-1 rounded">manifest.xml</code> file from the word-addin folder</li>
                <li>Click <strong>"IPO AI Assistant"</strong> in the Home ribbon</li>
              </ol>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">Features in Word:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• AI analyzes your document for HKEX compliance</li>
                <li>• Suggested changes appear as Track Changes (redlines)</li>
                <li>• Regulatory citations added as Word comments</li>
                <li>• Works with both English and Chinese documents</li>
              </ul>
            </div>

            <div className="text-xs text-muted-foreground">
              <strong>Note:</strong> Requires Microsoft Word 2016 or later, or Word Online.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
