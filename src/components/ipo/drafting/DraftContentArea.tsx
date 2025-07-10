import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Edit3, EyeIcon, RotateCcw, Save, Loader2, 
  BarChart3, Zap, AlertTriangle, CheckCircle, TrendingUp 
} from 'lucide-react';
import { ipoMessageFormatter } from '@/services/ipo/ipoMessageFormatter';
import { useRealTimeAnalysis } from '@/hooks/useRealTimeAnalysis';
import { SmartSuggestions } from '@/components/ipo/analysis/SmartSuggestions';
import { ComplianceScoring } from '@/components/ipo/analysis/ComplianceScoring';

interface DraftContentAreaProps {
  generatedContent: string;
  setGeneratedContent: (content: string) => void;
  isEditMode: boolean;
  setIsEditMode: (mode: boolean) => void;
  isGenerating: boolean;
  isLoading?: boolean;
  onRegenerate: () => void;
  layoutMode?: 'drafting' | 'tab';
  sectionType: string;
}

export const DraftContentArea: React.FC<DraftContentAreaProps> = ({
  generatedContent,
  setGeneratedContent,
  isEditMode,
  setIsEditMode,
  isGenerating,
  isLoading = false,
  onRegenerate,
  layoutMode = 'drafting',
  sectionType
}) => {
  const [showAnalysis, setShowAnalysis] = useState(true);
  
  // Real-time analysis hook
  const {
    suggestions,
    complianceScore,
    isAnalyzing,
    applySuggestion,
    dismissSuggestion,
    totalSuggestions,
    errorCount,
    warningCount,
    wordCount
  } = useRealTimeAnalysis({
    content: generatedContent,
    sectionType,
    isEnabled: showAnalysis && !!generatedContent.trim()
  });

  const borderClass = layoutMode === 'drafting' ? 'border-2' : 'border';
  const paddingClass = layoutMode === 'drafting' ? 'p-4' : 'p-3';
  
  // Calculate optimal height to fit content in one screen with proper scrollbar
  const getContentHeight = () => {
    if (layoutMode === 'drafting') {
      return showAnalysis ? 'h-[calc(100vh-16rem)]' : 'h-[calc(100vh-12rem)]';
    }
    return showAnalysis ? 'h-[calc(100vh-20rem)]' : 'h-[calc(100vh-16rem)]';
  };

  const handleApplySuggestion = (suggestion: any) => {
    applySuggestion(suggestion, setGeneratedContent);
  };

  return (
    <div className={`flex-1 ${layoutMode === 'drafting' ? 'p-4' : 'p-3'} overflow-hidden`}>
      <div className="h-full flex flex-col">
        {/* Enhanced Header with analysis toggle and metrics */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="font-medium text-sm">Draft Content</span>
            {wordCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {wordCount} words
              </Badge>
            )}
            {isAnalyzing && (
              <Badge variant="outline" className="text-xs animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Analyzing
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {/* Analysis Status Indicators */}
            {totalSuggestions > 0 && (
              <div className="flex items-center gap-1 mr-2">
                {errorCount > 0 && (
                  <Badge variant="destructive" className="text-xs h-5">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {errorCount}
                  </Badge>
                )}
                {warningCount > 0 && (
                  <Badge variant="secondary" className="text-xs h-5 bg-yellow-100 text-yellow-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {warningCount}
                  </Badge>
                )}
                {complianceScore && (
                  <Badge 
                    variant={complianceScore.overall >= 80 ? "default" : "outline"} 
                    className="text-xs h-5"
                  >
                    <BarChart3 className="h-3 w-3 mr-1" />
                    {complianceScore.overall}%
                  </Badge>
                )}
              </div>
            )}

            {/* Analysis Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAnalysis(!showAnalysis)}
              className="h-7 px-2 text-xs"
            >
              <Zap className="h-3 w-3 mr-1" />
              Analysis
            </Button>

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
        
        {/* Main Content Area with Resizable Analysis Panel */}
        {showAnalysis && (suggestions.length > 0 || complianceScore) ? (
          <PanelGroup direction="horizontal" className={`flex-1 ${getContentHeight()}`}>
            {/* Main Content Panel */}
            <Panel defaultSize={70} minSize={50}>
              <div className="h-full pr-2">
                {isEditMode ? (
                  <Textarea
                    placeholder={layoutMode === 'drafting' 
                      ? "Your generated content will appear here. Use the AI chat to request improvements, compliance checks, or refinements..."
                      : "Generated content will appear here..."
                    }
                    value={generatedContent}
                    onChange={(e) => setGeneratedContent(e.target.value)}
                    className={`w-full h-full resize-none ${borderClass} focus:ring-2 ${paddingClass} text-sm leading-relaxed`}
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
              </div>
            </Panel>

            {/* Resize Handle */}
            <PanelResizeHandle className="w-1 bg-border hover:bg-border/80 transition-colors" />

            {/* Analysis Panel */}
            <Panel defaultSize={30} minSize={25} maxSize={40}>
              <div className="h-full pl-2">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {/* Compliance Scoring */}
                    {complianceScore && (
                      <ComplianceScoring score={complianceScore} />
                    )}
                    
                    {/* Smart Suggestions */}
                    {suggestions.length > 0 && (
                      <SmartSuggestions
                        suggestions={suggestions}
                        onApplySuggestion={handleApplySuggestion}
                        onDismissSuggestion={dismissSuggestion}
                      />
                    )}
                  </div>
                </ScrollArea>
              </div>
            </Panel>
          </PanelGroup>
        ) : (
          /* Single Panel Layout */
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
          </div>
        )}
      </div>
    </div>
  );
};