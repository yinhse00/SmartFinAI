import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Edit3, EyeIcon, RotateCcw, Save, Loader2 } from 'lucide-react';
import { ipoMessageFormatter } from '@/services/ipo/ipoMessageFormatter';

interface DraftContentAreaProps {
  generatedContent: string;
  setGeneratedContent: (content: string) => void;
  isEditMode: boolean;
  setIsEditMode: (mode: boolean) => void;
  isGenerating: boolean;
  isLoading?: boolean;
  onRegenerate: () => void;
  layoutMode?: 'drafting' | 'tab';
}

export const DraftContentArea: React.FC<DraftContentAreaProps> = ({
  generatedContent,
  setGeneratedContent,
  isEditMode,
  setIsEditMode,
  isGenerating,
  isLoading = false,
  onRegenerate,
  layoutMode = 'drafting'
}) => {
  const borderClass = layoutMode === 'drafting' ? 'border-2' : 'border';
  const paddingClass = layoutMode === 'drafting' ? 'p-4' : 'p-3';
  
  // Calculate optimal height to fit content in one screen with proper scrollbar
  const getContentHeight = () => {
    if (layoutMode === 'drafting') {
      // For drafting mode, use viewport height minus header/footer/controls space
      return 'h-[calc(100vh-12rem)] min-h-[400px] max-h-[calc(100vh-12rem)]';
    }
    // For tab mode, use available flex space with fixed constraints
    return 'h-[calc(100vh-16rem)] min-h-[400px] max-h-[calc(100vh-16rem)]';
  };

  return (
    <div className={`flex-1 ${layoutMode === 'drafting' ? 'p-4' : 'p-3'} overflow-hidden`}>
      <div className="h-full flex flex-col">
        {/* Header with controls */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="font-medium text-sm">Draft Content</span>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className="h-7 px-2 text-xs"
            >
              {isEditMode ? (
                <>
                  <EyeIcon className="h-3 w-3 mr-1" />
                  View
                </>
              ) : (
                <>
                  <Edit3 className="h-3 w-3 mr-1" />
                  Edit
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRegenerate}
              disabled={isGenerating}
              className="h-7 px-2 text-xs"
            >
              {isGenerating ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3 mr-1" />
              )}
              Regenerate
            </Button>
            {layoutMode === 'tab' && (
              <Button size="sm" disabled={!generatedContent} className="h-7 px-2 text-xs">
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
            )}
          </div>
        </div>
        
        {/* Content area with proper height constraints */}
        <div className={`flex-1 ${getContentHeight()} relative`}>
          {isEditMode ? (
            <Textarea
              placeholder={layoutMode === 'drafting' 
                ? "Your generated content will appear here. Use the AI chat to request improvements, compliance checks, or refinements..."
                : "Generated content will appear here..."
              }
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              className={`w-full h-full resize-none ${borderClass} focus:ring-2 ${paddingClass} text-sm leading-relaxed overflow-y-scroll scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800`}
            />
          ) : (
            <ScrollArea className={`w-full h-full ${borderClass} rounded-md`} type="always">
              <div className={`${paddingClass} min-h-full w-full`}>
                {isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 mx-auto mb-3 animate-spin opacity-50" />
                    <p className="text-muted-foreground text-sm">Loading existing content...</p>
                  </div>
                ) : generatedContent ? (
                  <div 
                    className="regulatory-content prose prose-sm max-w-none [&_a]:text-inherit [&_a]:underline [&_a]:decoration-dotted [&_a]:underline-offset-2 [&_a]:transition-all [&_a]:duration-200 [&_a:hover]:decoration-solid [&_a:hover]:decoration-finance-accent-green [&_a:visited]:text-inherit [&_a:focus]:outline-2 [&_a:focus]:outline-finance-accent-blue [&_a:focus]:outline-offset-2 [&_a:focus]:rounded-sm"
                    dangerouslySetInnerHTML={{ 
                      __html: ipoMessageFormatter.formatMessage(generatedContent) 
                    }}
                  />
                ) : (
                  <div className="text-muted-foreground text-center py-8">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm font-medium">No content generated yet.</p>
                    <p className="text-xs mt-1">
                      {layoutMode === 'drafting' 
                        ? "Use the AI chat to request improvements, compliance checks, or refinements."
                        : "Generate content using the Input & Generate tab."
                      }
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
          
          {/* Scroll indicator for non-edit mode when content is scrollable */}
          {!isEditMode && generatedContent && (
            <div className="absolute bottom-2 right-6 pointer-events-none">
              <div className="bg-background/80 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-muted-foreground border shadow-sm">
                Scroll to view more
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};