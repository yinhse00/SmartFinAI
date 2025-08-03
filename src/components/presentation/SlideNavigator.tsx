import React, { useState } from 'react';
import { PresentationSlide, SlideType } from '@/types/presentation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  MoreVertical, 
  Copy, 
  Trash2,
  MoveUp,
  MoveDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SlideTypeSelector } from './SlideTypeSelector';
import { cn } from '@/lib/utils';

interface SlideNavigatorProps {
  slides: PresentationSlide[];
  currentSlideIndex: number;
  onSlideSelect: (index: number) => void;
  onSlideAdd: (type: SlideType, afterIndex?: number) => void;
  onSlideDelete: (slideId: string) => void;
  onSlideReorder: (fromIndex: number, toIndex: number) => void;
}

export const SlideNavigator: React.FC<SlideNavigatorProps> = ({
  slides,
  currentSlideIndex,
  onSlideSelect,
  onSlideAdd,
  onSlideDelete,
  onSlideReorder
}) => {
  const [isAddSlideDialogOpen, setIsAddSlideDialogOpen] = useState(false);

  const handleSlideTypeSelect = (type: SlideType) => {
    onSlideAdd(type, currentSlideIndex);
    setIsAddSlideDialogOpen(false);
  };

  const getSlidePreview = (slide: PresentationSlide) => {
    const title = slide.content.title || slide.title || 'Untitled Slide';
    const bulletCount = slide.content.bulletPoints?.length || 0;
    const hasVisuals = (slide.content.visualElements?.length || 0) > 0;
    
    return {
      title: title.length > 20 ? title.substring(0, 20) + '...' : title,
      bulletCount,
      hasVisuals
    };
  };

  const getSlideTypeIcon = (type: SlideType) => {
    const icons = {
      title: '🏆',
      agenda: '📋',
      executive_summary: '⭐',
      business_overview: '🏢',
      financial_highlights: '📊',
      market_opportunity: '🎯',
      competitive_advantages: '🚀',
      use_of_proceeds: '💰',
      management_team: '👥',
      risk_factors: '⚠️',
      credentials: '🏅',
      contact: '📞',
      appendix: '📄',
      custom: '📝'
    };
    return icons[type] || '📝';
  };

  return (
    <div className="h-full flex flex-col bg-muted/50">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Slides</h3>
          <Dialog open={isAddSlideDialogOpen} onOpenChange={setIsAddSlideDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Slide</DialogTitle>
              </DialogHeader>
              <SlideTypeSelector onTypeSelect={handleSlideTypeSelect} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Slide List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {slides.map((slide, index) => {
            const preview = getSlidePreview(slide);
            const isActive = index === currentSlideIndex;
            
            return (
              <div
                key={slide.id}
                className={cn(
                  "group relative border rounded-lg p-3 cursor-pointer transition-all",
                  "hover:bg-background hover:shadow-sm",
                  isActive && "bg-background shadow-sm border-primary ring-1 ring-primary/20"
                )}
                onClick={() => onSlideSelect(index)}
              >
                {/* Slide Number */}
                <div className="text-xs text-muted-foreground mb-1">
                  {index + 1}
                </div>

                {/* Slide Preview */}
                <div className="min-h-[60px] bg-white border rounded p-2 mb-2 relative overflow-hidden">
                  <div className="text-xs font-medium text-gray-900 mb-1">
                    {getSlideTypeIcon(slide.type)} {preview.title}
                  </div>
                  
                  {preview.bulletCount > 0 && (
                    <div className="space-y-0.5">
                      {Array.from({ length: Math.min(preview.bulletCount, 3) }).map((_, i) => (
                        <div key={i} className="w-full h-1 bg-gray-200 rounded-full" />
                      ))}
                      {preview.bulletCount > 3 && (
                        <div className="text-xs text-gray-400">+{preview.bulletCount - 3} more</div>
                      )}
                    </div>
                  )}
                  
                  {preview.hasVisuals && (
                    <div className="absolute top-2 right-2">
                      <div className="w-3 h-3 bg-blue-200 rounded border border-blue-300" />
                    </div>
                  )}
                </div>

                {/* Slide Title */}
                <div className="text-sm font-medium truncate">
                  {preview.title}
                </div>

                {/* Actions Menu */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSlideAdd(slide.type, index)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      {index > 0 && (
                        <DropdownMenuItem onClick={() => onSlideReorder(index, index - 1)}>
                          <MoveUp className="h-4 w-4 mr-2" />
                          Move Up
                        </DropdownMenuItem>
                      )}
                      {index < slides.length - 1 && (
                        <DropdownMenuItem onClick={() => onSlideReorder(index, index + 1)}>
                          <MoveDown className="h-4 w-4 mr-2" />
                          Move Down
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem 
                        onClick={() => onSlideDelete(slide.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};