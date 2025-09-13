import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { WordLikeEditor } from '@/components/ipo/word-like/WordLikeEditor';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, Edit3, EyeIcon, RotateCcw, Save, Loader2, BarChart3, Zap, AlertTriangle, CheckCircle, TrendingUp, Download, FileType, FileSpreadsheet } from 'lucide-react';
import { documentService } from '@/services/documents/documentService';
import { useToast } from '@/hooks/use-toast';
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
  return <div className={`flex-1 ${layoutMode === 'drafting' ? 'p-4' : 'p-3'} overflow-hidden`}>
      <div className="h-full flex flex-col">
        {/* Enhanced Header with analysis toggle and metrics */}
        
        
        {/* Main Content Area with Resizable Analysis Panel */}
        {showAnalysis && (suggestions.length > 0 || complianceScore) ? <PanelGroup direction="horizontal" className={`flex-1 ${getContentHeight()}`}>
            {/* Main Content Panel */}
            <Panel defaultSize={70} minSize={50}>
              <div className="h-full pr-2">
                {isEditMode ? <div className={`w-full h-full ${borderClass} rounded-md overflow-hidden`}>
                    <WordLikeEditor
                      content={generatedContent}
                      onChange={setGeneratedContent}
                      showTrackChanges={true}
                      zoom={100}
                      viewMode="web"
                      sectionType={sectionType}
                      className="w-full h-full"
                    />
                  </div> : <ScrollArea className={`w-full h-full ${borderClass} rounded-md`} type="always">
                    <div className={`${paddingClass} min-h-full w-full`}>
                      {isLoading ? <div className="text-center py-8">
                          <Loader2 className="h-6 w-6 mx-auto mb-3 animate-spin opacity-50" />
                          <p className="text-muted-foreground text-sm">Loading existing content...</p>
                        </div> : generatedContent ? <div className="regulatory-content prose prose-sm max-w-none [&_a]:text-inherit [&_a]:underline [&_a]:decoration-dotted [&_a]:underline-offset-2 [&_a]:transition-all [&_a]:duration-200 [&_a:hover]:decoration-solid [&_a:hover]:decoration-finance-accent-green [&_a:visited]:text-inherit [&_a:focus]:outline-2 [&_a:focus]:outline-finance-accent-blue [&_a:focus]:outline-offset-2 [&_a:focus]:rounded-sm" dangerouslySetInnerHTML={{
                  __html: ipoMessageFormatter.formatMessage(generatedContent)
                }} /> : <div className="text-muted-foreground text-center py-8">
                          <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                          <p className="text-sm font-medium">No content generated yet.</p>
                          <p className="text-xs mt-1">
                            {layoutMode === 'drafting' ? "Use the AI chat to request improvements, compliance checks, or refinements." : "Generate content using the Input & Generate tab."}
                          </p>
                        </div>}
                    </div>
                  </ScrollArea>}
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
                    {complianceScore && <ComplianceScoring score={complianceScore} />}
                    
                    {/* Smart Suggestions */}
                    {suggestions.length > 0 && <SmartSuggestions suggestions={suggestions} onApplySuggestion={handleApplySuggestion} onDismissSuggestion={dismissSuggestion} />}
                  </div>
                </ScrollArea>
              </div>
            </Panel>
          </PanelGroup> : (/* Single Panel Layout */
      <div className={`flex-1 ${getContentHeight()} relative`}>
            {isEditMode ? <div className={`w-full h-full ${borderClass} rounded-md overflow-hidden`}>
                <WordLikeEditor
                  content={generatedContent}
                  onChange={setGeneratedContent}
                  showTrackChanges={true}
                  zoom={100}
                  viewMode="web"
                  sectionType={sectionType}
                  className="w-full h-full"
                />
              </div> : <ScrollArea className={`w-full h-full ${borderClass} rounded-md`} type="always">
                <div className={`${paddingClass} min-h-full w-full`}>
                  {isLoading ? <div className="text-center py-8">
                      <Loader2 className="h-6 w-6 mx-auto mb-3 animate-spin opacity-50" />
                      <p className="text-muted-foreground text-sm">Loading existing content...</p>
                    </div> : generatedContent ? <div className="regulatory-content prose prose-sm max-w-none [&_a]:text-inherit [&_a]:underline [&_a]:decoration-dotted [&_a]:underline-offset-2 [&_a]:transition-all [&_a]:duration-200 [&_a:hover]:decoration-solid [&_a:hover]:decoration-finance-accent-green [&_a:visited]:text-inherit [&_a:focus]:outline-2 [&_a:focus]:outline-finance-accent-blue [&_a:focus]:outline-offset-2 [&_a:focus]:rounded-sm" dangerouslySetInnerHTML={{
              __html: ipoMessageFormatter.formatMessage(generatedContent)
            }} /> : <div className="text-muted-foreground text-center py-8">
                      <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm font-medium">No content generated yet.</p>
                      <p className="text-xs mt-1">
                        {layoutMode === 'drafting' ? "Use the AI chat to request improvements, compliance checks, or refinements." : "Generate content using the Input & Generate tab."}
                      </p>
                    </div>}
                </div>
              </ScrollArea>}
          </div>)}
      </div>
    </div>;
};