import React, { useState } from 'react';
import { IPOChapterNavigation } from './IPOChapterNavigation';
import { IPODraftingArea } from './IPODraftingArea';
import { IPOAIChat } from './IPOAIChat';
import { IPOProject } from '@/types/ipo';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings, Edit3, FileText } from 'lucide-react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { IPOInputGenerateLayout } from './IPOInputGenerateLayout';

interface IPOProspectusWorkspaceProps {
  project: IPOProject;
  onSwitchProject: () => void;
}

type LayoutMode = 'input-generate' | 'drafting';

export const IPOProspectusWorkspace: React.FC<IPOProspectusWorkspaceProps> = ({
  project,
  onSwitchProject
}) => {
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(true);
  const [chatContent, setChatContent] = useState<string>('');
  const [chatContentUpdater, setChatContentUpdater] = useState<((content: string) => void) | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('input-generate');

  const handlePassContentToChat = (content: string, onUpdate: (newContent: string) => void) => {
    setChatContent(content);
    setChatContentUpdater(() => onUpdate);
  };

  const handleChatContentUpdate = (newContent: string) => {
    if (chatContentUpdater) {
      chatContentUpdater(newContent);
    }
  };

  const handleContentGenerated = () => {
    // Auto-switch to drafting layout when content is generated
    setLayoutMode('drafting');
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onSwitchProject}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Projects
            </Button>
            <div>
              <h1 className="text-lg font-semibold">{project.company_name}</h1>
              <p className="text-sm text-muted-foreground">{project.project_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Layout Switcher */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Button
                variant={layoutMode === 'input-generate' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLayoutMode('input-generate')}
                className="h-7 px-3"
              >
                <Edit3 className="h-3 w-3 mr-1" />
                Input & Generate
              </Button>
              <Button
                variant={layoutMode === 'drafting' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setLayoutMode('drafting')}
                className="h-7 px-3"
              >
                <FileText className="h-3 w-3 mr-1" />
                Draft & Edit
              </Button>
            </div>
            
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Project Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Main workspace */}
      <div className="flex-1 overflow-hidden">
        {layoutMode === 'input-generate' ? (
          // Layout 1: Input & Generate Mode
          <IPOInputGenerateLayout
            projectId={project.id}
            selectedSection={selectedSection}
            onSectionSelect={setSelectedSection}
            onContentGenerated={handleContentGenerated}
          />
        ) : (
          // Layout 2: Drafting Mode
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Chapter Navigation Panel */}
            <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
              <IPOChapterNavigation
                projectId={project.id}
                selectedSection={selectedSection}
                onSelectSection={setSelectedSection}
              />
            </ResizablePanel>

            <ResizableHandle />

            {/* Main Drafting Screen */}
            <ResizablePanel defaultSize={isChatPanelOpen ? 50 : 80} minSize={40}>
              <IPODraftingArea
                projectId={project.id}
                selectedSection={selectedSection}
                onToggleChat={() => setIsChatPanelOpen(!isChatPanelOpen)}
                isChatOpen={isChatPanelOpen}
                onPassContentToChat={handlePassContentToChat}
                layoutMode="drafting"
              />
            </ResizablePanel>

            {/* AI Chat Panel */}
            {isChatPanelOpen && (
              <>
                <ResizableHandle />
                <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
                  <IPOAIChat
                    projectId={project.id}
                    selectedSection={selectedSection}
                    currentContent={chatContent}
                    onContentUpdate={handleChatContentUpdate}
                    onClose={() => setIsChatPanelOpen(false)}
                  />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
};