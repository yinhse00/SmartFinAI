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
import { ProfessionalBusinessCategoryTab } from './ProfessionalBusinessCategoryTab';
import { useProfessionalBusinessCategories } from '@/hooks/useProfessionalBusinessCategories';

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
  const [activeCategory, setActiveCategory] = useState('business-model');
  const { categories, getCompletionPercentage, getTotalCompletion, loading } = useProfessionalBusinessCategories();

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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading professional guidance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Professional Progress Header */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">Professional Business Information</h2>
            <p className="text-xs text-muted-foreground">HKEX Chapter 3.7 Compliant</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {categories.length} HKEX Sections
            </Badge>
            <Badge variant="outline" className="font-medium">
              {Math.round(totalCompletion)}% Complete
            </Badge>
          </div>
        </div>
        <Progress value={totalCompletion} className="h-2" />
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-muted-foreground">
            Professional HKEX-compliant business section guidance
          </p>
          <p className="text-xs text-muted-foreground">
            {Math.round(totalCompletion)}% Professional Standard
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="h-full flex flex-col">
          <div className="px-4 pt-4">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 xl:grid-cols-12 gap-1 h-auto p-1">
              {categories.map((category) => {
                const { status, icon: Icon, color } = getCategoryStatus(category.id);
                const completion = getCompletionPercentage(category.id, categoryData[category.id] || {});
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
                    <span className="text-xs opacity-60">{Math.round(completion)}%</span>
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
                <ProfessionalBusinessCategoryTab
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

      {/* Professional Generation Footer */}
      <div className="p-4 border-t bg-background">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm space-y-1">
            <div className="text-muted-foreground">
              {totalCompletion < 40 && "Complete core sections to meet HKEX professional standards"}
              {totalCompletion >= 40 && totalCompletion < 70 && "Good progress! Meeting professional standards"}
              {totalCompletion >= 70 && "Excellent! Ready for professional prospectus generation"}
            </div>
            <div className="text-xs text-muted-foreground">
              Professional HKEX Chapter 3.7 compliance: {totalCompletion >= 70 ? 'Ready' : 'In Progress'}
            </div>
          </div>
          <Button 
            onClick={onGenerate}
            disabled={isGenerating || totalCompletion < 40}
            size="lg"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            {isGenerating ? 'Generating Professional Content...' : 'Generate Professional Business Section'}
          </Button>
        </div>
      </div>
    </div>
  );
};