import React, { useState, useCallback } from 'react';
import { WordLikeEditor } from './WordLikeEditor';
import { EnhancedDocumentToolbar } from './EnhancedDocumentToolbar';
import { WordLikeAIPanel } from './WordLikeAIPanel';
import { CommentsSidebar } from './CommentsSidebar';
import { VersionHistory } from './VersionHistory';
import { GuidanceAssessmentPanel } from './GuidanceAssessmentPanel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { TextSelection } from '@/types/textSelection';

interface WordLikeWorkspaceProps {
  projectId: string;
  selectedSection: string;
  onSectionSelect: (section: string) => void;
  content: string;
  onContentChange: (content: string) => void;
  onSave?: () => void;
  onExport?: (format: 'word' | 'pdf' | 'excel' | 'powerpoint') => void;
}

export const WordLikeWorkspace: React.FC<WordLikeWorkspaceProps> = ({
  projectId,
  selectedSection,
  onSectionSelect,
  content,
  onContentChange,
  onSave,
  onExport
}) => {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(true);
  const [isGuidancePanelOpen, setIsGuidancePanelOpen] = useState(true);
  const [isCommentsSidebarOpen, setIsCommentsSidebarOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [showTrackChanges, setShowTrackChanges] = useState(false);
  const [documentZoom, setDocumentZoom] = useState(100);
  const [viewMode, setViewMode] = useState<'print' | 'web' | 'outline'>('print');
  const [currentSelection, setCurrentSelection] = useState<TextSelection | null>(null);

  const handleSelectionUpdate = useCallback((oldText: string, newText: string) => {
    const newContent = content.replace(oldText, newText);
    onContentChange(newContent);
    setCurrentSelection(null);
  }, [content, onContentChange]);

  const getMainPanelSize = () => {
    let totalPanels = 1; // Main document
    if (isAIPanelOpen) totalPanels++;
    if (isGuidancePanelOpen) totalPanels++;
    if (isCommentsSidebarOpen) totalPanels++;
    
    // Calculate proportional sizes
    if (totalPanels === 1) return 100;
    if (totalPanels === 2) return 70;
    if (totalPanels === 3) return 50;
    return 40;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Document Toolbar */}
      <EnhancedDocumentToolbar
        selectedSection={selectedSection}
        onSectionSelect={onSectionSelect}
        onSave={onSave}
        onExport={onExport}
        showTrackChanges={showTrackChanges}
        onToggleTrackChanges={() => setShowTrackChanges(!showTrackChanges)}
        documentZoom={documentZoom}
        onZoomChange={setDocumentZoom}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isAIPanelOpen={isAIPanelOpen}
        onToggleAIPanel={() => setIsAIPanelOpen(!isAIPanelOpen)}
        isCommentsSidebarOpen={isCommentsSidebarOpen}
        onToggleCommentsSidebar={() => setIsCommentsSidebarOpen(!isCommentsSidebarOpen)}
        isVersionHistoryOpen={isVersionHistoryOpen}
        onToggleVersionHistory={() => setIsVersionHistoryOpen(!isVersionHistoryOpen)}
        isGuidancePanelOpen={isGuidancePanelOpen}
        onToggleGuidancePanel={() => setIsGuidancePanelOpen(!isGuidancePanelOpen)}
      />

      {/* Main workspace */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Main document area */}
          <ResizablePanel 
            defaultSize={getMainPanelSize()} 
            minSize={40}
          >
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={isCommentsSidebarOpen ? 75 : 100} minSize={60}>
                <WordLikeEditor
                  content={content}
                  onChange={onContentChange}
                  onSelectionChange={setCurrentSelection}
                  showTrackChanges={showTrackChanges}
                  zoom={documentZoom}
                  viewMode={viewMode}
                  sectionType={selectedSection}
                />
              </ResizablePanel>

              {/* Comments Sidebar */}
              {isCommentsSidebarOpen && (
                <>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
                    <CommentsSidebar
                      projectId={projectId}
                      sectionType={selectedSection}
                      onClose={() => setIsCommentsSidebarOpen(false)}
                    />
                  </ResizablePanel>
                </>
              )}
            </ResizablePanelGroup>
          </ResizablePanel>

          {/* Guidance Assessment Panel */}
          {isGuidancePanelOpen && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
                <GuidanceAssessmentPanel
                  content={content}
                  sectionType={selectedSection}
                  isVisible={isGuidancePanelOpen}
                />
              </ResizablePanel>
            </>
          )}

          {/* AI Panel */}
          {isAIPanelOpen && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
                {isVersionHistoryOpen ? (
                  <VersionHistory
                    projectId={projectId}
                    sectionType={selectedSection}
                    onClose={() => setIsVersionHistoryOpen(false)}
                  />
                ) : (
                  <WordLikeAIPanel
                    projectId={projectId}
                    selectedSection={selectedSection}
                    currentContent={content}
                    onContentUpdate={onContentChange}
                    onClose={() => setIsAIPanelOpen(false)}
                    currentSelection={currentSelection}
                    onSelectionUpdate={handleSelectionUpdate}
                  />
                )}
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
};