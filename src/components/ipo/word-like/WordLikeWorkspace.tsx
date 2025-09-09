import React, { useState } from 'react';
import { WordLikeEditor } from './WordLikeEditor';
import { EnhancedDocumentToolbar } from './EnhancedDocumentToolbar';
import { WordLikeAIPanel } from './WordLikeAIPanel';
import { CommentsSidebar } from './CommentsSidebar';
import { VersionHistory } from './VersionHistory';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

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
  const [isCommentsSidebarOpen, setIsCommentsSidebarOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [showTrackChanges, setShowTrackChanges] = useState(false);
  const [documentZoom, setDocumentZoom] = useState(100);
  const [viewMode, setViewMode] = useState<'print' | 'web' | 'outline'>('print');

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
      />

      {/* Main workspace */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Main document area */}
          <ResizablePanel 
            defaultSize={isAIPanelOpen ? (isCommentsSidebarOpen ? 50 : 70) : (isCommentsSidebarOpen ? 75 : 100)} 
            minSize={40}
          >
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={isCommentsSidebarOpen ? 75 : 100} minSize={60}>
                <WordLikeEditor
                  content={content}
                  onChange={onContentChange}
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