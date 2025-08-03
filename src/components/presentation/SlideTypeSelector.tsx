import React from 'react';
import { SlideType } from '@/types/presentation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SlideTypeSelectorProps {
  onTypeSelect: (type: SlideType) => void;
}

export const SlideTypeSelector: React.FC<SlideTypeSelectorProps> = ({ onTypeSelect }) => {
  const slideTypes: Array<{ type: SlideType; name: string; description: string; icon: string }> = [
    {
      type: 'title',
      name: 'Title Slide',
      description: 'Cover slide with company name and presentation title',
      icon: '🏆'
    },
    {
      type: 'agenda',
      name: 'Agenda',
      description: 'Presentation outline and key topics',
      icon: '📋'
    },
    {
      type: 'executive_summary',
      name: 'Executive Summary',
      description: 'Investment highlights and key points',
      icon: '⭐'
    },
    {
      type: 'business_overview',
      name: 'Business Overview',
      description: 'Company description and business model',
      icon: '🏢'
    },
    {
      type: 'financial_highlights',
      name: 'Financial Highlights',
      description: 'Revenue, profitability, and key metrics',
      icon: '📊'
    },
    {
      type: 'market_opportunity',
      name: 'Market Opportunity',
      description: 'Market size, trends, and addressable market',
      icon: '🎯'
    },
    {
      type: 'competitive_advantages',
      name: 'Competitive Advantages',
      description: 'Unique value proposition and differentiation',
      icon: '🚀'
    },
    {
      type: 'use_of_proceeds',
      name: 'Use of Proceeds',
      description: 'How the raised capital will be used',
      icon: '💰'
    },
    {
      type: 'management_team',
      name: 'Management Team',
      description: 'Key executives and their experience',
      icon: '👥'
    },
    {
      type: 'risk_factors',
      name: 'Risk Factors',
      description: 'Key risks and mitigation strategies',
      icon: '⚠️'
    },
    {
      type: 'credentials',
      name: 'Credentials',
      description: 'Track record and relevant experience',
      icon: '🏅'
    },
    {
      type: 'contact',
      name: 'Contact Information',
      description: 'Contact details and next steps',
      icon: '📞'
    },
    {
      type: 'appendix',
      name: 'Appendix',
      description: 'Additional information and supporting data',
      icon: '📄'
    },
    {
      type: 'custom',
      name: 'Custom Slide',
      description: 'Blank slide for custom content',
      icon: '📝'
    }
  ];

  return (
    <ScrollArea className="h-[400px] w-full">
      <div className="grid grid-cols-1 gap-3 p-4">
        {slideTypes.map((slideType) => (
          <Button
            key={slideType.type}
            variant="outline"
            className="h-auto p-4 justify-start text-left"
            onClick={() => onTypeSelect(slideType.type)}
          >
            <div className="flex items-start gap-3 w-full">
              <div className="text-2xl">{slideType.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{slideType.name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {slideType.description}
                </div>
              </div>
            </div>
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
};