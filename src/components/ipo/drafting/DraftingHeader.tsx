import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, MessageSquare, BarChart3, Download, Loader2 } from 'lucide-react';
import { SectionDropdown } from '../SectionDropdown';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
interface DraftingHeaderProps {
  selectedSection: string;
  onSelectSection: (section: string) => void;
  isChatOpen: boolean;
  onToggleChat: () => void;
  onSave?: () => void;
  onExport?: (format: 'word' | 'pdf' | 'excel' | 'powerpoint') => void;
  isExporting?: boolean;
  isSaving?: boolean;
}
export const DraftingHeader: React.FC<DraftingHeaderProps> = ({
  selectedSection,
  onSelectSection,
  isChatOpen,
  onToggleChat,
  onSave,
  onExport,
  isExporting = false,
  isSaving = false
}) => {
  const handleExport = (format: 'word' | 'pdf' | 'excel' | 'powerpoint') => {
    if (onExport) {
      onExport(format);
    }
  };
  return <div className="border-b bg-background p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <SectionDropdown selectedSection={selectedSection} onSelectSection={onSelectSection} />
          
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isExporting}>
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('word')}>
                Export as Word (.docx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                Export as Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('powerpoint')}>
                Export as PowerPoint (.pptx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          
          
          <Button variant="outline" size="sm" onClick={onToggleChat}>
            <MessageSquare className="h-4 w-4 mr-2" />
            {isChatOpen ? 'Hide' : 'Show'} AI Chat
          </Button>
        </div>
      </div>
    </div>;
};