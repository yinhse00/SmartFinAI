import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, ExternalLink, Monitor } from 'lucide-react';
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
import { tempDocumentService } from '@/services/tempDocumentService';
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

  const handleOpenInWord = async () => {
    if (!content || content.trim().length === 0) {
      toast.error('No content to export');
      return;
    }

    setIsExporting(true);
    let blob: Blob | null = null;
    let filename = '';

    try {
      // 1. Generate the document
      blob = await WordExportService.exportSectionToWord(
        content,
        sectionTitle,
        companyName
      );
      filename = WordExportService.generateFilename(companyName, sectionType);

      // 2. Upload to temporary storage to get a public URL
      toast.info('Preparing document...');
      const { url } = await tempDocumentService.uploadTempDocument(blob, filename);

      // 3. Launch Word Desktop using protocol handler
      toast.info('Opening in Word...');
      const launched = await tempDocumentService.launchWordDesktop(url);

      if (launched) {
        toast.success('Word is opening! The AI Assistant will auto-open in the sidebar.');
      }

    } catch (error) {
      console.error('Failed to open in Word:', error);
      toast.error('Could not launch Word directly');
      
      // Fallback: download the file
      if (blob && filename) {
        toast.info('Downloading file instead...');
        WordExportService.downloadBlob(blob, filename);
        setShowInstructions(true);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownload = async () => {
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
      toast.success('Document downloaded');
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
            {isExporting ? 'Preparing...' : 'Open in Word'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleOpenInWord}>
            <Monitor className="h-4 w-4 mr-2" />
            Open in Word Desktop
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download .docx
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowInstructions(true)}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Add-in Setup Instructions
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              IPO AI Assistant in Word
            </DialogTitle>
            <DialogDescription>
              Get AI assistance directly in Microsoft Word Desktop
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Monitor className="h-4 w-4" />
                One-Click Experience (Recommended)
              </h4>
              <p className="text-sm text-muted-foreground">
                Once you install the IPO AI Assistant add-in from Microsoft AppSource, 
                clicking "Open in Word Desktop" will automatically launch Word with the 
                AI Assistant panel ready to help!
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">Manual Setup (First Time Only):</h4>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Open the document in Microsoft Word</li>
                <li>Go to <strong>Insert → Get Add-ins → My Add-ins</strong></li>
                <li>Click <strong>"Upload My Add-in"</strong></li>
                <li>Select the <code className="bg-muted px-1 rounded">manifest.xml</code> file</li>
                <li>Click <strong>"IPO AI Assistant"</strong> in the Home ribbon</li>
              </ol>
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2">Features in Word:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• AI analyzes your document for HKEX compliance</li>
                <li>• Suggested changes appear as Track Changes</li>
                <li>• Regulatory citations added as Word comments</li>
                <li>• Task pane auto-opens for future documents</li>
              </ul>
            </div>

            <div className="text-xs text-muted-foreground">
              <strong>Note:</strong> Requires Microsoft Word 2016 or later on Windows/Mac.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
