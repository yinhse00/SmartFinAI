
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import { RegulationProvision } from '@/services/database/types';

interface ChapterListProps {
  provisionsByChapter: Record<string, RegulationProvision[]>;
  isLoading: boolean;
  onViewProvision: (provision: RegulationProvision) => void;
}

const ChapterList = ({ provisionsByChapter, isLoading, onViewProvision }: ChapterListProps) => {
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  const toggleChapter = (chapter: string) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapter]: !prev[chapter]
    }));
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-finance-medium-blue" />
      </div>
    );
  }

  if (Object.keys(provisionsByChapter).length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No provisions found for this category
      </div>
    );
  }

  return (
    <div className="space-y-2 border rounded-md">
      {Object.keys(provisionsByChapter).sort().map((chapter) => (
        <div key={chapter} className="border-b last:border-b-0">
          <Button
            variant="ghost"
            className="w-full justify-between rounded-none h-auto py-3 px-4"
            onClick={() => toggleChapter(chapter)}
          >
            <span className="font-medium">{chapter}</span>
            {expandedChapters[chapter] ? 
              <ChevronDown className="h-4 w-4" /> : 
              <ChevronRight className="h-4 w-4" />
            }
          </Button>
          
          {expandedChapters[chapter] && (
            <div className="px-4 py-2 space-y-1 bg-slate-50 dark:bg-slate-900">
              {provisionsByChapter[chapter].map((provision) => (
                <Button
                  key={provision.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left text-sm"
                  onClick={() => onViewProvision(provision)}
                >
                  <span className="font-mono mr-2">{provision.rule_number}</span>
                  {provision.title}
                </Button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ChapterList;
