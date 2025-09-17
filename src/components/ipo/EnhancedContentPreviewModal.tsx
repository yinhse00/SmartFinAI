import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, FileText, Zap, Layers, Target } from 'lucide-react';
import { smartContentMerger, MergeStrategy } from '@/services/ipo/smartContentMerger';
import { contentExtractor, ContentSegment } from '@/services/ipo/contentExtractor';

interface EnhancedContentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (strategy: MergeStrategy, segments?: string[]) => void;
  beforeContent: string;
  aiSuggestion: string;
  confidence: number;
  title?: string;
  description?: string;
}

export const EnhancedContentPreviewModal: React.FC<EnhancedContentPreviewModalProps> = ({
  isOpen,
  onClose,
  onApply,
  beforeContent,
  aiSuggestion,
  confidence,
  title = "Apply AI Suggestion",
  description = "Choose how to apply the AI suggestion to your draft."
}) => {
  const [selectedStrategy, setSelectedStrategy] = useState<MergeStrategy['type']>('append');
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  const [previewContent, setPreviewContent] = useState('');
  const [extractedContent, setExtractedContent] = useState<ReturnType<typeof contentExtractor.extractImplementableContent> | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Extract implementable content and auto-detect strategy
      const extracted = contentExtractor.extractImplementableContent(aiSuggestion);
      setExtractedContent(extracted);
      
      const autoStrategy = smartContentMerger.analyzeBestMergeStrategy(beforeContent, extracted.implementableContent);
      setSelectedStrategy(autoStrategy.type);
      
      // Select all implementable segments by default
      const implementableIds = extracted.segments
        .filter(seg => seg.isImplementable)
        .map(seg => seg.id);
      setSelectedSegments(implementableIds);
      
      updatePreview(autoStrategy.type, implementableIds, extracted);
    }
  }, [isOpen, aiSuggestion, beforeContent]);

  const updatePreview = (strategy: MergeStrategy['type'], segments: string[], extracted: typeof extractedContent) => {
    if (!extracted) return;
    
    const selectedContent = extracted.segments
      .filter(seg => segments.includes(seg.id))
      .map(seg => seg.content)
      .join('\n\n');
    
    const strategyObj: MergeStrategy = { type: strategy, preserveStructure: true };
    const preview = smartContentMerger.generateMergePreview(beforeContent, selectedContent, strategyObj);
    setPreviewContent(preview.merged);
  };

  const handleStrategyChange = (strategy: MergeStrategy['type']) => {
    setSelectedStrategy(strategy);
    updatePreview(strategy, selectedSegments, extractedContent);
  };

  const handleSegmentToggle = (segmentId: string) => {
    const newSelection = selectedSegments.includes(segmentId)
      ? selectedSegments.filter(id => id !== segmentId)
      : [...selectedSegments, segmentId];
    
    setSelectedSegments(newSelection);
    updatePreview(selectedStrategy, newSelection, extractedContent);
  };

  const handleApply = () => {
    const strategy: MergeStrategy = { type: selectedStrategy, preserveStructure: true };
    const selectedContent = extractedContent?.segments
      .filter(seg => selectedSegments.includes(seg.id))
      .map(seg => seg.content) || [];
    
    onApply(strategy, selectedContent);
    onClose();
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const strategyOptions = [
    { value: 'append', label: 'Add to End', icon: '📝', description: 'Add content at the end of current section' },
    { value: 'prepend', label: 'Add to Beginning', icon: '⬆️', description: 'Add content at the beginning' },
    { value: 'merge-paragraphs', label: 'Merge Intelligently', icon: '🔄', description: 'Integrate with existing content' },
    { value: 'replace-section', label: 'Replace Section', icon: '🔄', description: 'Replace similar content' },
    { value: 'enhance-existing', label: 'Enhance Content', icon: '✨', description: 'Improve existing text' }
  ];

  if (!extractedContent) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {title}
              <Badge variant="outline" className={getConfidenceColor(confidence)}>
                {Math.round(confidence * 100)}% confidence
              </Badge>
            </DialogTitle>
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </DialogHeader>

        <Tabs defaultValue="strategy" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="strategy">Merge Strategy</TabsTrigger>
            <TabsTrigger value="segments">Select Content</TabsTrigger>
            <TabsTrigger value="preview">Preview Result</TabsTrigger>
          </TabsList>

          <TabsContent value="strategy" className="mt-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">How should this suggestion be applied?</label>
                <Select value={selectedStrategy} onValueChange={handleStrategyChange}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {strategyOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <span>{option.icon}</span>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-muted rounded-lg">
                <h4 className="text-sm font-medium mb-2">Content Analysis</h4>
                <div className="space-y-2 text-sm">
                  <div>Content Type: <Badge variant="outline">{extractedContent.contentType}</Badge></div>
                  <div>Implementable Segments: {extractedContent.segments.filter(s => s.isImplementable).length}</div>
                  <div>Has Commentary: {extractedContent.hasCommentary ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="segments" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Select content to implement:</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allImplementable = extractedContent.segments
                      .filter(s => s.isImplementable)
                      .map(s => s.id);
                    setSelectedSegments(
                      selectedSegments.length === allImplementable.length ? [] : allImplementable
                    );
                    updatePreview(selectedStrategy, 
                      selectedSegments.length === allImplementable.length ? [] : allImplementable, 
                      extractedContent);
                  }}
                >
                  {selectedSegments.length === extractedContent.segments.filter(s => s.isImplementable).length 
                    ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {extractedContent.segments.map(segment => (
                    <div
                      key={segment.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        segment.isImplementable
                          ? selectedSegments.includes(segment.id)
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-muted'
                          : 'bg-muted/50 cursor-not-allowed'
                      }`}
                      onClick={() => segment.isImplementable && handleSegmentToggle(segment.id)}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={selectedSegments.includes(segment.id)}
                          disabled={!segment.isImplementable}
                          onChange={() => {}}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {segment.type}
                            </Badge>
                            {!segment.isImplementable && (
                              <Badge variant="secondary" className="text-xs">
                                Commentary
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm">{segment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="grid grid-cols-2 gap-4 h-80">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Current Content
                </h4>
                <ScrollArea className="h-64 border rounded-md p-3 bg-muted/50">
                  <div className="text-sm whitespace-pre-wrap">{beforeContent}</div>
                </ScrollArea>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Result After Merge
                </h4>
                <ScrollArea className="h-64 border rounded-md p-3 bg-muted/50">
                  <div className="text-sm whitespace-pre-wrap">{previewContent}</div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex justify-between">
          <div className="text-xs text-muted-foreground">
            {selectedSegments.length} of {extractedContent.segments.filter(s => s.isImplementable).length} segments selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleApply} 
              disabled={selectedSegments.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Apply Selected ({selectedSegments.length})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};