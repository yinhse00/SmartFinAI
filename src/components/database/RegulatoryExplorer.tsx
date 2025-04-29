
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RegulatoryCategory {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

interface RegulationProvision {
  id: string;
  rule_number: string;
  title: string;
  content: string;
  chapter?: string;
  section?: string;
}

const RegulatoryExplorer = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
  const [viewingProvision, setViewingProvision] = useState<RegulationProvision | null>(null);

  // Fetch categories
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['regulatoryCategories'],
    queryFn: async (): Promise<RegulatoryCategory[]> => {
      try {
        const { data, error } = await supabase
          .from('regulatory_categories')
          .select('*')
          .order('priority', { ascending: true });
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error loading categories:', error);
        return [];
      }
    }
  });

  // Fetch provisions for selected category
  const { data: provisions, isLoading: loadingProvisions } = useQuery({
    queryKey: ['regulatoryProvisions', selectedCategory],
    queryFn: async (): Promise<RegulationProvision[]> => {
      try {
        if (!selectedCategory) return [];
        
        const { data, error } = await supabase
          .from('regulatory_provisions')
          .select('*')
          .eq('category_id', selectedCategory)
          .order('rule_number');
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Error loading provisions:', error);
        return [];
      }
    },
    enabled: !!selectedCategory
  });

  // Group provisions by chapter
  const provisionsByChapter = provisions ? provisions.reduce((acc, provision) => {
    const chapter = provision.chapter || 'Uncategorized';
    if (!acc[chapter]) {
      acc[chapter] = [];
    }
    acc[chapter].push(provision);
    return acc;
  }, {} as Record<string, RegulationProvision[]>) : {};

  const toggleChapter = (chapter: string) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapter]: !prev[chapter]
    }));
  };

  const handleViewProvision = (provision: RegulationProvision) => {
    setViewingProvision(provision);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Regulatory Categories</CardTitle>
          <CardDescription>
            Browse regulatory content by category
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className={!selectedCategory ? 'text-muted-foreground' : ''}>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {loadingCategories ? (
                  <div className="flex justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedCategory && (
            <div className="space-y-4">
              {loadingProvisions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-finance-medium-blue" />
                </div>
              ) : (
                Object.keys(provisionsByChapter).length > 0 ? (
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
                                onClick={() => handleViewProvision(provision)}
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
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No provisions found for this category
                  </div>
                )
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!viewingProvision} onOpenChange={(open) => !open && setViewingProvision(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {viewingProvision?.rule_number} - {viewingProvision?.title}
            </DialogTitle>
            <DialogDescription>
              Regulatory Provision
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-4 p-2">
              <div className="prose dark:prose-invert max-w-none">
                {viewingProvision?.content.split('\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RegulatoryExplorer;
