import React from 'react';
import { Button } from '@/components/ui/button';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { IPOContentGenerationResponse } from '@/types/ipo';

interface SourcesFooterProps {
  lastGeneratedResponse: IPOContentGenerationResponse | null;
  onViewSources: () => void;
}

export const SourcesFooter: React.FC<SourcesFooterProps> = ({
  lastGeneratedResponse,
  onViewSources
}) => {
  if (!lastGeneratedResponse?.sources || lastGeneratedResponse.sources.length === 0) {
    return null;
  }

  return (
    <div className="border-t bg-muted/30 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4" />
          <span className="text-sm font-medium">
            {lastGeneratedResponse.sources.length} source{lastGeneratedResponse.sources.length !== 1 ? 's' : ''} referenced
          </span>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onViewSources}
        >
          View Sources
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
};