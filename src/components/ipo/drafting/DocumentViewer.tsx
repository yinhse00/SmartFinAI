import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  X, 
  FileText, 
  Download, 
  Copy, 
  Lightbulb,
  ExternalLink,
  Search,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentViewerProps {
  document: any;
  onClose: () => void;
  onTextSelect?: (text: string) => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onClose,
  onTextSelect
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selected = selection?.toString().trim();
    if (selected && selected.length > 10) {
      setSelectedText(selected);
    }
  };

  const handleUseSelectedText = () => {
    if (selectedText && onTextSelect) {
      onTextSelect(selectedText);
      setSelectedText('');
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const highlightSearchTerm = (text: string) => {
    if (!searchTerm || !text) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Document Viewer
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <div className="font-medium text-sm truncate" title={document.document_name}>
            {document.document_name}
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {document.document_type}
            </Badge>
            <Badge 
              variant={document.processing_status === 'completed' ? 'default' : 'secondary'} 
              className="text-xs"
            >
              {document.processing_status}
            </Badge>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search in document..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm bg-background"
          />
        </div>
      </CardHeader>

      {/* Selected Text Action */}
      {selectedText && (
        <div className="mx-4 mb-2 p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">
                Selected Text
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400 line-clamp-2">
                "{selectedText}"
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleUseSelectedText}
                className="h-6 px-2 text-xs"
              >
                <ArrowRight className="h-3 w-3 mr-1" />
                Use
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyText(selectedText)}
                className="h-6 px-2 text-xs"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <CardContent className="flex-1 overflow-hidden p-4 space-y-4">
        {/* Key Insights */}
        {document.key_insights && document.key_insights.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4" />
              Key Insights
            </div>
            <div className="space-y-2">
              {document.key_insights.slice(0, 3).map((insight: any, index: number) => (
                <div key={index} className="p-2 bg-muted/40 rounded text-xs">
                  <div className="font-medium mb-1">{insight.category || 'Insight'}</div>
                  <div className="text-muted-foreground">{insight.content || insight}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Document Content */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Document Content</div>
            <div className="flex gap-1">
              {document.file_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(document.file_url, '_blank')}
                  className="h-6 px-2 text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Open
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopyText(document.extracted_content || '')}
                className="h-6 px-2 text-xs"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-[300px] border rounded-md">
            <div className="p-3">
              {document.extracted_content ? (
                <div 
                  className="text-sm whitespace-pre-wrap leading-relaxed select-text"
                  onMouseUp={handleTextSelection}
                  dangerouslySetInnerHTML={{
                    __html: highlightSearchTerm(document.extracted_content)
                  }}
                />
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  {document.processing_status === 'processing' ? (
                    <div>
                      <div className="animate-spin h-4 w-4 border-2 border-primary rounded-full border-t-transparent mx-auto mb-2" />
                      Processing document content...
                    </div>
                  ) : document.processing_status === 'error' ? (
                    'Error processing document content'
                  ) : (
                    'No content available'
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Usage Tips */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
          <div>• Select text in the document to extract to input fields</div>
          <div>• Use search to find specific information quickly</div>
          <div>• Key insights are automatically extracted from the document</div>
        </div>
      </CardContent>
    </Card>
  );
};