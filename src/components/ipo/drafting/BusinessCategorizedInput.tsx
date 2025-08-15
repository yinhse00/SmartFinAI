import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Target, 
  Package, 
  Settings, 
  Truck, 
  Users, 
  ShieldCheck, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  Loader2
} from 'lucide-react';
import { EnhancedBusinessCategoryTab } from './EnhancedBusinessCategoryTab';
import { useEnhancedBusinessCategories } from '@/hooks/useEnhancedBusinessCategories';

export interface BusinessCategoryData {
  [categoryId: string]: {
    [fieldId: string]: any;
  };
}

interface BusinessCategorizedInputProps {
  projectId: string;
  categoryData: BusinessCategoryData;
  setCategoryData: (data: BusinessCategoryData) => void;
  isGenerating: boolean;
  onGenerate: () => void;
}

export const BusinessCategorizedInput: React.FC<BusinessCategorizedInputProps> = ({
  projectId,
  categoryData,
  setCategoryData,
  isGenerating,
  onGenerate
}) => {
  const [activeCategory, setActiveCategory] = useState('overview');
  const { categories, getCompletionPercentage, getTotalCompletion } = useEnhancedBusinessCategories();

  const updateCategoryData = useCallback((categoryId: string, fieldId: string, value: any) => {
    setCategoryData({
      ...categoryData,
      [categoryId]: {
        ...categoryData[categoryId],
        [fieldId]: value
      }
    });
  }, [categoryData, setCategoryData]);

  const getCategoryStatus = (categoryId: string) => {
    const completion = getCompletionPercentage(categoryId, categoryData[categoryId] || {});
    if (completion === 100) return { status: 'complete', icon: CheckCircle, color: 'bg-green-500' };
    if (completion > 0) return { status: 'in-progress', icon: Clock, color: 'bg-yellow-500' };
    return { status: 'pending', icon: Clock, color: 'bg-gray-300' };
  };

  const totalCompletion = getTotalCompletion(categoryData);

  return (
    <div className="h-full flex flex-col">
      {/* Progress Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Business Information</h2>
          <Badge variant="outline" className="font-medium">
            {Math.round(totalCompletion)}% Complete
          </Badge>
        </div>
        <Progress value={totalCompletion} className="h-2" />
        <p className="text-sm text-muted-foreground mt-2">
          Complete each category to generate a comprehensive business section
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-1 h-auto p-1">
              {categories.map((category) => {
                const { status, icon: Icon, color } = getCategoryStatus(category.id);
                return (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="flex flex-col items-center gap-1 h-auto py-2 px-1 text-xs"
                  >
                    <div className="relative">
                      <Icon className="h-4 w-4" />
                      <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${color}`} />
                    </div>
                    <span className="leading-tight text-center">{category.shortName}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden px-4 pb-4">
            {categories.map((category) => (
              <TabsContent
                key={category.id}
                value={category.id}
                className="h-full mt-4 data-[state=active]:flex data-[state=active]:flex-col"
              >
                <EnhancedBusinessCategoryTab
                  projectId={projectId}
                  category={category}
                  data={categoryData[category.id] || {}}
                  onDataChange={(fieldId, value) => updateCategoryData(category.id, fieldId, value)}
                />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>

      {/* Generation Footer */}
      <div className="p-4 border-t bg-background">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {totalCompletion < 30 && "Complete at least Company Overview to generate content"}
            {totalCompletion >= 30 && totalCompletion < 70 && "Good progress! Add more details for better results"}
            {totalCompletion >= 70 && "Excellent! Ready to generate comprehensive content"}
          </div>
          <Button 
            onClick={onGenerate}
            disabled={isGenerating || totalCompletion < 30}
            size="lg"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? 'Generating...' : 'Generate Business Section'}
          </Button>
        </div>
      </div>
    </div>
  );
};