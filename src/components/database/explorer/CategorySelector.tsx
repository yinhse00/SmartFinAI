
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { RegulationCategory } from '@/services/database/types/index';

interface CategorySelectorProps {
  onSelectCategory: (categoryId: string) => void;
  selectedCategory: string;
}

const CategorySelector = ({ onSelectCategory, selectedCategory }: CategorySelectorProps) => {
  // Fetch categories
  const { data: categories, isLoading: loadingCategories } = useQuery({
    queryKey: ['regulatoryCategories'],
    queryFn: async (): Promise<RegulationCategory[]> => {
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

  return (
    <Select value={selectedCategory} onValueChange={onSelectCategory}>
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
  );
};

export default CategorySelector;
