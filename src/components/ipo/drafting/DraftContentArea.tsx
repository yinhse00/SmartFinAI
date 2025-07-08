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
  const paddingClass = layoutMode === 'drafting' ? 'p-6' : 'p-4';

  return (
    <div className="flex-1 p-6">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <span className="font-medium">Draft Content</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              {isEditMode ? (
                <>
                  <EyeIcon className="h-4 w-4 mr-2" />
                  View
                </>
              ) : (
                <>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onRegenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Regenerate
            </Button>
            {layoutMode === 'tab' && (
              <Button size="sm" disabled={!generatedContent}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            )}
          </div>
        </div>
        
        {isEditMode ? (
          <Textarea
            placeholder={layoutMode === 'drafting' 
              ? "Your generated content will appear here. Use the AI chat to request improvements, compliance checks, or refinements..."
              : "Generated content will appear here..."
            }
            value={generatedContent}
            onChange={(e) => setGeneratedContent(e.target.value)}
            className={`flex-1 resize-none ${borderClass} focus:ring-2 ${paddingClass} text-base leading-relaxed`}
          />
        ) : (
          <ScrollArea className={`flex-1 ${borderClass} rounded-md`}>
            <div className={`${paddingClass}`}>
              {isLoading ? (
                <div className="text-center py-12">
                  <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin opacity-50" />
                  <p className="text-muted-foreground">Loading existing content...</p>
                </div>
              ) : generatedContent ? (
                <div 
                  className="regulatory-content prose prose-lg max-w-none [&_a]:text-inherit [&_a]:underline [&_a]:decoration-dotted [&_a]:underline-offset-2 [&_a]:transition-all [&_a]:duration-200 [&_a:hover]:decoration-solid [&_a:hover]:decoration-finance-accent-green [&_a:visited]:text-inherit [&_a:focus]:outline-2 [&_a:focus]:outline-finance-accent-blue [&_a:focus]:outline-offset-2 [&_a:focus]:rounded-sm"
                  dangerouslySetInnerHTML={{ 
                    __html: ipoMessageFormatter.formatMessage(generatedContent) 
                  }}
                />
              ) : (
                <div className="text-muted-foreground text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No content generated yet.</p>
                  <p className="text-sm">
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
      </div>
    </div>
  );
};