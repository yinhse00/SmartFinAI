import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SectionDropdown } from '../SectionDropdown';
import { 
  Save, 
  Download, 
  MessageSquare, 
  FileText, 
  History, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  Layout, 
  Users,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Table,
  Image,
  Loader2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

interface DocumentToolbarProps {
  selectedSection: string;
  onSectionSelect: (section: string) => void;
  onSave?: () => void;
  onExport?: (format: 'word' | 'pdf' | 'excel' | 'powerpoint') => void;
  showTrackChanges: boolean;
  onToggleTrackChanges: () => void;
  documentZoom: number;
  onZoomChange: (zoom: number) => void;
  viewMode: 'print' | 'web' | 'outline';
  onViewModeChange: (mode: 'print' | 'web' | 'outline') => void;
  isAIPanelOpen: boolean;
  onToggleAIPanel: () => void;
  isCommentsSidebarOpen: boolean;
  onToggleCommentsSidebar: () => void;
  isVersionHistoryOpen: boolean;
  onToggleVersionHistory: () => void;
  isExporting?: boolean;
  isSaving?: boolean;
}

export const DocumentToolbar: React.FC<DocumentToolbarProps> = ({
  selectedSection,
  onSectionSelect,
  onSave,
  onExport,
  showTrackChanges,
  onToggleTrackChanges,
  documentZoom,
  onZoomChange,
  viewMode,
  onViewModeChange,
  isAIPanelOpen,
  onToggleAIPanel,
  isCommentsSidebarOpen,
  onToggleCommentsSidebar,
  isVersionHistoryOpen,
  onToggleVersionHistory,
  isExporting = false,
  isSaving = false
}) => {
  const handleExport = (format: 'word' | 'pdf' | 'excel' | 'powerpoint') => {
    if (onExport) {
      onExport(format);
    }
  };

  const zoomOptions = [50, 75, 100, 125, 150, 200];

  return (
    <div className="border-b bg-background">
      {/* Main toolbar */}
      <div className="px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left section - Document info and section selector */}
          <div className="flex items-center gap-4">
            <SectionDropdown 
              selectedSection={selectedSection} 
              onSelectSection={onSectionSelect} 
            />
            <Badge variant="outline" className="text-xs">
              Word-like Editor
            </Badge>
          </div>

          {/* Right section - Actions */}
          <div className="flex items-center gap-2">
            {/* Save */}
            <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isSaving ? 'Saving...' : 'Save'}
            </Button>

            {/* Export */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isExporting}>
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleExport('word')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as Word (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('pdf')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('excel')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('powerpoint')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PowerPoint (.pptx)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Separator orientation="vertical" className="h-6" />

            {/* View controls */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  onClick={() => onViewModeChange('print')}
                  className={viewMode === 'print' ? 'bg-accent' : ''}
                >
                  <Layout className="h-4 w-4 mr-2" />
                  Print Layout
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onViewModeChange('web')}
                  className={viewMode === 'web' ? 'bg-accent' : ''}
                >
                  <Layout className="h-4 w-4 mr-2" />
                  Web Layout
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onViewModeChange('outline')}
                  className={viewMode === 'outline' ? 'bg-accent' : ''}
                >
                  <Layout className="h-4 w-4 mr-2" />
                  Outline
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Zoom controls */}
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onZoomChange(Math.max(50, documentZoom - 25))}
                disabled={documentZoom <= 50}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="min-w-[70px]">
                    {documentZoom}%
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {zoomOptions.map((zoom) => (
                    <DropdownMenuItem 
                      key={zoom}
                      onClick={() => onZoomChange(zoom)}
                      className={documentZoom === zoom ? 'bg-accent' : ''}
                    >
                      {zoom}%
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onZoomChange(Math.min(200, documentZoom + 25))}
                disabled={documentZoom >= 200}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* Collaboration features */}
            <Button 
              variant={showTrackChanges ? "default" : "outline"} 
              size="sm"
              onClick={onToggleTrackChanges}
            >
              <Users className="h-4 w-4 mr-2" />
              Track Changes
            </Button>

            <Button 
              variant={isCommentsSidebarOpen ? "default" : "outline"} 
              size="sm"
              onClick={onToggleCommentsSidebar}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Comments
            </Button>

            <Button 
              variant={isVersionHistoryOpen ? "default" : "outline"} 
              size="sm"
              onClick={onToggleVersionHistory}
            >
              <History className="h-4 w-4 mr-2" />
              History
            </Button>

            <Button 
              variant={isAIPanelOpen ? "default" : "outline"} 
              size="sm"
              onClick={onToggleAIPanel}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              AI Assistant
            </Button>
          </div>
        </div>
      </div>

      {/* Quick formatting toolbar */}
      <div className="px-4 py-1 border-t bg-muted/30">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Redo className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-4 mx-1" />
          
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Underline className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-4 mx-1" />
          
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <AlignRight className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-4 mx-1" />
          
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <ListOrdered className="h-4 w-4" />
          </Button>
          
          <Separator orientation="vertical" className="h-4 mx-1" />
          
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Table className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
            <Image className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};