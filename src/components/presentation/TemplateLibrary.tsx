import React, { useState } from 'react';
import { SlideTemplate, PresentationType, SlideType } from '@/types/presentation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, X, Star, Zap, Building, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TemplateLibraryProps {
  presentationType: PresentationType;
  onTemplateSelect: (template: SlideTemplate) => void;
  onClose: () => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
  presentationType,
  onTemplateSelect,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Mock template data - in real implementation, this would come from an API
  const templates: SlideTemplate[] = [
    {
      type: 'title',
      name: 'Corporate Title Slide',
      description: 'Professional title slide with company branding',
      layout: {
        type: 'title',
        regions: [
          { id: '1', type: 'title', position: { x: 0, y: 30, width: 100, height: 40 } }
        ]
      },
      defaultContent: {
        title: 'Company Name - IPO Presentation',
        bulletPoints: []
      },
      isCustom: false
    },
    {
      type: 'executive_summary',
      name: 'Investment Highlights',
      description: 'Key investment themes and value proposition',
      layout: {
        type: 'content',
        regions: [
          { id: '1', type: 'title', position: { x: 0, y: 10, width: 100, height: 15 } },
          { id: '2', type: 'content', position: { x: 0, y: 25, width: 60, height: 65 } },
          { id: '3', type: 'visual', position: { x: 65, y: 25, width: 35, height: 65 } }
        ]
      },
      defaultContent: {
        title: 'Investment Highlights',
        bulletPoints: [
          'Market-leading position in growing sector',
          'Strong financial performance and growth trajectory',
          'Experienced management team',
          'Clear strategy for continued expansion'
        ]
      },
      isCustom: false
    },
    {
      type: 'financial_highlights',
      name: 'Financial Performance',
      description: 'Revenue, profitability and key metrics',
      layout: {
        type: 'visual-heavy',
        regions: [
          { id: '1', type: 'title', position: { x: 0, y: 10, width: 100, height: 15 } },
          { id: '2', type: 'chart', position: { x: 0, y: 25, width: 50, height: 65 } },
          { id: '3', type: 'content', position: { x: 55, y: 25, width: 45, height: 65 } }
        ]
      },
      defaultContent: {
        title: 'Financial Highlights',
        bulletPoints: [
          'Revenue growth of 40% CAGR',
          'Gross margins of 65%+',
          'Path to profitability',
          'Strong cash position'
        ]
      },
      isCustom: false
    },
    {
      type: 'market_opportunity',
      name: 'Market Overview',
      description: 'Market size, trends and opportunity',
      layout: {
        type: 'two-column',
        regions: [
          { id: '1', type: 'title', position: { x: 0, y: 10, width: 100, height: 15 } },
          { id: '2', type: 'content', position: { x: 0, y: 25, width: 48, height: 65 } },
          { id: '3', type: 'visual', position: { x: 52, y: 25, width: 48, height: 65 } }
        ]
      },
      defaultContent: {
        title: 'Market Opportunity',
        bulletPoints: [
          '$50B+ total addressable market',
          'Growing at 15% annually',
          'Increasing digitization trends',
          'Regulatory tailwinds'
        ]
      },
      isCustom: false
    }
  ];

  const categories = [
    { id: 'all', name: 'All Templates', icon: Star },
    { id: 'financial', name: 'Financial', icon: TrendingUp },
    { id: 'business', name: 'Business', icon: Building },
    { id: 'premium', name: 'Premium', icon: Zap }
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
                           (selectedCategory === 'financial' && template.type.includes('financial')) ||
                           (selectedCategory === 'business' && ['business_overview', 'market_opportunity'].includes(template.type)) ||
                           (selectedCategory === 'premium' && !template.isCustom);
    
    return matchesSearch && matchesCategory;
  });

  const getTemplatePreview = (template: SlideTemplate) => {
    // Generate a simple preview based on template type
    const colors = {
      title: 'bg-purple-100 border-purple-300',
      executive_summary: 'bg-blue-100 border-blue-300',
      financial_highlights: 'bg-green-100 border-green-300',
      market_opportunity: 'bg-orange-100 border-orange-300',
      business_overview: 'bg-cyan-100 border-cyan-300',
      custom: 'bg-gray-100 border-gray-300'
    };
    
    return colors[template.type as keyof typeof colors] || colors.custom;
  };

  const getTemplateIcon = (type: SlideType) => {
    const icons = {
      title: '🏆',
      executive_summary: '⭐',
      financial_highlights: '📊',
      market_opportunity: '🎯',
      business_overview: '🏢',
      custom: '📝'
    };
    return icons[type] || '📝';
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Template Library
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 h-full">
          {/* Sidebar */}
          <div className="w-64 border-r pr-6">
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground mb-3">Categories</h4>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <category.icon className="h-4 w-4 mr-2" />
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          <div className="flex-1">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 p-1">
                {filteredTemplates.map((template) => (
                  <Card
                    key={`${template.type}-${template.name}`}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onTemplateSelect(template)}
                  >
                    <div className="p-4">
                      {/* Template Preview */}
                      <div className={cn(
                        "w-full aspect-[16/9] rounded border-2 mb-3 relative overflow-hidden",
                        getTemplatePreview(template)
                      )}>
                        <div className="absolute inset-2 bg-white rounded border border-white/20">
                          <div className="p-2">
                            <div className="text-xs font-medium mb-1">
                              {getTemplateIcon(template.type)} {template.name}
                            </div>
                            <div className="space-y-1">
                              {template.defaultContent.bulletPoints?.slice(0, 3).map((_, i) => (
                                <div key={i} className="w-full h-1 bg-gray-300 rounded-full" />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Template Info */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          {!template.isCustom && (
                            <Badge variant="secondary" className="text-xs">
                              Premium
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-muted-foreground mb-2">No templates found</div>
                  <p className="text-sm text-muted-foreground">
                    Try adjusting your search or category filter
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};