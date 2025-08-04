import React, { useState, useCallback } from 'react';
import { PresentationSlide, PresentationType } from '@/types/presentation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { 
  Plus, 
  Trash2, 
  Type, 
  BarChart3, 
  Image as ImageIcon,
  Table,
  Edit3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlideEditorProps {
  slide?: PresentationSlide;
  presentationType: PresentationType;
  editMode: 'visual' | 'code';
  onSlideUpdate: (slideId: string, updates: Partial<PresentationSlide>) => void;
}

export const SlideEditor: React.FC<SlideEditorProps> = ({
  slide,
  presentationType,
  editMode,
  onSlideUpdate
}) => {
  const [localTitle, setLocalTitle] = useState(slide?.content.title || '');
  const [localBulletPoints, setLocalBulletPoints] = useState(slide?.content.bulletPoints || ['']);

  const handleTitleChange = useCallback((value: string) => {
    setLocalTitle(value);
    if (slide) {
      onSlideUpdate(slide.id, {
        content: {
          ...slide.content,
          title: value
        }
      });
    }
  }, [slide, onSlideUpdate]);

  const handleBulletPointChange = useCallback((index: number, value: string) => {
    const newBulletPoints = [...localBulletPoints];
    newBulletPoints[index] = value;
    setLocalBulletPoints(newBulletPoints);
    
    if (slide) {
      onSlideUpdate(slide.id, {
        content: {
          ...slide.content,
          bulletPoints: newBulletPoints.filter(point => point.trim() !== '')
        }
      });
    }
  }, [localBulletPoints, slide, onSlideUpdate]);

  const addBulletPoint = useCallback(() => {
    setLocalBulletPoints([...localBulletPoints, '']);
  }, [localBulletPoints]);

  const removeBulletPoint = useCallback((index: number) => {
    const newBulletPoints = localBulletPoints.filter((_, i) => i !== index);
    setLocalBulletPoints(newBulletPoints);
    
    if (slide) {
      onSlideUpdate(slide.id, {
        content: {
          ...slide.content,
          bulletPoints: newBulletPoints.filter(point => point.trim() !== '')
        }
      });
    }
  }, [localBulletPoints, slide, onSlideUpdate]);

  const getSlideTypeInfo = (type: string) => {
    const typeInfo = {
      title: { name: 'Title Slide', color: 'bg-purple-500' },
      executive_summary: { name: 'Executive Summary', color: 'bg-blue-500' },
      business_overview: { name: 'Business Overview', color: 'bg-green-500' },
      financial_highlights: { name: 'Financial Highlights', color: 'bg-orange-500' },
      market_opportunity: { name: 'Market Opportunity', color: 'bg-yellow-500' },
      competitive_advantages: { name: 'Competitive Advantages', color: 'bg-red-500' },
      use_of_proceeds: { name: 'Use of Proceeds', color: 'bg-cyan-500' },
      management_team: { name: 'Management Team', color: 'bg-indigo-500' },
      risk_factors: { name: 'Risk Factors', color: 'bg-gray-500' },
      credentials: { name: 'Credentials', color: 'bg-pink-500' },
      contact: { name: 'Contact Information', color: 'bg-teal-500' },
      appendix: { name: 'Appendix', color: 'bg-slate-500' },
      custom: { name: 'Custom Slide', color: 'bg-violet-500' }
    };
    return typeInfo[type as keyof typeof typeInfo] || typeInfo.custom;
  };

  if (!slide) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <div className="text-muted-foreground mb-2">No slide selected</div>
          <p className="text-sm text-muted-foreground">
            Select a slide from the navigator or create a new one to start editing
          </p>
        </div>
      </div>
    );
  }

  const slideTypeInfo = getSlideTypeInfo(slide.type);

  if (editMode === 'code') {
    return (
      <div className="h-full flex flex-col">
        <div className="border-b p-4">
          <div className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", slideTypeInfo.color)} />
            <h3 className="font-medium">{slideTypeInfo.name}</h3>
            <span className="text-sm text-muted-foreground">Code Editor</span>
          </div>
        </div>
        
        <div className="flex-1 p-4">
          <RichTextEditor
            value={JSON.stringify(slide.content, null, 2)}
            onChange={(value) => {
              try {
                const parsed = JSON.parse(value);
                onSlideUpdate(slide.id, { content: parsed });
              } catch (error) {
                // Invalid JSON, don't update
              }
            }}
            height={400}
            className="font-mono text-sm"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Editor Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", slideTypeInfo.color)} />
            <h3 className="font-medium">{slideTypeInfo.name}</h3>
            <span className="text-sm text-muted-foreground">Visual Editor</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <ImageIcon className="h-4 w-4 mr-2" />
              Add Image
            </Button>
            <Button size="sm" variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Add Chart
            </Button>
            <Button size="sm" variant="outline">
              <Table className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          </div>
        </div>
      </div>

      {/* Slide Canvas */}
      <div className="flex-1 p-6 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          {/* Slide Preview */}
          <Card className="w-full aspect-[16/9] p-8 bg-white shadow-lg">
            <div className="h-full flex flex-col">
              {/* Slide Title */}
              <div className="mb-6">
                <Input
                  value={localTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Enter slide title..."
                  className="text-2xl font-bold border-none shadow-none p-0 bg-transparent"
                />
              </div>

              {/* Content Area */}
              <div className="flex-1 space-y-4">
                {/* Bullet Points */}
                {localBulletPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-3 flex-shrink-0" />
                    <Input
                      value={point}
                      onChange={(e) => handleBulletPointChange(index, e.target.value)}
                      placeholder="Enter bullet point..."
                      className="flex-1 border-none shadow-none p-0 bg-transparent text-lg"
                    />
                    {localBulletPoints.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeBulletPoint(index)}
                        className="mt-1 opacity-60 hover:opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={addBulletPoint}
                  className="mt-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Bullet Point
                </Button>

                {/* Visual Elements Area */}
                {slide.content.visualElements && slide.content.visualElements.length > 0 && (
                  <div className="mt-6 p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg">
                    <div className="text-center text-muted-foreground">
                      Visual elements will be rendered here
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Slide Notes */}
          <Card className="mt-4 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Edit3 className="h-4 w-4" />
              <h4 className="font-medium">Speaker Notes</h4>
            </div>
            <Textarea
              value={slide.content.notes || ''}
              onChange={(e) => onSlideUpdate(slide.id, {
                content: {
                  ...slide.content,
                  notes: e.target.value
                }
              })}
              placeholder="Add speaker notes for this slide..."
              className="min-h-[100px]"
            />
          </Card>
        </div>
      </div>
    </div>
  );
};