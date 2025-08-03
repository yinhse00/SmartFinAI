import React, { useState, useCallback } from 'react';
import { Presentation, PresentationSlide, SlideType, PresentationType } from '@/types/presentation';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { SlideNavigator } from './SlideNavigator';
import { SlideEditor } from './SlideEditor';
import { PresentationHeader } from './PresentationHeader';
import { PresentationAIChat } from './PresentationAIChat';
import { TemplateLibrary } from './TemplateLibrary';
import { usePresentation } from '@/hooks/usePresentation';
import { toast } from 'sonner';

interface PresentationWorkspaceProps {
  projectId?: string;
  presentationType: PresentationType;
  onBack?: () => void;
}

export const PresentationWorkspace: React.FC<PresentationWorkspaceProps> = ({
  projectId,
  presentationType,
  onBack
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);
  const [editMode, setEditMode] = useState<'visual' | 'code'>('visual');

  const {
    presentation,
    isLoading,
    addSlide,
    updateSlide,
    deleteSlide,
    reorderSlides,
    exportPresentation,
    savePresentation
  } = usePresentation({
    projectId,
    presentationType
  });

  const currentSlide = presentation?.slides[currentSlideIndex];

  const handleSlideSelect = useCallback((index: number) => {
    setCurrentSlideIndex(index);
  }, []);

  const handleSlideAdd = useCallback(async (type: SlideType, afterIndex?: number) => {
    try {
      const newSlide = await addSlide(type, afterIndex);
      if (newSlide) {
        setCurrentSlideIndex(afterIndex !== undefined ? afterIndex + 1 : presentation!.slides.length);
        toast.success('Slide added successfully');
      }
    } catch (error) {
      toast.error('Failed to add slide');
    }
  }, [addSlide, presentation]);

  const handleSlideUpdate = useCallback(async (slideId: string, updates: Partial<PresentationSlide>) => {
    try {
      await updateSlide(slideId, updates);
      toast.success('Slide updated');
    } catch (error) {
      toast.error('Failed to update slide');
    }
  }, [updateSlide]);

  const handleSlideDelete = useCallback(async (slideId: string) => {
    try {
      await deleteSlide(slideId);
      if (currentSlideIndex >= presentation!.slides.length - 1) {
        setCurrentSlideIndex(Math.max(0, presentation!.slides.length - 2));
      }
      toast.success('Slide deleted');
    } catch (error) {
      toast.error('Failed to delete slide');
    }
  }, [deleteSlide, currentSlideIndex, presentation]);

  const handleReorderSlides = useCallback(async (fromIndex: number, toIndex: number) => {
    try {
      await reorderSlides(fromIndex, toIndex);
      setCurrentSlideIndex(toIndex);
    } catch (error) {
      toast.error('Failed to reorder slides');
    }
  }, [reorderSlides]);

  const handleExport = useCallback(async (format: 'pptx' | 'pdf') => {
    try {
      await exportPresentation(format);
      toast.success(`Presentation exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export presentation');
    }
  }, [exportPresentation]);

  const handleSave = useCallback(async () => {
    try {
      await savePresentation();
      toast.success('Presentation saved');
    } catch (error) {
      toast.error('Failed to save presentation');
    }
  }, [savePresentation]);

  const handleAISlideGeneration = useCallback(async (prompt: string, slideType?: SlideType) => {
    // This will be implemented by the AI chat component
    const targetType = slideType || 'custom';
    await handleSlideAdd(targetType, currentSlideIndex);
  }, [handleSlideAdd, currentSlideIndex]);

  if (isLoading || !presentation) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading presentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <PresentationHeader
        presentation={presentation}
        onSave={handleSave}
        onExport={handleExport}
        onBack={onBack}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        onToggleTemplates={() => setIsTemplateLibraryOpen(!isTemplateLibraryOpen)}
        isChatOpen={isChatOpen}
        editMode={editMode}
        onEditModeChange={setEditMode}
      />

      {/* Main workspace */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Slide Navigator */}
          <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
            <SlideNavigator
              slides={presentation.slides}
              currentSlideIndex={currentSlideIndex}
              onSlideSelect={handleSlideSelect}
              onSlideAdd={handleSlideAdd}
              onSlideDelete={handleSlideDelete}
              onSlideReorder={handleReorderSlides}
            />
          </ResizablePanel>

          <ResizableHandle />

          {/* Main Editor Area */}
          <ResizablePanel defaultSize={isChatOpen ? 50 : 80} minSize={40}>
            <SlideEditor
              slide={currentSlide}
              presentationType={presentationType}
              editMode={editMode}
              onSlideUpdate={handleSlideUpdate}
            />
          </ResizablePanel>

          {/* AI Chat Panel */}
          {isChatOpen && (
            <>
              <ResizableHandle />
              <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
                <PresentationAIChat
                  presentation={presentation}
                  currentSlide={currentSlide}
                  onSlideGenerate={handleAISlideGeneration}
                  onSlideUpdate={handleSlideUpdate}
                  onClose={() => setIsChatOpen(false)}
                />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>

      {/* Template Library Modal */}
      {isTemplateLibraryOpen && (
        <TemplateLibrary
          presentationType={presentationType}
          onTemplateSelect={(template) => {
            handleSlideAdd(template.type);
            setIsTemplateLibraryOpen(false);
          }}
          onClose={() => setIsTemplateLibraryOpen(false)}
        />
      )}
    </div>
  );
};