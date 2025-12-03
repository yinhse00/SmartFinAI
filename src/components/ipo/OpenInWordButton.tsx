import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Download, HelpCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WordExportService } from '@/services/wordExportService';
import { AddinInstallGuide } from './AddinInstallGuide';
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
  const [showInstallGuide, setShowInstallGuide] = useState(false);

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
      toast.success('Document downloaded! Open it in Word with the AI Assistant add-in.', {
        duration: 5000,
        action: {
          label: 'Setup Guide',
          onClick: () => setShowInstallGuide(true),
        },
      });
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
            {isExporting ? 'Preparing...' : 'Export to Word'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download .docx
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowInstallGuide(true)}>
            <HelpCircle className="h-4 w-4 mr-2" />
            AI Add-in Setup Guide
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddinInstallGuide 
        open={showInstallGuide} 
        onOpenChange={setShowInstallGuide} 
      />
    </>
  );
};